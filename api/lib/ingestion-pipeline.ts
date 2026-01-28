import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GoogleDriveService, DriveFile } from './google-drive.js';
import { TextExtractionService } from './text-extraction.js';
import { ChunkingService } from './chunking.js';
import { EmbeddingService } from './embeddings.js';
import crypto from 'crypto';

export interface IngestionConfig {
  openaiApiKey: string;
  supabaseUrl: string;
  supabaseServiceKey: string;
}

export interface SyncProgress {
  stage: string;
  current: number;
  total: number;
}

export interface SyncStats {
  files_processed: number;
  files_failed: number;
  total_files: number;
  total_chunks: number;
  errors: string[];
}

export class IngestionPipeline {
  private supabase: SupabaseClient;
  private driveService: GoogleDriveService;
  private textExtractor: TextExtractionService;
  private chunker: ChunkingService;
  private embedder: EmbeddingService;

  constructor(
    driveService: GoogleDriveService,
    config: IngestionConfig
  ) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
    this.driveService = driveService;
    this.textExtractor = new TextExtractionService();
    this.chunker = new ChunkingService();
    this.embedder = new EmbeddingService(config.openaiApiKey);
  }

  async runSync(corpusId: string, folderId: string, jobId: string, batchSize: number = 3): Promise<void> {
    let successCount = 0;
    let failedCount = 0;
    let totalChunks = 0;
    const errors: string[] = [];
    const BATCH_SIZE = batchSize; // Process only this many files per invocation

    try {
      // Update job to running
      console.log(`[${jobId}] Setting job status to 'running'`);
      await this.updateJobStatus(jobId, 'running');

      // Stage 1: List Drive files
      console.log(`[${jobId}] Listing files in folder: ${folderId}`);
      await this.updateJobProgress(jobId, 'listing_files', 0, 1);
      const driveFiles = await this.driveService.listFilesInFolder(folderId);
      console.log(`[${jobId}] Found ${driveFiles.length} total files`);

      // Filter supported types
      const supportedFiles = driveFiles.filter(f =>
        GoogleDriveService.isSupportedFile(f.mimeType)
      );

      if (supportedFiles.length === 0) {
        await this.updateJobStatus(jobId, 'completed', {
          files_processed: 0,
          files_failed: 0,
          total_files: 0,
          total_chunks: 0,
          errors: ['No supported files found in folder'],
        });
        await this.updateCorpusSync(corpusId, 'completed', {
          files_processed: 0,
          files_failed: 0,
          total_files: 0,
          errors: ['No supported files found'],
        });
        return;
      }

      // Stage 2: Process files (in batches to avoid timeout)
      await this.updateJobProgress(jobId, 'processing_files', 0, supportedFiles.length);

      const filesToProcess = supportedFiles.slice(0, BATCH_SIZE);
      console.log(`Processing batch of ${filesToProcess.length} files out of ${supportedFiles.length} total`);

      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];

        try {
          console.log(`Processing file ${i + 1}/${filesToProcess.length}: ${file.name}`);
          const chunkCount = await this.processFile(file, corpusId);
          totalChunks += chunkCount;
          successCount++;
        } catch (error) {
          failedCount++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`${file.name}: ${errorMsg}`);
          console.error(`Failed to process file ${file.name}:`, error);
        }

        await this.updateJobProgress(jobId, 'processing_files', i + 1, supportedFiles.length);
      }

      // Update corpus
      const hasMoreFiles = filesToProcess.length < supportedFiles.length;
      const syncStatus = hasMoreFiles ? 'running' : 'completed';

      const stats: SyncStats = {
        files_processed: successCount,
        files_failed: failedCount,
        total_files: supportedFiles.length,
        total_chunks: totalChunks,
        errors,
      };

      console.log(`Batch complete. Status: ${syncStatus}, Processed: ${filesToProcess.length}/${supportedFiles.length}`);

      await this.updateCorpusSync(corpusId, syncStatus, stats);
      await this.updateJobStatus(jobId, syncStatus, stats);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Sync failed:', error);

      await this.updateJobStatus(jobId, 'failed', undefined, errorMessage);
      await this.updateCorpusSync(corpusId, 'error', {
        files_processed: successCount,
        files_failed: failedCount,
        total_files: successCount + failedCount,
        total_chunks: totalChunks,
        errors: [errorMessage, ...errors],
      });

      throw error;
    } finally {
      this.chunker.cleanup();
    }
  }

  private async processFile(file: DriveFile, corpusId: string): Promise<number> {
    const fileStartTime = Date.now();
    console.log(`[File: ${file.name}] Starting processing...`);

    // Extract text based on file type
    let extractedText: string;
    const extractStartTime = Date.now();

    if (file.mimeType.includes('google-apps.document')) {
      extractedText = await this.driveService.exportGoogleDoc(file.id);
    } else if (file.mimeType.includes('pdf')) {
      const buffer = await this.driveService.downloadFile(file.id);
      extractedText = await this.textExtractor.extractFromPDF(buffer);
    } else {
      const buffer = await this.driveService.downloadFile(file.id);
      extractedText = this.textExtractor.extractFromText(buffer);
    }

    console.log(`[File: ${file.name}] Text extraction took ${Date.now() - extractStartTime}ms, extracted ${extractedText?.length || 0} characters`);

    // Normalize text
    extractedText = this.textExtractor.normalizeText(extractedText);

    console.log(`[File: ${file.name}] After normalization: ${extractedText?.length || 0} characters, preview: ${extractedText?.substring(0, 200)}`);

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text content extracted');
    }

    const contentHash = this.textExtractor.computeContentHash(extractedText);

    // Check if document already exists and is unchanged
    const { data: existingDoc } = await this.supabase
      .from('documents')
      .select('id, content_hash, indexing_status')
      .eq('corpus_id', corpusId)
      .eq('google_drive_file_id', file.id)
      .single();

    if (existingDoc && existingDoc.content_hash === contentHash && existingDoc.indexing_status === 'indexed') {
      // Document unchanged, skip reprocessing
      return 0;
    }

    const documentId = existingDoc?.id || crypto.randomUUID();

    // Upsert document record
    await this.supabase.from('documents').upsert({
      id: documentId,
      corpus_id: corpusId,
      google_drive_file_id: file.id,
      file_name: file.name,
      file_type: file.mimeType,
      file_path: file.path,
      file_size_bytes: file.size ? parseInt(file.size, 10) : null,
      drive_modified_at: file.modifiedTime,
      content_hash: contentHash,
      indexing_status: 'processing',
      updated_at: new Date().toISOString(),
    });

    // Delete existing chunks if reprocessing
    if (existingDoc) {
      await this.supabase
        .from('chunks')
        .delete()
        .eq('document_id', documentId);
    }

    // Chunk text
    const chunkStartTime = Date.now();
    const chunks = this.chunker.chunkText(extractedText);
    console.log(`[File: ${file.name}] Chunking took ${Date.now() - chunkStartTime}ms, generated ${chunks.length} chunks`);

    if (chunks.length === 0) {
      throw new Error('No chunks generated from text');
    }

    // Log first few chunks for debugging
    const firstChunk = chunks[0];
    const firstContent = firstChunk?.content;
    console.log(`[File: ${file.name}] First chunk sample:`, {
      index: firstChunk?.index,
      contentType: typeof firstContent,
      contentLength: typeof firstContent === 'string' ? firstContent.length : 'N/A',
      contentPreview: typeof firstContent === 'string' ? firstContent.substring(0, 100) : String(firstContent).substring(0, 100),
      tokenCount: firstChunk?.tokenCount,
    });

    // Generate embeddings in batches
    const embeddingStartTime = Date.now();
    const chunkTexts = chunks.map(c => c.content);

    // Filter out invalid chunks and log for debugging
    const validChunkTexts = chunkTexts.filter((text, idx) => {
      // Type check first
      if (typeof text !== 'string') {
        console.warn(`[File: ${file.name}] Chunk ${idx} is not a string (type: ${typeof text}), skipping`);
        return false;
      }

      // Then check if empty
      const isValid = text.trim().length > 0;
      if (!isValid) {
        console.warn(`[File: ${file.name}] Chunk ${idx} is empty or whitespace-only (length: ${text.length}), skipping`);
      }
      return isValid;
    });

    if (validChunkTexts.length === 0) {
      throw new Error('All chunks are invalid after filtering');
    }

    console.log(`[File: ${file.name}] Processing ${validChunkTexts.length} valid chunks (${chunkTexts.length - validChunkTexts.length} filtered out)`);

    const embeddings = await this.embedder.generateEmbeddings(validChunkTexts);
    console.log(`[File: ${file.name}] Embedding generation took ${Date.now() - embeddingStartTime}ms`);

    // Store chunks with embeddings
    const dbStartTime = Date.now();

    // Map embeddings back to valid chunks only
    const validChunks = chunks.filter(c =>
      typeof c.content === 'string' && c.content.trim().length > 0
    );
    const chunkRecords = validChunks.map((chunk, idx) => ({
      id: crypto.randomUUID(),
      document_id: documentId,
      chunk_index: chunk.index,
      content: chunk.content,
      token_count: chunk.tokenCount,
      embedding: JSON.stringify(embeddings[idx]), // pgvector accepts JSON string
      metadata: {
        file_name: file.name,
        file_path: file.path,
        file_type: file.mimeType,
      },
    }));

    // Insert chunks in batches (Supabase has insert limits)
    const batchSize = 100;
    for (let i = 0; i < chunkRecords.length; i += batchSize) {
      const batch = chunkRecords.slice(i, i + batchSize);
      const { error } = await this.supabase.from('chunks').insert(batch);
      if (error) {
        throw new Error(`Failed to insert chunks: ${error.message}`);
      }
    }

    // Update document status
    await this.supabase
      .from('documents')
      .update({
        indexing_status: 'indexed',
        chunk_count: chunkRecords.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    console.log(`[File: ${file.name}] Database operations took ${Date.now() - dbStartTime}ms`);
    console.log(`[File: ${file.name}] Total processing time: ${Date.now() - fileStartTime}ms`);

    return chunkRecords.length;
  }

  private async updateJobStatus(
    jobId: string,
    status: string,
    stats?: SyncStats,
    errorMessage?: string
  ): Promise<void> {
    const updates: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'running') {
      updates.started_at = new Date().toISOString();
    }

    if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString();
    }

    if (stats) {
      updates.stats = stats;
    }

    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    console.log(`[${jobId}] Updating job status to '${status}':`, JSON.stringify(updates, null, 2));

    const { error } = await this.supabase
      .from('ingestion_jobs')
      .update(updates)
      .eq('id', jobId);

    if (error) {
      console.error(`[${jobId}] Failed to update job status:`, error);
      throw error;
    }

    console.log(`[${jobId}] Job status updated successfully`);
  }

  private async updateJobProgress(
    jobId: string,
    stage: string,
    current: number,
    total: number
  ): Promise<void> {
    console.log(`[${jobId}] Updating progress: ${stage} (${current}/${total})`);

    const { error } = await this.supabase
      .from('ingestion_jobs')
      .update({
        progress: { stage, current, total },
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (error) {
      console.error(`[${jobId}] Failed to update progress:`, error);
    }
  }

  private async updateCorpusSync(
    corpusId: string,
    syncStatus: string,
    stats: Partial<SyncStats>
  ): Promise<void> {
    console.log(`[${corpusId}] Updating corpus sync_status to '${syncStatus}':`, JSON.stringify(stats, null, 2));

    const { error } = await this.supabase
      .from('corpora')
      .update({
        sync_status: syncStatus,
        last_sync_at: new Date().toISOString(),
        last_sync_stats: stats,
        updated_at: new Date().toISOString(),
      })
      .eq('id', corpusId);

    if (error) {
      console.error(`[${corpusId}] Failed to update corpus:`, error);
    } else {
      console.log(`[${corpusId}] Corpus updated successfully`);
    }
  }
}

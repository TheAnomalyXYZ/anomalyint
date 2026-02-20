import { toast } from 'sonner';
import { profilesApi } from './supabase';

/**
 * Chunk data returned from the retrieve-chunks API
 */
export interface KnowledgeChunk {
  content: string;
  file_name: string;
  similarity?: number;
  chunk_index?: number;
}

/**
 * Brand profile context for knowledge base
 */
export interface BrandProfileContext {
  name: string;
  description: string;
}

/**
 * Options for retrieving knowledge chunks
 */
export interface RetrieveChunksOptions {
  query: string;
  corpusId: string;
  matchCount?: number;
  matchThreshold?: number;
  showToast?: boolean;
  brandProfileId?: string; // Optional: fetch and include brand profile context
}

/**
 * Result from chunk retrieval
 */
export interface RetrievalResult {
  chunks: KnowledgeChunk[];
  success: boolean;
  error?: string;
}

/**
 * Fetch brand profile context for a corpus
 *
 * @param brandProfileId - ID of the brand profile
 * @returns Promise with brand profile context or null
 */
export async function fetchBrandProfileContext(
  brandProfileId?: string
): Promise<BrandProfileContext | null> {
  if (!brandProfileId) return null;

  try {
    const profile = await profilesApi.getProfile(brandProfileId);
    if (!profile) return null;

    return {
      name: profile.name,
      description: profile.brandDescription || '',
    };
  } catch (error) {
    console.error('[KnowledgeRetrieval] Failed to fetch brand profile:', error);
    return null;
  }
}

/**
 * Build brand profile context string for system prompt
 *
 * @param profileContext - Brand profile context data
 * @returns Formatted brand profile context string
 */
export function buildBrandProfileContext(
  profileContext: BrandProfileContext | null
): string {
  if (!profileContext || !profileContext.name) return '';

  const parts = [`You represent ${profileContext.name}.`];

  if (profileContext.description) {
    parts.push(profileContext.description);
  }

  return parts.join(' ');
}

/**
 * Retrieve relevant chunks from a knowledge corpus
 *
 * @param options - Configuration for chunk retrieval
 * @returns Promise with chunks and success status
 */
export async function retrieveKnowledgeChunks(
  options: RetrieveChunksOptions
): Promise<RetrievalResult> {
  const {
    query,
    corpusId,
    matchCount = 10,
    matchThreshold = 0.5,
    showToast = true,
  } = options;

  try {
    console.log(`[KnowledgeRetrieval] Retrieving chunks for query: "${query.substring(0, 100)}..."`);

    const response = await fetch('/api/retrieve-chunks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        corpus_id: corpusId,
        match_count: matchCount,
        match_threshold: matchThreshold,
      }),
    });

    if (!response.ok) {
      let errorData: any = {};
      let errorMessage = 'Failed to retrieve chunks';

      try {
        const text = await response.text();
        if (text) {
          errorData = JSON.parse(text);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } else {
          errorMessage = `Server returned ${response.status} with empty response. Is the API server running?`;
        }
      } catch (parseError) {
        errorMessage = `Server error (${response.status}): Unable to parse error response`;
        console.error('[KnowledgeRetrieval] Failed to parse error response:', parseError);
      }

      console.error('[KnowledgeRetrieval] Retrieval failed:', errorData);

      if (showToast) {
        toast.error('Failed to retrieve knowledge base: ' + errorMessage);
      }

      return {
        chunks: [],
        success: false,
        error: errorMessage,
      };
    }

    const data = await response.json();
    console.log(`[KnowledgeRetrieval] Retrieved ${data.chunks?.length || 0} chunks`);

    if (data.chunks && data.chunks.length > 0) {
      if (showToast) {
        toast.success(`Found ${data.chunks.length} relevant documents`);
      }

      return {
        chunks: data.chunks,
        success: true,
      };
    } else {
      console.warn(`[KnowledgeRetrieval] No chunks found`);

      if (showToast) {
        toast.info('No relevant documents found in knowledge base');
      }

      return {
        chunks: [],
        success: true, // Not an error, just no results
      };
    }
  } catch (error) {
    console.error('[KnowledgeRetrieval] Error retrieving chunks:', error);

    if (showToast) {
      toast.error('Error accessing knowledge base');
    }

    return {
      chunks: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Format chunks into a knowledge context string
 *
 * @param chunks - Array of knowledge chunks
 * @param options - Optional formatting configuration
 * @returns Formatted context string
 */
export function buildKnowledgeContext(
  chunks: KnowledgeChunk[],
  options?: {
    includeHeader?: boolean;
    headerText?: string;
    includeSourceNumbers?: boolean;
  }
): string {
  const {
    includeHeader = true,
    headerText = '## Knowledge Base Context:',
    includeSourceNumbers = true,
  } = options || {};

  if (!chunks || chunks.length === 0) {
    return '';
  }

  const formattedChunks = chunks.map((chunk, idx) => {
    const sourceLabel = includeSourceNumbers
      ? `[Source ${idx + 1}: ${chunk.file_name}]`
      : `[${chunk.file_name}]`;

    return `${sourceLabel}\n${chunk.content}`;
  }).join('\n\n');

  if (includeHeader) {
    return `\n\n${headerText}\n${formattedChunks}`;
  }

  return formattedChunks;
}

/**
 * Result from retrieveAndBuildContext with both profile and knowledge context
 */
export interface ContextResult {
  profileContext: string;
  knowledgeContext: string;
  fullContext: string; // Combined context with profile first
}

/**
 * Convenience function to retrieve chunks and build context in one call
 * Includes brand profile context if brandProfileId is provided
 *
 * @param options - Configuration for chunk retrieval
 * @returns Promise with formatted context string (legacy) or ContextResult
 */
export async function retrieveAndBuildContext(
  options: RetrieveChunksOptions & {
    includeHeader?: boolean;
    headerText?: string;
    includeSourceNumbers?: boolean;
    includeBrandProfile?: boolean; // If true, returns ContextResult with profile context
  }
): Promise<string | ContextResult> {
  // Fetch brand profile context if requested
  const profileContext = options.includeBrandProfile && options.brandProfileId
    ? await fetchBrandProfileContext(options.brandProfileId)
    : null;

  const profileContextString = buildBrandProfileContext(profileContext);

  // Retrieve knowledge chunks
  const result = await retrieveKnowledgeChunks(options);

  const knowledgeContextString = result.success && result.chunks.length > 0
    ? buildKnowledgeContext(result.chunks, {
        includeHeader: options.includeHeader,
        headerText: options.headerText,
        includeSourceNumbers: options.includeSourceNumbers,
      })
    : '';

  // If brand profile context is included, return structured result
  if (options.includeBrandProfile) {
    const fullContext = [profileContextString, knowledgeContextString]
      .filter(Boolean)
      .join('\n\n');

    return {
      profileContext: profileContextString,
      knowledgeContext: knowledgeContextString,
      fullContext,
    };
  }

  // Legacy behavior: return just knowledge context string
  return knowledgeContextString;
}

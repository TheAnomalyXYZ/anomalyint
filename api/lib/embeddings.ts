import OpenAI from 'openai';

export interface EmbeddingConfig {
  model: string;
  batchSize: number;
}

export class EmbeddingService {
  private openai: OpenAI;
  private config: EmbeddingConfig;

  constructor(
    apiKey: string,
    config: EmbeddingConfig = {
      model: 'text-embedding-3-large',
      batchSize: 100,
    }
  ) {
    this.openai = new OpenAI({ apiKey });
    this.config = config;
  }

  /**
   * Generate embeddings for an array of texts
   * Automatically batches requests to avoid API limits
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    // Validate all texts are non-empty strings
    const invalidIndices = texts
      .map((text, idx) => {
        if (typeof text !== 'string') return idx;
        if (text.trim().length === 0) return idx;
        return null;
      })
      .filter(idx => idx !== null);

    if (invalidIndices.length > 0) {
      throw new Error(`Cannot generate embeddings: ${invalidIndices.length} invalid text(s) at indices: ${invalidIndices.join(', ')}`);
    }

    const { batchSize, model } = this.config;
    const batches: string[][] = [];

    // Split into batches
    for (let i = 0; i < texts.length; i += batchSize) {
      batches.push(texts.slice(i, i + batchSize));
    }

    const allEmbeddings: number[][] = [];

    // Process each batch
    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];

      try {
        const response = await this.openai.embeddings.create({
          model,
          input: batch,
          encoding_format: 'float',
          dimensions: 1536, // Use 1536 dimensions for HNSW index compatibility
        });

        allEmbeddings.push(...response.data.map(d => d.embedding));
      } catch (error) {
        console.error(`Failed to generate embeddings for batch ${batchIdx}:`, {
          batchSize: batch.length,
          firstTextPreview: batch[0]?.substring(0, 100),
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }

    return allEmbeddings;
  }

  /**
   * Generate a single embedding (convenience method)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text]);
    return embeddings[0];
  }
}

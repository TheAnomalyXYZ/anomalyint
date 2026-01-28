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
      model: 'text-embedding-3-small',
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

    const { batchSize, model } = this.config;
    const batches: string[][] = [];

    // Split into batches
    for (let i = 0; i < texts.length; i += batchSize) {
      batches.push(texts.slice(i, i + batchSize));
    }

    const allEmbeddings: number[][] = [];

    // Process each batch
    for (const batch of batches) {
      const response = await this.openai.embeddings.create({
        model,
        input: batch,
        encoding_format: 'float',
      });

      allEmbeddings.push(...response.data.map(d => d.embedding));
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

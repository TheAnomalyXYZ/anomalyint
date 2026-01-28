import { encoding_for_model } from 'tiktoken';

export interface TextChunk {
  content: string;
  index: number;
  tokenCount: number;
}

export interface ChunkingConfig {
  chunkSize: number;
  chunkOverlap: number;
}

export class ChunkingService {
  private encoder;
  private config: ChunkingConfig;

  constructor(config: ChunkingConfig = { chunkSize: 800, chunkOverlap: 200 }) {
    this.encoder = encoding_for_model('text-embedding-3-small');
    this.config = config;
  }

  /**
   * Split text into overlapping chunks based on token count
   */
  chunkText(text: string): TextChunk[] {
    const tokens = this.encoder.encode(text);
    const chunks: TextChunk[] = [];
    let index = 0;

    const { chunkSize, chunkOverlap } = this.config;
    const step = chunkSize - chunkOverlap;

    for (let i = 0; i < tokens.length; i += step) {
      const chunkTokens = tokens.slice(i, i + chunkSize);
      const decoded = this.encoder.decode(chunkTokens);

      // Ensure content is always a string (tiktoken might return Uint8Array in some cases)
      const chunkText = typeof decoded === 'string'
        ? decoded
        : decoded instanceof Uint8Array
          ? new TextDecoder().decode(decoded)
          : String(decoded);

      chunks.push({
        content: chunkText,
        index: index++,
        tokenCount: chunkTokens.length,
      });

      // Stop if we've reached the end
      if (i + chunkSize >= tokens.length) break;
    }

    return chunks;
  }

  /**
   * Estimate token count for text
   */
  countTokens(text: string): number {
    const tokens = this.encoder.encode(text);
    return tokens.length;
  }

  /**
   * Clean up encoder resources
   */
  cleanup() {
    this.encoder.free();
  }
}

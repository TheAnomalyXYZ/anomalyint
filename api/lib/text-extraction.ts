import PDFParser from 'pdf-parse';
import crypto from 'crypto';

export class TextExtractionService {
  /**
   * Extract text from PDF buffer
   */
  async extractFromPDF(buffer: Buffer): Promise<string> {
    const pdfData = await PDFParser(buffer);
    return pdfData.text;
  }

  /**
   * Extract text from plain text buffer
   */
  extractFromText(buffer: Buffer): string {
    return buffer.toString('utf-8');
  }

  /**
   * Compute SHA-256 hash of content for change detection
   */
  computeContentHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Clean and normalize extracted text
   */
  normalizeText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Reduce excessive newlines
      .trim();
  }
}

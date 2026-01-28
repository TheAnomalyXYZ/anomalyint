import { google } from 'googleapis';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  path?: string;
}

export class GoogleDriveService {
  private drive: any;

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    this.drive = google.drive({ version: 'v3', auth });
  }

  async listFilesInFolder(folderId: string, parentPath: string = ''): Promise<DriveFile[]> {
    const files: DriveFile[] = [];
    let pageToken: string | undefined;

    do {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size)',
        pageSize: 100,
        pageToken,
      });

      const currentFiles = response.data.files || [];

      // Add path information to files
      for (const file of currentFiles) {
        files.push({
          ...file,
          path: parentPath ? `${parentPath}/${file.name}` : file.name,
        });
      }

      pageToken = response.data.nextPageToken;

      // Recursively list subfolders
      const folders = currentFiles.filter(
        (f: any) => f.mimeType === 'application/vnd.google-apps.folder'
      );

      for (const folder of folders) {
        const subPath = parentPath ? `${parentPath}/${folder.name}` : folder.name;
        const subFiles = await this.listFilesInFolder(folder.id, subPath);
        files.push(...subFiles);
      }
    } while (pageToken);

    return files;
  }

  async exportGoogleDoc(fileId: string): Promise<string> {
    const response = await this.drive.files.export({
      fileId,
      mimeType: 'text/plain',
    });
    return response.data;
  }

  async downloadFile(fileId: string): Promise<Buffer> {
    const response = await this.drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );
    return Buffer.from(response.data);
  }

  /**
   * Check if a file is supported for text extraction
   */
  static isSupportedFile(mimeType: string): boolean {
    const supportedTypes = [
      'application/vnd.google-apps.document',
      'application/pdf',
      'text/plain',
      'text/markdown',
      'text/html',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    return supportedTypes.some(type => mimeType.includes(type));
  }
}

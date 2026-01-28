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
  private auth: any;

  constructor(accessToken: string, refreshToken?: string) {
    const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.VITE_GOOGLE_CLIENT_SECRET;

    console.log('GoogleDriveService initialized with:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      accessTokenPreview: accessToken ? `${accessToken.substring(0, 20)}...` : 'none',
    });

    if (!clientId || !clientSecret) {
      console.warn('VITE_GOOGLE_CLIENT_ID or VITE_GOOGLE_CLIENT_SECRET not set - token refresh will not work');
    }

    // Use OAuth2 client with refresh token support
    this.auth = new google.auth.OAuth2(clientId, clientSecret);

    this.auth.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    // Automatically refresh tokens when they expire
    this.auth.on('tokens', (tokens: any) => {
      if (tokens.refresh_token) {
        console.log('New refresh token received:', tokens.refresh_token);
      }
      if (tokens.access_token) {
        console.log('Access token refreshed');
      }
    });

    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  async listFilesInFolder(folderId: string, parentPath: string = ''): Promise<DriveFile[]> {
    const files: DriveFile[] = [];
    let pageToken: string | undefined;

    try {
      do {
        console.log(`Listing files in folder ${folderId}, page token: ${pageToken || 'none'}`);
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
    } catch (error: any) {
      console.error('Error listing files in Google Drive:', error);

      // Check if it's a 401 Unauthorized error
      if (error.code === 401 || error.response?.status === 401) {
        throw new Error('Google Drive authentication failed. The access token may be expired or invalid. Please re-authenticate.');
      }

      if (error instanceof Error) {
        throw new Error(`Failed to list Drive files: ${error.message}`);
      }
      throw new Error('Failed to list Drive files: Unknown error');
    }
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

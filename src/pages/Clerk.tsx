import { useState, useEffect } from 'react';
import { PageHeader } from '../components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface FillableField {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  page?: number;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
  url: string;
  status: 'uploading' | 'completed' | 'error' | 'detecting' | 'filling';
  fieldsDetected?: boolean;
  filledUrl?: string;
  detectedFields?: FillableField[];
  totalPages?: number;
}

export function Clerk() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch previously uploaded files on component mount
  useEffect(() => {
    async function fetchFiles() {
      try {
        const { data, error } = await supabase
          .from('clerk_documents')
          .select('*')
          .order('uploaded_at', { ascending: false });

        if (error) throw error;

        // Transform database records to UploadedFile format
        const loadedFiles: UploadedFile[] = (data || []).map(doc => ({
          id: doc.id,
          name: doc.file_name,
          size: Number(doc.file_size),
          uploadedAt: new Date(doc.uploaded_at),
          url: doc.r2_url,
          status: doc.status as UploadedFile['status'],
          fieldsDetected: doc.fields_detected,
          detectedFields: doc.detected_fields,
          totalPages: doc.total_pages,
          filledUrl: doc.filled_url || undefined,
        }));

        setFiles(loadedFiles);
      } catch (error) {
        console.error('Error fetching files:', error);
        toast.error('Failed to load previous uploads');
      } finally {
        setIsLoading(false);
      }
    }

    fetchFiles();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === 'application/pdf'
    );

    if (droppedFiles.length === 0) {
      toast.error('Please upload PDF files only');
      return;
    }

    await uploadFiles(droppedFiles);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    await uploadFiles(selectedFiles);
  };

  const uploadFiles = async (filesToUpload: File[]) => {
    for (const file of filesToUpload) {
      const fileId = crypto.randomUUID();
      const newFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        uploadedAt: new Date(),
        url: '',
        status: 'uploading',
      };

      setFiles((prev) => [newFile, ...prev]);

      try {
        // Create FormData for upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileId', fileId);

        // Upload to R2 via API endpoint
        const response = await fetch('/api/clerk/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();

        // Save to database
        const { error: dbError } = await supabase
          .from('clerk_documents')
          .insert({
            id: fileId,
            file_name: file.name,
            file_size: file.size,
            r2_url: data.url,
            status: 'uploaded',
            fields_detected: false,
          });

        if (dbError) {
          console.error('Database error:', dbError);
          throw new Error('Failed to save file metadata');
        }

        // Update file status
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { ...f, status: 'completed', url: data.url }
              : f
          )
        );

        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        console.error('Upload error:', error);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, status: 'error' } : f
          )
        );
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  };

  const handleDetectFields = async (fileId: string, pdfUrl: string) => {
    try {
      // Update status to detecting
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: 'detecting' as const } : f
        )
      );

      // Call the detect-fillable-areas endpoint (CV-based detection)
      const response = await fetch('/api/clerk/detect-fillable-areas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to detect fillable areas');
      }

      const data = await response.json();

      // Update database with detected fields
      const { error: dbError } = await supabase
        .from('clerk_documents')
        .update({
          status: 'completed',
          fields_detected: true,
          detected_fields: data.fields || [],
          total_pages: data.totalPages || 0,
          processed_at: new Date().toISOString(),
        })
        .eq('id', fileId);

      if (dbError) {
        console.error('Database error:', dbError);
      }

      // Update file status with detected fields
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: 'completed' as const,
                fieldsDetected: true,
                detectedFields: data.fields || [],
                totalPages: data.totalPages || 0,
              }
            : f
        )
      );

      const fieldCount = data.fieldsDetected || 0;
      toast.success(`Detected ${fieldCount} fillable areas! PDF is ready for filling.`);
    } catch (error) {
      console.error('Field detection error:', error);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: 'error' as const } : f
        )
      );
      toast.error('Failed to detect fillable areas');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clerk"
        description="Upload and manage PDF documents for AI-powered form filling"
      />

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload PDFs</CardTitle>
          <CardDescription>
            Drag and drop PDF files here or click to browse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-lg p-12
              transition-colors duration-200 cursor-pointer
              ${isDragging
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-primary/50'
              }
            `}
          >
            <input
              type="file"
              accept="application/pdf"
              multiple
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 rounded-full bg-primary/10">
                <Upload className="h-10 w-10 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">Drop PDF files here</p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse from your computer
                </p>
              </div>
              <Button variant="outline">
                Browse Files
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading previous uploads...</p>
            </div>
          </CardContent>
        </Card>
      ) : files.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
            <CardDescription>
              {files.length} {files.length === 1 ? 'document' : 'documents'} uploaded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="h-8 w-8 text-red-500" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)} • {file.uploadedAt.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {file.status === 'uploading' && (
                      <div className="flex items-center gap-2 text-blue-500">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-sm">Uploading...</span>
                      </div>
                    )}
                    {file.status === 'completed' && (
                      <div className="flex items-center gap-2 text-green-500">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-sm">Completed</span>
                      </div>
                    )}
                    {file.status === 'error' && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 text-red-500">
                          <AlertCircle className="h-5 w-5" />
                          <span className="text-sm">Failed</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDetectFields(file.id, file.url)}
                        >
                          Retry
                        </Button>
                      </div>
                    )}

                    {file.status === 'detecting' && (
                      <div className="flex items-center gap-2 text-blue-500">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-sm">Detecting fields...</span>
                      </div>
                    )}

                    {file.status === 'completed' && !file.fieldsDetected && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDetectFields(file.id, file.url)}
                      >
                        Detect Form Fields
                      </Button>
                    )}

                    {file.status === 'completed' && file.fieldsDetected && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          toast.info('AI form filling coming in next iteration!');
                        }}
                      >
                        Fill with AI
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { PageHeader } from '../components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Trash2, Brain, User, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, corporaApi } from '../lib/supabase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { cn } from '../lib/utils';
import OpenAI from 'openai';
import { Corpus } from '../lib/types';

interface FillableField {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  page?: number;
}

interface TextElement {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  page?: number;
}

interface FieldFill {
  fieldIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  value: string;
  label?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
  url: string;
  status: 'uploading' | 'uploaded' | 'completed' | 'error' | 'detecting' | 'filling';
  fieldsDetected?: boolean;
  filledUrl?: string;
  detectedFields?: FillableField[];
  lineFields?: FillableField[];
  tableFields?: FillableField[];
  textElements?: TextElement[];
  totalPages?: number;
  suggestedFills?: FieldFill[];
}

interface LineDetectionParams {
  cannyLow: number;
  cannyHigh: number;
  houghThreshold: number;
  minLineLength: number;
  maxLineGap: number;
  minWidth: number;
}

export function Clerk() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [currentFile, setCurrentFile] = useState<UploadedFile | null>(null);
  const [corpora, setCorpora] = useState<Corpus[]>([]);
  const [selectedCorpusId, setSelectedCorpusId] = useState<string>("");

  // Initialize OpenAI client
  const openaiClient = useRef<OpenAI | null>(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (apiKey) {
      openaiClient.current = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });
    } else {
      console.warn('OpenAI API key not found in environment variables');
    }
  }, []);

  // Load corpora on component mount
  useEffect(() => {
    loadCorpora();
  }, []);

  const loadCorpora = async () => {
    try {
      const corporaData = await corporaApi.getCorpora();
      setCorpora(corporaData || []);
      // Don't auto-select - let user explicitly choose which knowledge base to use
    } catch (error) {
      console.error('Error loading corpora:', error);
    }
  };

  // Line detection parameters with balanced default settings
  const [detectionParams, setDetectionParams] = useState<LineDetectionParams>({
    cannyLow: 115,
    cannyHigh: 175,
    houghThreshold: 150,
    minLineLength: 100,
    maxLineGap: 7,
    minWidth: 60,
  });

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
          lineFields: doc.line_fields,
          tableFields: doc.table_fields,
          textElements: doc.text_elements,
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
        const now = new Date().toISOString();
        const { error: dbError } = await supabase
          .from('clerk_documents')
          .insert({
            id: fileId,
            file_name: file.name,
            file_size: file.size,
            r2_url: data.url,
            status: 'uploaded',
            fields_detected: false,
            uploaded_at: now,
            created_at: now,
            updated_at: now,
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
      const now = new Date().toISOString();
      const { error: dbError } = await supabase
        .from('clerk_documents')
        .update({
          status: 'completed',
          fields_detected: true,
          detected_fields: data.fields || [],
          total_pages: data.totalPages || 0,
          processed_at: now,
          updated_at: now,
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

  const handleDetectLines = async (fileId: string, pdfUrl: string) => {
    try {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: 'detecting' as const } : f
        )
      );

      const response = await fetch('/api/clerk/detect-fillable-areas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfUrl, ...detectionParams }),
      });

      if (!response.ok) {
        throw new Error('Failed to detect lines');
      }

      const data = await response.json();

      const now = new Date().toISOString();
      const { error: dbError } = await supabase
        .from('clerk_documents')
        .update({
          status: 'completed',
          fields_detected: true,
          line_fields: data.fields || [],
          total_pages: data.totalPages || 0,
          processed_at: now,
          updated_at: now,
        })
        .eq('id', fileId);

      if (dbError) {
        console.error('Database error:', dbError);
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: 'completed' as const,
                fieldsDetected: true,
                lineFields: data.fields || [],
                totalPages: data.totalPages || 0,
              }
            : f
        )
      );

      const fieldCount = data.fieldsDetected || 0;
      toast.success(`Detected ${fieldCount} horizontal lines!`);
    } catch (error) {
      console.error('Line detection error:', error);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: 'error' as const } : f
        )
      );
      toast.error('Failed to detect lines');
    }
  };

  const handleDetectTables = async (fileId: string, pdfUrl: string) => {
    try {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: 'detecting' as const } : f
        )
      );

      const response = await fetch('/api/clerk/detect-table-cells', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to detect table cells');
      }

      const data = await response.json();

      const now = new Date().toISOString();
      const { error: dbError } = await supabase
        .from('clerk_documents')
        .update({
          status: 'completed',
          fields_detected: true,
          table_fields: data.fields || [],
          total_pages: data.totalPages || 0,
          processed_at: now,
          updated_at: now,
        })
        .eq('id', fileId);

      if (dbError) {
        console.error('Database error:', dbError);
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: 'completed' as const,
                fieldsDetected: true,
                tableFields: data.fields || [],
                totalPages: data.totalPages || 0,
              }
            : f
        )
      );

      const fieldCount = data.fieldsDetected || 0;
      toast.success(`Detected ${fieldCount} table cells!`);
    } catch (error) {
      console.error('Table detection error:', error);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: 'error' as const } : f
        )
      );
      toast.error('Failed to detect table cells');
    }
  };

  const handleDetectText = async (fileId: string, pdfUrl: string) => {
    try {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: 'detecting' as const } : f
        )
      );

      const response = await fetch('/api/clerk/detect-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to detect text');
      }

      const data = await response.json();

      const now = new Date().toISOString();
      const { error: dbError } = await supabase
        .from('clerk_documents')
        .update({
          status: 'completed',
          fields_detected: true,
          text_elements: data.textElements || [],
          total_pages: data.totalPages || 0,
          processed_at: now,
          updated_at: now,
        })
        .eq('id', fileId);

      if (dbError) {
        console.error('Database error:', dbError);
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: 'completed' as const,
                fieldsDetected: true,
                textElements: data.textElements || [],
                totalPages: data.totalPages || 0,
              }
            : f
        )
      );

      const textCount = data.textElementsDetected || 0;
      toast.success(`Detected ${textCount} text elements!`);
    } catch (error) {
      console.error('Text detection error:', error);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: 'error' as const } : f
        )
      );
      toast.error('Failed to detect text');
    }
  };

  const handleViewAnnotatedPdf = async (file: UploadedFile) => {
    try {
      if (!file.detectedFields || file.detectedFields.length === 0) {
        toast.error('No fields detected yet. Please run field detection first.');
        return;
      }

      toast.info('Generating annotated PDF...');

      // Call the annotate-pdf endpoint
      const response = await fetch('/api/clerk/annotate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfUrl: file.url,
          fields: file.detectedFields,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate annotated PDF');
      }

      const data = await response.json();

      // Convert base64 to blob
      const byteCharacters = atob(data.annotatedPdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      // Create URL and open in new tab
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');

      // Clean up URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 100);

      toast.success(`Annotated PDF with ${data.fieldsAnnotated} fields!`);
    } catch (error) {
      console.error('Annotation error:', error);
      toast.error('Failed to generate annotated PDF');
    }
  };

  const handleViewAnnotatedLines = async (file: UploadedFile) => {
    try {
      if (!file.lineFields || file.lineFields.length === 0) {
        toast.error('No line fields detected yet. Please run line detection first.');
        return;
      }

      toast.info('Generating annotated PDF with lines...');

      const response = await fetch('/api/clerk/annotate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfUrl: file.url,
          fields: file.lineFields,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate annotated PDF');
      }

      const data = await response.json();

      const byteCharacters = atob(data.annotatedPdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');

      setTimeout(() => URL.revokeObjectURL(url), 100);

      toast.success(`Annotated PDF with ${data.fieldsAnnotated} line fields!`);
    } catch (error) {
      console.error('Annotation error:', error);
      toast.error('Failed to generate annotated PDF');
    }
  };

  const handleViewAnnotatedTables = async (file: UploadedFile) => {
    try {
      if (!file.tableFields || file.tableFields.length === 0) {
        toast.error('No table fields detected yet. Please run table detection first.');
        return;
      }

      toast.info('Generating annotated PDF with tables...');

      const response = await fetch('/api/clerk/annotate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfUrl: file.url,
          fields: file.tableFields,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate annotated PDF');
      }

      const data = await response.json();

      const byteCharacters = atob(data.annotatedPdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');

      setTimeout(() => URL.revokeObjectURL(url), 100);

      toast.success(`Annotated PDF with ${data.fieldsAnnotated} table cells!`);
    } catch (error) {
      console.error('Annotation error:', error);
      toast.error('Failed to generate annotated PDF');
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    try {
      // Delete from database (this will cascade delete all associated data)
      const { error } = await supabase
        .from('clerk_documents')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      // Remove from UI state
      setFiles((prev) => prev.filter((f) => f.id !== fileId));

      toast.success(`${fileName} deleted successfully`);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(`Failed to delete ${fileName}`);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTextElements = (elements: TextElement[]): string => {
    return elements.map(elem =>
      `Text: ${elem.text}\nPage: ${elem.page || 'N/A'}\nConfidence: ${elem.confidence.toFixed(2)}%\nPosition: (${elem.x}, ${elem.y})\nSize: ${elem.width} × ${elem.height}`
    ).join('\n');
  };

  const formatLineFields = (fields: FillableField[]): string => {
    return fields.map((field, idx) =>
      `Field ${idx}:\nType: ${field.type}\nPage: ${field.page || 'N/A'}\nPosition: (${field.x}, ${field.y})\nSize: ${field.width} × ${field.height}${field.label ? `\nLabel: ${field.label}` : ''}`
    ).join('\n\n');
  };

  const handleOpenChat = async (file: UploadedFile) => {
    // Check if text elements exist
    if (!file.textElements || file.textElements.length === 0) {
      toast.error('No text detected. Please run "Detect Text" first.');
      return;
    }

    setCurrentFile(file);
    setChatOpen(true);
    setChatMessages([]);
    setChatInput("");

    if (!openaiClient.current) {
      toast.error('OpenAI API key not configured');
      return;
    }

    // Generate initial greeting with document summary
    const formattedText = formatTextElements(file.textElements);
    const formattedLines = file.lineFields ? formatLineFields(file.lineFields) : '';

    try {
      // Retrieve relevant chunks from knowledge corpus if selected
      let knowledgeContext = '';
      if (selectedCorpusId) {
        try {
          console.log(`[Clerk] Retrieving chunks from corpus: ${selectedCorpusId}`);
          const retrievalResponse = await fetch('/api/retrieve-chunks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: formattedText.substring(0, 2000), // Use first part of document as query
              corpus_id: selectedCorpusId,
              match_count: 10,
              match_threshold: 0.5, // Lowered threshold for more results
            }),
          });

          if (retrievalResponse.ok) {
            const retrievalData = await retrievalResponse.json();
            console.log(`[Clerk] Retrieval response:`, retrievalData);
            if (retrievalData.chunks && retrievalData.chunks.length > 0) {
              knowledgeContext = '\n\n## Knowledge Base Context:\n' +
                retrievalData.chunks.map((chunk: any, idx: number) =>
                  `[Source ${idx + 1}: ${chunk.file_name}]\n${chunk.content}`
                ).join('\n\n');
              console.log(`[Clerk] Retrieved ${retrievalData.chunks.length} relevant chunks from corpus`);
              toast.success(`Found ${retrievalData.chunks.length} relevant documents`);
            } else {
              console.warn(`[Clerk] No chunks found in corpus`);
              toast.info('No relevant documents found in knowledge base');
            }
          } else {
            const errorData = await retrievalResponse.json();
            console.error('[Clerk] Retrieval failed:', errorData);
            toast.error('Failed to retrieve knowledge base: ' + errorData.message);
          }
        } catch (error) {
          console.error('[Clerk] Failed to retrieve chunks:', error);
          toast.error('Error accessing knowledge base');
          // Continue without knowledge context
        }
      }

      const corpusContext = knowledgeContext
        ? `\n\nYou have access to a knowledge base with relevant information. Use the knowledge base context provided to give accurate, informed responses when filling forms or answering questions about the document.`
        : '';

      const systemPrompt = `You are an AI assistant helping users understand and fill out PDF forms. You have been provided with OCR-detected text from a PDF document with coordinates${file.lineFields ? ', and detected fillable line fields' : ''}.${corpusContext}

Your role:
1. Analyze the document structure and understand what type of form it is
2. Help users understand what information is needed
3. Assist with form filling by suggesting appropriate values
4. Use the fill_form_field function to suggest values for specific fields
5. Answer questions about the document

Be conversational, helpful, and concise.`;

      let userPrompt = `Here is a document:\n\n## Text Elements:\n${formattedText}`;

      if (formattedLines) {
        userPrompt += `\n\n## Fillable Line Fields:\n${formattedLines}`;
      }

      if (knowledgeContext) {
        userPrompt += knowledgeContext;
      }

      userPrompt += `\n\nGive me a summary of what this document is and what fields need to be filled.`;

      const tools: OpenAI.Chat.ChatCompletionTool[] = file.lineFields ? [{
        type: 'function',
        function: {
          name: 'fill_form_field',
          description: 'Suggest a value to fill in a specific form field by field index',
          parameters: {
            type: 'object',
            properties: {
              fieldIndex: {
                type: 'number',
                description: 'The index of the field to fill (from the Fillable Line Fields list)'
              },
              value: {
                type: 'string',
                description: 'The suggested value to fill in this field'
              },
              reasoning: {
                type: 'string',
                description: 'Brief explanation of why this value is appropriate'
              }
            },
            required: ['fieldIndex', 'value', 'reasoning']
          }
        }
      }] : [];

      const completion = await openaiClient.current.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: tools.length > 0 ? tools : undefined,
        temperature: 0.7,
        max_tokens: 1000,
      });

      const message = completion.choices[0]?.message;
      const summary = message?.content || 'I analyzed the document but could not generate a summary.';

      // Handle function calls if any
      if (message?.tool_calls && message.tool_calls.length > 0) {
        const fills: FieldFill[] = [];
        let functionResults = '';

        for (const toolCall of message.tool_calls) {
          if (toolCall.function.name === 'fill_form_field') {
            try {
              const args = JSON.parse(toolCall.function.arguments);
              const field = file.lineFields![args.fieldIndex];

              if (field) {
                fills.push({
                  fieldIndex: args.fieldIndex,
                  x: field.x,
                  y: field.y,
                  width: field.width,
                  height: field.height,
                  value: args.value,
                  label: field.label
                });

                functionResults += `\n✓ Field ${args.fieldIndex}: "${args.value}" (${args.reasoning})`;
              }
            } catch (error) {
              console.error('Error processing fill_form_field call:', error);
            }
          }
        }

        // Update file with suggested fills
        if (fills.length > 0) {
          setCurrentFile(prev => prev ? { ...prev, suggestedFills: fills } : null);
          setFiles(prev => prev.map(f =>
            f.id === file.id ? { ...f, suggestedFills: fills } : f
          ));
          toast.success(`AI suggested ${fills.length} field fills`);
        }

        setChatMessages([{
          role: 'assistant',
          content: summary + (functionResults ? `\n\n**Suggested Field Fills:**${functionResults}` : '')
        }]);
      } else {
        setChatMessages([{ role: 'assistant', content: summary }]);
      }
    } catch (error) {
      console.error('Error generating document summary:', error);
      toast.error('Failed to generate document summary');
      setChatMessages([{
        role: 'assistant',
        content: `I'm ready to help you with ${file.name}. I detected ${file.textElements.length} text elements. What would you like to know?`
      }]);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !openaiClient.current || !currentFile) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const formattedText = currentFile.textElements ? formatTextElements(currentFile.textElements) : '';
      const formattedLines = currentFile.lineFields ? formatLineFields(currentFile.lineFields) : '';

      // Retrieve relevant chunks from knowledge corpus if selected
      let knowledgeContext = '';
      if (selectedCorpusId) {
        try {
          console.log(`[Clerk] Retrieving chunks for query: "${userMessage}"`);
          const retrievalResponse = await fetch('/api/retrieve-chunks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: userMessage,
              corpus_id: selectedCorpusId,
              match_count: 10,
              match_threshold: 0.5, // Lowered threshold for more results
            }),
          });

          if (retrievalResponse.ok) {
            const retrievalData = await retrievalResponse.json();
            console.log(`[Clerk] Query retrieval response:`, retrievalData);
            if (retrievalData.chunks && retrievalData.chunks.length > 0) {
              knowledgeContext = '\n\n## Knowledge Base Context:\n' +
                retrievalData.chunks.map((chunk: any, idx: number) =>
                  `[Source ${idx + 1}: ${chunk.file_name}]\n${chunk.content}`
                ).join('\n\n');
              console.log(`[Clerk] Retrieved ${retrievalData.chunks.length} relevant chunks for user query`);
            } else {
              console.warn(`[Clerk] No relevant chunks found for query`);
            }
          } else {
            const errorData = await retrievalResponse.json();
            console.error('[Clerk] Query retrieval failed:', errorData);
          }
        } catch (error) {
          console.error('[Clerk] Failed to retrieve chunks for query:', error);
          // Continue without knowledge context
        }
      }

      const corpusContext = knowledgeContext
        ? `\n\nYou have access to a knowledge base with relevant information. Use the knowledge base context provided to give accurate, informed responses when filling forms or answering questions about the document.`
        : '';

      let documentContext = `## Text Elements:\n${formattedText}`;
      if (formattedLines) {
        documentContext += `\n\n## Fillable Line Fields:\n${formattedLines}`;
      }
      if (knowledgeContext) {
        documentContext += knowledgeContext;
      }

      const systemPrompt = `You are an AI assistant helping users understand and fill out PDF forms. You have access to the following document information:

${documentContext}${corpusContext}

Help the user understand the document and assist with form filling. When the user asks you to fill out the form or suggests values, use the fill_form_field function to specify which fields to fill and with what values. Be concise and helpful.`;

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...chatMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: userMessage }
      ];

      const tools: OpenAI.Chat.ChatCompletionTool[] = currentFile.lineFields ? [{
        type: 'function',
        function: {
          name: 'fill_form_field',
          description: 'Suggest a value to fill in a specific form field by field index',
          parameters: {
            type: 'object',
            properties: {
              fieldIndex: {
                type: 'number',
                description: 'The index of the field to fill (from the Fillable Line Fields list)'
              },
              value: {
                type: 'string',
                description: 'The suggested value to fill in this field'
              },
              reasoning: {
                type: 'string',
                description: 'Brief explanation of why this value is appropriate'
              }
            },
            required: ['fieldIndex', 'value', 'reasoning']
          }
        }
      }] : [];

      const completion = await openaiClient.current.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        tools: tools.length > 0 ? tools : undefined,
        temperature: 0.7,
        max_tokens: 1000,
      });

      const message = completion.choices[0]?.message;
      const assistantMessage = message?.content || 'I apologize, but I could not generate a response.';

      // Handle function calls if any
      if (message?.tool_calls && message.tool_calls.length > 0) {
        const fills: FieldFill[] = currentFile.suggestedFills || [];
        let functionResults = '';

        for (const toolCall of message.tool_calls) {
          if (toolCall.function.name === 'fill_form_field') {
            try {
              const args = JSON.parse(toolCall.function.arguments);
              const field = currentFile.lineFields![args.fieldIndex];

              if (field) {
                // Check if this field already has a suggestion, update it
                const existingIndex = fills.findIndex(f => f.fieldIndex === args.fieldIndex);

                const newFill: FieldFill = {
                  fieldIndex: args.fieldIndex,
                  x: field.x,
                  y: field.y,
                  width: field.width,
                  height: field.height,
                  value: args.value,
                  label: field.label
                };

                if (existingIndex >= 0) {
                  fills[existingIndex] = newFill;
                } else {
                  fills.push(newFill);
                }

                functionResults += `\n✓ Field ${args.fieldIndex}: "${args.value}" (${args.reasoning})`;
              }
            } catch (error) {
              console.error('Error processing fill_form_field call:', error);
            }
          }
        }

        // Update file with suggested fills
        if (fills.length > 0) {
          setCurrentFile(prev => prev ? { ...prev, suggestedFills: fills } : null);
          setFiles(prev => prev.map(f =>
            f.id === currentFile.id ? { ...f, suggestedFills: fills } : f
          ));
          toast.success(`AI suggested fills for ${message.tool_calls.length} fields`);
        }

        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: assistantMessage + (functionResults ? `\n\n**Suggested Field Fills:**${functionResults}` : '')
        }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to send message');
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clerk"
        description="Upload and manage PDF documents for AI-powered form filling"
      />

      {/* Line Detection Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Line Detection Settings</CardTitle>
              <CardDescription>
                Adjust parameters to fine-tune line detection without rebuilding
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              {showSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {showSettings && (
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              {/* Canny Low */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Canny Low Threshold: {detectionParams.cannyLow}
                </label>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={detectionParams.cannyLow}
                  onChange={(e) => setDetectionParams({ ...detectionParams, cannyLow: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Lower = detects fainter edges</p>
              </div>

              {/* Canny High */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Canny High Threshold: {detectionParams.cannyHigh}
                </label>
                <input
                  type="range"
                  min="100"
                  max="300"
                  value={detectionParams.cannyHigh}
                  onChange={(e) => setDetectionParams({ ...detectionParams, cannyHigh: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Lower = more edges detected</p>
              </div>

              {/* Hough Threshold */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Hough Threshold: {detectionParams.houghThreshold}
                </label>
                <input
                  type="range"
                  min="50"
                  max="300"
                  value={detectionParams.houghThreshold}
                  onChange={(e) => setDetectionParams({ ...detectionParams, houghThreshold: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Lower = more lines detected</p>
              </div>

              {/* Min Line Length */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Min Line Length: {detectionParams.minLineLength}px
                </label>
                <input
                  type="range"
                  min="20"
                  max="200"
                  value={detectionParams.minLineLength}
                  onChange={(e) => setDetectionParams({ ...detectionParams, minLineLength: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Minimum pixels to form a line</p>
              </div>

              {/* Max Line Gap */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Max Line Gap: {detectionParams.maxLineGap}px
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={detectionParams.maxLineGap}
                  onChange={(e) => setDetectionParams({ ...detectionParams, maxLineGap: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Max gap to connect broken lines</p>
              </div>

              {/* Min Width */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Min Width: {detectionParams.minWidth}px
                </label>
                <input
                  type="range"
                  min="20"
                  max="200"
                  value={detectionParams.minWidth}
                  onChange={(e) => setDetectionParams({ ...detectionParams, minWidth: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Filters out shorter lines/words</p>
              </div>
            </div>

            {/* Reset Button */}
            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setDetectionParams({
                  cannyLow: 115,
                  cannyHigh: 175,
                  houghThreshold: 150,
                  minLineLength: 100,
                  maxLineGap: 7,
                  minWidth: 60,
                })}
              >
                Reset to Defaults
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

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
                  className="border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="h-8 w-8 text-red-500" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)} • {file.uploadedAt.toLocaleString()}
                        </p>
                        {file.fieldsDetected && file.detectedFields && (
                          <p className="text-sm text-primary mt-1">
                            {file.detectedFields.length} fields detected across {file.totalPages} pages
                          </p>
                        )}
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

                    {(file.status === 'completed' || file.status === 'uploaded') && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDetectLines(file.id, file.url)}
                        >
                          Detect Lines
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDetectTables(file.id, file.url)}
                        >
                          Detect Tables
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDetectText(file.id, file.url)}
                        >
                          Detect Text
                        </Button>
                        {(file.lineFields || file.tableFields || file.textElements) && (
                          <>
                            {file.lineFields && file.lineFields.length > 0 && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleViewAnnotatedLines(file)}
                              >
                                View Lines PDF ({file.lineFields.length})
                              </Button>
                            )}
                            {file.tableFields && file.tableFields.length > 0 && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleViewAnnotatedTables(file)}
                              >
                                View Tables PDF ({file.tableFields.length})
                              </Button>
                            )}
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleOpenChat(file)}
                            >
                              Fill with AI
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedFileId(expandedFileId === file.id ? null : file.id)}
                            >
                              {expandedFileId === file.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </>
                        )}
                      </>
                    )}

                    {/* Delete button - always available */}
                    {file.status !== 'uploading' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFile(file.id, file.name)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  </div>

                  {/* Expanded Fields View */}
                  {expandedFileId === file.id && (file.lineFields || file.tableFields || file.textElements) && (
                    <div className="border-t p-4 bg-gray-50 dark:bg-gray-900">
                      <div className="space-y-6">
                        {/* Line Fields Section */}
                        {file.lineFields && file.lineFields.length > 0 && (
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Line Fields ({file.lineFields.length})</h4>
                              <div className="text-sm text-muted-foreground mb-3">
                                Horizontal line detections
                              </div>
                            </div>

                            <div className="max-h-96 overflow-y-auto space-y-3">
                              {file.lineFields.map((field: any, idx: number) => (
                                <div key={idx} className="bg-white dark:bg-gray-800 p-3 rounded border">
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="font-medium">Type:</span> {field.type}
                                    </div>
                                    <div>
                                      <span className="font-medium">Page:</span> {field.page || 'N/A'}
                                    </div>
                                    <div>
                                      <span className="font-medium">Position:</span> ({field.x}, {field.y})
                                    </div>
                                    <div>
                                      <span className="font-medium">Size:</span> {field.width} × {field.height}
                                    </div>
                                    {field.label && (
                                      <div className="col-span-2">
                                        <span className="font-medium">Label:</span> {field.label}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="pt-3 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const dataStr = JSON.stringify(file.lineFields, null, 2);
                                  const dataBlob = new Blob([dataStr], { type: 'application/json' });
                                  const url = URL.createObjectURL(dataBlob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = `${file.name}-lines.json`;
                                  link.click();
                                  URL.revokeObjectURL(url);
                                  toast.success('Line fields JSON downloaded');
                                }}
                              >
                                Download Line Fields JSON
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Table Fields Section */}
                        {file.tableFields && file.tableFields.length > 0 && (
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Table Cells ({file.tableFields.length})</h4>
                              <div className="text-sm text-muted-foreground mb-3">
                                Table structure detections
                              </div>
                            </div>

                            <div className="max-h-96 overflow-y-auto space-y-3">
                              {file.tableFields.map((field: any, idx: number) => (
                                <div key={idx} className="bg-white dark:bg-gray-800 p-3 rounded border">
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="font-medium">Type:</span> {field.type}
                                    </div>
                                    <div>
                                      <span className="font-medium">Page:</span> {field.page || 'N/A'}
                                    </div>
                                    <div>
                                      <span className="font-medium">Position:</span> ({field.x}, {field.y})
                                    </div>
                                    <div>
                                      <span className="font-medium">Size:</span> {field.width} × {field.height}
                                    </div>
                                    {field.label && (
                                      <div className="col-span-2">
                                        <span className="font-medium">Label:</span> {field.label}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="pt-3 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const dataStr = JSON.stringify(file.tableFields, null, 2);
                                  const dataBlob = new Blob([dataStr], { type: 'application/json' });
                                  const url = URL.createObjectURL(dataBlob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = `${file.name}-tables.json`;
                                  link.click();
                                  URL.revokeObjectURL(url);
                                  toast.success('Table fields JSON downloaded');
                                }}
                              >
                                Download Table Fields JSON
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Text Elements Section */}
                        {file.textElements && file.textElements.length > 0 && (
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Text Elements ({file.textElements.length})</h4>
                              <div className="text-sm text-muted-foreground mb-3">
                                OCR-detected text with coordinates
                              </div>
                            </div>

                            <div className="max-h-96 overflow-y-auto space-y-3">
                              {file.textElements.map((textElem: TextElement, idx: number) => (
                                <div key={idx} className="bg-white dark:bg-gray-800 p-3 rounded border">
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="col-span-2">
                                      <span className="font-medium">Text:</span> {textElem.text}
                                    </div>
                                    <div>
                                      <span className="font-medium">Page:</span> {textElem.page || 'N/A'}
                                    </div>
                                    <div>
                                      <span className="font-medium">Confidence:</span> {textElem.confidence.toFixed(2)}%
                                    </div>
                                    <div>
                                      <span className="font-medium">Position:</span> ({textElem.x}, {textElem.y})
                                    </div>
                                    <div>
                                      <span className="font-medium">Size:</span> {textElem.width} × {textElem.height}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="pt-3 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const dataStr = JSON.stringify(file.textElements, null, 2);
                                  const dataBlob = new Blob([dataStr], { type: 'application/json' });
                                  const url = URL.createObjectURL(dataBlob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = `${file.name}-text.json`;
                                  link.click();
                                  URL.revokeObjectURL(url);
                                  toast.success('Text elements JSON downloaded');
                                }}
                              >
                                Download Text Elements JSON
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Suggested Fills Section */}
                        {file.suggestedFills && file.suggestedFills.length > 0 && (
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2 text-green-600 dark:text-green-400">
                                AI Suggested Fills ({file.suggestedFills.length})
                              </h4>
                              <div className="text-sm text-muted-foreground mb-3">
                                AI-generated field values with coordinates
                              </div>
                            </div>

                            <div className="max-h-96 overflow-y-auto space-y-3">
                              {file.suggestedFills.map((fill: FieldFill, idx: number) => (
                                <div key={idx} className="bg-green-50 dark:bg-green-950 p-3 rounded border border-green-200 dark:border-green-800">
                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                      <span className="font-medium text-green-700 dark:text-green-300">
                                        Field {fill.fieldIndex}
                                      </span>
                                      {fill.label && (
                                        <span className="text-xs text-muted-foreground">
                                          ({fill.label})
                                        </span>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 pl-6">
                                      <div className="col-span-2">
                                        <span className="font-medium">Value:</span>{' '}
                                        <span className="text-green-700 dark:text-green-300 font-semibold">
                                          {fill.value}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="font-medium">Position:</span> ({fill.x}, {fill.y})
                                      </div>
                                      <div>
                                        <span className="font-medium">Size:</span> {fill.width} × {fill.height}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="pt-3 border-t flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const dataStr = JSON.stringify(file.suggestedFills, null, 2);
                                  const dataBlob = new Blob([dataStr], { type: 'application/json' });
                                  const url = URL.createObjectURL(dataBlob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = `${file.name}-suggested-fills.json`;
                                  link.click();
                                  URL.revokeObjectURL(url);
                                  toast.success('Suggested fills JSON downloaded');
                                }}
                              >
                                Download Suggested Fills JSON
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                className="gradient-primary text-white"
                                onClick={() => {
                                  toast.info('Apply fills feature coming soon');
                                }}
                              >
                                Apply Fills to PDF
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Summary */}
                        {file.totalPages && (
                          <div className="text-sm text-muted-foreground pt-3 border-t">
                            Total Pages: {file.totalPages}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* AI Chat Dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 gradient-primary text-white rounded-lg">
                <Brain className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <DialogTitle>AI Form Assistant</DialogTitle>
                <DialogDescription>
                  Chat with AI about {currentFile?.name || 'your document'}
                </DialogDescription>
              </div>
            </div>

            {/* Knowledge Base Selector */}
            {corpora.length > 0 && (
              <div className="mt-4">
                <Label className="text-sm font-medium mb-2 block">Knowledge Base</Label>
                <Select value={selectedCorpusId} onValueChange={setSelectedCorpusId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a knowledge base" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (General AI)</SelectItem>
                    {corpora.map((corpus) => (
                      <SelectItem key={corpus.id} value={corpus.id}>
                        {corpus.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCorpusId && selectedCorpusId !== 'none' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Responses will use knowledge from the selected corpus
                  </p>
                )}
              </div>
            )}
          </DialogHeader>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[400px] max-h-[50vh]">
            {chatMessages.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analyzing document...</h3>
                <p className="text-muted-foreground">
                  Please wait while I understand your document
                </p>
              </div>
            ) : (
              chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center justify-center w-8 h-8 gradient-primary text-white rounded-lg flex-shrink-0">
                      <Brain className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-lg px-4 py-3 max-w-[80%]",
                      message.role === 'user'
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600"
                        : "bg-muted"
                    )}
                  >
                    <p className={cn(
                      "text-sm whitespace-pre-wrap",
                      message.role === 'user' ? "text-white" : ""
                    )}>{message.content}</p>
                  </div>
                  {message.role === 'user' && (
                    <div className="flex items-center justify-center w-8 h-8 bg-slate-200 rounded-lg flex-shrink-0">
                      <User className="h-4 w-4 text-slate-600" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t bg-slate-50">
            <div className="flex gap-2">
              <Input
                placeholder="Ask about the document or request form filling..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1 bg-white"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!chatInput.trim()}
                className="gradient-primary text-white border-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

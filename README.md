
# AI Automation Dashboard UI

This is a code bundle for AI Automation Dashboard UI. The original project is available at https://www.figma.com/design/5bg6h6yUehvXU7U82vdQGD/AI-Automation-Dashboard-UI.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Features

### 📋 Clerk AI Form Assistant

The Clerk AI Form Assistant is an intelligent PDF form filling system that uses OpenAI function calling and RAG (Retrieval Augmented Generation) to automatically fill out forms based on your knowledge base.

#### How It Works

**1. PDF Upload & Analysis**

When you upload a PDF to Clerk:
- OCR detects all text elements with their positions, size, and confidence scores
- Form field detection identifies fillable fields (text boxes, checkboxes, etc.) with coordinates
- All data is structured and stored in the database

**2. Data Structure**

The system captures two types of data:

**Text Elements** - All detected text from the PDF:
```typescript
{
  text: string;      // The actual text content
  x: number;         // X coordinate on page
  y: number;         // Y coordinate on page
  width: number;     // Width of text box
  height: number;    // Height of text box
  confidence: number; // OCR confidence percentage
  page?: number;     // Page number
}
```

**Line Fields** - Detected fillable form fields:
```typescript
{
  type: string;      // Field type (e.g., "text", "checkbox")
  x: number;         // X coordinate
  y: number;         // Y coordinate
  width: number;     // Width of field
  height: number;    // Height of field
  label?: string;    // Associated label text
  page?: number;     // Page number
}
```

**3. AI Function Calling**

When you ask the AI to fill out the form, it uses OpenAI's function calling feature:

**Function Definition:**
```typescript
{
  name: 'fill_form_field',
  description: 'Suggest a value to fill in a specific form field by field index',
  parameters: {
    fieldIndex: number,  // Which field to fill (from detected fields)
    value: string,       // The value to fill in
    reasoning: string    // Why this value was chosen
  }
}
```

**4. RAG Integration**

The AI has access to your knowledge base:
- User's question generates an embedding using `text-embedding-3-large` (1536 dimensions)
- Vector similarity search retrieves up to 10 relevant document chunks (≥50% similarity threshold)
- Retrieved chunks are provided as context to help fill fields accurately
- The AI prioritizes the document's own text while using knowledge base for supplementary information

**5. Processing Flow**

```
PDF Upload
    ↓
OCR Detection (text + fields)
    ↓
User: "Chat with AI"
    ↓
Formatted Data Sent to OpenAI:
  - System Prompt (instructions)
  - Text Elements (all detected text)
  - Line Fields (all fillable fields)
  - Knowledge Base Context (RAG chunks)
  - Function Tool Definition
    ↓
User: "Fill out this form"
    ↓
AI Analyzes Document + Knowledge Base
    ↓
AI Calls fill_form_field() for each field:
  - fieldIndex: 0
  - value: "John Doe"
  - reasoning: "Name found in knowledge base profile"
    ↓
Function Calls Processed:
  - Create FieldFill objects with coordinates
  - Save to database
    ↓
Visual Overlay Rendered:
  - Draggable overlays at exact (x, y) positions
  - User can fine-tune or edit values
```

**6. Example Interaction**

```
User: "Fill out this W-2 form using my company's information"

AI retrieves from knowledge base:
  - Company Name: "Acme Corporation"
  - Address: "123 Main St, New York, NY"
  - EIN: "12-3456789"

AI function calls:
  fill_form_field(fieldIndex: 0, value: "Acme Corporation", reasoning: "Company name from profile")
  fill_form_field(fieldIndex: 1, value: "123 Main St", reasoning: "Address line 1 from profile")
  fill_form_field(fieldIndex: 2, value: "New York, NY", reasoning: "City and state from profile")
  fill_form_field(fieldIndex: 3, value: "12-3456789", reasoning: "EIN from company profile")

Result: Form fields are automatically filled with draggable overlays positioned at detected coordinates
```

**7. Key Features**

- **Intelligent Field Matching**: AI understands context and matches knowledge base data to appropriate fields
- **Visual Feedback**: Draggable overlays show exactly where values will be placed
- **Source Attribution**: AI explains its reasoning for each field fill
- **Knowledge Base Priority**: Document's own text takes precedence over knowledge base suggestions
- **Multi-page Support**: Handles forms spanning multiple pages with page-specific coordinates
- **Manual Override**: Users can drag, edit, or delete any AI-suggested fills

**8. Technology Stack**

- **OCR**: Custom PDF processing for text and field detection
- **Embeddings**: OpenAI `text-embedding-3-large` (1536 dimensions)
- **Vector Search**: PostgreSQL with pgvector extension
- **LLM**: OpenAI GPT-4o-mini with function calling
- **RAG**: Custom retrieval pipeline with 0.5 similarity threshold
- **Storage**: Supabase PostgreSQL for documents and chunks

### 🧠 AI Knowledge Chat

The AI Knowledge Chat provides RAG-powered question answering over your synced Google Drive documents.

**Features:**
- Vector similarity search with 0.5 threshold
- Retrieves up to 10 relevant document chunks per query
- Source attribution with file names and similarity scores
- Corpus-specific knowledge bases per brand profile

**How to Use:**
1. Navigate to Knowledge Corpus page
2. Connect a Google Drive folder to create a corpus
3. Sync documents (automatic chunking and embedding)
4. Click "Chat" button on any corpus
5. Select knowledge base and ask questions
6. AI responds with citations to source documents

### 🚀 Other Features

- **Pulse**: AI-generated event suggestions with Nova ratings
- **Profiles**: Manage brand profiles with Google Drive integration
- **AI Agents**: Configure automated content monitoring agents
- **Tracked Content**: Monitor specific sources for updates
- **Knowledge Corpus**: Sync and manage knowledge bases from Google Drive


  
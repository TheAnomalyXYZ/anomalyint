// Core data types for the predictive markets dashboard

export type QuestionState =
  | 'pending'           // AI suggestion awaiting review
  | 'approved'          // Approved and queued for publishing
  | 'rejected'          // Rejected suggestion
  | 'draft'             // Manual draft
  | 'awaiting_review'   // Awaiting manual review
  | 'published'         // Live market
  | 'answering_closed'  // Market closed for answers
  | 'awaiting_resolution' // Awaiting resolution
  | 'resolved'          // Market resolved
  | 'invalid'           // Invalid market
  | 'paused';           // Paused market

export type ReviewStatus = 'pending' | 'approved' | 'revision_requested';

export type Outcome = 'YES' | 'NO' | 'INVALID';

export type QuestionType = 'binary' | 'multi-option';

export interface NovaRating {
  rating: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'S';
  ratingCategory: string;
  confidence?: number;
  sparkline?: number[];
}

export interface Question {
  id: string;
  title: string;
  description: string;
  state: QuestionState;
  liveDate?: Date;
  answerEndAt: Date;
  settlementAt: Date;
  resolutionCriteria: string;
  categories: string[];
  topic?: string;
  agentId: string;
  pushedTo?: string[]; // Platforms where question is pushed (e.g., "Synapse Markets", "Vectra Markets")

  // Legacy single rating fields (kept for backward compatibility)
  rating?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'S'; // Nova rating
  ratingCategory?: string; // Category/reason for the rating
  ratingConfidence?: number; // 0-100 percentage
  ratingSparkline?: number[]; // confidence history over time
  // New multiple ratings array
  novaRatings?: NovaRating[];
  riskFlags?: string[];

  // Live market fields (for published states)
  reviewStatus?: ReviewStatus;
  outcome?: Outcome;
  outcomeEvidence?: string[];
  answerCount?: number;
  poolSize?: {
    total: number;
    yes: number;
    no: number;
  };
  tags?: string[];

  createdAt: Date;
  updatedAt: Date;
  type?: QuestionType;
}

// Alias for backward compatibility
export type ProposedQuestion = Question;

export interface Answer {
  id: string;
  questionId: string;
  questionTitle: string;
  choice: 'YES' | 'NO';
  closedAt: Date;
}

export interface KPIStat {
  label: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
}

// ConnectorHealth removed - no longer needed without sources

export interface AuditEvent {
  id: string;
  timestamp: Date;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, any>;
}

// AI Agent Types
export type AgentSourceType = 
  | 'website' 
  | 'api' 
  | 'x' 
  | 'reddit' 
  | 'feed';

export type AgentFrequency = 
  | 'daily' 
  | 'on_update' 
  | 'weekly';

export interface AgentSource {
  type: AgentSourceType;
  config: {
    url?: string;
    subreddit?: string;
    apiEndpoint?: string;
    feedUrl?: string;
  };
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  categories: string[];
  sources: AgentSource[];
  questionPrompt: string;
  secondFilterPrompt?: string;
  resolutionPrompt?: string;
  baseModel: string;
  frequency: AgentFrequency;
  status: 'active' | 'paused' | 'error';
  questionsCreated: number;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  updatedAt: Date;
  isTemplate?: boolean;
}

// AI Resolution Proposal Types
export type ResolutionProposalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'under_review';

export interface AIResolutionProposal {
  id: string;
  questionId: string;
  resolution: Outcome;
  confidenceScore: number; // 0.0000 to 1.0000
  reasoning: string;
  evidence?: {
    sources?: string[];
    dataPoints?: Array<{
      metric: string;
      value: string | number;
      timestamp?: Date;
    }>;
    urls?: string[];
  };
  status: ResolutionProposalStatus;
  createdBy: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Brand Profile Types
export interface BrandProfile {
  id: string;
  name: string;
  brandDescription: string;
  website: string;
  industry: string;
  targetAudience: string;
  brandVoice: string;
  keyValues: string[];
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  socialLinks: {
    twitter: string;
    linkedin: string;
    facebook: string;
    instagram: string;
  };
  metaContent: string[];
  googleDriveFolderIds: string[]; // Array of Google Drive folder IDs
  createdAt: Date;
  updatedAt: Date;
}

// Knowledge Corpus Types for RAG
export type SyncStatus = 'idle' | 'running' | 'completed' | 'error';

export interface DriveSource {
  id: string;
  displayName: string;
  googleAccountEmail?: string;
  status: string;
  oauth_credential?: {
    token_expires_at: string;
  };
}

export interface SyncStats {
  files_processed: number;
  files_failed: number;
  total_files: number;
  total_chunks?: number;
  errors?: string[];
}

export interface Corpus {
  id: string;
  name: string;
  description?: string;
  brandProfileId?: string;
  driveSourceId: string;
  googleDriveFolderId: string;
  syncStatus: SyncStatus;
  lastSyncAt?: Date;
  lastSyncStats?: SyncStats;
  syncConfig?: {
    recursive?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  // Populated from join
  drive_source?: DriveSource;
  brand_profile?: {
    id: string;
    name: string;
  };
}

export type IngestionJobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface IngestionProgress {
  stage: string;
  current: number;
  total: number;
}

export interface IngestionJob {
  id: string;
  corpusId: string;
  status: IngestionJobStatus;
  progress: IngestionProgress;
  stats?: SyncStats;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchResult {
  chunk_id: string;
  document_id: string;
  content: string;
  similarity: number;
  metadata: Record<string, any>;
  file_name: string;
  file_path?: string;
}
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Database, RefreshCw, CheckCircle2, AlertCircle, Clock, Trash2, X, KeyRound, MessageSquare, Brain, Send, User } from 'lucide-react';
import { toast } from 'sonner';
import { Corpus, IngestionJob, SyncStatus, BrandProfile } from '../lib/types';
import { profilesApi, corporaApi } from '../lib/supabase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { cn } from '../lib/utils';
import OpenAI from 'openai';

export function KnowledgeCorpus() {
  const [corpora, setCorpora] = useState<Corpus[]>([]);
  const [jobs, setJobs] = useState<Map<string, IngestionJob>>(new Map());
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<Set<string>>(new Set());
  const [clearing, setClearing] = useState<Set<string>>(new Set());
  const [settingUp, setSettingUp] = useState(false);
  const [profiles, setProfiles] = useState<BrandProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [editingCorpusId, setEditingCorpusId] = useState<string | null>(null);
  const [editFolderId, setEditFolderId] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedChatCorpusId, setSelectedChatCorpusId] = useState<string>('');
  const openaiClient = useRef<OpenAI | null>(null);

  // Initialize OpenAI client
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

  useEffect(() => {
    loadCorpora();
    loadProfiles();

    // Handle OAuth redirect callbacks
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const refreshed = params.get('refreshed');
    const error = params.get('error');
    const message = params.get('message');

    if (success) {
      if (refreshed) {
        toast.success('OAuth tokens refreshed successfully!');
      } else {
        toast.success('Successfully connected to Google Drive!');
      }
      // Clean URL
      window.history.replaceState({}, '', '/knowledge-corpus');
      loadCorpora();
    } else if (error) {
      toast.error(`OAuth failed: ${message || error}`);
      // Clean URL
      window.history.replaceState({}, '', '/knowledge-corpus');
    }
  }, []);

  const loadCorpora = async (): Promise<Corpus[]> => {
    setLoading(true);
    try {
      const data = await corporaApi.getCorpora();
      setCorpora(data || []);
      return data || [];
    } catch (error) {
      toast.error('Failed to load corpora');
      console.error(error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const loadProfiles = async () => {
    try {
      const profilesData = await profilesApi.getProfiles();
      setProfiles(profilesData);
      // Auto-select first profile if available
      if (profilesData.length > 0 && !selectedProfileId) {
        setSelectedProfileId(profilesData[0].id);
      }
    } catch (error) {
      toast.error('Failed to load profiles');
      console.error(error);
    }
  };

  // Auto-select first folder when profile changes
  useEffect(() => {
    if (selectedProfileId) {
      const profile = profiles.find(p => p.id === selectedProfileId);
      if (profile && profile.googleDriveFolderIds && profile.googleDriveFolderIds.length > 0) {
        setSelectedFolderId(profile.googleDriveFolderIds[0]);
      } else {
        setSelectedFolderId('');
      }
    }
  }, [selectedProfileId, profiles]);

  const handleConnectGoogle = () => {
    if (!selectedProfileId) {
      toast.error('Please select a brand profile first');
      return;
    }

    if (!selectedFolderId) {
      toast.error('Please select a Google Drive folder');
      return;
    }

    // Redirect to OAuth init endpoint
    const oauthUrl = `/api/oauth/google/init?profile_id=${selectedProfileId}&folder_id=${selectedFolderId}`;
    window.location.href = oauthUrl;
  };

  const handleSync = async (corpusId: string) => {
    try {
      setSyncing(prev => new Set(prev).add(corpusId));

      // Call the actual Vercel API endpoint to trigger file processing
      const response = await fetch('/api/corpora-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corpus_id: corpusId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Failed to start sync');
      }

      const data = await response.json();

      toast.success('Sync started!');

      // Poll job status
      const jobId = data.job_id;
      pollJobStatus(corpusId, jobId);
    } catch (error) {
      setSyncing(prev => {
        const next = new Set(prev);
        next.delete(corpusId);
        return next;
      });
      toast.error(error instanceof Error ? error.message : 'Failed to start sync');
    }
  };

  const handleClear = async (corpusId: string, isCurrentlySyncing: boolean) => {
    // Different confirmation messages based on whether sync is running
    const confirmMessage = isCurrentlySyncing
      ? 'Stop the current sync and reset to idle? Partial progress will be saved.'
      : 'Are you sure you want to clear all ingestion jobs and reset this corpus? This will delete all indexed documents and chunks.';

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setClearing(prev => new Set(prev).add(corpusId));

      // If stopping a sync, also clear the syncing state
      if (isCurrentlySyncing) {
        setSyncing(prev => {
          const next = new Set(prev);
          next.delete(corpusId);
          return next;
        });
      }

      const response = await fetch('/api/corpora-clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corpus_id: corpusId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Failed to clear corpus');
      }

      toast.success(isCurrentlySyncing ? 'Sync stopped and corpus reset' : 'Corpus cleared successfully');

      // Clear local job state
      setJobs(prev => {
        const next = new Map(prev);
        next.delete(corpusId);
        return next;
      });

      // Reload corpora to show updated state
      await loadCorpora();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to clear corpus');
    } finally {
      setClearing(prev => {
        const next = new Set(prev);
        next.delete(corpusId);
        return next;
      });
    }
  };

  const handleEditFolderId = (corpus: Corpus) => {
    setEditingCorpusId(corpus.id);
    setEditFolderId(corpus.googleDriveFolderId);
  };

  const handleSaveFolderId = async (corpusId: string) => {
    if (!editFolderId.trim()) {
      toast.error('Folder ID cannot be empty');
      return;
    }

    try {
      const updatedCorpus = await corporaApi.updateCorpus(corpusId, {
        googleDriveFolderId: editFolderId.trim(),
      });

      if (updatedCorpus) {
        setCorpora(corpora.map(c => (c.id === corpusId ? updatedCorpus : c)));
        toast.success('Folder ID updated successfully!');
        setEditingCorpusId(null);
        setEditFolderId('');
      }
    } catch (error) {
      console.error('Error updating folder ID:', error);
      toast.error('Failed to update folder ID');
    }
  };

  const handleCancelEditFolderId = () => {
    setEditingCorpusId(null);
    setEditFolderId('');
  };

  const handleOpenChat = (corpusId: string) => {
    setSelectedChatCorpusId(corpusId);
    setChatOpen(true);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    if (!openaiClient.current) {
      toast.error("OpenAI API not configured. Please check your API key.");
      return;
    }

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const selectedCorpus = corpora.find(c => c.id === selectedChatCorpusId);
      const systemPrompt = selectedCorpus
        ? `You are an AI assistant with access to the "${selectedCorpus.name}" knowledge base. Answer questions using information from this corpus when relevant.`
        : 'You are an AI assistant helping with content creation and answering questions.';

      const completion = await openaiClient.current.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...chatMessages.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const assistantMessage = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
      setChatMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    }
  };

  const pollJobStatus = (corpusId: string, jobId: string) => {
    const intervalId = setInterval(async () => {
      try {
        const job = await corporaApi.getIngestionJob(jobId);

        setJobs(prev => new Map(prev).set(corpusId, job as IngestionJob));

        if (job.status === 'completed') {
          clearInterval(intervalId);

          // Reload corpora to check if sync_status is still 'running'
          const updatedCorpora = await loadCorpora();

          // Check if corpus needs another batch using freshly loaded data
          const corpus = updatedCorpora.find(c => c.id === corpusId);
          if (corpus && corpus.syncStatus === 'running') {
            // Trigger another sync for the next batch
            console.log('Triggering next batch for corpus:', corpusId);
            const totalFiles = corpus.lastSyncStats?.total_files || 0;
            const processedFiles = corpus.lastSyncStats?.files_processed || 0;
            toast.info(`Processing file ${processedFiles + 1}/${totalFiles}...`);
            handleSync(corpusId);
          } else {
            // All done
            setSyncing(prev => {
              const next = new Set(prev);
              next.delete(corpusId);
              return next;
            });
            const totalProcessed = corpus?.lastSyncStats?.files_processed || job.stats?.files_processed || 0;
            const totalFailed = corpus?.lastSyncStats?.files_failed || 0;
            toast.success(`Sync completed! ${totalProcessed} files processed${totalFailed > 0 ? `, ${totalFailed} failed` : ''}.`);
          }
          return;
        }

        if (job.status === 'failed') {
          clearInterval(intervalId);
          setSyncing(prev => {
            const next = new Set(prev);
            next.delete(corpusId);
            return next;
          });
          loadCorpora();
          toast.error(`Sync failed: ${job.error_message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        clearInterval(intervalId);
        setSyncing(prev => {
          const next = new Set(prev);
          next.delete(corpusId);
          return next;
        });
      }
    }, 2000);
  };

  const getStatusBadge = (status: SyncStatus) => {
    const configs: Record<SyncStatus, { className: string; icon: any; label: string }> = {
      idle: {
        className: 'bg-gray-500 hover:bg-gray-500',
        icon: Clock,
        label: 'IDLE',
      },
      running: {
        className: 'bg-blue-500 hover:bg-blue-500 animate-pulse',
        icon: RefreshCw,
        label: 'SYNCING',
      },
      completed: {
        className: 'bg-green-500 hover:bg-green-500',
        icon: CheckCircle2,
        label: 'COMPLETED',
      },
      error: {
        className: 'bg-red-500 hover:bg-red-500',
        icon: AlertCircle,
        label: 'ERROR',
      },
    };

    const config = configs[status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.className} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getTokenStatus = (corpus: Corpus) => {
    if (!corpus.drive_source?.oauth_credential?.token_expires_at) {
      return { isExpired: true, message: 'No OAuth token' };
    }

    const expiresAt = new Date(corpus.drive_source.oauth_credential.token_expires_at);
    const now = new Date();
    const isExpired = expiresAt <= now;

    return {
      isExpired,
      expiresAt,
      message: isExpired
        ? 'OAuth token expired - please re-authenticate'
        : `Token valid until ${expiresAt.toLocaleString('en-US', { timeZone: 'America/Toronto' })}`,
    };
  };

  const handleReauthenticate = (corpusId: string) => {
    // Redirect to refresh OAuth flow
    const oauthUrl = `/api/oauth/google/refresh-init?corpus_id=${corpusId}`;
    window.location.href = oauthUrl;
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString('en-US', {
      timeZone: 'America/Toronto',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Database className="h-12 w-12 animate-pulse text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Database className="h-8 w-8" />
            Knowledge Corpus
          </h1>
          <p className="text-muted-foreground mt-1">
            Sync Google Drive folders for RAG retrieval
          </p>
        </div>
      </div>

      {/* Setup Form - Collapsible when corpora exist */}
      {(corpora.length === 0 || showAddForm) ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {corpora.length === 0 ? 'Initialize Knowledge Corpus' : 'Add Knowledge Corpus'}
                </CardTitle>
                <CardDescription>
                  {corpora.length === 0
                    ? 'Connect a Google Drive folder to create a knowledge base for RAG retrieval'
                    : 'Create an additional knowledge base for another brand profile'}
                </CardDescription>
              </div>
              {corpora.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
          <div className="space-y-4">
            {/* Profile Selection */}
            <div className="space-y-2">
              <Label htmlFor="profile">Brand Profile</Label>
              <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                <SelectTrigger id="profile">
                  <SelectValue placeholder="Select a brand profile" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Each profile can have its own isolated knowledge base
              </p>
            </div>

            {/* Google Drive Folder Selection */}
            {selectedProfileId && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="folder">Google Drive Folder</Label>
                  <Select
                    value={selectedFolderId}
                    onValueChange={setSelectedFolderId}
                    disabled={!selectedProfileId}
                  >
                    <SelectTrigger id="folder">
                      <SelectValue placeholder="Select a folder" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles
                        .find(p => p.id === selectedProfileId)
                        ?.googleDriveFolderIds?.map(folderId => (
                          <SelectItem key={folderId} value={folderId}>
                            {folderId}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Folders configured in the Profiles page. Folder ID from Google Drive URL.
                  </p>
                </div>
              </>
            )}
          </div>

          <Button
            onClick={handleConnectGoogle}
            disabled={!selectedProfileId || !selectedFolderId}
            className="w-full gradient-primary text-white border-0"
          >
            <Database className="h-4 w-4 mr-2" />
            Connect with Google Drive
          </Button>
        </CardContent>
        </Card>
      ) : (
        <Button
          onClick={() => setShowAddForm(true)}
          variant="outline"
          className="w-full border-dashed border-2 h-16 hover:border-indigo-500 hover:bg-indigo-50"
        >
          <Database className="h-5 w-5 mr-2" />
          Add Knowledge Corpus
        </Button>
      )}

      {/* Existing Corpora List */}
      {corpora.length > 0 && (
        <div className="grid gap-4">
          {corpora.map(corpus => {
            const job = jobs.get(corpus.id);
            const isRunning = corpus.syncStatus === 'running' || syncing.has(corpus.id);
            const isClearing = clearing.has(corpus.id);

            return (
              <Card key={corpus.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>{corpus.name}</CardTitle>
                      {corpus.description && (
                        <CardDescription>{corpus.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(corpus.syncStatus)}
                      <Button
                        onClick={() => handleReauthenticate(corpus.id)}
                        disabled={isRunning || isClearing}
                        size="sm"
                        variant="outline"
                        title="Refresh OAuth tokens"
                      >
                        <KeyRound className="h-4 w-4 mr-2" />
                        Refresh Auth
                      </Button>
                      <Button
                        onClick={() => handleSync(corpus.id)}
                        disabled={isRunning || isClearing}
                        size="sm"
                        variant="outline"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
                        Sync Now
                      </Button>
                      <Button
                        onClick={() => handleOpenChat(corpus.id)}
                        size="sm"
                        variant="outline"
                        className="gradient-primary text-white border-0"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat
                      </Button>
                      <Button
                        onClick={() => handleClear(corpus.id, isRunning)}
                        disabled={isClearing}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className={`h-4 w-4 mr-2 ${isClearing ? 'animate-pulse' : ''}`} />
                        {isRunning ? 'Stop' : 'Clear'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* OAuth Token Status */}
                  {(() => {
                    const tokenStatus = getTokenStatus(corpus);
                    return (
                      <div className={`flex items-center justify-between text-sm p-2 rounded ${tokenStatus.isExpired ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                        <div className="flex items-center gap-2">
                          {tokenStatus.isExpired ? (
                            <AlertCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          <span>{tokenStatus.message}</span>
                        </div>
                        {tokenStatus.isExpired && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-white hover:bg-gray-50"
                            onClick={() => handleReauthenticate(corpus.id)}
                          >
                            Re-authenticate
                          </Button>
                        )}
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    {/* Brand profile info */}
                    {corpus.brand_profile && (
                      <div>
                        <span className="font-medium">Profile:</span>{' '}
                        <span className="text-foreground">{corpus.brand_profile.name}</span>
                      </div>
                    )}

                    {/* Drive source info */}
                    {corpus.drive_source && (
                      <div>
                        <span className="font-medium">Drive Source:</span> {corpus.drive_source.displayName}
                        {corpus.drive_source.googleAccountEmail && (
                          <span className="ml-2">({corpus.drive_source.googleAccountEmail})</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Google Drive Folder ID */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Google Drive Folder ID</Label>
                    {editingCorpusId === corpus.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={editFolderId}
                          onChange={(e) => setEditFolderId(e.target.value)}
                          placeholder="Enter folder ID"
                          className="font-mono text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveFolderId(corpus.id)}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEditFolderId}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm bg-muted/50 px-3 py-2 rounded border">
                          {corpus.googleDriveFolderId}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditFolderId(corpus)}
                          disabled={isRunning || isClearing}
                        >
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Sync progress */}
                  {isRunning && job && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{job.progress.stage.replace(/_/g, ' ')}</span>
                        <span className="text-muted-foreground">
                          {job.progress.current} / {job.progress.total}
                        </span>
                      </div>
                      <Progress
                        value={
                          job.progress.total > 0
                            ? (job.progress.current / job.progress.total) * 100
                            : 0
                        }
                      />
                    </div>
                  )}

                  {/* Last sync stats */}
                  {corpus.lastSyncStats && corpus.lastSyncAt && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Last Sync:</span>{' '}
                        <span className="font-medium">{formatDate(corpus.lastSyncAt)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Files Processed:</span>{' '}
                        <span className="font-medium">{corpus.lastSyncStats.files_processed}</span>
                      </div>
                      {corpus.lastSyncStats.total_chunks !== undefined && (
                        <div>
                          <span className="text-muted-foreground">Total Chunks:</span>{' '}
                          <span className="font-medium">{corpus.lastSyncStats.total_chunks}</span>
                        </div>
                      )}
                      {corpus.lastSyncStats.files_failed > 0 && (
                        <div>
                          <span className="text-red-500">Failed:</span>{' '}
                          <span className="font-medium text-red-500">
                            {corpus.lastSyncStats.files_failed}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error messages */}
                  {corpus.syncStatus === 'error' && corpus.lastSyncStats?.errors && corpus.lastSyncStats.errors.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-red-500">Errors:</p>
                      <ul className="text-xs text-red-500 list-disc list-inside space-y-1">
                        {corpus.lastSyncStats.errors.slice(0, 3).map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                        {corpus.lastSyncStats.errors.length > 3 && (
                          <li>... and {corpus.lastSyncStats.errors.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* AI Chat Modal */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 gradient-primary text-white rounded-lg">
                <Brain className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <DialogTitle>AI Content Generator</DialogTitle>
                <DialogDescription>
                  Chat with AI to create engaging content
                </DialogDescription>
              </div>
            </div>

            {/* Knowledge Base Selector */}
            {corpora.length > 0 && (
              <div className="mt-4">
                <Label className="text-sm font-medium mb-2 block">Knowledge Base</Label>
                <Select value={selectedChatCorpusId} onValueChange={setSelectedChatCorpusId}>
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
                {selectedChatCorpusId && selectedChatCorpusId !== 'none' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Querying: {corpora.find(c => c.id === selectedChatCorpusId)?.name}
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
                <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
                <p className="text-muted-foreground">
                  Ask me to create content about anything
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
                placeholder="Type your message..."
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

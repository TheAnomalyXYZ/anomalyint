import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Database, RefreshCw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Corpus, IngestionJob, SyncStatus, BrandProfile } from '../lib/types';
import { profilesApi, corporaApi } from '../lib/supabase';

export function KnowledgeCorpus() {
  const [corpora, setCorpora] = useState<Corpus[]>([]);
  const [jobs, setJobs] = useState<Map<string, IngestionJob>>(new Map());
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<Set<string>>(new Set());
  const [settingUp, setSettingUp] = useState(false);
  const [profiles, setProfiles] = useState<BrandProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');

  useEffect(() => {
    loadCorpora();
    loadProfiles();
  }, []);

  const loadCorpora = async () => {
    setLoading(true);
    try {
      const data = await corporaApi.getCorpora();
      setCorpora(data || []);
    } catch (error) {
      toast.error('Failed to load corpora');
      console.error(error);
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

  const handleSetup = async () => {
    if (!selectedProfileId) {
      toast.error('Please select a brand profile first');
      return;
    }

    setSettingUp(true);
    try {
      const selectedProfile = profiles.find(p => p.id === selectedProfileId);

      // TODO: Replace with actual OAuth flow - these are placeholder values
      const accessToken = import.meta.env.VITE_GOOGLE_ACCESS_TOKEN || '';
      const refreshToken = import.meta.env.VITE_GOOGLE_REFRESH_TOKEN || '';
      const folderId = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID || '';

      if (!accessToken || !refreshToken || !folderId) {
        toast.error('Google OAuth credentials not configured. Please set VITE_GOOGLE_ACCESS_TOKEN, VITE_GOOGLE_REFRESH_TOKEN, and VITE_GOOGLE_DRIVE_FOLDER_ID in .env');
        return;
      }

      await corporaApi.setupCorpus({
        access_token: accessToken,
        refresh_token: refreshToken,
        google_drive_folder_id: folderId,
        corpus_name: `${selectedProfile?.name || 'Test'} Knowledge Base`,
        corpus_description: 'Documents for RAG retrieval',
        google_account_email: 'long@theanomaly.xyz',
        brand_profile_id: selectedProfileId,
      });

      toast.success('Knowledge Corpus setup completed!');
      await loadCorpora();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to setup corpus');
    } finally {
      setSettingUp(false);
    }
  };

  const handleSync = async (corpusId: string) => {
    try {
      setSyncing(prev => new Set(prev).add(corpusId));

      const data = await corporaApi.syncCorpus(corpusId);

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

  const pollJobStatus = (corpusId: string, jobId: string) => {
    const intervalId = setInterval(async () => {
      try {
        const job = await corporaApi.getIngestionJob(jobId);

        setJobs(prev => new Map(prev).set(corpusId, job as IngestionJob));

        if (job.status === 'completed' || job.status === 'failed') {
          clearInterval(intervalId);
          setSyncing(prev => {
            const next = new Set(prev);
            next.delete(corpusId);
            return next;
          });
          loadCorpora();

          if (job.status === 'completed') {
            const filesProcessed = job.stats?.files_processed || 0;
            const chunksCreated = job.stats?.total_chunks || 0;
            toast.success(`Sync completed! ${filesProcessed} files indexed (${chunksCreated} chunks).`);
          } else {
            toast.error(`Sync failed: ${job.error_message || 'Unknown error'}`);
          }
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

      {corpora.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No corpora configured</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select a brand profile and initialize your first Knowledge Corpus with Google Drive.
            </p>

            <div className="flex flex-col items-center gap-4">
              <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                <SelectTrigger className="w-64">
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

              <Button
                onClick={handleSetup}
                disabled={settingUp || !selectedProfileId}
                className="gradient-primary text-white border-0"
              >
                {settingUp ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Initialize Knowledge Corpus
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              This will create a corpus for the selected profile connected to your Google Drive folder.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {corpora.map(corpus => {
            const job = jobs.get(corpus.id);
            const isRunning = corpus.syncStatus === 'running' || syncing.has(corpus.id);

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
                        onClick={() => handleSync(corpus.id)}
                        disabled={isRunning}
                        size="sm"
                        variant="outline"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
                        Sync Now
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
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
    </div>
  );
}

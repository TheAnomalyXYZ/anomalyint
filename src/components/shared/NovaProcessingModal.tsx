import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Star, CheckCircle2, AlertCircle, Loader2, FileText, RefreshCw, Trash2 } from 'lucide-react';
import { Question } from '../../lib/types';
import { toast } from 'sonner';
import { novaRatingsApi } from '../../lib/supabase'; // Still needed for deleteRating functionality

interface NovaProcessingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: Question[];
  onComplete: () => void;
}

interface QuestionBatch {
  questionId: string;
  question: string;
  agentId: string;
  settlementAt: string;
}

interface RatingResponse {
  questionId: string;
  rating: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'S';
  ratingCategory?: string;
  question: string;
}

const BATCH_SIZE = 3;
const WEBHOOK_URL = 'https://theanomaly.app.n8n.cloud/webhook/57fa52c2-cc79-4831-bf51-482c7cd6d314';

export function NovaProcessingModal({
  open,
  onOpenChange,
  questions,
  onComplete
}: NovaProcessingModalProps) {
  const [processing, setProcessing] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'processing' | 'selection' | 'processed'>('selection');

  // Calculate unprocessed questions (those without ratings)
  const unprocessedQuestions = questions.filter(q => !q.rating);

  // Calculate processed questions (those with ratings)
  const processedQuestions = questions.filter(q => q.rating && q.state === 'pending');

  // Use selected questions or all unprocessed if none selected
  const questionsToProcess = selectedQuestionIds.size > 0
    ? unprocessedQuestions.filter(q => selectedQuestionIds.has(q.id))
    : unprocessedQuestions;

  const totalUnprocessed = questionsToProcess.length;
  const totalBatches = Math.ceil(totalUnprocessed / BATCH_SIZE);

  // Selection handlers
  const toggleQuestion = (questionId: string) => {
    setSelectedQuestionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const toggleAll = () => {
    if (selectedQuestionIds.size === unprocessedQuestions.length) {
      setSelectedQuestionIds(new Set());
    } else {
      setSelectedQuestionIds(new Set(unprocessedQuestions.map(q => q.id)));
    }
  };

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const processBatch = async (batch: QuestionBatch[]): Promise<RatingResponse[]> => {
    try {
      addLog(`Sending batch of ${batch.length} questions to Nova API...`);

      // Create an AbortController with a 5-minute timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes in milliseconds

      try {
        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(batch),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const ratings: RatingResponse[] = await response.json();
        addLog(`✓ Received ${ratings.length} ratings from Nova API`);
        return ratings;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timed out after 5 minutes');
        }
        throw error;
      }
    } catch (error) {
      addLog(`✗ Error processing batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

  // COMMENTED OUT: Ratings are now saved via external /api/save-ratings endpoint
  // The webhook will POST ratings directly to the API endpoint instead
  // const saveRatings = async (ratings: RatingResponse[]) => {
  //   try {
  //     addLog(`Saving ${ratings.length} ratings to database...`);
  //
  //     // Save ratings to database using Supabase API
  //     const ratingsToSave = ratings.map(r => ({
  //       questionId: r.questionId,
  //       rating: r.rating,
  //       ratingCategory: r.ratingCategory,
  //       confidence: undefined, // API doesn't return confidence yet
  //       sparkline: undefined, // API doesn't return sparkline yet
  //     }));
  //
  //     const result = await novaRatingsApi.batchCreateOrUpdateRatings(ratingsToSave);
  //
  //     if (result.failed > 0) {
  //       addLog(`⚠ Saved ${result.success} ratings, ${result.failed} failed`);
  //     } else {
  //       addLog(`✓ Saved ${result.success} ratings to database`);
  //     }
  //   } catch (error) {
  //     addLog(`✗ Error saving ratings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  //     throw error;
  //   }
  // };

  const processAllBatches = async () => {
    setProcessing(true);
    setProcessedCount(0);
    setFailedCount(0);
    setLogs([]);
    setCurrentBatch(0);
    setActiveTab('processing'); // Switch to processing tab

    const totalToProcess = totalUnprocessed;
    const totalBatchCount = totalBatches;
    let successCount = 0;
    let failCount = 0;

    addLog(`Starting Nova rating process for ${totalToProcess} questions`);
    addLog(`Processing in batches of ${BATCH_SIZE}...`);

    for (let i = 0; i < totalToProcess; i += BATCH_SIZE) {
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      setCurrentBatch(batchNum);

      const batchQuestions = questionsToProcess.slice(i, i + BATCH_SIZE);
      const batch: QuestionBatch[] = batchQuestions.map(q => ({
        questionId: q.id,
        question: q.title,
        agentId: q.agentId,
        settlementAt: q.settlementAt.toISOString()
      }));

      addLog(`\nProcessing batch ${batchNum}/${totalBatchCount}...`);

      // Log the questions being sent
      batch.forEach(q => {
        addLog(`  → Sent: ${q.question.substring(0, 60)}... (${q.questionId})`);
      });

      try {
        await processBatch(batch);
        // Note: Ratings will be saved via external /api/save-ratings endpoint by the webhook
        successCount += batch.length;
        setProcessedCount(successCount);
        addLog(`✓ Batch ${batchNum} sent successfully. Progress: ${Math.min(i + BATCH_SIZE, totalToProcess)}/${totalToProcess}`);
        addLog(`  ℹ Ratings will be saved when webhook POSTs to /api/save-ratings`);
      } catch (error) {
        failCount += batch.length;
        setFailedCount(failCount);
        addLog(`✗ Batch ${batchNum} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        addLog(`  Continuing to next batch...`);
      }

      // Add a small delay between batches to avoid overwhelming the API
      if (i + BATCH_SIZE < totalToProcess) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    addLog(`\n=== Processing Complete ===`);
    addLog(`✓ Successfully sent: ${successCount} questions`);
    if (failCount > 0) {
      addLog(`✗ Failed to send: ${failCount} questions`);
    }
    addLog(`\nℹ Note: Ratings will be saved to the database when the webhook`);
    addLog(`  POSTs the results to /api/save-ratings endpoint.`);

    setProcessing(false);
    toast.success(`Sent ${successCount} questions to Nova for rating!`);

    // Call onComplete to refresh the questions list
    onComplete();
  };

  const handleStart = () => {
    if (totalUnprocessed === 0) {
      toast.info('All questions have already been rated!');
      return;
    }
    processAllBatches();
  };

  const handleClose = () => {
    if (!processing) {
      onOpenChange(false);
    }
  };

  const handleReprocess = async (questionId: string) => {
    try {
      // Delete the existing rating
      await novaRatingsApi.deleteRating(questionId);
      toast.success('Rating removed. Question ready for reprocessing.');
      onComplete(); // Refresh the questions list
    } catch (error) {
      console.error('Error removing rating:', error);
      toast.error('Failed to remove rating');
    }
  };

  const handleDelete = async (questionId: string) => {
    try {
      // Delete the rating from database
      await novaRatingsApi.deleteRating(questionId);
      toast.success('Rating deleted successfully');
      onComplete(); // Refresh the questions list
    } catch (error) {
      console.error('Error deleting rating:', error);
      toast.error('Failed to delete rating');
    }
  };

  const progress = totalUnprocessed > 0
    ? ((processedCount + failedCount) / totalUnprocessed) * 100
    : 0;

  return (
    <Dialog open={open} onOpenChange={processing ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Nova Rating Processor
          </DialogTitle>
          <DialogDescription>
            Process questions through Nova AI to generate quality ratings
          </DialogDescription>
        </DialogHeader>

        {/* Statistics - Card Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-shrink-0">
          <div className="relative overflow-hidden rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-slate-700">{totalUnprocessed}</div>
              <div className="text-sm text-muted-foreground font-medium mt-1">Unprocessed</div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-slate-500/10 pointer-events-none" />
          </div>
          <div className="relative overflow-hidden rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm">
            <div className="flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-green-700">{processedCount}</div>
              <div className="text-sm text-green-700 font-medium mt-1">Processed</div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-500/10 pointer-events-none" />
          </div>
          <div className="relative overflow-hidden rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
            <div className="flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-red-700">{failedCount}</div>
              <div className="text-sm text-red-700 font-medium mt-1">Failed</div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-500/10 pointer-events-none" />
          </div>
        </div>

        {/* Tabs for Selection, Processing, and Processed */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0 mb-4">
          <TabsList className="!grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="selection" disabled={processing}>
              <FileText className="h-4 w-4 mr-2" />
              Select Questions ({selectedQuestionIds.size > 0 ? selectedQuestionIds.size : unprocessedQuestions.length})
            </TabsTrigger>
            <TabsTrigger value="processing">
              <Star className="h-4 w-4 mr-2" />
              Processing
            </TabsTrigger>
            <TabsTrigger value="processed" disabled={processing}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Processed ({processedQuestions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="selection" className="flex-1 min-h-0 mt-4 data-[state=active]:flex data-[state=active]:flex-col">
            {/* Select All Header */}
            <div className="flex items-center gap-3 p-3 border rounded-t-lg border-b bg-white flex-shrink-0">
              <Checkbox
                checked={selectedQuestionIds.size === unprocessedQuestions.length && unprocessedQuestions.length > 0}
                onCheckedChange={toggleAll}
                disabled={processing}
              />
              <span className="text-sm font-medium">
                Select All ({unprocessedQuestions.length} questions)
              </span>
            </div>

            {/* Question List - Scrollable */}
            {unprocessedQuestions.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center text-muted-foreground border border-t-0 rounded-b-lg bg-slate-50 py-12">
                <div>
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>All questions have been rated!</p>
                </div>
              </div>
            ) : (
              <div className="border border-t-0 rounded-b-lg bg-slate-50 question-list-scroll">
                <div className="p-2 space-y-2">
                  {unprocessedQuestions.map((question) => (
                    <div
                      key={question.id}
                      className="flex items-start gap-3 p-3 bg-white border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => toggleQuestion(question.id)}
                    >
                      <Checkbox
                        checked={selectedQuestionIds.has(question.id)}
                        onCheckedChange={() => toggleQuestion(question.id)}
                        disabled={processing}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight mb-1">{question.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{question.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="processing" className="flex-1 min-h-0 mt-4 flex flex-col">
            {/* Progress */}
            {processing && (
              <div className="space-y-2 flex-shrink-0 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Batch {currentBatch} of {totalBatches}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Logs */}
            <div className="flex-1 min-h-0 border rounded-lg bg-slate-50 p-4 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Star className="h-12 w-12 mx-auto mb-2 text-amber-300" />
                  <p>Click "Start Processing" to begin</p>
                </div>
              ) : (
                <div className="space-y-1 font-mono text-xs">
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className={`${
                        log.includes('✓') ? 'text-green-700' :
                        log.includes('✗') ? 'text-red-700' :
                        'text-slate-600'
                      }`}
                    >
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="processed" className="flex-1 min-h-0 mt-4 data-[state=active]:flex data-[state=active]:flex-col">
            {/* Processed Questions List */}
            {processedQuestions.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center text-muted-foreground border rounded-lg bg-slate-50 py-12">
                <div>
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                  <p>No processed questions yet</p>
                  <p className="text-xs mt-1">Questions will appear here after processing</p>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg bg-slate-50 question-list-scroll">
                <div className="p-2 space-y-2">
                  {processedQuestions.map((question) => (
                    <div
                      key={question.id}
                      className="flex items-start gap-3 p-3 bg-white border rounded-lg hover:border-primary/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium leading-tight flex-1">{question.title}</p>
                          {question.rating && (
                            <Badge
                              className={`${
                                question.rating === 'A' ? 'bg-green-100 text-green-700 border-green-200' :
                                question.rating === 'B' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                question.rating === 'C' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                question.rating === 'D' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                question.rating === 'E' ? 'bg-red-100 text-red-700 border-red-200' :
                                'bg-gray-100 text-gray-700 border-gray-200'
                              }`}
                            >
                              Rating: {question.rating}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{question.description}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReprocess(question.id)}
                          title="Reprocess this question"
                          className="h-8 w-8 p-0"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(question.id)}
                          title="Delete this rating"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Close'}
          </Button>
          <Button
            onClick={handleStart}
            disabled={processing || totalUnprocessed === 0}
            className="!bg-gradient-to-r !from-amber-500 !to-orange-500 hover:!from-amber-600 hover:!to-orange-600 !text-white !border-0 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Star className="h-4 w-4 mr-2" />
                Start Processing
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

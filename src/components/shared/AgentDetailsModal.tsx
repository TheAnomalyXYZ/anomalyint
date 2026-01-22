import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Agent, ProposedQuestion, AgentSourceType } from "../../lib/types";
import { questionsApi } from "../../lib/supabase";
import { formatDateTime, cn, getCategoryColor } from "../../lib/utils";
import {
  Globe,
  LinkIcon,
  Twitter,
  FileJson,
  Play,
  Pause,
  Settings,
  Calendar,
  TrendingUp,
  Sparkles,
  Clock,
  Tag,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { AgentRunner } from "../../api/agentRunner";

interface AgentDetailsModalProps {
  agent: Agent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditAgent?: (agent: Agent) => void;
  onRunAgent?: (agentId: string) => void;
  onTogglePause?: (agentId: string) => void;
  onNavigate?: (page: string, params?: Record<string, string>) => void;
}


export function AgentDetailsModal({
  agent,
  open,
  onOpenChange,
  onEditAgent,
  onRunAgent,
  onTogglePause,
  onNavigate,
}: AgentDetailsModalProps) {
  const [generatedQuestions, setGeneratedQuestions] = useState<ProposedQuestion[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Load questions from database
  const loadQuestions = async () => {
    if (!agent) return;

    try {
      const questions = await questionsApi.getQuestionsByAgent(agent.id);
      // Filter for pending questions (AI suggestions)
      const pendingQuestions = questions.filter(q => q.state === 'pending');
      setGeneratedQuestions(pendingQuestions);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  useEffect(() => {
    if (agent && open) {
      loadQuestions();
    }
  }, [agent, open]);

  if (!agent) return null;

  const getSourceIcon = (type: AgentSourceType) => {
    switch (type) {
      case 'website':
        return <Globe className="h-3 w-3" />;
      case 'api':
        return <LinkIcon className="h-3 w-3" />;
      case 'x':
        return <Twitter className="h-3 w-3" />;
      case 'reddit':
        return <FileJson className="h-3 w-3" />;
      case 'feed':
        return <FileJson className="h-3 w-3" />;
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'daily':
        return 'Every Day';
      case 'on_update':
        return 'Every Update';
      case 'weekly':
        return 'Every Week';
      default:
        return frequency;
    }
  };

  const handleRunNow = async () => {
    if (!agent) return;

    setIsRunning(true);

    try {
      console.log(`Running agent: ${agent.name}`);

      // Use the AgentRunner service to execute the agent
      const result = await AgentRunner.runAgent(agent);

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate questions');
      }

      if (!result.questions || result.questions.length === 0) {
        throw new Error('No questions were generated');
      }

      // Reload questions from database to show the newly generated questions
      await loadQuestions();

      setIsRunning(false);
      onRunAgent?.(agent.id);

      const count = result.questions.length;
      toast.success(`${count} ${count === 1 ? 'question' : 'questions'} generated and saved to database!`);

    } catch (error) {
      console.error('Error generating questions:', error);
      setIsRunning(false);
      toast.error(error instanceof Error ? error.message : "Failed to generate questions");
    }
  };

  const handleEdit = () => {
    onEditAgent?.(agent);
    onOpenChange(false);
  };

  const handleTogglePause = () => {
    onTogglePause?.(agent.id);
  };

  const handleViewAll = () => {
    if (agent && onNavigate) {
      onNavigate('/markets', { agent: agent.name, tab: 'suggestions' });
      onOpenChange(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] sm:w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl flex items-center gap-3 flex-wrap">
                {agent.name}
                <Badge
                  variant={agent.status === 'active' ? 'default' : 'secondary'}
                  className={
                    agent.status === 'active'
                      ? 'bg-green-600'
                      : agent.status === 'paused'
                      ? 'bg-yellow-600'
                      : 'bg-red-600'
                  }
                >
                  {agent.status}
                </Badge>
                {agent.categories.map((category, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className={getCategoryColor(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                {agent.description}
              </DialogDescription>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                onClick={handleEdit}
              >
                <Settings className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={handleTogglePause}
              >
                {agent.status === 'paused' ? (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                )}
              </Button>
              <Button
                onClick={handleRunNow}
                disabled={isRunning}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
              >
                <Play className="h-4 w-4 mr-2" />
                {isRunning ? 'Running...' : 'Run Now'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Agent Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Sources</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {agent.sources.map((source, idx) => (
                    <Badge key={idx} variant="outline" className="gap-1">
                      {getSourceIcon(source.type)}
                      {source.type}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Schedule</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Badge variant="secondary" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  {getFrequencyLabel(agent.frequency)}
                </Badge>
                <div className="mt-2 text-xs text-muted-foreground">
                  {agent.nextRun && (
                    <p>Next: {formatDateTime(agent.nextRun)}</p>
                  )}
                  {agent.lastRun && (
                    <p>Last: {formatDateTime(agent.lastRun)}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Statistics</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{agent.questionsCreated}</div>
                <div className="text-xs text-muted-foreground">Questions Created</div>
              </CardContent>
            </Card>
          </div>

          {/* Generated Questions Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-xl">🔥 Generated Questions</h2>
                <Badge variant="secondary">{generatedQuestions.length}</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={handleViewAll}>
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {/* Full width questions list */}
            <div className="space-y-4">
              {generatedQuestions.slice(0, 6).map((question, index) => (
                <Card
                  key={question.id}
                  className="group hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50 relative overflow-hidden"
                >
                  {/* Gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${
                    index === 0 ? 'from-violet-500/10 to-purple-500/10' :
                    index === 1 ? 'from-blue-500/10 to-cyan-500/10' :
                    index === 2 ? 'from-pink-500/10 to-rose-500/10' :
                    index === 3 ? 'from-emerald-500/10 to-teal-500/10' :
                    'from-orange-500/10 to-amber-500/10'
                  } opacity-0 group-hover:opacity-100 transition-opacity`} />

                  <CardContent className="relative pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            AI Score: 100%
                          </Badge>
                          {index === 0 && (
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                              ✨ Latest
                            </Badge>
                          )}
                        </div>

                        <div>
                          <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors mb-2">
                            {question.title}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 break-words">
                            {question.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                            {question.categories.map((category) => (
                              <Badge
                                key={category}
                                variant="outline"
                                className={getCategoryColor(category)}
                              >
                                {category}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Ends {question.answerEndAt.toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              <span>Generated by AI</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Agent Prompts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Question Prompt</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  {agent.questionPrompt}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resolution Prompt</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  {agent.resolutionPrompt}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
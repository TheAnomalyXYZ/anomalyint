import { useState, Fragment, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../components/shared/PageHeader";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "../components/ui/tooltip";
import { Sparkles, Check, X, ChevronDown, ChevronLeft, ChevronRight, Search, Clock, Tag, TrendingUp, Pause, Edit, XCircle, Play, Loader2, Trash2, Undo2, Send } from "lucide-react";
import { CardHeader, CardTitle } from "../components/ui/card";
import { questionsApi, agentsApi } from "../lib/supabase";
import { ProposedQuestion, Agent } from "../lib/types";
import { formatDate, formatDateTime, getCategoryColor } from "../lib/utils";
import { EmptyState } from "../components/shared/EmptyState";
import { QuestionDetailsModal } from "../components/shared/QuestionDetailsModal";
import { NovaProcessingModal } from "../components/shared/NovaProcessingModal";
import { toast } from "sonner@2.0.3";

export function Markets() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [questions, setQuestions] = useState<ProposedQuestion[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<ProposedQuestion | null>(null);
  const [activeTab, setActiveTab] = useState<"suggestions" | "queued" | "live" | "paused" | "deleted">("queued");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [platformDialogOpen, setPlatformDialogOpen] = useState(false);
  const [questionToApprove, setQuestionToApprove] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [novaProcessingOpen, setNovaProcessingOpen] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilters, setCategoryFilters] = useState({
    Technology: true,
    AI: true,
    Cryptocurrency: true,
    Finance: true,
    Markets: true,
    Apple: true,
  });
  const [sourceFilters, setSourceFilters] = useState({
    twitter: true,
    news: true,
    meme: true,
  });
  const [typeFilters, setTypeFilters] = useState({
    binary: true,
    multiOption: true,
  });

  // Load data from database on mount
  useEffect(() => {
    loadData();
  }, []);

  // Initialize state from URL params after data loads
  useEffect(() => {
    if (!loading) {
      const agentSearch = searchParams.get('agent');
      const tab = searchParams.get('tab');

      if (agentSearch) {
        setSearchTerm(agentSearch);
      }

      if (tab === 'suggestions') {
        setActiveTab('suggestions');
      }
    }
  }, [loading, searchParams]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [questionsData, agentsData] = await Promise.all([
        questionsApi.getQuestions(),
        agentsApi.getAgents(),
      ]);
      setQuestions(questionsData);
      setAgents(agentsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get agent name from a proposal
  const getAgentName = (proposal: ProposedQuestion): string => {
    const agent = agents.find(a => a.id === proposal.agentId);
    return agent?.name || 'Unknown Agent';
  };

  // Filter questions by active tab (state)
  const tabStateMap = {
    suggestions: 'pending' as const,
    queued: 'approved' as const,
    live: 'published' as const,
    paused: 'paused' as const,
    deleted: 'rejected' as const,
  };

  const filteredProposals = questions.filter((proposal) => {
    // Tab filter (by state)
    if (proposal.state !== tabStateMap[activeTab]) return false;

    // Search filter (only search agent names)
    const agentName = getAgentName(proposal);
    const matchesSearch = searchTerm === "" ||
      agentName.toLowerCase().includes(searchTerm.toLowerCase());

    // Category filter - check agent's category
    const agent = agents.find(a => a.id === proposal.agentId);
    const agentCategory = agent?.category;
    const matchesCategory = !agentCategory || categoryFilters[agentCategory as keyof typeof categoryFilters];

    // Agent filter - for now we'll match all since we removed source filtering
    const matchesSource = true;

    // Type filter
    const proposalType = proposal.type || 'binary';
    const matchesType = proposalType === 'binary' ? typeFilters.binary : typeFilters.multiOption;

    return matchesSearch && matchesCategory && matchesSource && matchesType;
  });

  // Helper to get friendly platform name
  const getPlatformDisplayName = (platform: string): string => {
    const platformMap: Record<string, string> = {
      'synapse': 'Synapse Markets',
      'vectra': 'Vectra Markets'
    };
    return platformMap[platform] || platform;
  };

  // Count by state for tab labels
  const pendingCount = questions.filter(q => q.state === 'pending').length;
  const approvedCount = questions.filter(q => q.state === 'approved').length;
  const liveCount = questions.filter(q => q.state === 'published').length;
  const pausedCount = questions.filter(q => q.state === 'paused').length;
  const rejectedCount = questions.filter(q => q.state === 'rejected').length;

  const handleToggleCategoryFilter = (category: keyof typeof categoryFilters) => {
    setCategoryFilters(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleToggleSourceFilter = (source: keyof typeof sourceFilters) => {
    setSourceFilters(prev => ({
      ...prev,
      [source]: !prev[source]
    }));
  };

  const handleToggleTypeFilter = (type: keyof typeof typeFilters) => {
    setTypeFilters(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      setIsGenerating(false);
      setGenerateOpen(false);
      toast.success("Generated 3 new question proposals");
    }, 2000);
  };

  const handleApprove = (id: string) => {
    setQuestionToApprove(id);
    setSelectedPlatforms([]);
    setPlatformDialogOpen(true);
  };

  const confirmApprove = async () => {
    if (!questionToApprove || selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    const question = questions.find((p) => p.id === questionToApprove);
    if (question) {
      const updatedQuestion = await questionsApi.updateQuestion(questionToApprove, {
        state: 'approved',
        pushedTo: selectedPlatforms
      });

      if (updatedQuestion) {
        toast.success(`Question approved and queued for ${selectedPlatforms.join(', ')}`);
        setQuestions(questions.map(q =>
          q.id === questionToApprove ? updatedQuestion : q
        ));
      } else {
        toast.error("Failed to approve question");
      }
    }

    setPlatformDialogOpen(false);
    setQuestionToApprove(null);
    setSelectedPlatforms([]);
  };

  const handleReject = async (id: string) => {
    const question = questions.find((p) => p.id === id);
    if (question) {
      const updatedQuestion = await questionsApi.updateQuestionState(id, 'rejected');
      if (updatedQuestion) {
        toast.success("Question moved to deleted");
        setQuestions(questions.map(q =>
          q.id === id ? updatedQuestion : q
        ));
      } else {
        toast.error("Failed to delete question");
      }
    }
  };

  const handlePermanentDelete = async (id: string) => {
    const success = await questionsApi.deleteQuestion(id);
    if (success) {
      toast.success("Question permanently deleted");
      setQuestions(questions.filter(q => q.id !== id));
    } else {
      toast.error("Failed to permanently delete question");
    }
  };

  const handleApproveFromModal = (question: ProposedQuestion) => {
    // Close the details modal first
    setDetailsModalOpen(false);
    // Open platform selection dialog
    setQuestionToApprove(question.id);
    setSelectedPlatforms([]);
    setPlatformDialogOpen(true);
  };

  const handleRejectFromModal = (question: ProposedQuestion) => {
    setQuestions(questions.map(q =>
      q.id === question.id ? { ...q, state: 'rejected' as const, updatedAt: new Date() } : q
    ));
  };

  const handleBatchApprove = () => {
    const pendingQuestions = questions.filter(q => q.state === 'pending');
    toast.success(`Approved ${pendingQuestions.length} questions and moved to queued`);
    setQuestions(questions.map(q =>
      q.state === 'pending' ? { ...q, state: 'approved' as const, updatedAt: new Date() } : q
    ));
  };

  const handleCloseNow = (id: string) => {
    const question = questions.find((q) => q.id === id);
    if (question) {
      toast.success("Question closed and moved to awaiting resolution");
      setQuestions(questions.map(q =>
        q.id === id ? { ...q, state: 'awaiting_resolution' as const, updatedAt: new Date() } : q
      ));
    }
  };

  const handlePause = (id: string) => {
    const question = questions.find((q) => q.id === id);
    if (question) {
      toast.success("Question paused");
      setQuestions(questions.map(q =>
        q.id === id ? { ...q, state: 'paused' as const, updatedAt: new Date() } : q
      ));
    }
  };

  const handleUnpause = (id: string) => {
    const question = questions.find((q) => q.id === id);
    if (question) {
      toast.success("Question resumed");
      setQuestions(questions.map(q =>
        q.id === id ? { ...q, state: 'published' as const, updatedAt: new Date() } : q
      ));
    }
  };

  const handleEditDetails = (proposal: ProposedQuestion) => {
    setSelectedQuestion(proposal);
    setDetailsModalOpen(true);
  };

  const handleSaveQuestion = (updatedQuestion: ProposedQuestion) => {
    setQuestions(questions.map(q =>
      q.id === updatedQuestion.id ? { ...updatedQuestion, updatedAt: new Date() } : q
    ));
    toast.success("Question details updated");
  };

  const handleUnqueue = async (id: string) => {
    const question = questions.find((q) => q.id === id);
    if (question) {
      const updatedQuestion = await questionsApi.updateQuestion(id, {
        state: 'pending',
        pushedTo: []
      });

      if (updatedQuestion) {
        toast.success("Question moved back to suggestions");
        setQuestions(questions.map(q =>
          q.id === id ? updatedQuestion : q
        ));
      } else {
        toast.error("Failed to unqueue question");
      }
    }
  };

  const handleDeleteQueued = async (id: string) => {
    const question = questions.find((q) => q.id === id);
    if (question) {
      const updatedQuestion = await questionsApi.updateQuestionState(id, 'rejected');
      if (updatedQuestion) {
        toast.success("Question deleted");
        setQuestions(questions.map(q =>
          q.id === id ? updatedQuestion : q
        ));
      } else {
        toast.error("Failed to delete question");
      }
    }
  };

  // Helper to convert Date to MySQL datetime format (YYYY-MM-DD HH:MM:SS)
  const toMySQLDateTime = (date: Date | string): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const handlePush = async (id: string) => {
    const question = questions.find((q) => q.id === id);

    if (!question) {
      toast.error("Question not found");
      return;
    }

    // Check if the question has pushedTo platforms
    if (!question.pushedTo || question.pushedTo.length === 0) {
      toast.error("Question must have platforms selected before pushing");
      return;
    }

    try {
      // Push to each selected platform
      const pushPromises = question.pushedTo.map(async (platform: string) => {
        const apiPath = platform === 'synapse'
          ? '/api/synapse/api/predictive/wager-questions'
          : `/api/${platform}/api/predictive/wager-questions`;

        const response = await fetch(apiPath, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: 0, // 0 for new question on platform
            question: question.title,
            extra: question.description || "",
            liveUntil: toMySQLDateTime(question.answerEndAt),
            liveAt: toMySQLDateTime(question.liveDate || new Date()),
            settlementAt: toMySQLDateTime(question.settlementAt),
            image: "", // Add image support later if needed
            client: platform
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to push to ${platform}`);
        }

        return platform;
      });

      const pushedPlatforms = await Promise.all(pushPromises);

      // Update the question state to published in database
      const updatedQuestion = await questionsApi.updateQuestionState(id, 'published');

      if (updatedQuestion) {
        toast.success(`Question pushed to ${pushedPlatforms.join(', ')} and is now live!`);
        setQuestions(questions.map(q =>
          q.id === id ? updatedQuestion : q
        ));
      } else {
        toast.error("Failed to update question state");
      }
    } catch (error) {
      console.error('Error pushing question:', error);
      toast.error(error instanceof Error ? error.message : "Failed to push question to platform");
    }
  };

  // Get all AI-generated suggestions (excluding past settlement date)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day for comparison

  const topSuggestions = questions
    .filter(q => {
      if (q.state !== 'pending') return false;

      // Filter out questions past their settlement date
      const settlementDate = new Date(q.settlementAt);
      return settlementDate >= today;
    })
    .slice(0, 6);

  // Helper function to truncate title for desktop
  const truncateTitle = (title: string, maxLength: number = 50) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };


  return (
    <div>
      <PageHeader
        title="Markets"
        description="Manage AI-generated suggestions and queued questions"
        actions={
          <>
            {activeTab === "suggestions" && pendingCount > 0 && (
              <Button variant="outline" onClick={handleBatchApprove}>
                Approve All ({pendingCount})
              </Button>
            )}
            {activeTab === "suggestions" && (
              <Button onClick={() => setGenerateOpen(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate
              </Button>
            )}
          </>
        }
      />

      {/* Top Suggestions Horizontal Feed */}
      {topSuggestions.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-lg">All AI Agent Generated</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                Highest Scored
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {topSuggestions.map((suggestion, index) => (
                <Card
                  key={suggestion.id}
                  className="w-[340px] h-[280px] shrink-0 flex flex-col group hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50 relative overflow-hidden box-border"
                  style={{ maxWidth: '340px' }}
                  onClick={() => handleEditDetails(suggestion)}
                >
                  {/* Gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${
                    index === 0 ? 'from-violet-500/10 to-purple-500/10' :
                    index === 1 ? 'from-blue-500/10 to-cyan-500/10' :
                    index === 2 ? 'from-pink-500/10 to-rose-500/10' :
                    index === 3 ? 'from-emerald-500/10 to-teal-500/10' :
                    index === 4 ? 'from-orange-500/10 to-amber-500/10' :
                    'from-indigo-500/10 to-blue-500/10'
                  } opacity-0 group-hover:opacity-100 transition-opacity`} />

                  <CardHeader className="relative pb-3 flex-shrink-0 min-w-0">
                    <div className="flex items-center justify-between mb-2 min-w-0">
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        AI Score: 100%
                      </Badge>
                      {index === 0 && (
                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                          🏆 Top Pick
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {suggestion.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative space-y-3 pt-0 flex-1 flex flex-col justify-between overflow-hidden min-w-0">
                    {/* Description - truncated */}
                    <div className="space-y-3 w-full max-w-full overflow-hidden">
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 break-all">
                        {suggestion.description}
                      </p>

                      {/* Categories */}
                      <div className="flex items-center gap-1 flex-wrap">
                        <Tag className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        {suggestion.categories.slice(0, 2).map((category) => (
                          <Badge
                            key={category}
                            variant="outline"
                            className={`text-xs ${getCategoryColor(category)}`}
                          >
                            {category}
                          </Badge>
                        ))}
                        {suggestion.categories.length > 2 && (
                          <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-200">
                            +{suggestion.categories.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center justify-between pt-1 border-t text-xs text-muted-foreground">
                      <div className="flex items-center gap-1 min-w-0">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">Ends {suggestion.answerEndAt.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1 min-w-0">
                        <Sparkles className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{getAgentName(suggestion)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-6">
        {/* Left Filter Bar */}
        <Card className={sidebarCollapsed ? "w-[50px]" : "w-[250px]"} style={{ flexShrink: 0 }}>
          <CardContent className={sidebarCollapsed ? "p-2 flex items-center justify-center h-full" : "p-6 space-y-6"}>
            {sidebarCollapsed ? (
              <div className="flex flex-col items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarCollapsed(false)}
                  title="Expand sidebar"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div
                  className="text-xs text-muted-foreground cursor-pointer"
                  style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                  onClick={() => setSidebarCollapsed(false)}
                >
                  Search Filters
                </div>
              </div>
            ) : (
              <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <Label>Search Agents</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarCollapsed(true)}
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative mt-2">
                <Input
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-8"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full w-8 hover:bg-transparent"
                    onClick={handleClearSearch}
                  >
                    <XCircle className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label className="mb-3 block">Category</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="technology"
                    checked={categoryFilters.Technology}
                    onCheckedChange={() => handleToggleCategoryFilter("Technology")}
                  />
                  <label
                    htmlFor="technology"
                    className="text-sm cursor-pointer"
                  >
                    Technology
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="ai"
                    checked={categoryFilters.AI}
                    onCheckedChange={() => handleToggleCategoryFilter("AI")}
                  />
                  <label
                    htmlFor="ai"
                    className="text-sm cursor-pointer"
                  >
                    AI
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="cryptocurrency"
                    checked={categoryFilters.Cryptocurrency}
                    onCheckedChange={() => handleToggleCategoryFilter("Cryptocurrency")}
                  />
                  <label
                    htmlFor="cryptocurrency"
                    className="text-sm cursor-pointer"
                  >
                    Cryptocurrency
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="finance"
                    checked={categoryFilters.Finance}
                    onCheckedChange={() => handleToggleCategoryFilter("Finance")}
                  />
                  <label
                    htmlFor="finance"
                    className="text-sm cursor-pointer"
                  >
                    Finance
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="markets"
                    checked={categoryFilters.Markets}
                    onCheckedChange={() => handleToggleCategoryFilter("Markets")}
                  />
                  <label
                    htmlFor="markets"
                    className="text-sm cursor-pointer"
                  >
                    Markets
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="apple"
                    checked={categoryFilters.Apple}
                    onCheckedChange={() => handleToggleCategoryFilter("Apple")}
                  />
                  <label
                    htmlFor="apple"
                    className="text-sm cursor-pointer"
                  >
                    Apple
                  </label>
                </div>
              </div>
            </div>

            <div>
              <Label className="mb-3 block text-muted-foreground">Sources</Label>
              <div className="space-y-3 opacity-50">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="twitter"
                    checked={sourceFilters.twitter}
                    onCheckedChange={() => handleToggleSourceFilter("twitter")}
                    disabled
                  />
                  <label
                    htmlFor="twitter"
                    className="text-sm cursor-not-allowed"
                  >
                    Twitter
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="news"
                    checked={sourceFilters.news}
                    onCheckedChange={() => handleToggleSourceFilter("news")}
                    disabled
                  />
                  <label
                    htmlFor="news"
                    className="text-sm cursor-not-allowed"
                  >
                    News
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="reddit"
                    checked={sourceFilters.meme}
                    onCheckedChange={() => handleToggleSourceFilter("meme")}
                    disabled
                  />
                  <label
                    htmlFor="reddit"
                    className="text-sm cursor-not-allowed"
                  >
                    Reddit
                  </label>
                </div>
              </div>
            </div>

            <div>
              <Label className="mb-3 block text-muted-foreground">Type</Label>
              <div className="space-y-3 opacity-50">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="binary"
                    checked={typeFilters.binary}
                    onCheckedChange={() => handleToggleTypeFilter("binary")}
                    disabled
                  />
                  <label
                    htmlFor="binary"
                    className="text-sm cursor-not-allowed"
                  >
                    Binary
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="multi-option"
                    checked={typeFilters.multiOption}
                    onCheckedChange={() => handleToggleTypeFilter("multiOption")}
                    disabled
                  />
                  <label
                    htmlFor="multi-option"
                    className="text-sm cursor-not-allowed"
                  >
                    Multi-option
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <p className="mb-1">
                  <span className="font-medium">AI Suggestions:</span> {pendingCount}
                </p>
                <p className="mb-1">
                  <span className="font-medium">Queued:</span> {approvedCount}
                </p>
                <p className="mb-1">
                  <span className="font-medium">Live:</span> {liveCount}
                </p>
                <p className="mb-1">
                  <span className="font-medium">Paused:</span> {pausedCount}
                </p>
                <p>
                  <span className="font-medium">Deleted:</span> {rejectedCount}
                </p>
              </div>
            </div>
            </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="flex-1">
          <Card>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "suggestions" | "queued" | "live" | "paused" | "deleted")} className="w-full">
                <div className="border-b px-6 pt-4 flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="suggestions">
                      All AI Suggestions ({pendingCount})
                    </TabsTrigger>
                    <TabsTrigger value="queued">
                      Queued ({approvedCount})
                    </TabsTrigger>
                    <TabsTrigger value="live">
                      Live ({liveCount})
                    </TabsTrigger>
                    <TabsTrigger value="paused">
                      Paused ({pausedCount})
                    </TabsTrigger>
                    <TabsTrigger value="deleted">
                      Deleted ({rejectedCount})
                    </TabsTrigger>
                  </TabsList>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNovaProcessingOpen(true)}
                    className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20 hover:from-amber-500/20 hover:to-orange-500/20 mb-1"
                  >
                    <Sparkles className="h-4 w-4 mr-2 text-amber-600" />
                    Process Nova Ratings
                  </Button>
                </div>
                
                {/* AI Suggestions Tab */}
                <TabsContent value="suggestions" className="m-0 p-6">
                  {filteredProposals.length === 0 ? (
                    <EmptyState
                      icon={<Sparkles className="h-12 w-12" />}
                      title="No proposals yet"
                      description="Click Generate to create AI-powered question proposals based on your configured sources"
                      action={{
                        label: "Generate Proposals",
                        onClick: () => setGenerateOpen(true),
                      }}
                    />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Agent</TableHead>
                          <TableHead>Categories</TableHead>
                          <TableHead>Live Date</TableHead>
                          <TableHead>Answer End</TableHead>
                          <TableHead>Settlement</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="w-48">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProposals.map((proposal) => (
                          <TableRow key={proposal.id}>
                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="max-w-md cursor-help">{truncateTitle(proposal.title)}</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-sm">{proposal.title}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="border-primary/50 text-primary"
                              >
                                {getAgentName(proposal)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {(() => {
                                const agent = agents.find(a => a.id === proposal.agentId);
                                return agent?.categories && agent.categories.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {agent.categories.map((category, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="outline"
                                        className={getCategoryColor(category)}
                                      >
                                        {category}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                );
                              })()}
                            </TableCell>
                            <TableCell className="text-sm">{formatDateTime(proposal.liveDate)}</TableCell>
                            <TableCell className="text-sm">{formatDateTime(proposal.answerEndAt)}</TableCell>
                            <TableCell className="text-sm">
                              {formatDateTime(proposal.settlementAt)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {proposal.type === 'multi-option' ? 'Multi-option' : proposal.type === 'paused' ? 'Paused' : 'Binary'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditDetails(proposal)}
                                  title="Edit Details"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleApprove(proposal.id)}
                                  title="Approve"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReject(proposal.id)}
                                  title="Reject"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                {/* Queued Tab */}
                <TabsContent value="queued" className="m-0 p-6">
                  {filteredProposals.length === 0 ? (
                    <EmptyState
                      icon={<Clock className="h-12 w-12" />}
                      title="No queued questions"
                      description="Approved questions will appear here ready for publishing"
                    />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Agent</TableHead>
                          <TableHead>Categories</TableHead>
                          <TableHead>Platform</TableHead>
                          <TableHead>Live Date</TableHead>
                          <TableHead>Answer End</TableHead>
                          <TableHead>Settlement</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="w-80">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProposals.map((proposal) => (
                          <Fragment key={proposal.id}>
                            <TableRow>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setExpandedRow(
                                      expandedRow === proposal.id ? null : proposal.id
                                    )
                                  }
                                >
                                  {expandedRow === proposal.id ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                              <TableCell>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <p className="max-w-md cursor-help">{truncateTitle(proposal.title)}</p>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-sm">{proposal.title}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="border-primary/50 text-primary"
                                >
                                  {getAgentName(proposal)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  const agent = agents.find(a => a.id === proposal.agentId);
                                  return agent?.categories && agent.categories.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {agent.categories.map((category, idx) => (
                                        <Badge
                                          key={idx}
                                          variant="outline"
                                          className={getCategoryColor(category)}
                                        >
                                          {category}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">-</span>
                                  );
                                })()}
                              </TableCell>
                              <TableCell>
                                {proposal.pushedTo && proposal.pushedTo.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {proposal.pushedTo.map((platform, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="outline"
                                        className="bg-blue-50 text-blue-700 border-blue-200"
                                      >
                                        {getPlatformDisplayName(platform)}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm">{formatDateTime(proposal.liveDate)}</TableCell>
                              <TableCell className="text-sm">{formatDateTime(proposal.answerEndAt)}</TableCell>
                              <TableCell className="text-sm">
                                {formatDateTime(proposal.settlementAt)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {proposal.type === 'multi-option' ? 'Multi-option' : proposal.type === 'paused' ? 'Paused' : 'Binary'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditDetails(proposal)}
                                    title="Edit Details"
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                                    onClick={() => handlePush(proposal.id)}
                                    title="Push to platform and go live"
                                  >
                                    <Send className="h-4 w-4 mr-1" />
                                    Push
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUnqueue(proposal.id)}
                                    title="Move back to Suggestions"
                                  >
                                    <Undo2 className="h-4 w-4 mr-1" />
                                    Unqueue
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={() => handleDeleteQueued(proposal.id)}
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                            {expandedRow === proposal.id && (
                              <TableRow>
                                <TableCell colSpan={10} className="bg-muted/50">
                                  <div className="p-4 space-y-4">
                                    <div>
                                      <h4 className="mb-2">Description</h4>
                                      <p className="text-muted-foreground">
                                        {proposal.description}
                                      </p>
                                    </div>
                                    <div>
                                      <h4 className="mb-2">Resolution Criteria</h4>
                                      <p className="text-muted-foreground">
                                        {proposal.resolutionCriteria}
                                      </p>
                                    </div>
                                    <div>
                                      <h4 className="mb-2">AI Agent</h4>
                                      <Badge variant="outline" className="border-primary/50 text-primary">
                                        {getAgentName(proposal)}
                                      </Badge>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() => handleEditDetails(proposal)}
                                      >
                                        Edit Details
                                      </Button>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                {/* Live Tab */}
                <TabsContent value="live" className="m-0 p-6">
                  {filteredProposals.length === 0 ? (
                    <EmptyState
                      icon={<TrendingUp className="h-12 w-12" />}
                      title="No live markets"
                      description="Published questions will appear here"
                    />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Agent</TableHead>
                          <TableHead>Categories</TableHead>
                          <TableHead>Live Date</TableHead>
                          <TableHead>Answer End</TableHead>
                          <TableHead>Settlement</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="w-32">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProposals.map((proposal) => (
                          <TableRow key={proposal.id}>
                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="max-w-md cursor-help">{truncateTitle(proposal.title)}</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-sm">{proposal.title}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="border-primary/50 text-primary"
                                >
                                  {getAgentName(proposal)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  const agent = agents.find(a => a.id === proposal.agentId);
                                  return agent?.categories && agent.categories.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {agent.categories.map((category, idx) => (
                                        <Badge
                                          key={idx}
                                          variant="outline"
                                          className={getCategoryColor(category)}
                                        >
                                          {category}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">-</span>
                                  );
                                })()}
                              </TableCell>
                              <TableCell className="text-sm">{formatDateTime(proposal.liveDate)}</TableCell>
                              <TableCell className="text-sm">{formatDateTime(proposal.answerEndAt)}</TableCell>
                              <TableCell className="text-sm">
                                {formatDateTime(proposal.settlementAt)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {proposal.type === 'multi-option' ? 'Multi-option' : 'Binary'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCloseNow(proposal.id)}
                                    title="Close Now"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Close
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handlePause(proposal.id)}
                                    title="Pause"
                                  >
                                    <Pause className="h-4 w-4 mr-1" />
                                    Pause
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditDetails(proposal)}
                                    title="Edit"
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                {/* Paused Tab */}
                <TabsContent value="paused" className="m-0 p-6">
                  {filteredProposals.length === 0 ? (
                    <EmptyState
                      icon={<Clock className="h-12 w-12" />}
                      title="No paused markets"
                      description="Paused questions will appear here"
                    />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Agent</TableHead>
                          <TableHead>Categories</TableHead>
                          <TableHead>Live Date</TableHead>
                          <TableHead>Answer End</TableHead>
                          <TableHead>Settlement</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="w-32">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProposals.map((proposal) => (
                          <Fragment key={proposal.id}>
                            <TableRow>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setExpandedRow(
                                      expandedRow === proposal.id ? null : proposal.id
                                    )
                                  }
                                >
                                  {expandedRow === proposal.id ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                              <TableCell>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <p className="max-w-md cursor-help">{truncateTitle(proposal.title)}</p>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-sm">{proposal.title}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="border-primary/50 text-primary"
                                >
                                  {getAgentName(proposal)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  const agent = agents.find(a => a.id === proposal.agentId);
                                  return agent?.categories && agent.categories.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {agent.categories.map((category, idx) => (
                                        <Badge
                                          key={idx}
                                          variant="outline"
                                          className={getCategoryColor(category)}
                                        >
                                          {category}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">-</span>
                                  );
                                })()}
                              </TableCell>
                              <TableCell className="text-sm">{formatDateTime(proposal.liveDate)}</TableCell>
                              <TableCell className="text-sm">{formatDateTime(proposal.answerEndAt)}</TableCell>
                              <TableCell className="text-sm">
                                {formatDateTime(proposal.settlementAt)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {proposal.type === 'multi-option' ? 'Multi-option' : 'Binary'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUnpause(proposal.id)}
                                    title="Resume"
                                  >
                                    <Play className="h-4 w-4 mr-1" />
                                    Resume
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCloseNow(proposal.id)}
                                    title="Close Now"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Close
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditDetails(proposal)}
                                    title="Edit"
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                            {expandedRow === proposal.id && (
                              <TableRow>
                                <TableCell colSpan={9} className="bg-muted/50">
                                  <div className="p-4 space-y-4">
                                    <div>
                                      <h4 className="mb-2">Description</h4>
                                      <p className="text-muted-foreground">
                                        {proposal.description}
                                      </p>
                                    </div>
                                    <div>
                                      <h4 className="mb-2">Resolution Criteria</h4>
                                      <p className="text-muted-foreground">
                                        {proposal.resolutionCriteria}
                                      </p>
                                    </div>
                                    <div>
                                      <h4 className="mb-2">AI Agent</h4>
                                      <Badge variant="outline" className="border-primary/50 text-primary">
                                        {getAgentName(proposal)}
                                      </Badge>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() => handleEditDetails(proposal)}
                                      >
                                        Edit Details
                                      </Button>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                {/* Deleted Tab */}
                <TabsContent value="deleted" className="m-0 p-6">
                  {filteredProposals.length === 0 ? (
                    <EmptyState
                      icon={<X className="h-12 w-12" />}
                      title="No deleted proposals"
                      description="Rejected questions will appear here"
                    />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Agent</TableHead>
                          <TableHead>Categories</TableHead>
                          <TableHead>Live Date</TableHead>
                          <TableHead>Answer End</TableHead>
                          <TableHead>Settlement</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="w-48">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProposals.map((proposal) => (
                          <Fragment key={proposal.id}>
                            <TableRow>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setExpandedRow(
                                      expandedRow === proposal.id ? null : proposal.id
                                    )
                                  }
                                >
                                  {expandedRow === proposal.id ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                              <TableCell>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <p className="max-w-md cursor-help">{truncateTitle(proposal.title)}</p>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-sm">{proposal.title}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="border-primary/50 text-primary"
                                >
                                  {getAgentName(proposal)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  const agent = agents.find(a => a.id === proposal.agentId);
                                  return agent?.categories && agent.categories.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {agent.categories.map((category, idx) => (
                                        <Badge
                                          key={idx}
                                          variant="outline"
                                          className={getCategoryColor(category)}
                                        >
                                          {category}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">-</span>
                                  );
                                })()}
                              </TableCell>
                              <TableCell className="text-sm">{formatDateTime(proposal.liveDate)}</TableCell>
                              <TableCell className="text-sm">{formatDateTime(proposal.answerEndAt)}</TableCell>
                              <TableCell className="text-sm">
                                {formatDateTime(proposal.settlementAt)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {proposal.type === 'multi-option' ? 'Multi-option' : proposal.type === 'paused' ? 'Paused' : 'Binary'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditDetails(proposal)}
                                    title="Edit Details"
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handlePermanentDelete(proposal.id)}
                                    title="Permanently Delete"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                            {expandedRow === proposal.id && (
                              <TableRow>
                                <TableCell colSpan={9} className="bg-muted/50">
                                  <div className="p-4 space-y-4">
                                    <div>
                                      <h4 className="mb-2">Description</h4>
                                      <p className="text-muted-foreground">
                                        {proposal.description}
                                      </p>
                                    </div>
                                    <div>
                                      <h4 className="mb-2">Resolution Criteria</h4>
                                      <p className="text-muted-foreground">
                                        {proposal.resolutionCriteria}
                                      </p>
                                    </div>
                                    <div>
                                      <h4 className="mb-2">AI Agent</h4>
                                      <Badge variant="outline" className="border-primary/50 text-primary">
                                        {getAgentName(proposal)}
                                      </Badge>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() => handleEditDetails(proposal)}
                                      >
                                        Edit Details
                                      </Button>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Generate Dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate AI Proposals</DialogTitle>
            <DialogDescription>
              The AI will analyze recent sources and generate binary question proposals
              based on your configured filters.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Topic (optional)</Label>
              <Input placeholder="e.g., Politics, Sports, Technology..." />
            </div>
            <div className="space-y-2">
              <Label>Number of proposals</Label>
              <Input type="number" defaultValue="5" min="1" max="20" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setGenerateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Platform Selection Dialog */}
      <Dialog open={platformDialogOpen} onOpenChange={setPlatformDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Select Target Platforms</DialogTitle>
            <DialogDescription>
              Choose which platforms to push this question to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="synapse"
                  checked={selectedPlatforms.includes("synapse")}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedPlatforms([...selectedPlatforms, "synapse"]);
                    } else {
                      setSelectedPlatforms(selectedPlatforms.filter(p => p !== "synapse"));
                    }
                  }}
                />
                <Label htmlFor="synapse" className="text-base font-normal cursor-pointer">
                  Synapse Markets
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vectra"
                  checked={selectedPlatforms.includes("vectra")}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedPlatforms([...selectedPlatforms, "vectra"]);
                    } else {
                      setSelectedPlatforms(selectedPlatforms.filter(p => p !== "vectra"));
                    }
                  }}
                />
                <Label htmlFor="vectra" className="text-base font-normal cursor-pointer">
                  Vectra Markets
                </Label>
              </div>
            </div>
            {selectedPlatforms.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Please select at least one platform
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPlatformDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmApprove} disabled={selectedPlatforms.length === 0}>
              <Check className="h-4 w-4 mr-2" />
              Approve & Queue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Question Details Modal */}
      <QuestionDetailsModal
        question={selectedQuestion}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        onSave={handleSaveQuestion}
        onApprove={handleApproveFromModal}
        onReject={handleRejectFromModal}
        showActions={activeTab === "suggestions"}
      />

      {/* Nova Processing Modal */}
      <NovaProcessingModal
        open={novaProcessingOpen}
        onOpenChange={setNovaProcessingOpen}
        questions={questions.filter((q: ProposedQuestion) => q.state === 'pending')}
        onComplete={loadData}
      />
    </div>
  );
}

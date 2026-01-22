import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import {
  Sparkles,
  TrendingUp,
  Zap,
  ArrowRight,
  Clock,
  Users,
  Brain,
  Search,
  Calendar as CalendarIcon,
  Tag,
  Star,
  ChevronDown,
  Check
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { questionsApi, agentsApi } from "../lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { cn, getCategoryColor } from "../lib/utils";
import { QuestionDetailsModal } from "../components/shared/QuestionDetailsModal";
import { EditQuestionDetailsModal } from "../components/shared/EditQuestionDetailsModal";
import { RatingGauge } from "../components/shared/RatingGauge";
import { NovaProcessingModal } from "../components/shared/NovaProcessingModal";
import { ProposedQuestion, Question, Agent } from "../lib/types";
import { Checkbox } from "../components/ui/checkbox";
import { toast } from "sonner";

export function Overview() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from database
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [questionsData, agentsData] = await Promise.all([
        questionsApi.getQuestions(),
        agentsApi.getAgents()
      ]);
      setQuestions(questionsData);
      setAgents(agentsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get agent name from a proposal
  const getAgentName = (proposal: ProposedQuestion): string => {
    const agent = agents.find(a => a.id === proposal.agentId);
    return agent?.name || 'Unknown Agent';
  };

  // Helper function to get gradient class for suggestion cards
  const getGradientClass = (index: number): string => {
    const gradients = [
      'from-violet-500/10 to-purple-500/10',
      'from-blue-500/10 to-cyan-500/10',
      'from-pink-500/10 to-rose-500/10',
      'from-emerald-500/10 to-teal-500/10',
      'from-orange-500/10 to-amber-500/10'
    ];
    return gradients[index % gradients.length];
  };

  // Helper function to get rating badge color
  const getRatingColor = (rating: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'S'): string => {
    const colors: Record<string, string> = {
      'S': 'bg-purple-500/10 text-purple-700 border-purple-500/20',
      'A': 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
      'B': 'bg-green-500/10 text-green-700 border-green-500/20',
      'C': 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
      'D': 'bg-orange-500/10 text-orange-700 border-orange-500/20',
      'E': 'bg-red-500/10 text-red-700 border-red-500/20',
      'F': 'bg-rose-500/10 text-rose-700 border-rose-500/20',
    };
    return colors[rating] || colors['F'];
  };

  // Helper function to calculate average rating from multiple ratings
  const getAverageRating = (question: Question): { rating: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'S', confidence: number, sparkline: number[], categories: string[] } => {
    if (question.novaRatings && question.novaRatings.length > 0) {
      // Convert ratings to numeric values for averaging
      const ratingToNum: Record<string, number> = { 'F': 1, 'E': 2, 'D': 3, 'C': 4, 'B': 5, 'A': 6, 'S': 7 };
      const numToRating: Record<number, 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'S'> = { 1: 'F', 2: 'E', 3: 'D', 4: 'C', 5: 'B', 6: 'A', 7: 'S' };

      // Calculate average rating
      const avgRatingNum = Math.round(
        question.novaRatings.reduce((sum, r) => sum + ratingToNum[r.rating], 0) / question.novaRatings.length
      );

      // Calculate average confidence
      const confidences = question.novaRatings.filter(r => r.confidence !== undefined).map(r => r.confidence!);
      const avgConfidence = confidences.length > 0
        ? Math.round(confidences.reduce((sum, c) => sum + c, 0) / confidences.length)
        : 0;

      // Merge sparklines (take longest one or average if needed)
      const sparklines = question.novaRatings.filter(r => r.sparkline && r.sparkline.length > 0).map(r => r.sparkline!);
      const avgSparkline = sparklines.length > 0 ? sparklines[0] : [];

      // Collect all category names
      const categories = question.novaRatings.map(r => r.ratingCategory).filter(Boolean) as string[];

      return {
        rating: numToRating[avgRatingNum] || 'F',
        confidence: avgConfidence,
        sparkline: avgSparkline,
        categories
      };
    }

    // Fallback to legacy single rating
    return {
      rating: question.rating || 'F',
      confidence: question.ratingConfidence || 0,
      sparkline: question.ratingSparkline || [],
      categories: question.ratingCategory ? [question.ratingCategory] : []
    };
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [questionInput, setQuestionInput] = useState("");
  const [expiryDate, setExpiryDate] = useState<Date>();
  const [settlementDate, setSettlementDate] = useState<Date>();
  const [expiryPopoverOpen, setExpiryPopoverOpen] = useState(false);
  const [settlementPopoverOpen, setSettlementPopoverOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<ProposedQuestion | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEditQuestion, setSelectedEditQuestion] = useState<Question | null>(null);
  const [ratingFilter, setRatingFilter] = useState<string>("highest");
  const [novaProcessingOpen, setNovaProcessingOpen] = useState(false);
  const [novaVisibleCount, setNovaVisibleCount] = useState(8);
  const [aiVisibleCount, setAiVisibleCount] = useState(8);
  const [platformDialogOpen, setPlatformDialogOpen] = useState(false);
  const [questionToQueue, setQuestionToQueue] = useState<Question | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const handleOpenModal = () => {
    setQuestionInput(searchInput);
    setIsModalOpen(true);
  };

  const handleUseAI = () => {
    // Mock AI rephrasing - in production this would call an LLM API
    const rephrased = `Will ${questionInput.trim() || 'this event'} happen by ${expiryDate ? expiryDate.toLocaleDateString() : 'the deadline'}?`;
    setQuestionInput(rephrased);
  };

  const handleViewDetails = (suggestion: ProposedQuestion) => {
    // Convert ProposedQuestion to Question for editing
    const questionForEdit: Question = {
      id: suggestion.id,
      title: suggestion.title,
      description: suggestion.description,
      state: 'published', // Overview shows live/published questions
      liveDate: suggestion.liveDate || suggestion.createdAt, // Use liveDate or fallback to createdAt
      answerEndAt: suggestion.answerEndAt,
      settlementAt: suggestion.settlementAt,
      resolutionCriteria: suggestion.resolutionCriteria,
      categories: suggestion.categories,
      agentId: suggestion.agentId,
      answerCount: 0, // Default values
      createdAt: suggestion.createdAt,
      updatedAt: new Date(),
      type: suggestion.type || 'binary',
    };

    setSelectedEditQuestion(questionForEdit);
    setEditModalOpen(true);
  };

  const handleSaveQuestion = (updatedQuestion: Question) => {
    // In a real app, this would update the backend
    // For now, we'll just show a success message
    console.log('Draft saved:', updatedQuestion);
  };

  const handleQueueLive = (updatedQuestion: Question) => {
    // Close the edit modal first
    setEditModalOpen(false);
    // Store the question and open platform selection dialog
    setQuestionToQueue(updatedQuestion);
    setSelectedPlatforms([]);
    setPlatformDialogOpen(true);
  };

  const confirmQueueLive = async () => {
    if (!questionToQueue || selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    // Update the question state to approved and add selected platforms
    const updatedQuestion = await questionsApi.updateQuestion(questionToQueue.id, {
      state: 'approved',
      pushedTo: selectedPlatforms
    });

    if (updatedQuestion) {
      toast.success(`Question approved and queued for ${selectedPlatforms.join(', ')}`);
      // Update local state
      setQuestions(questions.map(q =>
        q.id === questionToQueue.id ? updatedQuestion : q
      ));
      // Navigate to markets page
      navigate('/markets');
    } else {
      toast.error("Failed to queue question");
    }

    setPlatformDialogOpen(false);
    setQuestionToQueue(null);
    setSelectedPlatforms([]);
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

  const handlePush = async (updatedQuestion: Question) => {
    // Close the edit modal first
    setEditModalOpen(false);

    // Check if the question has pushedTo platforms
    if (!updatedQuestion.pushedTo || updatedQuestion.pushedTo.length === 0) {
      toast.error("Question must be queued with platforms before pushing");
      return;
    }

    try {
      // Push to each selected platform
      const pushPromises = updatedQuestion.pushedTo.map(async (platform) => {
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
            question: updatedQuestion.title,
            extra: updatedQuestion.description || "",
            liveUntil: toMySQLDateTime(updatedQuestion.answerEndAt),
            liveAt: toMySQLDateTime(updatedQuestion.liveDate || new Date()),
            settlementAt: toMySQLDateTime(updatedQuestion.settlementAt),
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
      const dbUpdatedQuestion = await questionsApi.updateQuestion(updatedQuestion.id, {
        state: 'published',
      });

      if (dbUpdatedQuestion) {
        toast.success(`Question pushed to ${pushedPlatforms.join(', ')} and is now live!`);
        // Update local state
        setQuestions(questions.map(q =>
          q.id === updatedQuestion.id ? dbUpdatedQuestion : q
        ));
      } else {
        toast.error("Failed to update question state");
      }
    } catch (error) {
      console.error('Error pushing question:', error);
      toast.error(error instanceof Error ? error.message : "Failed to push question to platform");
    }
  };

  // Get Nova rated suggestions (pending questions with real ratings A-F, S from database)
  const ratingOrder: Record<string, number> = { 'S': 7, 'A': 6, 'B': 5, 'C': 4, 'D': 3, 'E': 2, 'F': 1 };
  const novaSuggestions = questions
    .filter(q => q.state === 'pending' && (q.rating !== undefined || (q.novaRatings && q.novaRatings.length > 0)))
    .sort((a, b) => {
      // Get the highest rating from either single rating or novaRatings array
      const getHighestRating = (q: Question) => {
        if (q.novaRatings && q.novaRatings.length > 0) {
          return Math.max(...q.novaRatings.map(r => ratingOrder[r.rating] || 1));
        }
        return ratingOrder[q.rating || 'F'] || 1;
      };

      const orderA = getHighestRating(a);
      const orderB = getHighestRating(b);
      return ratingFilter === "highest"
        ? orderB - orderA
        : orderA - orderB;
    });

  // Get all AI-generated suggestions (excluding past settlement date)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day for comparison

  const trendingSuggestions = [...questions.filter(q => {
    if (q.state !== 'pending') return false;

    // Filter out questions past their settlement date
    const settlementDate = new Date(q.settlementAt);
    return settlementDate >= today;
  })];

  // Calculate stats from real data
  const pendingCount = questions.filter(q => q.state === 'pending').length;
  const publishedCount = questions.filter(q => q.state === 'published').length;
  const totalParticipants = questions.reduce((sum, q) => sum + (q.answerCount || 0), 0);

  const stats = [
    { label: 'Active Questions', value: publishedCount.toString(), icon: Zap, trend: `${questions.length} total` },
    { label: 'Total Participants', value: totalParticipants.toString(), icon: Users, trend: `${agents.length} agents` },
    { label: 'AI Suggestions', value: pendingCount.toString(), icon: Brain, trend: 'Ready for review' },
  ];


  return (
    <div className="space-y-8 pb-8">
      {/* Compact Search Bar */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Make a question about $FLOKI"
              className="pl-10 bg-white border-slate-200 h-11 w-full"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-sm sm:whitespace-nowrap"
            onClick={handleOpenModal}
          >
            <Brain className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Generate Question</span>
            <span className="sm:hidden">Generate</span>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
                <Badge variant="secondary" className="text-xs">
                  {stat.trend}
                </Badge>
              </div>
              <div className="text-3xl mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Nova Suggestions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            <h2 className="text-2xl">⭐ Nova Suggestions</h2>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNovaProcessingOpen(true)}
              className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20 hover:from-amber-500/20 hover:to-orange-500/20"
            >
              <Star className="h-4 w-4 mr-2 text-amber-600" />
              Process Ratings
            </Button>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="highest">Highest Rated</SelectItem>
                <SelectItem value="lowest">Lowest Rated</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" onClick={() => navigate('/markets')}>
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading Nova suggestions...</p>
          </div>
        ) : novaSuggestions.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Nova Suggestions Yet</h3>
            <p className="text-muted-foreground mb-4">
              Generate questions to see Nova ratings
            </p>
            <Button onClick={() => navigate('/markets')}>
              Go to Markets
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Card>
        ) : (
          <>
          <div className="suggestions-grid">
            {novaSuggestions.slice(0, novaVisibleCount).map((suggestion, index) => (
            <Card
              key={suggestion.id}
              className="group hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50 relative overflow-hidden"
              onClick={() => handleViewDetails(suggestion)}
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${getGradientClass(index)} opacity-0 group-hover:opacity-100 transition-opacity`} />

              <CardHeader className="relative">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors mb-3">
                      {suggestion.title}
                    </CardTitle>
                  </div>
                  {(suggestion.rating === 'S' || suggestion.rating === 'A' ||
                    suggestion.novaRatings?.some(r => r.rating === 'S' || r.rating === 'A')) && (
                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 whitespace-nowrap">
                      ⭐ Top Rated
                    </Badge>
                  )}
                </div>
                {/* Display averaged rating circle and individual category rows */}
                {suggestion.novaRatings && suggestion.novaRatings.length > 0 ? (
                  <div className="space-y-4">
                    {/* Averaged Rating Circle */}
                    {(() => {
                      const avgRating = getAverageRating(suggestion);
                      return (
                        <RatingGauge
                          rating={avgRating.rating}
                          ratingCategory="Avg. Rating"
                          confidence={avgRating.confidence}
                          sparklineData={avgRating.sparkline}
                        />
                      );
                    })()}

                    {/* Individual Category Ratings (without circles) */}
                    <div className="space-y-2 pl-2 border-l-2 border-muted">
                      {suggestion.novaRatings.map((novaRating, index) => (
                        <div key={index} className="flex items-center gap-3 text-sm">
                          <span className="text-lg font-bold" style={{
                            color: (() => {
                              const configs: Record<string, string> = {
                                'S': 'rgb(168, 85, 247)', 'A': 'rgb(16, 185, 129)', 'B': 'rgb(34, 197, 94)',
                                'C': 'rgb(234, 179, 8)', 'D': 'rgb(249, 115, 22)', 'E': 'rgb(239, 68, 68)', 'F': 'rgb(244, 63, 94)'
                              };
                              return configs[novaRating.rating] || configs['F'];
                            })()
                          }}>
                            {novaRating.rating}
                          </span>
                          <span className="text-xs text-muted-foreground flex-1">
                            {novaRating.ratingCategory}
                          </span>
                          {novaRating.confidence !== undefined && novaRating.confidence !== null && (
                            <span className="text-xs text-muted-foreground">
                              {novaRating.confidence}%
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : suggestion.rating ? (
                  /* Fallback to legacy single rating */
                  <RatingGauge
                    rating={suggestion.rating}
                    ratingCategory={suggestion.ratingCategory}
                    confidence={suggestion.ratingConfidence || 0}
                    sparklineData={suggestion.ratingSparkline}
                  />
                ) : null}
              </CardHeader>
              <CardContent className="relative space-y-4">
                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {suggestion.description}
                </p>

                {/* Categories */}
                {suggestion.categories && suggestion.categories.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    {suggestion.categories.map((category) => (
                      <Badge
                        key={category}
                        variant="outline"
                        className={getCategoryColor(category)}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Meta info */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Ends {suggestion.answerEndAt.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      <span>{getAgentName(suggestion)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
          {novaVisibleCount < novaSuggestions.length && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={() => setNovaVisibleCount(prev => prev + 8)}
                className="gap-2"
              >
                Load More
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          )}
          </>
        )}
      </div>

      {/* Trending AI Suggestions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-2xl">All AI Agent Generated</h2>
          </div>
          <Button variant="ghost" onClick={() => navigate('/markets')}>
            View All Suggestions
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading AI suggestions...</p>
          </div>
        ) : trendingSuggestions.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No AI Suggestions Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create an agent and run it to generate questions
            </p>
            <Button onClick={() => navigate('/agents')}>
              Go to AI Agents
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Card>
        ) : (
          <>
          <div className="suggestions-grid">
            {trendingSuggestions.slice(0, aiVisibleCount).map((suggestion, index) => (
            <Card 
              key={suggestion.id} 
              className="group hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50 relative overflow-hidden"
              onClick={() => handleViewDetails(suggestion)}
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${getGradientClass(index)} opacity-0 group-hover:opacity-100 transition-opacity`} />
              
              <CardHeader className="relative">
                {index === 0 && (
                  <div className="flex items-center justify-between mb-3">
                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                      🏆 Top Pick
                    </Badge>
                  </div>
                )}
                <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                  {suggestion.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative space-y-4">
                {/* Description - not truncated */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {suggestion.description}
                </p>
                
                {/* Categories */}
                {suggestion.categories && suggestion.categories.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    {suggestion.categories.map((category) => (
                      <Badge
                        key={category}
                        variant="outline"
                        className={getCategoryColor(category)}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Meta info */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Ends {suggestion.answerEndAt.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      <span>{getAgentName(suggestion)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
          {aiVisibleCount < trendingSuggestions.length && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={() => setAiVisibleCount(prev => prev + 8)}
                className="gap-2"
              >
                Load More
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          )}
          </>
        )}
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-2">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl mb-1">Ready to create something new?</h3>
              <p className="text-muted-foreground">
                Use AI to generate questions or create your own from scratch
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigate('/markets')} className="gradient-primary text-white border-0">
                <Brain className="h-4 w-4 mr-2" />
                AI Generate
              </Button>
              <Button variant="outline" onClick={() => navigate('/questions')}>
                Manual Create
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal for Manual Question Creation */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>Create a New Question</DialogTitle>
            <DialogDescription>
              Enter your question and set an expiry date.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Input
                id="question"
                placeholder="Enter your question here"
                className="col-span-3"
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 border-0"
                onClick={handleUseAI}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Use AI
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry-date">Answer deadline:</Label>
              <Popover open={expiryPopoverOpen} onOpenChange={setExpiryPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left",
                      !expiryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate ? expiryDate.toLocaleDateString() : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[100]" align="start">
                  <Calendar
                    mode="single"
                    selected={expiryDate}
                    onSelect={(date) => {
                      setExpiryDate(date);
                      setExpiryPopoverOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="settlement-date">Settlement:</Label>
              <Popover open={settlementPopoverOpen} onOpenChange={setSettlementPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left",
                      !settlementDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {settlementDate ? settlementDate.toLocaleDateString() : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[100]" align="start">
                  <Calendar
                    mode="single"
                    selected={settlementDate}
                    onSelect={(date) => {
                      setSettlementDate(date);
                      setSettlementPopoverOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-green-500 hover:bg-green-600 text-white"
              onClick={() => {
                // Handle question creation logic here
                setIsModalOpen(false);
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Details Modal */}
      <QuestionDetailsModal
        question={selectedQuestion}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        onSave={(updatedQuestion: ProposedQuestion) => {
          // Legacy handler if needed
        }}
        showActions={false}
      />

      {/* Edit Question Details Modal */}
      <EditQuestionDetailsModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        question={selectedEditQuestion}
        onSave={handleSaveQuestion}
        onQueueLive={handleQueueLive}
      />

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
            <Button onClick={confirmQueueLive} disabled={selectedPlatforms.length === 0}>
              <Check className="h-4 w-4 mr-2" />
              Approve & Queue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nova Processing Modal */}
      <NovaProcessingModal
        open={novaProcessingOpen}
        onOpenChange={setNovaProcessingOpen}
        questions={questions.filter(q => q.state === 'pending')}
        onComplete={loadData}
      />
    </div>
  );
}

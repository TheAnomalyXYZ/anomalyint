import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import {
  MessageSquare,
  ThumbsUp,
  Share2,
  Eye,
  Twitter,
  TrendingUp,
  Clock,
  User,
  Send,
  Copy,
  CheckCheck,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../lib/utils";

interface Comment {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  timestamp: Date;
  likes: number;
  suggestedResponse?: string;
}

interface TrackedPost {
  id: string;
  platform: "twitter" | "linkedin" | "facebook";
  content: string;
  postedAt: Date;
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  comments: Comment[];
  status: "active" | "archived";
}

export function TrackedContent() {
  const [posts, setPosts] = useState<TrackedPost[]>([
    {
      id: "1",
      platform: "twitter",
      content: "Exciting developments in AI prediction markets! 🚀 Intelligence Guild is revolutionizing how we forecast future events with our advanced AI agents. Check out our latest features! #AI #PredictionMarkets",
      postedAt: new Date("2026-01-25T10:30:00"),
      metrics: {
        views: 12543,
        likes: 342,
        comments: 28,
        shares: 56,
      },
      status: "active",
      comments: [
        {
          id: "c1",
          author: "TechEnthusiast_42",
          content: "This looks amazing! How accurate are your AI predictions compared to traditional forecasting methods?",
          timestamp: new Date("2026-01-25T11:15:00"),
          likes: 12,
          suggestedResponse: "Great question! Our AI agents combine multiple data sources and use advanced ML models to achieve 15-20% higher accuracy than traditional methods. We'd love to show you a demo - DM us!",
        },
        {
          id: "c2",
          author: "DataScience_Pro",
          content: "Interesting concept. What kind of events can your system predict?",
          timestamp: new Date("2026-01-25T12:00:00"),
          likes: 8,
          suggestedResponse: "Our platform handles a wide range of events including market trends, technology releases, sports outcomes, and business metrics. Each AI agent specializes in different domains for maximum accuracy.",
        },
        {
          id: "c3",
          author: "CryptoTrader_99",
          content: "Can I integrate this with my trading bot?",
          timestamp: new Date("2026-01-25T13:45:00"),
          likes: 15,
          suggestedResponse: "Absolutely! We offer API access for integration with trading systems. Our predictions can feed directly into your trading algorithms. Let's discuss your use case in detail.",
        },
      ],
    },
    {
      id: "2",
      platform: "twitter",
      content: "Just launched our new Nova rating system! ⭐ Now AI agents automatically score prediction questions for quality and relevance. Intelligence is evolving. #MachineLearning #Innovation",
      postedAt: new Date("2026-01-24T14:20:00"),
      metrics: {
        views: 8932,
        likes: 234,
        comments: 15,
        shares: 42,
      },
      status: "active",
      comments: [
        {
          id: "c4",
          author: "AIResearcher_Lab",
          content: "How does the Nova rating system work exactly? What criteria does it use?",
          timestamp: new Date("2026-01-24T15:30:00"),
          likes: 18,
          suggestedResponse: "Nova evaluates questions across multiple dimensions: clarity, verifiability, time-boundedness, and market interest. It uses a proprietary ML model trained on thousands of successful prediction markets.",
        },
        {
          id: "c5",
          author: "StartupFounder_",
          content: "Would love to see a case study on this!",
          timestamp: new Date("2026-01-24T16:00:00"),
          likes: 6,
          suggestedResponse: "We're preparing detailed case studies! In the meantime, check out our blog where we've analyzed 500+ predictions and their Nova scores. Link in bio!",
        },
      ],
    },
  ]);

  const [generatingResponse, setGeneratingResponse] = useState<string | null>(null);
  const [customResponses, setCustomResponses] = useState<Record<string, string>>({});

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "twitter":
        return <Twitter className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "twitter":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const handleGenerateResponse = (commentId: string) => {
    setGeneratingResponse(commentId);
    // Simulate AI generation delay
    setTimeout(() => {
      setGeneratingResponse(null);
      toast.success("AI response generated!");
    }, 1500);
  };

  const handleCopyResponse = (response: string) => {
    navigator.clipboard.writeText(response);
    toast.success("Response copied to clipboard!");
  };

  const handleSendResponse = (postId: string, commentId: string, response: string) => {
    toast.success("Response posted successfully!");
    // In a real app, this would actually post the response to the platform
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays}d ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours}h ago`;
    } else {
      return "Just now";
    }
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tracked Content</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your posts and engage with AI-suggested responses
          </p>
        </div>
        <Button className="gradient-primary text-white border-0">
          <RefreshCw className="h-4 w-4 mr-2" />
          Sync Posts
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Posts</p>
                <p className="text-2xl font-bold">{posts.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">
                  {posts.reduce((sum, p) => sum + p.metrics.views, 0).toLocaleString()}
                </p>
              </div>
              <Eye className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Engagement</p>
                <p className="text-2xl font-bold">
                  {posts
                    .reduce(
                      (sum, p) =>
                        sum + p.metrics.likes + p.metrics.comments + p.metrics.shares,
                      0
                    )
                    .toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Responses</p>
                <p className="text-2xl font-bold">
                  {posts.reduce((sum, p) => sum + p.comments.length, 0)}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tracked Posts */}
      <div className="space-y-6">
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={getPlatformColor(post.platform)}>
                      {getPlatformIcon(post.platform)}
                      <span className="ml-1 capitalize">{post.platform}</span>
                    </Badge>
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTimeAgo(post.postedAt)}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-normal leading-relaxed">
                    {post.content}
                  </CardTitle>
                </div>
              </div>

              {/* Post Metrics */}
              <div className="flex items-center gap-6 mt-4 pt-4 border-t">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>{post.metrics.views.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{post.metrics.likes}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>{post.metrics.comments}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Share2 className="h-4 w-4" />
                  <span>{post.metrics.shares}</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comments ({post.comments.length})
                </h3>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {post.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="border rounded-lg p-4 space-y-3 bg-muted/30"
                  >
                    {/* Comment Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-full flex-shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">@{comment.author}</p>
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(comment.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{comment.content}</p>
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <ThumbsUp className="h-3 w-3" />
                            <span>{comment.likes}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Suggested Response */}
                    {comment.suggestedResponse && (
                      <div className="ml-11 space-y-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-purple-600" />
                          <p className="text-xs font-medium text-purple-600">
                            AI Suggested Response
                          </p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-3">
                          <Textarea
                            value={
                              customResponses[comment.id] !== undefined
                                ? customResponses[comment.id]
                                : comment.suggestedResponse
                            }
                            onChange={(e) =>
                              setCustomResponses({
                                ...customResponses,
                                [comment.id]: e.target.value,
                              })
                            }
                            className="text-sm bg-white/50 border-purple-200 min-h-[80px] mb-3"
                            placeholder="Edit response..."
                          />

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleCopyResponse(
                                  customResponses[comment.id] || comment.suggestedResponse
                                )
                              }
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                            <Button
                              size="sm"
                              className="gradient-primary text-white border-0"
                              onClick={() =>
                                handleSendResponse(
                                  post.id,
                                  comment.id,
                                  customResponses[comment.id] || comment.suggestedResponse
                                )
                              }
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Send Response
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleGenerateResponse(comment.id)}
                              disabled={generatingResponse === comment.id}
                            >
                              <RefreshCw
                                className={cn(
                                  "h-3 w-3 mr-1",
                                  generatingResponse === comment.id && "animate-spin"
                                )}
                              />
                              Regenerate
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {posts.length === 0 && (
        <Card className="p-12 text-center border-2 border-dashed">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Tracked Content Yet</h3>
          <p className="text-muted-foreground mb-4">
            Connect your social media accounts to start tracking posts and comments
          </p>
          <Button className="gradient-primary text-white border-0">
            <Twitter className="h-4 w-4 mr-2" />
            Connect Account
          </Button>
        </Card>
      )}
    </div>
  );
}

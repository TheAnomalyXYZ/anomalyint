import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { AgentSourceType, AgentFrequency, Agent, AgentSource } from "../../lib/types";
import { toast } from "sonner@2.0.3";
import { Plus, X, Globe, Link as LinkIcon, Twitter, FileJson, ChevronDown, ChevronUp } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";

interface EditAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (agent: Agent) => void;
  agent: Agent | null;
}

export function EditAgentModal({
  open,
  onOpenChange,
  onSave,
  agent,
}: EditAgentModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [sources, setSources] = useState<AgentSource[]>([]);
  const [questionPrompt, setQuestionPrompt] = useState("");
  const [resolutionPrompt, setResolutionPrompt] = useState("");
  const [baseModel, setBaseModel] = useState("chatgpt-4o-latest");
  const [frequency, setFrequency] = useState<AgentFrequency>("on_update");

  const [newSourceType, setNewSourceType] = useState<AgentSourceType | "">("");
  const [newSourceConfig, setNewSourceConfig] = useState("");
  const [redditApiEndpoint, setRedditApiEndpoint] = useState("https://theanomaly.app.n8n.cloud/webhook/subreddit");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Pre-populate form fields when agent changes
  useEffect(() => {
    if (agent) {
      setName(agent.name || "");
      setDescription(agent.description || "");
      setCategories(agent.categories || []);
      setSources(agent.sources || []);
      setQuestionPrompt(agent.questionPrompt || "");
      setResolutionPrompt(agent.resolutionPrompt || "");
      setBaseModel(agent.baseModel || "chatgpt-4o-latest");
      setFrequency(agent.frequency || "on_update");
    }
  }, [agent]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setNewSourceType("");
      setNewSourceConfig("");
    }
  }, [open]);

  const handleAddSource = () => {
    if (!newSourceType || !newSourceConfig) {
      toast.error("Please select a source type and provide configuration");
      return;
    }

    const config: any = {};

    switch (newSourceType) {
      case 'website':
        config.url = newSourceConfig;
        break;
      case 'api':
        config.apiEndpoint = newSourceConfig;
        break;
      case 'x':
        config.url = newSourceConfig;
        break;
      case 'reddit':
        config.subreddit = newSourceConfig;
        config.apiEndpoint = redditApiEndpoint;
        break;
      case 'feed':
        config.feedUrl = newSourceConfig;
        break;
    }

    setSources([...sources, { type: newSourceType, config }]);
    setNewSourceType("");
    setNewSourceConfig("");
  };

  const handleRemoveSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      toast.error("Please enter a category name");
      return;
    }
    if (categories.includes(newCategory.trim())) {
      toast.error("Category already added");
      return;
    }
    setCategories([...categories, newCategory.trim()]);
    setNewCategory("");
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    setCategories(categories.filter(cat => cat !== categoryToRemove));
  };

  const handleSave = () => {
    if (!agent) return;

    if (!name || !questionPrompt || sources.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    const updatedAgent: Agent = {
      ...agent,
      name,
      description,
      categories,
      sources,
      questionPrompt,
      resolutionPrompt: resolutionPrompt || undefined,
      baseModel,
      frequency,
      updatedAt: new Date(),
    };

    onSave(updatedAgent);
    onOpenChange(false);
    toast.success("Agent updated successfully");
  };

  const getSourceIcon = (type: AgentSourceType) => {
    switch (type) {
      case 'website':
        return <Globe className="h-4 w-4" />;
      case 'api':
        return <LinkIcon className="h-4 w-4" />;
      case 'x':
        return <Twitter className="h-4 w-4" />;
      case 'reddit':
        return <FileJson className="h-4 w-4" />;
      case 'feed':
        return <FileJson className="h-4 w-4" />;
    }
  };

  const getSourceLabel = (source: AgentSource) => {
    switch (source.type) {
      case 'website':
        return source.config.url;
      case 'api':
        return source.config.apiEndpoint;
      case 'x':
        return source.config.url;
      case 'reddit':
        return `r/${source.config.subreddit}`;
      case 'feed':
        return source.config.feedUrl;
    }
  };

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Edit Agent: {agent.name}
          </DialogTitle>
          <DialogDescription>
            Modify the AI agent configuration and settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Name */}
          <div>
            <Label htmlFor="name">Agent Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Elon Market Agent"
              className="mt-2"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this agent do?"
              className="mt-2 min-h-[80px]"
            />
          </div>

          {/* Categories */}
          <div>
            <Label>Categories</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
                placeholder="e.g., Cryptocurrency, Technology, Finance"
              />
              <Button type="button" onClick={handleAddCategory} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Questions created by this agent will inherit these categories
            </p>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {categories.map((cat, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    {cat}
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(cat)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Sources */}
          <div>
            <Label>Sources *</Label>
            <div className="mt-2 space-y-3">
              {sources.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {sources.map((source, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="gap-2 pr-1 py-1.5"
                    >
                      {getSourceIcon(source.type)}
                      <span className="text-xs">{source.type}</span>
                      <span className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {getSourceLabel(source)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 hover:bg-transparent"
                        onClick={() => handleRemoveSource(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Select
                  value={newSourceType}
                  onValueChange={(value) => setNewSourceType(value as AgentSourceType)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select source type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Website (scrape)
                      </div>
                    </SelectItem>
                    <SelectItem value="api">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" />
                        API
                      </div>
                    </SelectItem>
                    <SelectItem value="x">
                      <div className="flex items-center gap-2">
                        <Twitter className="h-4 w-4" />
                        X
                      </div>
                    </SelectItem>
                    <SelectItem value="reddit">
                      <div className="flex items-center gap-2">
                        <FileJson className="h-4 w-4" />
                        Reddit (Subreddit)
                      </div>
                    </SelectItem>
                    <SelectItem value="feed">
                      <div className="flex items-center gap-2">
                        <FileJson className="h-4 w-4" />
                        Feed (JSON)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  value={newSourceConfig}
                  onChange={(e) => setNewSourceConfig(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSource();
                    }
                  }}
                  placeholder={
                    newSourceType === "website"
                      ? "https://example.com"
                      : newSourceType === "api"
                      ? "https://api.example.com/endpoint"
                      : newSourceType === "x"
                      ? "https://x.com/username"
                      : newSourceType === "reddit"
                      ? "Subreddit name (e.g., politics)"
                      : newSourceType === "feed"
                      ? "https://feed.example.com/data.json"
                      : "Configure source..."
                  }
                  className="flex-1"
                />

                <Button onClick={handleAddSource} variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Reddit API Endpoint Configuration */}
              {newSourceType === "reddit" && (
                <div className="mt-2">
                  <Label htmlFor="reddit-api" className="text-xs text-muted-foreground">
                    Reddit API Endpoint
                  </Label>
                  <Input
                    id="reddit-api"
                    value={redditApiEndpoint}
                    onChange={(e) => setRedditApiEndpoint(e.target.value)}
                    placeholder="https://theanomaly.app.n8n.cloud/webhook/subreddit"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The API endpoint that accepts the subreddit as a query parameter
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Question Generation Prompt */}
          <div>
            <Label htmlFor="questionPrompt">Question Generation Prompt *</Label>
            <Textarea
              id="questionPrompt"
              value={questionPrompt}
              onChange={(e) => setQuestionPrompt(e.target.value)}
              placeholder="e.g., Create a question based on Elon Musk's latest tweet"
              className="mt-2 min-h-[100px]"
            />
          </div>

          {/* Base Model */}
          <div>
            <Label htmlFor="baseModel">AI Model *</Label>
            <Select value={baseModel} onValueChange={setBaseModel}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chatgpt-4o-latest">ChatGPT 4o (Latest)</SelectItem>
                <SelectItem value="chatgpt-4o">ChatGPT 4o</SelectItem>
                <SelectItem value="chatgpt-4-turbo">ChatGPT 4 Turbo</SelectItem>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Frequency */}
          <div>
            <Label htmlFor="frequency">How often should this agent run? *</Label>
            <Select value={frequency} onValueChange={(value) => setFrequency(value as AgentFrequency)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Every Day</SelectItem>
                <SelectItem value="on_update">Every Update</SelectItem>
                <SelectItem value="weekly">Every Week</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Section */}
          <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full flex items-center justify-between">
                <span className="font-semibold">Advanced Options</span>
                {isAdvancedOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              {/* Resolution Prompt */}
              <div>
                <Label htmlFor="resolutionPrompt">Resolution Prompt (Optional)</Label>
                <Textarea
                  id="resolutionPrompt"
                  value={resolutionPrompt}
                  onChange={(e) => setResolutionPrompt(e.target.value)}
                  placeholder="e.g., Answer the question by researching the web and finding the answer."
                  className="mt-2 min-h-[100px]"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
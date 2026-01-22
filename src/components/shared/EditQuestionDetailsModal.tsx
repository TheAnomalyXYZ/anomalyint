import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Question } from "../../lib/types";
import { formatDate, cn } from "../../lib/utils";
import { ExternalLink, Calendar as CalendarIcon, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Calendar } from "../ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner@2.0.3";

interface EditQuestionDetailsModalProps {
  question: Question | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedQuestion: Question) => void;
  onQueueLive?: (updatedQuestion: Question) => void;
}

export function EditQuestionDetailsModal({
  question,
  open,
  onOpenChange,
  onSave,
  onQueueLive,
}: EditQuestionDetailsModalProps) {
  const [editedQuestion, setEditedQuestion] = useState<Question | null>(null);
  const [liveDatePopoverOpen, setLiveDatePopoverOpen] = useState(false);
  const [answerEndPopoverOpen, setAnswerEndPopoverOpen] = useState(false);
  const [settlementPopoverOpen, setSettlementPopoverOpen] = useState(false);
  const [newTag, setNewTag] = useState("");

  // Helper function to format date to EST time string (HH:MM)
  const formatTimeEST = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Toronto'
    });
  };

  // Helper function to parse time string and update date
  const updateDateTime = (date: Date, timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const newDate = new Date(date);

    // Convert from EST to UTC
    const estDate = new Date(newDate.toLocaleString('en-US', { timeZone: 'America/Toronto' }));
    estDate.setHours(hours, minutes, 0, 0);

    // Get the offset difference
    const offset = newDate.getTime() - new Date(newDate.toLocaleString('en-US', { timeZone: 'America/Toronto' })).getTime();

    return new Date(estDate.getTime() - offset);
  };

  useEffect(() => {
    if (question) {
      setEditedQuestion({ ...question });
    }
  }, [question]);

  if (!question || !editedQuestion) return null;

  const handleSaveDraft = () => {
    if (editedQuestion) {
      const updatedQuestion: Question = {
        ...editedQuestion,
        state: 'draft',
        updatedAt: new Date(),
      };
      onSave(updatedQuestion);
      toast.success("Question saved as draft");
    }
    onOpenChange(false);
  };

  const handleQueueLive = () => {
    if (editedQuestion && onQueueLive) {
      const updatedQuestion: Question = {
        ...editedQuestion,
        state: 'awaiting_review',
        updatedAt: new Date(),
      };
      onQueueLive(updatedQuestion);
      toast.success("Question queued for review");
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    setEditedQuestion({ ...question });
    onOpenChange(false);
  };

  const handleAddTag = () => {
    if (newTag.trim() && editedQuestion) {
      setEditedQuestion({
        ...editedQuestion,
        tags: [...(editedQuestion.tags || []), newTag.trim()],
      });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (editedQuestion) {
      setEditedQuestion({
        ...editedQuestion,
        tags: editedQuestion.tags?.filter((tag) => tag !== tagToRemove) || [],
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl pr-6">Edit Question Details</DialogTitle>
          <DialogDescription>
            Update the question details below. All dates and times are in EST timezone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Question Title</Label>
            <Input
              id="title"
              value={editedQuestion.title}
              onChange={(e) =>
                setEditedQuestion({ ...editedQuestion, title: e.target.value })
              }
              className="mt-2"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={editedQuestion.description}
              onChange={(e) =>
                setEditedQuestion({ ...editedQuestion, description: e.target.value })
              }
              className="mt-2 min-h-[100px]"
              placeholder="Provide additional context or details about the question..."
            />
          </div>

          {/* Question Type */}
          <div>
            <Label htmlFor="type">Question Type</Label>
            <Select
              value={editedQuestion.type || "binary"}
              onValueChange={(value) => setEditedQuestion({ ...editedQuestion, type: value })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="binary">Binary (Yes/No)</SelectItem>
                <SelectItem value="multi-option">Multi-option</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Live Date */}
          <div>
            <Label>Live Date (EST)</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Popover open={liveDatePopoverOpen} onOpenChange={setLiveDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left",
                      !editedQuestion.liveDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editedQuestion.liveDate
                      ? formatDate(editedQuestion.liveDate)
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[100]" align="start">
                  <Calendar
                    mode="single"
                    selected={editedQuestion.liveDate}
                    onSelect={(date) => {
                      if (date) {
                        const currentTime = editedQuestion.liveDate
                          ? formatTimeEST(editedQuestion.liveDate)
                          : "09:00";
                        const newDate = updateDateTime(date, currentTime);
                        setEditedQuestion({
                          ...editedQuestion,
                          liveDate: newDate,
                        });
                      }
                      setLiveDatePopoverOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                value={editedQuestion.liveDate ? formatTimeEST(editedQuestion.liveDate) : "09:00"}
                onChange={(e) => {
                  const baseDate = editedQuestion.liveDate || new Date();
                  const newDate = updateDateTime(baseDate, e.target.value);
                  setEditedQuestion({
                    ...editedQuestion,
                    liveDate: newDate,
                  });
                }}
              />
            </div>
          </div>

          {/* Answer End Date */}
          <div>
            <Label>Answer End Date (EST)</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Popover open={answerEndPopoverOpen} onOpenChange={setAnswerEndPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left",
                      !editedQuestion.answerEndAt && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editedQuestion.answerEndAt
                      ? formatDate(editedQuestion.answerEndAt)
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[100]" align="start">
                  <Calendar
                    mode="single"
                    selected={editedQuestion.answerEndAt}
                    onSelect={(date) => {
                      if (date) {
                        const currentTime = formatTimeEST(editedQuestion.answerEndAt);
                        const newDate = updateDateTime(date, currentTime);
                        setEditedQuestion({
                          ...editedQuestion,
                          answerEndAt: newDate,
                        });
                      }
                      setAnswerEndPopoverOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                value={formatTimeEST(editedQuestion.answerEndAt)}
                onChange={(e) => {
                  const newDate = updateDateTime(editedQuestion.answerEndAt, e.target.value);
                  setEditedQuestion({
                    ...editedQuestion,
                    answerEndAt: newDate,
                  });
                }}
              />
            </div>
          </div>

          {/* Settlement Date */}
          <div>
            <Label>Settlement Date (EST)</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Popover open={settlementPopoverOpen} onOpenChange={setSettlementPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left",
                      !editedQuestion.settlementAt && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editedQuestion.settlementAt
                      ? formatDate(editedQuestion.settlementAt)
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[100]" align="start">
                  <Calendar
                    mode="single"
                    selected={editedQuestion.settlementAt}
                    onSelect={(date) => {
                      if (date) {
                        const currentTime = formatTimeEST(editedQuestion.settlementAt);
                        const newDate = updateDateTime(date, currentTime);
                        setEditedQuestion({
                          ...editedQuestion,
                          settlementAt: newDate,
                        });
                      }
                      setSettlementPopoverOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                value={formatTimeEST(editedQuestion.settlementAt)}
                onChange={(e) => {
                  const newDate = updateDateTime(editedQuestion.settlementAt, e.target.value);
                  setEditedQuestion({
                    ...editedQuestion,
                    settlementAt: newDate,
                  });
                }}
              />
            </div>
          </div>

          {/* Resolution Criteria */}
          <div>
            <Label htmlFor="resolution">Resolution Criteria</Label>
            <Textarea
              id="resolution"
              value={editedQuestion.resolutionCriteria}
              onChange={(e) =>
                setEditedQuestion({
                  ...editedQuestion,
                  resolutionCriteria: e.target.value,
                })
              }
              className="mt-2 min-h-[100px]"
              placeholder="Describe the specific criteria that will be used to resolve this question..."
            />
          </div>

          {/* Categories */}
          <div>
            <Label>Categories</Label>
            <div className="mt-2 space-y-3">
              <div className="flex flex-wrap gap-2">
                {editedQuestion.categories?.map((category) => (
                  <Badge
                    key={category}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    {category}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 hover:bg-transparent"
                      onClick={() => {
                        setEditedQuestion({
                          ...editedQuestion,
                          categories: editedQuestion.categories.filter((c) => c !== category),
                        });
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add new category..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newTag.trim()) {
                        setEditedQuestion({
                          ...editedQuestion,
                          categories: [...(editedQuestion.categories || []), newTag.trim()],
                        });
                        setNewTag("");
                      }
                    }
                  }}
                />
                <Button onClick={() => {
                  if (newTag.trim()) {
                    setEditedQuestion({
                      ...editedQuestion,
                      categories: [...(editedQuestion.categories || []), newTag.trim()],
                    });
                    setNewTag("");
                  }
                }} variant="outline">
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="mt-2 space-y-3">
              <div className="flex flex-wrap gap-2">
                {editedQuestion.tags?.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="gap-1 pr-1"
                  >
                    {tag}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 hover:bg-transparent"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add new tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button onClick={handleAddTag} variant="outline">
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Sources */}
          {editedQuestion.sources && editedQuestion.sources.length > 0 && (
            <div>
              <Label>Sources</Label>
              <div className="space-y-2 mt-2">
                {editedQuestion.sources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={
                          source.type === "twitter"
                            ? "border-blue-500 text-blue-700"
                            : source.type === "news"
                            ? "border-orange-500 text-orange-700"
                            : "border-purple-500 text-purple-700"
                        }
                      >
                        {source.type}
                      </Badge>
                      <span className="text-sm truncate">{source.title}</span>
                      {source.outlet && (
                        <span className="text-xs text-muted-foreground">({source.outlet})</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="h-8 w-8"
                    >
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleSaveDraft}>
            Save Draft
          </Button>
          {onQueueLive && (
            <Button onClick={handleQueueLive} className="gradient-primary text-white border-0">
              Queue Live
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
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
import { ProposedQuestion, Agent } from "../../lib/types";
import { mockAgents } from "../../lib/mock-data";
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
import { toast } from "sonner@2.0.3";

interface QuestionDetailsModalProps {
  question: ProposedQuestion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (updatedQuestion: ProposedQuestion) => void;
  onApprove?: (question: ProposedQuestion) => void;
  onReject?: (question: ProposedQuestion) => void;
  showActions?: boolean;
}

export function QuestionDetailsModal({
  question,
  open,
  onOpenChange,
  onSave,
  onApprove,
  onReject,
  showActions = true,
}: QuestionDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(true);
  const [editedQuestion, setEditedQuestion] = useState<ProposedQuestion | null>(null);
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
      // If no liveDate, default to now + 1 hour
      const defaultLiveDate = question.liveDate || new Date(Date.now() + 60 * 60 * 1000);
      setEditedQuestion({ 
        ...question,
        liveDate: defaultLiveDate
      });
    }
  }, [question]);

  if (!question || !editedQuestion) return null;

  const handleSave = () => {
    if (onSave && editedQuestion) {
      onSave(editedQuestion);
      toast.success("Question updated successfully");
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    setEditedQuestion({ ...question });
    onOpenChange(false);
  };

  const handleApprove = () => {
    if (onApprove && editedQuestion) {
      onApprove(editedQuestion);
      toast.success("Question approved and moved to drafts");
    }
    onOpenChange(false);
  };

  const handleReject = () => {
    if (onReject && editedQuestion) {
      onReject(editedQuestion);
      toast.success("Question rejected");
    }
    onOpenChange(false);
  };

  const handleAddTag = () => {
    if (newTag.trim() && editedQuestion) {
      setEditedQuestion({
        ...editedQuestion,
        categories: [...(editedQuestion.categories || []), newTag.trim()],
      });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (editedQuestion) {
      setEditedQuestion({
        ...editedQuestion,
        categories: editedQuestion.categories.filter((tag) => tag !== tagToRemove),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl pr-6">Edit Question Details</DialogTitle>
          <DialogDescription>
            Update the question details below. All dates and times are in EST timezone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-2">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={editedQuestion.title}
              onChange={(e) =>
                setEditedQuestion({ ...editedQuestion, title: e.target.value })
              }
              className="mt-2"
            />
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
                        const currentTime = formatTimeEST(editedQuestion.liveDate);
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
                value={formatTimeEST(editedQuestion.liveDate)}
                onChange={(e) => {
                  const newDate = updateDateTime(editedQuestion.liveDate, e.target.value);
                  setEditedQuestion({
                    ...editedQuestion,
                    liveDate: newDate,
                  });
                }}
              />
            </div>
          </div>

          {/* Answer End */}
          <div>
            <Label>Answer End (EST)</Label>
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

          {/* Settlement */}
          <div>
            <Label>Settlement (EST)</Label>
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
            />
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
            />
          </div>

          {/* AI Agent */}
          <div>
            <Label>AI Agent</Label>
            <div className="mt-2">
              {(() => {
                const agent = mockAgents.find(a => a.id === editedQuestion.agentId);
                return (
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="outline" className="border-primary/50 text-primary">
                        AI Generated
                      </Badge>
                      <span className="font-medium">{agent?.name || 'Unknown Agent'}</span>
                      {agent?.category && (
                        <Badge variant="outline" className="ml-auto">
                          {agent.category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {agent?.description || 'AI Agent for generating and resolving questions'}
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
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
                      onClick={() => handleRemoveTag(category)}
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
        </div>

        <DialogFooter className="gap-2">
          {showActions && (
            <div className="flex gap-2 mr-auto">
              <Button
                variant="default"
                onClick={handleApprove}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
              >
                Reject
              </Button>
            </div>
          )}
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

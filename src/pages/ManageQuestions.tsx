import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/shared/PageHeader";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { StateBadge } from "../components/shared/StateBadge";
import { Countdown } from "../components/shared/Countdown";
import { QuestionDetailsModal } from "../components/shared/QuestionDetailsModal";
import { EditQuestionDetailsModal } from "../components/shared/EditQuestionDetailsModal";
import { Search, Plus, MoreHorizontal, XCircle, Pause, Edit } from "lucide-react";
import { mockQuestions } from "../lib/mock-data";
import { Question } from "../lib/types";
import { formatDate } from "../lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { toast } from "sonner@2.0.3";

export function ManageQuestions() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>(mockQuestions);
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [pauseConfirmOpen, setPauseConfirmOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const filteredQuestions = questions.filter((q) => {
    // Exclude AI suggestion workflow states (those belong in Markets page)
    if (q.state === 'pending' || q.state === 'approved' || q.state === 'rejected') return false;

    // Exclude awaiting_resolution questions as they appear in Resolve Markets
    if (q.state === 'awaiting_resolution') return false;

    const matchesSearch =
      searchQuery === "" ||
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesState = stateFilter === "all" || q.state === stateFilter;
    return matchesSearch && matchesState;
  });

  const handleClone = (id: string) => {
    toast.success("Question cloned successfully");
  };

  const handleUnpublish = (id: string) => {
    toast.success("Question unpublished");
  };

  const handleResolve = (id: string) => {
    navigate(`/resolve/${id}`);
  };

  const handleCloseNow = (question: Question) => {
    setSelectedQuestion(question);
    setCloseConfirmOpen(true);
  };

  const handlePause = (question: Question) => {
    setSelectedQuestion(question);
    setPauseConfirmOpen(true);
  };

  const handleEdit = (question: Question) => {
    setSelectedQuestion(question);
    setEditModalOpen(true);
  };

  const handleItemClick = (question: Question) => {
    setSelectedQuestion(question);
    setEditModalOpen(true);
  };

  const confirmCloseNow = () => {
    if (selectedQuestion) {
      setQuestions(
        questions.map((q) =>
          q.id === selectedQuestion.id ? { ...q, state: 'answering_closed' } : q
        )
      );
      toast.success("Question closed successfully");
    }
    setCloseConfirmOpen(false);
    setSelectedQuestion(null);
  };

  const confirmPause = () => {
    if (selectedQuestion) {
      setQuestions(
        questions.map((q) =>
          q.id === selectedQuestion.id ? { ...q, state: 'paused' } : q
        )
      );
      toast.success("Question paused successfully");
    }
    setPauseConfirmOpen(false);
    setSelectedQuestion(null);
  };

  const handleSaveQuestion = (updatedQuestion: Question) => {
    setQuestions(
      questions.map((q) =>
        q.id === updatedQuestion.id ? updatedQuestion : q
      )
    );
    toast.success("Question details updated");
  };

  return (
    <div>
      <PageHeader
        title="Live Markets"
        description="Browse and manage all active prediction markets"
        actions={
          <Button onClick={() => navigate("/markets")}>
            <Plus className="h-4 w-4 mr-2" />
            New Question
          </Button>
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="awaiting_review">Awaiting Review</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Questions Table */}
      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Market Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Answer Window</TableHead>
                <TableHead>Settlement</TableHead>
                <TableHead>Pool Size</TableHead>
                <TableHead className="w-48">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuestions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No questions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuestions.map((question) => (
                  <TableRow
                    key={question.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleItemClick(question)}
                  >
                    <TableCell>
                      <p className="max-w-md">{question.title}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {question.type === 'multi-option' ? 'Multi-option' : question.type || 'binary'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StateBadge state={question.state} />
                    </TableCell>
                    <TableCell>
                      {question.tags && question.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {question.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {question.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{question.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{formatDate(question.answerEndAt)}</p>
                        {question.state === 'published' && (
                          <Countdown date={question.answerEndAt} />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{formatDate(question.settlementAt)}</p>
                    </TableCell>
                    <TableCell>
                      {question.poolSize && question.poolSize.total > 0 ? (
                        <div className="text-sm">
                          <p>{question.poolSize.total.toLocaleString()} coins</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Yes: {question.poolSize.yes.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            No: {question.poolSize.no.toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {question.state === 'published' ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCloseNow(question)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Close Now
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePause(question)}
                          >
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(question)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => navigate(`/questions/${question.id}`)}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleClone(question.id)}>
                              Clone
                            </DropdownMenuItem>
                            {question.state === 'awaiting_resolution' && (
                              <DropdownMenuItem onClick={() => handleResolve(question.id)}>
                                Resolve
                              </DropdownMenuItem>
                            )}
                            {question.state === 'published' && (
                              <DropdownMenuItem onClick={() => handleUnpublish(question.id)}>
                                Unpublish
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Close Now Confirmation Modal */}
      <AlertDialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Question Now?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately close the answering period for "{selectedQuestion?.title}". 
              Users will no longer be able to submit answers. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCloseNow}>
              Close Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pause Confirmation Modal */}
      <AlertDialog open={pauseConfirmOpen} onOpenChange={setPauseConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pause Question?</AlertDialogTitle>
            <AlertDialogDescription>
              This will pause the question "{selectedQuestion?.title}". 
              The question will be temporarily hidden from users and answering will be suspended.
              You can resume it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPause}>
              Pause Question
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Question Details Modal */}
      <EditQuestionDetailsModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        question={selectedQuestion}
        onSave={handleSaveQuestion}
      />
    </div>
  );
}
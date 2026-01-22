import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Clock, TrendingUp, Tag, Brain, Calendar, CheckCircle2, XCircle, Edit2, Save, X, Trash2 } from "lucide-react";
import { getCategoryColor } from "../lib/utils";
import { toast } from "sonner@2.0.3";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";

interface SynapseQuestion {
  id: number;
  liveAt: string;
  liveUntil: string;
  updatedAt: string | null;
  createdAt: string;
  question: string;
  extra: string;
  answerValue: number;
  answeredAt: string | null;
  markedAsCompleteAt: string | null;
  scheduledForCompletionAt: string | null;
  settlementAt: string | null;
  qstashMessageId: string | null;
  image: string;
}

interface SynapseApiResponse {
  success: boolean;
  data: {
    result: SynapseQuestion[];
  };
}

export function SynapseMarkets() {
  const [questions, setQuestions] = useState<SynapseQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<SynapseQuestion | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState<SynapseQuestion | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      // Direct call to external API (CORS now whitelisted for Vercel URL)
      const url = 'https://admin-launcher-api-synapse-dev.dolong-4e5.workers.dev/api/predictive/wager-questions?client=synapse&filterBy=All&page=1&limit=100';
      console.log('[Synapse] Fetching from:', url);

      const response = await fetch(url, {
        headers: {
          'x-api-key': 'TZ3eYpuOwDfm6CEyLJyLmN0y',
          'Content-Type': 'application/json',
        },
      });
      console.log('[Synapse] Response status:', response.status, response.statusText);
      console.log('[Synapse] Response content-type:', response.headers.get('content-type'));

      if (!response.ok) {
        const text = await response.text();
        console.error('[Synapse] Error response body:', text.substring(0, 500));
        throw new Error(`Failed to fetch questions: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      console.log('[Synapse] Response body (first 500 chars):', text.substring(0, 500));

      const data: SynapseApiResponse = JSON.parse(text);

      if (data.success && data.data && data.data.result) {
        setQuestions(data.data.result);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error loading Synapse questions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

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

  const handleQuestionClick = (question: SynapseQuestion) => {
    setSelectedQuestion(question);
    setEditedQuestion(question);
    setIsEditing(false);
    setModalOpen(true);
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing && selectedQuestion) {
      setEditedQuestion({ ...selectedQuestion });
    }
  };

  // Helper to convert ISO string to MySQL datetime format (YYYY-MM-DD HH:MM:SS)
  const toMySQLDateTime = (isoString: string | null): string | null => {
    if (!isoString) return null;
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const handleSave = async () => {
    if (!editedQuestion) return;

    setSaving(true);
    try {
      const response = await fetch('https://admin-launcher-api-synapse-dev.dolong-4e5.workers.dev/api/predictive/wager-questions', {
        method: 'POST',
        headers: {
          'x-api-key': 'TZ3eYpuOwDfm6CEyLJyLmN0y',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editedQuestion.id,
          question: editedQuestion.question,
          extra: editedQuestion.extra,
          liveUntil: toMySQLDateTime(editedQuestion.liveUntil),
          liveAt: toMySQLDateTime(editedQuestion.liveAt),
          settlementAt: toMySQLDateTime(editedQuestion.settlementAt),
          image: editedQuestion.image || "",
          client: "synapse"
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update question');
      }

      toast.success("Question updated successfully");

      // Update the question in the list
      setQuestions(questions.map(q =>
        q.id === editedQuestion.id ? editedQuestion : q
      ));

      setSelectedQuestion(editedQuestion);
      setIsEditing(false);

      // Reload questions to get fresh data
      await loadQuestions();
    } catch (err) {
      console.error('Error updating question:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update question');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedQuestion(selectedQuestion);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!selectedQuestion) return;

    if (!confirm(`Are you sure you want to delete this question: "${selectedQuestion.question}"?`)) {
      return;
    }

    try {
      const response = await fetch(`https://admin-launcher-api-synapse-dev.dolong-4e5.workers.dev/api/predictive/wager-questions?id=${selectedQuestion.id}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': 'TZ3eYpuOwDfm6CEyLJyLmN0y',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete question');
      }

      toast.success("Question deleted successfully");

      // Remove the question from the list
      setQuestions(questions.filter(q => q.id !== selectedQuestion.id));

      // Close the modal
      setModalOpen(false);
      setSelectedQuestion(null);
    } catch (err) {
      console.error('Error deleting question:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete question');
    }
  };

  // Helper to format datetime for input field
  const formatDateTimeForInput = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Synapse Markets</h1>
        <p className="text-muted-foreground">
          Live questions from Synapse prediction markets
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Questions</p>
                <p className="text-3xl font-bold">{questions.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active</p>
                <p className="text-3xl font-bold">
                  {questions.filter(q => !q.answeredAt).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Resolved</p>
                <p className="text-3xl font-bold">
                  {questions.filter(q => q.answeredAt).length}
                </p>
              </div>
              <Brain className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Questions List */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-2xl">Live Questions</h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading Synapse questions...</p>
          </div>
        ) : error ? (
          <Card className="p-12 text-center border-2 border-destructive">
            <Brain className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Questions</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
          </Card>
        ) : questions.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Questions Available</h3>
            <p className="text-muted-foreground">
              No Synapse questions found at this time
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {questions.map((question, index) => (
              <Card
                key={question.id}
                className="group hover:shadow-lg transition-all border-2 hover:border-primary/50 relative overflow-hidden cursor-pointer"
                onClick={() => handleQuestionClick(question)}
              >
                {/* Gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${getGradientClass(index)} opacity-0 group-hover:opacity-100 transition-opacity`} />

                <CardHeader className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <Badge
                      className={
                        question.answeredAt
                          ? "bg-gray-100 text-gray-700 border-gray-200"
                          : "bg-green-100 text-green-700 border-green-200"
                      }
                    >
                      {question.answeredAt ? "Resolved" : "Active"}
                    </Badge>
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      ID: {question.id}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                    {question.question}
                  </CardTitle>
                </CardHeader>

                <CardContent className="relative space-y-4">
                  {/* Extra description if available */}
                  {question.extra && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {question.extra}
                    </p>
                  )}

                  {/* Categories */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    <Badge
                      variant="outline"
                      className={getCategoryColor("Synapse")}
                    >
                      Synapse
                    </Badge>
                  </div>

                  {/* Meta info */}
                  <div className="flex flex-col gap-2 pt-2 border-t text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Live: {new Date(question.liveAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Until: {new Date(question.liveUntil).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {question.answeredAt && (
                      <div className="flex items-center gap-1">
                        <Brain className="h-3 w-3" />
                        <span>
                          Answered: {new Date(question.answeredAt).toLocaleDateString()}
                          {question.answerValue !== null && ` - Value: ${question.answerValue}`}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Question Details Modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => {
        setModalOpen(open);
        if (!open) {
          setIsEditing(false);
          setEditedQuestion(null);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedQuestion && editedQuestion && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge
                    className={
                      selectedQuestion.answeredAt
                        ? "bg-gray-100 text-gray-700 border-gray-200"
                        : "bg-green-100 text-green-700 border-green-200"
                    }
                  >
                    {selectedQuestion.answeredAt ? "Resolved" : "Active"}
                  </Badge>
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    ID: {selectedQuestion.id}
                  </Badge>
                </div>
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="question">Question</Label>
                      <Input
                        id="question"
                        value={editedQuestion.question}
                        onChange={(e) => setEditedQuestion({ ...editedQuestion, question: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="extra">Description</Label>
                      <Textarea
                        id="extra"
                        value={editedQuestion.extra}
                        onChange={(e) => setEditedQuestion({ ...editedQuestion, extra: e.target.value })}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <DialogTitle className="text-2xl">{selectedQuestion.question}</DialogTitle>
                    <DialogDescription>
                      {selectedQuestion.extra || "No additional description provided"}
                    </DialogDescription>
                  </>
                )}
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Image */}
                {isEditing ? (
                  <div>
                    <Label htmlFor="image">Image URL</Label>
                    <Input
                      id="image"
                      value={editedQuestion.image}
                      onChange={(e) => setEditedQuestion({ ...editedQuestion, image: e.target.value })}
                      className="mt-1"
                      placeholder="https://example.com/image.png"
                    />
                    {editedQuestion.image && (
                      <div className="mt-2 rounded-lg overflow-hidden border">
                        <img
                          src={editedQuestion.image}
                          alt="Question visual preview"
                          className="w-full h-auto"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  selectedQuestion.image && (
                    <div className="rounded-lg overflow-hidden border">
                      <img
                        src={selectedQuestion.image}
                        alt="Question visual"
                        className="w-full h-auto"
                      />
                    </div>
                  )
                )}

                {/* Categories */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Categories
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={getCategoryColor("Synapse")}
                    >
                      Synapse
                    </Badge>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Timeline
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Created</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedQuestion.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {isEditing ? (
                      <>
                        <div>
                          <Label htmlFor="liveAt">Goes Live</Label>
                          <Input
                            id="liveAt"
                            type="datetime-local"
                            value={formatDateTimeForInput(editedQuestion.liveAt)}
                            onChange={(e) => setEditedQuestion({
                              ...editedQuestion,
                              liveAt: new Date(e.target.value).toISOString()
                            })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="liveUntil">Expires</Label>
                          <Input
                            id="liveUntil"
                            type="datetime-local"
                            value={formatDateTimeForInput(editedQuestion.liveUntil)}
                            onChange={(e) => setEditedQuestion({
                              ...editedQuestion,
                              liveUntil: new Date(e.target.value).toISOString()
                            })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="settlementAt">Settlement Date (Optional)</Label>
                          <Input
                            id="settlementAt"
                            type="datetime-local"
                            value={editedQuestion.settlementAt ? formatDateTimeForInput(editedQuestion.settlementAt) : ''}
                            onChange={(e) => setEditedQuestion({
                              ...editedQuestion,
                              settlementAt: e.target.value ? new Date(e.target.value).toISOString() : null
                            })}
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Leave blank if not applicable</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start gap-3">
                          <Clock className="h-4 w-4 mt-0.5 text-green-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Goes Live</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(selectedQuestion.liveAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <XCircle className="h-4 w-4 mt-0.5 text-orange-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Expires</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(selectedQuestion.liveUntil).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                    {selectedQuestion.updatedAt && (
                      <div className="flex items-start gap-3">
                        <Clock className="h-4 w-4 mt-0.5 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Last Updated</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(selectedQuestion.updatedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedQuestion.answeredAt && (
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Answered</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(selectedQuestion.answeredAt).toLocaleString()}
                          </p>
                          {selectedQuestion.answerValue !== null && (
                            <p className="text-sm font-semibold text-green-700 mt-1">
                              Answer Value: {selectedQuestion.answerValue}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {selectedQuestion.markedAsCompleteAt && (
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Marked Complete</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(selectedQuestion.markedAsCompleteAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedQuestion.scheduledForCompletionAt && (
                      <div className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 mt-0.5 text-purple-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Scheduled for Completion</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(selectedQuestion.scheduledForCompletionAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedQuestion.settlementAt && (
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-indigo-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Settlement Date</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(selectedQuestion.settlementAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Technical Details */}
                {!isEditing && selectedQuestion.qstashMessageId && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Technical Details
                    </h3>
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs text-muted-foreground">QStash Message ID</p>
                      <p className="text-sm font-mono break-all">{selectedQuestion.qstashMessageId}</p>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={handleCancel} disabled={saving}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <>
                          <span className="mr-2">Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={handleEditToggle}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Question
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Question
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

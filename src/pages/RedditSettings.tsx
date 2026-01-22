import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/shared/PageHeader";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Plus, Trash2, MessageCircle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface RedditSubreddit {
  id: string;
  name: string;
  enabled: boolean;
  addedAt: Date;
  postsIngested: number;
  status: "active" | "error";
}

export function RedditSettings() {
  const navigate = useNavigate();
  const [subreddits, setSubreddits] = useState<RedditSubreddit[]>([
    {
      id: "1",
      name: "r/wallstreetbets",
      enabled: true,
      addedAt: new Date("2025-09-01T10:00:00Z"),
      postsIngested: 342,
      status: "active",
    },
    {
      id: "2",
      name: "r/cryptocurrency",
      enabled: true,
      addedAt: new Date("2025-09-01T10:00:00Z"),
      postsIngested: 198,
      status: "active",
    },
    {
      id: "3",
      name: "r/technology",
      enabled: true,
      addedAt: new Date("2025-09-15T14:00:00Z"),
      postsIngested: 156,
      status: "active",
    },
    {
      id: "4",
      name: "r/memes",
      enabled: false,
      addedAt: new Date("2025-10-01T08:00:00Z"),
      postsIngested: 45,
      status: "error",
    },
  ]);
  const [newSubreddit, setNewSubreddit] = useState("");

  const handleAddSubreddit = () => {
    if (!newSubreddit.trim()) {
      toast.error("Please enter a subreddit name");
      return;
    }

    const subredditName = newSubreddit.startsWith("r/") ? newSubreddit : `r/${newSubreddit}`;
    
    // Check for duplicates
    if (subreddits.some(sub => sub.name.toLowerCase() === subredditName.toLowerCase())) {
      toast.error("This subreddit is already being monitored");
      return;
    }

    const newSub: RedditSubreddit = {
      id: Date.now().toString(),
      name: subredditName,
      enabled: true,
      addedAt: new Date(),
      postsIngested: 0,
      status: "active",
    };

    setSubreddits([...subreddits, newSub]);
    setNewSubreddit("");
    toast.success(`Added ${subredditName} to monitoring`);
  };

  const handleToggleSubreddit = (id: string) => {
    setSubreddits(subreddits.map(sub => 
      sub.id === id ? { ...sub, enabled: !sub.enabled } : sub
    ));
    const subreddit = subreddits.find(sub => sub.id === id);
    toast.success(`${subreddit?.enabled ? "Disabled" : "Enabled"} ${subreddit?.name}`);
  };

  const handleRemoveSubreddit = (id: string) => {
    const subreddit = subreddits.find(sub => sub.id === id);
    setSubreddits(subreddits.filter(sub => sub.id !== id));
    toast.success(`Removed ${subreddit?.name} from monitoring`);
  };

  return (
    <div>
      <PageHeader
        title="Reddit Settings"
        description="Configure Reddit communities for trending content"
        actions={
          <Button variant="outline" onClick={() => navigate("/settings")}>
            Back to Sources
          </Button>
        }
      />

      {/* Add New Subreddit */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-orange-600" />
            Add Subreddit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="subreddit-name" className="sr-only">
                Subreddit Name
              </Label>
              <Input
                id="subreddit-name"
                placeholder="Enter subreddit (e.g., r/wallstreetbets)"
                value={newSubreddit}
                onChange={(e) => setNewSubreddit(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSubreddit()}
              />
            </div>
            <Button onClick={handleAddSubreddit}>
              <Plus className="h-4 w-4 mr-2" />
              Add Subreddit
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Add subreddits to monitor their posts for trending topics and meme analysis
          </p>
        </CardContent>
      </Card>

      {/* Subreddits List */}
      <Card>
        <CardHeader>
          <CardTitle>Monitored Subreddits ({subreddits.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {subreddits.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3>No subreddits configured</h3>
              <p className="text-muted-foreground mt-2">
                Add subreddits above to start monitoring
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Enabled</TableHead>
                  <TableHead>Subreddit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Posts Ingested</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subreddits.map((subreddit) => (
                  <TableRow key={subreddit.id}>
                    <TableCell>
                      <Checkbox
                        checked={subreddit.enabled}
                        onCheckedChange={() => handleToggleSubreddit(subreddit.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-orange-600" />
                        <span className="font-medium">{subreddit.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {subreddit.status === "active" ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Error
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{subreddit.postsIngested}</TableCell>
                    <TableCell>
                      {subreddit.addedAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSubreddit(subreddit.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
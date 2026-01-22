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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Plus, Trash2, Send, CheckCircle, XCircle, Info } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface TelegramGroup {
  id: string;
  name: string;
  username: string;
  enabled: boolean;
  addedAt: Date;
  messagesIngested: number;
  status: "active" | "error" | "pending";
}

export function TelegramSettings() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<TelegramGroup[]>([
    {
      id: "1",
      name: "Crypto Predictions",
      username: "@cryptopredictions",
      enabled: true,
      addedAt: new Date("2025-09-15T10:00:00Z"),
      messagesIngested: 1247,
      status: "active",
    },
    {
      id: "2",
      name: "Market Analysis Hub",
      username: "@marketanalysis",
      enabled: true,
      addedAt: new Date("2025-09-20T14:30:00Z"),
      messagesIngested: 892,
      status: "active",
    },
    {
      id: "3",
      name: "Trading Signals",
      username: "@tradingsignals",
      enabled: false,
      addedAt: new Date("2025-10-01T08:00:00Z"),
      messagesIngested: 0,
      status: "pending",
    },
  ]);

  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupUsername, setNewGroupUsername] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const handleAddGroup = () => {
    if (!newGroupName.trim() || !newGroupUsername.trim()) {
      toast.error("Please enter both group name and username");
      return;
    }

    const newGroup: TelegramGroup = {
      id: Date.now().toString(),
      name: newGroupName,
      username: newGroupUsername.startsWith("@") ? newGroupUsername : `@${newGroupUsername}`,
      enabled: true,
      addedAt: new Date(),
      messagesIngested: 0,
      status: "pending",
    };

    setGroups([...groups, newGroup]);
    setNewGroupName("");
    setNewGroupUsername("");
    setAddDialogOpen(false);
    toast.success("Telegram group added successfully! Don't forget to invite the bot.");
  };

  const handleToggleGroup = (id: string) => {
    setGroups(
      groups.map((group) =>
        group.id === id ? { ...group, enabled: !group.enabled } : group
      )
    );
    toast.success("Group status updated");
  };

  const handleRemoveGroup = (id: string) => {
    setGroups(groups.filter((group) => group.id !== id));
    toast.success("Group removed");
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Toronto",
    }).format(date);
  };

  return (
    <div>
      <PageHeader
        title="Telegram Settings"
        description="Configure Telegram groups for trending content"
        actions={
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white border-0">
                <Plus className="h-4 w-4 mr-2" />
                Add Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Telegram Group</DialogTitle>
                <DialogDescription>
                  Add a Telegram group to monitor for trending content
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="text-sm">
                        After adding a group, you must invite our bot to start monitoring:
                      </p>
                      <ol className="list-decimal list-inside text-sm space-y-1 ml-2">
                        <li>Open your Telegram group</li>
                        <li>Click on group name → Add Members</li>
                        <li>Search for <strong>@PredictionMarketBot</strong></li>
                        <li>Add the bot and grant it admin permissions</li>
                      </ol>
                    </div>
                  </AlertDescription>
                </Alert>
                <div>
                  <Label htmlFor="group-name">Group Name</Label>
                  <Input
                    id="group-name"
                    placeholder="e.g., Crypto Predictions"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="group-username">Group Username</Label>
                  <Input
                    id="group-username"
                    placeholder="e.g., @cryptopredictions"
                    value={newGroupUsername}
                    onChange={(e) => setNewGroupUsername(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddGroup}>Add Group</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="space-y-6">
        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-500" />
              Bot Setup Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4>How to connect your Telegram group:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
                <li>Add your group using the "Add Group" button above</li>
                <li>Open the Telegram group you want to monitor</li>
                <li>Click on the group name at the top</li>
                <li>Select "Add Members" or "Invite to Group"</li>
                <li>Search for <code className="px-2 py-1 bg-muted rounded">@PredictionMarketBot</code></li>
                <li>Add the bot to your group</li>
                <li>Make the bot an admin so it can read messages (required)</li>
                <li>The bot will start monitoring messages automatically</li>
              </ol>
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                The bot needs admin permissions to read group messages. Without admin access, 
                message ingestion will fail.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Groups Table */}
        <Card>
          <CardHeader>
            <CardTitle>Configured Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Messages Ingested</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Send className="h-8 w-8 mb-2" />
                        <p>No Telegram groups configured</p>
                        <p className="text-sm">
                          Add your first group to start monitoring content
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  groups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell>{group.name}</TableCell>
                      <TableCell>
                        <code className="text-sm">{group.username}</code>
                      </TableCell>
                      <TableCell>
                        {group.status === "active" && (
                          <Badge variant="outline" className="border-green-500/50 text-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                        {group.status === "error" && (
                          <Badge variant="outline" className="border-red-500/50 text-red-500">
                            <XCircle className="h-3 w-3 mr-1" />
                            Error
                          </Badge>
                        )}
                        {group.status === "pending" && (
                          <Badge variant="outline" className="border-amber-500/50 text-amber-500">
                            <Info className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{group.messagesIngested.toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(group.addedAt)}
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={group.enabled}
                          onCheckedChange={() => handleToggleGroup(group.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveGroup(group.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{groups.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Active Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl">
                {groups.filter((g) => g.enabled && g.status === "active").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl">
                {groups.reduce((sum, g) => sum + g.messagesIngested, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

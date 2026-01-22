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
import { Plus, Trash2, MessageSquare, CheckCircle, XCircle, Info } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface DiscordServer {
  id: string;
  name: string;
  serverId: string;
  channelName: string;
  enabled: boolean;
  addedAt: Date;
  messagesIngested: number;
  status: "active" | "error" | "pending";
}

export function DiscordSettings() {
  const navigate = useNavigate();
  const [servers, setServers] = useState<DiscordServer[]>([
    {
      id: "1",
      name: "Trading Community",
      serverId: "1234567890",
      channelName: "#predictions",
      enabled: true,
      addedAt: new Date("2025-09-10T10:00:00Z"),
      messagesIngested: 2341,
      status: "active",
    },
    {
      id: "2",
      name: "Crypto Talk",
      serverId: "9876543210",
      channelName: "#market-analysis",
      enabled: true,
      addedAt: new Date("2025-09-25T14:30:00Z"),
      messagesIngested: 1567,
      status: "active",
    },
    {
      id: "3",
      name: "Finance Hub",
      serverId: "5555555555",
      channelName: "#general",
      enabled: false,
      addedAt: new Date("2025-10-05T08:00:00Z"),
      messagesIngested: 0,
      status: "pending",
    },
  ]);

  const [newServerName, setNewServerName] = useState("");
  const [newServerId, setNewServerId] = useState("");
  const [newChannelName, setNewChannelName] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const handleAddServer = () => {
    if (!newServerName.trim() || !newServerId.trim() || !newChannelName.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const newServer: DiscordServer = {
      id: Date.now().toString(),
      name: newServerName,
      serverId: newServerId,
      channelName: newChannelName.startsWith("#") ? newChannelName : `#${newChannelName}`,
      enabled: true,
      addedAt: new Date(),
      messagesIngested: 0,
      status: "pending",
    };

    setServers([...servers, newServer]);
    setNewServerName("");
    setNewServerId("");
    setNewChannelName("");
    setAddDialogOpen(false);
    toast.success("Discord server added successfully! Don't forget to invite the bot.");
  };

  const handleToggleServer = (id: string) => {
    setServers(
      servers.map((server) =>
        server.id === id ? { ...server, enabled: !server.enabled } : server
      )
    );
    toast.success("Server status updated");
  };

  const handleRemoveServer = (id: string) => {
    setServers(servers.filter((server) => server.id !== id));
    toast.success("Server removed");
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
        title="Discord Settings"
        description="Configure Discord servers for trending content"
        actions={
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white border-0">
                <Plus className="h-4 w-4 mr-2" />
                Add Server
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Discord Server</DialogTitle>
                <DialogDescription>
                  Add a Discord server to monitor for trending content
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="text-sm">
                        After adding a server, you must invite our bot to start monitoring:
                      </p>
                      <ol className="list-decimal list-inside text-sm space-y-1 ml-2">
                        <li>Go to Server Settings → Integrations</li>
                        <li>Click "Add Bot" or use the invite link</li>
                        <li>Search for <strong>PredictionMarket</strong></li>
                        <li>Authorize the bot with Read Messages permission</li>
                      </ol>
                    </div>
                  </AlertDescription>
                </Alert>
                <div>
                  <Label htmlFor="server-name">Server Name</Label>
                  <Input
                    id="server-name"
                    placeholder="e.g., Trading Community"
                    value={newServerName}
                    onChange={(e) => setNewServerName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="server-id">Server ID</Label>
                  <Input
                    id="server-id"
                    placeholder="e.g., 1234567890"
                    value={newServerId}
                    onChange={(e) => setNewServerId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Right-click the server icon and select "Copy Server ID"
                  </p>
                </div>
                <div>
                  <Label htmlFor="channel-name">Channel Name</Label>
                  <Input
                    id="channel-name"
                    placeholder="e.g., #predictions or #general"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddServer}>Add Server</Button>
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
              <MessageSquare className="h-5 w-5 text-indigo-500" />
              Bot Setup Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4>How to connect your Discord server:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
                <li>Add your server using the "Add Server" button above</li>
                <li>Use this invite link to add the bot to your server:</li>
                <li className="ml-4">
                  <code className="px-2 py-1 bg-muted rounded text-xs">
                    https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=68608&scope=bot
                  </code>
                </li>
                <li>Select your Discord server from the dropdown</li>
                <li>Grant the bot "Read Messages" and "Read Message History" permissions</li>
                <li>The bot will start monitoring the specified channel automatically</li>
              </ol>
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                The bot needs "Read Messages" and "Read Message History" permissions. 
                Without these permissions, message ingestion will fail.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Servers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Configured Servers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Server Name</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Server ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Messages Ingested</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <MessageSquare className="h-8 w-8 mb-2" />
                        <p>No Discord servers configured</p>
                        <p className="text-sm">
                          Add your first server to start monitoring content
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  servers.map((server) => (
                    <TableRow key={server.id}>
                      <TableCell>{server.name}</TableCell>
                      <TableCell>
                        <code className="text-sm">{server.channelName}</code>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs text-muted-foreground">{server.serverId}</code>
                      </TableCell>
                      <TableCell>
                        {server.status === "active" && (
                          <Badge variant="outline" className="border-green-500/50 text-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                        {server.status === "error" && (
                          <Badge variant="outline" className="border-red-500/50 text-red-500">
                            <XCircle className="h-3 w-3 mr-1" />
                            Error
                          </Badge>
                        )}
                        {server.status === "pending" && (
                          <Badge variant="outline" className="border-amber-500/50 text-amber-500">
                            <Info className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{server.messagesIngested.toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(server.addedAt)}
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={server.enabled}
                          onCheckedChange={() => handleToggleServer(server.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveServer(server.id)}
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
              <CardTitle className="text-sm">Total Servers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{servers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Active Servers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl">
                {servers.filter((s) => s.enabled && s.status === "active").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl">
                {servers.reduce((sum, s) => sum + s.messagesIngested, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/shared/PageHeader";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Plus, Trash2, Twitter, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface TwitterAccount {
  id: string;
  username: string;
  addedAt: Date;
  status: "active" | "error";
  postsIngested: number;
}

export function TwitterSettings() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<TwitterAccount[]>([
    {
      id: "1",
      username: "@elonmusk",
      addedAt: new Date("2025-10-01T10:00:00Z"),
      status: "active",
      postsIngested: 247,
    },
    {
      id: "2",
      username: "@OpenAI",
      addedAt: new Date("2025-09-15T14:30:00Z"),
      status: "active",
      postsIngested: 189,
    },
    {
      id: "3",
      username: "@sama",
      addedAt: new Date("2025-10-05T08:00:00Z"),
      status: "error",
      postsIngested: 0,
    },
  ]);
  const [newAccount, setNewAccount] = useState("");

  const handleAddAccount = () => {
    if (!newAccount.trim()) {
      toast.error("Please enter a Twitter username");
      return;
    }

    const username = newAccount.startsWith("@") ? newAccount : `@${newAccount}`;
    
    // Check for duplicates
    if (accounts.some(acc => acc.username.toLowerCase() === username.toLowerCase())) {
      toast.error("This account is already being tracked");
      return;
    }

    const newAcc: TwitterAccount = {
      id: Date.now().toString(),
      username,
      addedAt: new Date(),
      status: "active",
      postsIngested: 0,
    };

    setAccounts([...accounts, newAcc]);
    setNewAccount("");
    toast.success(`Added ${username} to Twitter monitoring`);
  };

  const handleRemoveAccount = (id: string) => {
    const account = accounts.find(acc => acc.id === id);
    setAccounts(accounts.filter(acc => acc.id !== id));
    toast.success(`Removed ${account?.username} from monitoring`);
  };

  return (
    <div>
      <PageHeader
        title="Twitter Accounts Settings"
        description="Configure which Twitter accounts to monitor for content ingestion"
        actions={
          <Button variant="outline" onClick={() => navigate("/settings")}>
            Back to Settings
          </Button>
        }
      />

      {/* Add New Account */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Twitter className="h-5 w-5 text-blue-500" />
            Add Twitter Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="twitter-username" className="sr-only">
                Twitter Username
              </Label>
              <Input
                id="twitter-username"
                placeholder="Enter username (e.g., @username)"
                value={newAccount}
                onChange={(e) => setNewAccount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddAccount()}
                className="border-gray-300"
              />
            </div>
            <Button onClick={handleAddAccount}>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Add Twitter accounts to monitor their posts for AI question generation
          </p>
        </CardContent>
      </Card>

      {/* Accounts List */}
      <Card>
        <CardHeader>
          <CardTitle>Monitored Accounts ({accounts.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {accounts.length === 0 ? (
            <div className="text-center py-12">
              <Twitter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3>No accounts configured</h3>
              <p className="text-muted-foreground mt-2">
                Add Twitter accounts above to start monitoring
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Posts Ingested</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Twitter className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{account.username}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {account.status === "active" ? (
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
                    <TableCell>{account.postsIngested}</TableCell>
                    <TableCell>
                      {account.addedAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAccount(account.id)}
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
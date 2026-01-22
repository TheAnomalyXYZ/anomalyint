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
import { Plus, Trash2, Newspaper, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface NewsSource {
  id: string;
  name: string;
  url: string;
  trustLevel: "high" | "medium" | "low";
  enabled: boolean;
  addedAt: Date;
  articlesIngested: number;
}

export function NewsSettings() {
  const navigate = useNavigate();
  const [sources, setSources] = useState<NewsSource[]>([
    {
      id: "1",
      name: "TechCrunch",
      url: "https://techcrunch.com",
      trustLevel: "high",
      enabled: true,
      addedAt: new Date("2025-09-01T10:00:00Z"),
      articlesIngested: 156,
    },
    {
      id: "2",
      name: "The Verge",
      url: "https://theverge.com",
      trustLevel: "high",
      enabled: true,
      addedAt: new Date("2025-09-01T10:00:00Z"),
      articlesIngested: 203,
    },
    {
      id: "3",
      name: "CoinDesk",
      url: "https://coindesk.com",
      trustLevel: "medium",
      enabled: true,
      addedAt: new Date("2025-09-15T14:00:00Z"),
      articlesIngested: 89,
    },
    {
      id: "4",
      name: "Random Blog",
      url: "https://example.com",
      trustLevel: "low",
      enabled: false,
      addedAt: new Date("2025-10-01T08:00:00Z"),
      articlesIngested: 12,
    },
  ]);
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");

  const handleAddSource = () => {
    if (!newSourceName.trim() || !newSourceUrl.trim()) {
      toast.error("Please enter both source name and URL");
      return;
    }

    // Check for duplicates
    if (sources.some(src => src.url.toLowerCase() === newSourceUrl.toLowerCase())) {
      toast.error("This source is already configured");
      return;
    }

    const newSource: NewsSource = {
      id: Date.now().toString(),
      name: newSourceName,
      url: newSourceUrl,
      trustLevel: "medium",
      enabled: true,
      addedAt: new Date(),
      articlesIngested: 0,
    };

    setSources([...sources, newSource]);
    setNewSourceName("");
    setNewSourceUrl("");
    toast.success(`Added ${newSourceName} to news sources`);
  };

  const handleToggleSource = (id: string) => {
    setSources(sources.map(src => 
      src.id === id ? { ...src, enabled: !src.enabled } : src
    ));
    const source = sources.find(src => src.id === id);
    toast.success(`${source?.enabled ? "Disabled" : "Enabled"} ${source?.name}`);
  };

  const handleRemoveSource = (id: string) => {
    const source = sources.find(src => src.id === id);
    setSources(sources.filter(src => src.id !== id));
    toast.success(`Removed ${source?.name} from sources`);
  };

  const handleChangeTrustLevel = (id: string) => {
    setSources(sources.map(src => {
      if (src.id === id) {
        const newLevel = src.trustLevel === "high" ? "medium" : 
                        src.trustLevel === "medium" ? "low" : "high";
        return { ...src, trustLevel: newLevel };
      }
      return src;
    }));
  };

  return (
    <div>
      <PageHeader
        title="News Sources Settings"
        description="Configure which news outlets to monitor for content ingestion"
        actions={
          <Button variant="outline" onClick={() => navigate("/settings")}>
            Back to Sources
          </Button>
        }
      />

      {/* Add New Source */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-orange-500" />
            Add News Source
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="source-name">Source Name</Label>
              <Input
                id="source-name"
                placeholder="e.g., TechCrunch"
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="source-url">URL</Label>
              <Input
                id="source-url"
                placeholder="https://example.com"
                value={newSourceUrl}
                onChange={(e) => setNewSourceUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSource()}
              />
            </div>
          </div>
          <Button onClick={handleAddSource}>
            <Plus className="h-4 w-4 mr-2" />
            Add Source
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Add news outlets to monitor their articles for AI question generation
          </p>
        </CardContent>
      </Card>

      {/* Sources List */}
      <Card>
        <CardHeader>
          <CardTitle>Configured Sources ({sources.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {sources.length === 0 ? (
            <div className="text-center py-12">
              <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3>No sources configured</h3>
              <p className="text-muted-foreground mt-2">
                Add news sources above to start monitoring
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Enabled</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Trust Level</TableHead>
                  <TableHead>Articles Ingested</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell>
                      <Checkbox
                        checked={source.enabled}
                        onCheckedChange={() => handleToggleSource(source.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Newspaper className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className="font-medium">{source.name}</p>
                          <p className="text-sm text-muted-foreground">{source.url}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`cursor-pointer ${
                          source.trustLevel === "high"
                            ? "border-green-500 text-green-700"
                            : source.trustLevel === "medium"
                            ? "border-yellow-500 text-yellow-700"
                            : "border-red-500 text-red-700"
                        }`}
                        onClick={() => handleChangeTrustLevel(source.id)}
                      >
                        {source.trustLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>{source.articlesIngested}</TableCell>
                    <TableCell>
                      {source.addedAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSource(source.id)}
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

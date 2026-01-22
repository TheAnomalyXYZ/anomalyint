import { useState } from "react";
import { PageHeader } from "../components/shared/PageHeader";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Play, Settings as SettingsIcon, ExternalLink, CheckCircle, XCircle, Clock } from "lucide-react";
import { mockConnectors, mockSources } from "../lib/mock-data";
import { formatDateTime } from "../lib/utils";
import { toast } from "sonner@2.0.3";

interface SourcesMonitorProps {
  onNavigate: (page: string) => void;
}

export function SourcesMonitor({ onNavigate }: SourcesMonitorProps) {
  const [connectors] = useState(mockConnectors);
  const [sources] = useState(mockSources);

  const handleRunNow = (connectorId: string) => {
    toast.success("Connector run started");
  };

  const handleTestConnection = (connectorId: string) => {
    toast.success("Connection test successful");
  };

  const handleSettings = (connectorId: string) => {
    const connector = connectors.find(c => c.id === connectorId);
    if (!connector) return;
    
    // Route to specific settings page based on connector type
    switch (connector.type) {
      case 'twitter':
        onNavigate('sources/twitter');
        break;
      case 'news':
        onNavigate('sources/news');
        break;
      case 'meme':
        onNavigate('sources/reddit');
        break;
      default:
        onNavigate('settings');
    }
  };

  return (
    <div>
      <PageHeader
        title="Sources & Ingestion Monitor"
        description="See connector health, inspect ingested items, and manage sources"
        actions={
          <Button variant="outline" onClick={() => onNavigate("settings")}>
            <SettingsIcon className="h-4 w-4 mr-2" />
            Configure
          </Button>
        }
      />

      {/* Connector Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {connectors.map((connector) => (
          <Card key={connector.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-base">{connector.name}</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleSettings(connector.id)}
                    className="h-8 w-8"
                  >
                    <SettingsIcon className="h-4 w-4" />
                  </Button>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      connector.status === "healthy"
                        ? "bg-green-500"
                        : connector.status === "warning"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last run:</span>
                <span>
                  {connector.lastRun ? formatDateTime(connector.lastRun) : "Never"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items ingested:</span>
                <span>{connector.itemsIngested}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Failures:</span>
                <span
                  className={connector.failureCount > 0 ? "text-destructive" : ""}
                >
                  {connector.failureCount}
                </span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTestConnection(connector.id)}
                  className="flex-1"
                >
                  Test
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleRunNow(connector.id)}
                  className="flex-1"
                >
                  <Play className="h-3 w-3 mr-2" />
                  Run Now
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs for Runs and Items */}
      <Card>
        <Tabs defaultValue="items">
          <div className="border-b px-6 pt-6">
            <TabsList>
              <TabsTrigger value="items">Ingested Items</TabsTrigger>
              <TabsTrigger value="runs">Run History</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="items" className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Outlet</TableHead>
                  <TableHead>Trust Level</TableHead>
                  <TableHead>Fetched At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell>
                      <p className="max-w-md truncate">{source.title}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {source.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{source.outlet}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          source.trustLevel === "high"
                            ? "border-green-500 text-green-700"
                            : source.trustLevel === "medium"
                            ? "border-yellow-500 text-yellow-700"
                            : "border-red-500 text-red-700"
                        }
                      >
                        {source.trustLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(source.fetchedAt)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <a href={source.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="runs" className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Connector</TableHead>
                  <TableHead>Started At</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connectors.map((connector) => (
                  <TableRow key={connector.id}>
                    <TableCell>{connector.name}</TableCell>
                    <TableCell>
                      {connector.lastRun
                        ? formatDateTime(connector.lastRun)
                        : "-"}
                    </TableCell>
                    <TableCell>2m 34s</TableCell>
                    <TableCell>
                      {connector.status === "healthy" ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Success
                        </Badge>
                      ) : connector.status === "warning" ? (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                          <Clock className="h-3 w-3 mr-1" />
                          Partial
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{connector.itemsIngested}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
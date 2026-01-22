import { useState } from "react";
import { PageHeader } from "../components/shared/PageHeader";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
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
import { Badge } from "../components/ui/badge";
import { Download, Search } from "lucide-react";
import { mockAnswers } from "../lib/mock-data";
import { Answer } from "../lib/types";
import { formatDateTime } from "../lib/utils";
import { toast } from "sonner@2.0.3";

export function AnswersExplorer() {
  const [answers] = useState<Answer[]>(mockAnswers);
  const [searchQuery, setSearchQuery] = useState("");
  const [choiceFilter, setChoiceFilter] = useState<string>("all");

  const filteredAnswers = answers.filter((a) => {
    const matchesSearch =
      searchQuery === "" ||
      a.questionTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChoice = choiceFilter === "all" || a.choice === choiceFilter;
    return matchesSearch && matchesChoice;
  });

  const handleExport = () => {
    toast.success("Exporting answers to CSV...");
  };

  return (
    <div>
      <PageHeader
        title="Market History"
        description="Inspect participation, filter, and export market responses"
        actions={
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
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
                placeholder="Search by question..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={choiceFilter} onValueChange={setChoiceFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Choice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Choices</SelectItem>
                <SelectItem value="YES">YES</SelectItem>
                <SelectItem value="NO">NO</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">Total Answers</p>
            <p className="text-2xl mt-2">{filteredAnswers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">YES Votes</p>
            <p className="text-2xl mt-2">
              {filteredAnswers.filter((a) => a.choice === "YES").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">NO Votes</p>
            <p className="text-2xl mt-2">
              {filteredAnswers.filter((a) => a.choice === "NO").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Answers Table */}
      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Choice</TableHead>
                <TableHead>Closed At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAnswers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No answers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAnswers.map((answer) => (
                  <TableRow key={answer.id}>
                    <TableCell>
                      <p className="max-w-md truncate">{answer.questionTitle}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={answer.choice === "YES" ? "default" : "secondary"}
                      >
                        {answer.choice}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(answer.closedAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

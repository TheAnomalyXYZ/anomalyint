import { PageHeader } from "../components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { TrendingUp, TrendingDown, Users, FileQuestion, Sparkles, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useState } from "react";

export function Reports() {
  const [timeRange, setTimeRange] = useState("7d");

  // Mock data for Active Questions over time
  const activeQuestionsData = [
    { date: "Oct 16", count: 18 },
    { date: "Oct 17", count: 21 },
    { date: "Oct 18", count: 19 },
    { date: "Oct 19", count: 23 },
    { date: "Oct 20", count: 25 },
    { date: "Oct 21", count: 27 },
    { date: "Oct 22", count: 23 },
  ];

  // Mock data for Total Participants over time
  const participantsData = [
    { date: "Oct 16", count: 342 },
    { date: "Oct 17", count: 389 },
    { date: "Oct 18", count: 412 },
    { date: "Oct 19", count: 445 },
    { date: "Oct 20", count: 478 },
    { date: "Oct 21", count: 502 },
    { date: "Oct 22", count: 531 },
  ];

  // Mock data for Suggested Questions over time
  const suggestedQuestionsData = [
    { date: "Oct 16", count: 12 },
    { date: "Oct 17", count: 15 },
    { date: "Oct 18", count: 18 },
    { date: "Oct 19", count: 14 },
    { date: "Oct 20", count: 22 },
    { date: "Oct 21", count: 19 },
    { date: "Oct 22", count: 25 },
  ];

  // Mock data for Questions by Category
  const questionsByCategoryData = [
    { name: "Technology", value: 45 },
    { name: "Finance", value: 32 },
    { name: "Crypto", value: 28 },
    { name: "Politics", value: 18 },
    { name: "Sports", value: 15 },
    { name: "Other", value: 12 },
  ];

  // Mock data for Participant Activity
  const participantActivityData = [
    { hour: "00:00", participants: 45 },
    { hour: "04:00", participants: 32 },
    { hour: "08:00", participants: 98 },
    { hour: "12:00", participants: 156 },
    { hour: "16:00", participants: 187 },
    { hour: "20:00", participants: 142 },
  ];

  const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#6366f1'];

  const currentMetrics = {
    activeQuestions: { value: 23, change: 12.5, trend: "up" },
    totalParticipants: { value: 531, change: 8.3, trend: "up" },
    suggestedQuestions: { value: 25, change: -4.2, trend: "down" },
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Analytics and insights for your prediction markets"
        actions={
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Key Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        {/* Active Questions */}
        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active Questions</CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/10">
              <FileQuestion className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl mb-1">{currentMetrics.activeQuestions.value}</div>
            <div className="flex items-center gap-2 text-sm">
              {currentMetrics.activeQuestions.trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={currentMetrics.activeQuestions.trend === "up" ? "text-green-500" : "text-red-500"}>
                {currentMetrics.activeQuestions.change}%
              </span>
              <span className="text-muted-foreground">from last period</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Participants */}
        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Participants</CardTitle>
            <div className="p-2 rounded-lg bg-pink-500/10">
              <Users className="h-4 w-4 text-pink-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl mb-1">{currentMetrics.totalParticipants.value.toLocaleString()}</div>
            <div className="flex items-center gap-2 text-sm">
              {currentMetrics.totalParticipants.trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={currentMetrics.totalParticipants.trend === "up" ? "text-green-500" : "text-red-500"}>
                {currentMetrics.totalParticipants.change}%
              </span>
              <span className="text-muted-foreground">from last period</span>
            </div>
          </CardContent>
        </Card>

        {/* Suggested Questions */}
        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Suggested Questions</CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl mb-1">{currentMetrics.suggestedQuestions.value}</div>
            <div className="flex items-center gap-2 text-sm">
              {currentMetrics.suggestedQuestions.trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={currentMetrics.suggestedQuestions.trend === "up" ? "text-green-500" : "text-red-500"}>
                {Math.abs(currentMetrics.suggestedQuestions.change)}%
              </span>
              <span className="text-muted-foreground">from last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Active Questions Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Active Questions Trend</CardTitle>
                <CardDescription>Number of active questions over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={activeQuestionsData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={{ fill: "#8b5cf6" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Participants Growth */}
            <Card>
              <CardHeader>
                <CardTitle>Participant Growth</CardTitle>
                <CardDescription>Total unique participants over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={participantsData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#ec4899" 
                      strokeWidth={2}
                      dot={{ fill: "#ec4899" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Questions by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Questions by Category</CardTitle>
                <CardDescription>Distribution across different categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={questionsByCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {questionsByCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* AI Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle>AI Suggestions Generated</CardTitle>
                <CardDescription>New suggestions created by AI</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={suggestedQuestionsData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Question Lifecycle</CardTitle>
                <CardDescription>Questions by current state</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { state: "Draft", count: 12 },
                      { state: "Review", count: 5 },
                      { state: "Published", count: 23 },
                      { state: "Awaiting Resolution", count: 8 },
                      { state: "Resolved", count: 147 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="state" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Questions by Category</CardTitle>
                <CardDescription>Top performing categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={questionsByCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {questionsByCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Active Questions Over Time</CardTitle>
              <CardDescription>Daily trend of active questions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={activeQuestionsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={{ fill: "#8b5cf6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participants" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Participant Growth</CardTitle>
                <CardDescription>Cumulative participant count</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={participantsData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#ec4899" 
                      strokeWidth={2}
                      dot={{ fill: "#ec4899" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity by Time</CardTitle>
                <CardDescription>Participant activity throughout the day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={participantActivityData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="hour" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="participants" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Engagement Metrics</CardTitle>
              <CardDescription>Key participation statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Avg. Answers per User</p>
                  <p className="text-2xl">4.8</p>
                  <div className="flex items-center gap-1 text-sm text-green-500">
                    <TrendingUp className="h-4 w-4" />
                    <span>12%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Daily Active Users</p>
                  <p className="text-2xl">234</p>
                  <div className="flex items-center gap-1 text-sm text-green-500">
                    <TrendingUp className="h-4 w-4" />
                    <span>8%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Avg. Confidence</p>
                  <p className="text-2xl">72%</p>
                  <div className="flex items-center gap-1 text-sm text-red-500">
                    <TrendingDown className="h-4 w-4" />
                    <span>3%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Return Rate</p>
                  <p className="text-2xl">68%</p>
                  <div className="flex items-center gap-1 text-sm text-green-500">
                    <TrendingUp className="h-4 w-4" />
                    <span>5%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

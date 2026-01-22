import { PageHeader } from "../components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Twitter, Newspaper, MessageSquare, Send, Hash, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Settings() {
  const navigate = useNavigate();
  const settingsSections = [
    {
      id: 'twitter',
      title: 'Twitter Accounts Settings',
      description: 'Manage Twitter accounts for sourcing trending content and questions',
      icon: Twitter,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      route: 'sources/twitter',
    },
    {
      id: 'news',
      title: 'News Sources Settings',
      description: 'Configure news outlets and RSS feeds for content aggregation',
      icon: Newspaper,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      route: 'sources/news',
    },
    {
      id: 'telegram',
      title: 'Telegram Settings',
      description: 'Monitor Telegram groups for trending discussions and predictions',
      icon: Send,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      route: 'sources/telegram',
    },
    {
      id: 'discord',
      title: 'Discord Settings',
      description: 'Connect Discord servers for community insights and trends',
      icon: Hash,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      route: 'sources/discord',
    },
    {
      id: 'reddit',
      title: 'Reddit Settings',
      description: 'Set up Reddit communities and feeds for trending discussions',
      icon: MessageSquare,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      route: 'sources/reddit',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure data sources and system preferences"
      />

      <div className="space-y-6">
        <div>
          <h2 className="mb-4">Sources</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {settingsSections.map((section) => {
              const Icon = section.icon;
              return (
                <Card
                  key={section.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                  onClick={() => navigate(`/${section.route}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-lg ${section.bgColor}`}>
                        <Icon className={`h-6 w-6 ${section.color}`} />
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <CardTitle className="mt-4">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/${section.route}`);
                      }}
                    >
                      Configure
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
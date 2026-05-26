import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ArrowLeft, ExternalLink, Users, MessageSquare, Calendar, RefreshCw, Gamepad2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

interface WeeklyMetric {
  measured_on: string;
  users: number | null;
  contributions: number | null;
}

interface TrackedGame {
  id: string;
  game_name: string;
  description: string | null;
  sub_address: string | null;
  created_date: string | null;
  last_update: string | null;
  listings: string[];
  genre: string | null;
  moderators: string[];
  screenshots: string[];
  screenshots_full: string[];
  tracked_game_weekly_metrics: WeeklyMetric[];
}

const numberFmt = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("en-US");

const compactFmt = (n: number) =>
  Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);

const dateFmt = (iso: string | null) =>
  !iso ? "—" : new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Toronto" });

interface RedditGameDetailProps {
  basePath?: string;
}

export function RedditGameDetail({ basePath = "/reddit-games" }: RedditGameDetailProps = {}) {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<TrackedGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("tracked_games")
        .select("*, tracked_game_weekly_metrics(measured_on, users, contributions)")
        .eq("id", id)
        .single();
      if (error) {
        console.error("Failed to load game:", error);
        setGame(null);
      } else {
        setGame(data as TrackedGame);
      }
      setLoading(false);
    })();
  }, [id]);

  const weeklySeries = useMemo(() => {
    if (!game) return [];
    return [...(game.tracked_game_weekly_metrics ?? [])]
      .sort((a, b) => (a.measured_on < b.measured_on ? -1 : 1))
      .map(m => ({ date: m.measured_on, users: m.users ?? 0, contributions: m.contributions ?? 0 }));
  }, [game]);

  const latest = weeklySeries[weeklySeries.length - 1];

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  if (!game) {
    return (
      <div className="p-6 space-y-4">
        <Link to={basePath} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <p>Game not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Link
            to={basePath}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> All Reddit games
          </Link>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Gamepad2 className="h-6 w-6" /> {game.game_name}
          </h1>
          <div className="flex flex-wrap gap-2 pt-1">
            {game.listings?.map(l => (
              <Badge
                key={l}
                variant={l === "popular" ? "default" : "secondary"}
                className={l === "featured" ? "bg-amber-500 hover:bg-amber-500 text-white border-transparent" : ""}
              >
                {l}
              </Badge>
            ))}
            {game.genre && <Badge variant="outline">{game.genre}</Badge>}
          </div>
        </div>
        {game.sub_address && (
          <Button asChild variant="outline">
            <a href={game.sub_address} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">
              Open subreddit <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Weekly Users</CardDescription>
            <CardTitle className="text-3xl">{numberFmt(latest?.users)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> Contributions</CardDescription>
            <CardTitle className="text-3xl">{numberFmt(latest?.contributions)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Subreddit Created</CardDescription>
            <CardTitle className="text-lg">{dateFmt(game.created_date)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="inline-flex items-center gap-1"><RefreshCw className="h-3.5 w-3.5" /> Last Update</CardDescription>
            <CardTitle className="text-lg">{dateFmt(game.last_update)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
              {game.description || "No description yet."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Moderators</CardTitle>
          </CardHeader>
          <CardContent>
            {game.moderators?.length ? (
              <ul className="flex flex-wrap gap-2">
                {game.moderators.map(m => (
                  <li key={m}>
                    <a
                      href={`https://www.reddit.com/user/${m.replace(/^u\//, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm bg-muted px-3 py-1 rounded-full hover:bg-muted/70"
                    >
                      {m}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">None listed.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Screenshots</CardTitle>
          <CardDescription>
            {game.screenshots?.length
              ? `${game.screenshots.length} image${game.screenshots.length > 1 ? "s" : ""} stored in R2.`
              : "No screenshots yet — add some from the edit modal on the list page."}
          </CardDescription>
        </CardHeader>
        {game.screenshots?.length > 0 && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {game.screenshots.map((cropUrl, i) => {
                const fullUrl = game.screenshots_full?.[i] ?? cropUrl;
                return (
                  <button
                    key={cropUrl}
                    type="button"
                    onClick={() => setLightbox(fullUrl)}
                    className="block overflow-hidden rounded border hover:ring-2 hover:ring-primary transition focus:outline-none focus:ring-2 focus:ring-primary"
                    title="Click to view full subreddit page"
                  >
                    <img src={cropUrl} alt="screenshot" className="w-full h-56 object-cover" />
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              Click a thumbnail to view the full subreddit page.
            </p>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity Over Time</CardTitle>
          <CardDescription>Rolling 7-day users and contributions per measurement.</CardDescription>
        </CardHeader>
        <CardContent>
          {weeklySeries.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
              No weekly snapshots yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={weeklySeries} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v: number) => compactFmt(v)} />
                <Tooltip formatter={(v: number) => numberFmt(v)} />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="contributions" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6 cursor-zoom-out"
        >
          <img src={lightbox} alt="screenshot" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
}

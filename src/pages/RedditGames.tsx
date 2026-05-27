import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Gamepad2, ExternalLink, Search, Users, MessageSquare, Pencil, X, ArrowUp, ArrowDown, ArrowUpDown, TrendingUp, Trophy, Rocket, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../components/ui/hover-card";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, LabelList } from "recharts";

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
  genres: string[];
  moderators: string[];
  screenshots: string[];
  screenshots_full: string[];
  tracked_game_weekly_metrics: WeeklyMetric[];
}

// A game's effective genre list (new array, falling back to legacy single field).
const gameGenres = (g: { genres?: string[]; genre?: string | null }): string[] => {
  if (g.genres?.length) return g.genres;
  return g.genre ? [g.genre] : [];
};

type GenreSortKey = "genre" | "curr" | "prev" | "delta" | "pct";

type ListingFilter = "all" | "popular" | "new" | "featured";
type SortKey = "name" | "users" | "contributions";
type SortDir = "asc" | "desc";

const GENRES = [
  "Arcade", "Word", "Pet", "Action", "Puzzle",
  "Number", "Daily", "Other", "Strategy",
  "Creative", "Guessing", "Simulation", "Card",
  "Trivia", "Board",
];

const numberFmt = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("en-US");

const compactFmt = (n: number) =>
  Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);

const dateFmt = (iso: string | null) =>
  !iso ? "—" : new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Toronto" });

function normalizeSubAddress(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/+$/, "");
  const slug = trimmed
    .replace(/^https?:\/\/(www\.)?reddit\.com\//i, "")
    .replace(/^\/+/, "")
    .replace(/^r\//i, "")
    .replace(/\/+$/, "");
  return slug ? `https://www.reddit.com/r/${slug}` : null;
}

function latestMetric(metrics: WeeklyMetric[]): WeeklyMetric | null {
  if (!metrics?.length) return null;
  return [...metrics].sort((a, b) => (a.measured_on < b.measured_on ? 1 : -1))[0];
}

// Day-over-day: the reading immediately before the latest one.
function previousMetric(metrics: WeeklyMetric[]): WeeklyMetric | null {
  if (!metrics || metrics.length < 2) return null;
  const sorted = [...metrics].sort((a, b) => (a.measured_on < b.measured_on ? 1 : -1));
  return sorted[1] ?? null;
}

interface RedditGamesProps {
  basePath?: string;
}

export function RedditGames({ basePath = "/reddit-games" }: RedditGamesProps = {}) {
  const navigate = useNavigate();
  const [games, setGames] = useState<TrackedGame[]>([]);
  const [genreSortKey, setGenreSortKey] = useState<GenreSortKey>("delta");
  const [genreSortDir, setGenreSortDir] = useState<SortDir>("desc");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [listingFilter, setListingFilter] = useState<ListingFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [editing, setEditing] = useState<TrackedGame | null>(null);
  const [draftSub, setDraftSub] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftGenres, setDraftGenres] = useState<string[]>([]);
  const [draftMods, setDraftMods] = useState<string[]>([]);
  const [newMod, setNewMod] = useState("");
  const [draftScreenshots, setDraftScreenshots] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

  const openEdit = (game: TrackedGame) => {
    setEditing(game);
    setDraftSub(game.sub_address ?? "");
    setDraftGenres(gameGenres(game));
    setDraftDescription(game.description ?? "");
    setDraftMods(game.moderators ?? []);
    setDraftScreenshots(game.screenshots ?? []);
    setNewMod("");
  };

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "game";

  const onUploadScreenshots = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !editing) return;
    setUploading(true);
    const prefix = `reddit-games/${slugify(editing.game_name)}/screenshots`;
    const added: string[] = [];
    for (const file of Array.from(fileList)) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("prefix", prefix);
        const res = await fetch("/api/upload-image", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok || !json.url) {
          toast.error(`Failed: ${file.name} — ${json.error ?? res.statusText}`);
          continue;
        }
        added.push(json.url);
      } catch (e: any) {
        toast.error(`Failed: ${file.name} — ${e?.message ?? "Upload error"}`);
      }
    }
    if (added.length) {
      setDraftScreenshots(prev => [...prev, ...added]);
      toast.success(`Uploaded ${added.length} screenshot${added.length > 1 ? "s" : ""}`);
    }
    setUploading(false);
  };

  const removeScreenshot = (url: string) =>
    setDraftScreenshots(prev => prev.filter(s => s !== url));

  const closeEdit = () => {
    setEditing(null);
    setNewMod("");
  };

  const addMod = () => {
    const m = newMod.trim();
    if (!m) return;
    if (draftMods.includes(m)) {
      toast.error("Moderator already added");
      return;
    }
    setDraftMods([...draftMods, m]);
    setNewMod("");
  };

  const removeMod = (m: string) => setDraftMods(draftMods.filter(x => x !== m));

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    const updates = {
      sub_address: normalizeSubAddress(draftSub),
      genres: draftGenres,
      genre: draftGenres[0] ?? null,
      description: draftDescription.trim() || null,
      moderators: draftMods,
      screenshots: draftScreenshots,
      last_update: new Date().toISOString(),
    };
    const { error } = await supabase.from("tracked_games").update(updates).eq("id", editing.id);
    setSaving(false);
    if (error) {
      console.error("Failed to update game:", error);
      toast.error("Failed to save changes");
      return;
    }
    setGames(games.map(g => (g.id === editing.id ? { ...g, ...updates } : g)));
    toast.success(`Updated ${editing.game_name}`);
    closeEdit();
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("tracked_games")
        .select("*, tracked_game_weekly_metrics(measured_on, users, contributions)")
        .order("game_name", { ascending: true });
      if (error) {
        console.error("Failed to load tracked games:", error);
        setGames([]);
      } else {
        setGames((data ?? []) as TrackedGame[]);
      }
      setLoading(false);
    })();
  }, []);

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = games.filter(g => {
      if (listingFilter !== "all" && !g.listings?.includes(listingFilter)) return false;
      if (!q) return true;
      return (
        g.game_name.toLowerCase().includes(q) ||
        gameGenres(g).some(genre => genre.toLowerCase().includes(q)) ||
        g.sub_address?.toLowerCase().includes(q)
      );
    });
    const dir = sortDir === "asc" ? 1 : -1;
    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === "name") return a.game_name.localeCompare(b.game_name) * dir;
      const av = latestMetric(a.tracked_game_weekly_metrics)?.[sortKey] ?? null;
      const bv = latestMetric(b.tracked_game_weekly_metrics)?.[sortKey] ?? null;
      // Nulls always last regardless of direction
      if (av == null && bv == null) return a.game_name.localeCompare(b.game_name);
      if (av == null) return 1;
      if (bv == null) return -1;
      return (av - bv) * dir;
    });
    return sorted;
  }, [games, search, listingFilter, sortKey, sortDir]);

  const stats = useMemo(() => {
    const popular = games.filter(g => g.listings?.includes("popular")).length;
    const fresh = games.filter(g => g.listings?.includes("new")).length;
    const featured = games.filter(g => g.listings?.includes("featured")).length;

    // Distinct measurement dates across all games (desc).
    const allDates = new Set<string>();
    for (const g of games) for (const m of g.tracked_game_weekly_metrics ?? []) allDates.add(m.measured_on);
    const sortedDates = [...allDates].sort((a, b) => (a < b ? 1 : -1));
    const latestDate = sortedDates[0] ?? null;
    const prevDate = sortedDates[1] ?? null;

    // Snapshot at date X = sum of each game's most recent reading whose measured_on <= X.
    const snapshotAt = (date: string | null) => {
      if (!date) return 0;
      let sum = 0;
      for (const g of games) {
        const eligible = (g.tracked_game_weekly_metrics ?? [])
          .filter(m => m.users != null && m.measured_on <= date)
          .sort((a, b) => (a.measured_on < b.measured_on ? 1 : -1));
        if (eligible[0]?.users) sum += eligible[0].users;
      }
      return sum;
    };

    const totalUsers = snapshotAt(latestDate);
    const prevTotal = snapshotAt(prevDate);
    const dailyDelta = prevDate ? totalUsers - prevTotal : null;
    const dailyPct = prevDate && prevTotal > 0 ? (dailyDelta! / prevTotal) * 100 : null;

    return { popular, fresh, featured, totalUsers, dailyDelta, dailyPct, latestDate, prevDate };
  }, [games]);

  const genreCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    GENRES.forEach(g => (counts[g] = 0));
    for (const game of games) {
      for (const raw of gameGenres(game)) {
        const match = GENRES.find(g => g.toLowerCase() === raw.toLowerCase());
        if (match) counts[match] += 1;
      }
    }
    return counts;
  }, [games]);

  const weeklyAdoption = useMemo(() => {
    // Aggregate users across all games per measurement date.
    const byDate = new Map<string, number>();
    for (const game of games) {
      for (const m of game.tracked_game_weekly_metrics ?? []) {
        if (m.users == null) continue;
        byDate.set(m.measured_on, (byDate.get(m.measured_on) ?? 0) + m.users);
      }
    }
    return [...byDate.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([date, users]) => ({ date, users }));
  }, [games]);

  const firstScreenshotByGameId = useMemo(() => {
    const m = new Map<string, string>();
    for (const g of games) {
      if (g.screenshots?.[0]) m.set(g.id, g.screenshots[0]);
    }
    return m;
  }, [games]);

  const newHotGames = useMemo(() => {
    const ranked = games
      .map(g => ({ game: g, users: latestMetric(g.tracked_game_weekly_metrics)?.users ?? 0 }))
      .filter(x => x.game.screenshots?.[0])
      .sort((a, b) => b.users - a.users)
      .slice(0, 10);
    // Deterministic Pinterest-style sizing per game id
    const heights = [180, 220, 160, 260, 200, 240, 180, 220, 160, 200];
    return ranked.map((r, i) => ({
      gameId: r.game.id,
      gameName: r.game.game_name,
      url: r.game.screenshots[0],
      height: heights[i % heights.length],
      tilt: ((r.game.id.charCodeAt(0) + i) % 5) - 2,
      users: r.users,
    }));
  }, [games]);

  const allScreenshots = useMemo(() => {
    const items: { url: string; gameId: string; gameName: string }[] = [];
    for (const g of games) {
      const first = g.screenshots?.[0];
      if (first) items.push({ url: first, gameId: g.id, gameName: g.game_name });
    }
    return items;
  }, [games]);

  const insights = useMemo(() => {
    if (games.length === 0) return [];
    const out: { title: string; body: string }[] = [];

    // 1. Platform-wide engagement (latest contributions ÷ latest users).
    let sumUsers = 0, sumContrib = 0;
    for (const g of games) {
      const latest = latestMetric(g.tracked_game_weekly_metrics);
      if (latest?.users) sumUsers += latest.users;
      if (latest?.contributions) sumContrib += latest.contributions;
    }
    if (sumUsers > 0) {
      const pct = Math.round((sumContrib / sumUsers) * 100);
      out.push({
        title: "Engagement runs far ahead of mobile",
        body: `The average tracked game converts ${pct}% of its weekly players into active contributors — four to eight times the 5–10% typical of mobile free-to-play. On Reddit, playing and posting are the same action.`,
      });
    }

    // 2. Newcomer ratio — games created this calendar year.
    const year = new Date().getFullYear();
    const datedGames = games.filter(g => g.created_date);
    const newThisYear = datedGames.filter(g => new Date(g.created_date!).getFullYear() === year).length;
    if (datedGames.length > 0 && newThisYear > 0) {
      out.push({
        title: "No early-mover penalty yet",
        body: `${newThisYear} of the ${games.length} games we track launched in ${year} alone — a large share of the ecosystem is only months old. Devvit is still bootstrapping its catalog. A studio that ships 2–3 hits in the next 12 months is locked in for the cycle.`,
      });
    }

    // 3. Breakout traction — top games by users, with time-to-traction + a high-engagement standout.
    const withUsers = games
      .map(g => {
        const latest = latestMetric(g.tracked_game_weekly_metrics);
        const users = latest?.users ?? 0;
        const contributions = latest?.contributions ?? 0;
        const months = g.created_date
          ? Math.max(1, Math.round((Date.now() - new Date(g.created_date).getTime()) / (1000 * 60 * 60 * 24 * 30)))
          : null;
        const eng = users > 0 ? Math.round((contributions / users) * 100) : 0;
        return { name: g.game_name, users, months, eng };
      })
      .filter(x => x.users > 0);

    const topByUsers = [...withUsers].sort((a, b) => b.users - a.users).slice(0, 2);
    const topEng = [...withUsers].filter(x => x.users >= 20000).sort((a, b) => b.eng - a.eng)[0];
    if (topByUsers.length) {
      const parts = topByUsers.map(g =>
        `${g.name}: ${compactFmt(g.users)} weekly users${g.months ? ` in ${g.months} months` : ""}`
      );
      let body = parts.join(". ") + ".";
      if (topEng && !topByUsers.some(t => t.name === topEng.name)) {
        body += ` ${topEng.name} runs at ${topEng.eng}% engagement — players posting straight back into the feed.`;
      }
      out.push({ title: "Solo developers are hitting six figures", body });
    }

    return out;
  }, [games]);

  const topGames = useMemo(() => {
    return games
      .map(g => ({ game: g, latest: latestMetric(g.tracked_game_weekly_metrics) }))
      .filter(x => x.latest?.users != null)
      .sort((a, b) => (b.latest!.users! - a.latest!.users!))
      .slice(0, 10);
  }, [games]);

  const growth = useMemo(() => {
    // For each game, compare the latest reading vs the immediately-preceding reading (day-over-day).
    const perGame = games
      .map(g => {
        const readings = (g.tracked_game_weekly_metrics ?? []).filter(m => m.users != null);
        const curr = latestMetric(readings);
        const prev = previousMetric(readings);
        if (!curr || !prev) return null;
        const delta = curr.users! - prev.users!;
        const pct = prev.users! === 0 ? null : (delta / prev.users!) * 100;
        return { game: g, curr: curr.users!, prev: prev.users!, delta, pct };
      })
      .filter((x): x is { game: TrackedGame; curr: number; prev: number; delta: number; pct: number | null } => !!x);
    // Top growing games: sort by absolute delta (positive first), tie-break by pct
    const topGames = [...perGame].sort((a, b) => b.delta - a.delta).slice(0, 10);
    const decliningGames = [...perGame].filter(x => x.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 10);

    // Aggregate per genre using known GENRES (case-insensitive). A game counts
    // toward every genre it belongs to.
    const genreAgg = new Map<string, { curr: number; prev: number }>();
    for (const row of perGame) {
      for (const raw of gameGenres(row.game)) {
        const matched = GENRES.find(g => g.toLowerCase() === raw.toLowerCase());
        if (!matched) continue;
        const acc = genreAgg.get(matched) ?? { curr: 0, prev: 0 };
        acc.curr += row.curr;
        acc.prev += row.prev;
        genreAgg.set(matched, acc);
      }
    }
    const topGenres = [...genreAgg.entries()]
      .map(([genre, { curr, prev }]) => ({
        genre,
        curr,
        prev,
        delta: curr - prev,
        pct: prev === 0 ? null : ((curr - prev) / prev) * 100,
      }))
      .sort((a, b) => b.delta - a.delta);

    return { topGames, decliningGames, topGenres };
  }, [games]);

  const sortedTopGenres = useMemo(() => {
    const dir = genreSortDir === "asc" ? 1 : -1;
    return [...growth.topGenres].sort((a, b) => {
      if (genreSortKey === "genre") return a.genre.localeCompare(b.genre) * dir;
      const av = (a[genreSortKey] ?? null) as number | null;
      const bv = (b[genreSortKey] ?? null) as number | null;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return (av - bv) * dir;
    });
  }, [growth.topGenres, genreSortKey, genreSortDir]);

  const toggleGenreSort = (key: GenreSortKey) => {
    if (genreSortKey === key) {
      setGenreSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setGenreSortKey(key);
      setGenreSortDir(key === "genre" ? "asc" : "desc");
    }
  };

  const GenreSortIcon = ({ k }: { k: GenreSortKey }) => {
    if (genreSortKey !== k) return <ArrowUpDown className="h-3 w-3 opacity-50 inline-block ml-1" />;
    return genreSortDir === "asc" ? <ArrowUp className="h-3 w-3 inline-block ml-1" /> : <ArrowDown className="h-3 w-3 inline-block ml-1" />;
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  return (
    <div className="p-6 space-y-6 min-w-0 max-w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Gamepad2 className="h-6 w-6" /> Reddit Games
          </h1>
          <p className="text-sm text-muted-foreground">
            Subreddit games tracked from r/GamesOnReddit. Weekly metrics accumulate over time.
          </p>
        </div>
      </div>

      {allScreenshots.length > 0 && (
        <>
          <style>{`
            @keyframes screenshot-marquee {
              from { transform: translateX(0); }
              to { transform: translateX(-50%); }
            }
            .screenshot-marquee-track {
              animation: screenshot-marquee 60s linear infinite;
            }
            .screenshot-marquee-wrap:hover .screenshot-marquee-track {
              animation-play-state: paused;
            }
          `}</style>
          <div className="screenshot-marquee-wrap overflow-hidden rounded-xl border bg-muted/30">
            <div className="screenshot-marquee-track flex gap-3 py-3 w-max">
              {[...allScreenshots, ...allScreenshots].map((s, i) => (
                <Link
                  key={`${s.url}-${i}`}
                  to={`${basePath}/${s.gameId}`}
                  title={s.gameName}
                  className="shrink-0 block rounded-md overflow-hidden border bg-background hover:ring-2 hover:ring-primary transition"
                >
                  <img src={s.url} alt={s.gameName} className="h-24 w-auto object-cover" loading="lazy" />
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Games</CardDescription>
            <CardTitle className="text-3xl">{games.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Weekly Users</CardDescription>
            <CardTitle className="text-3xl">{numberFmt(stats.totalUsers)}</CardTitle>
            {stats.dailyDelta != null && (
              <div
                className={`inline-flex items-center gap-1 text-xs font-medium pt-1 ${
                  stats.dailyDelta >= 0 ? "text-green-600" : "text-red-600"
                }`}
                title={`Snapshot total on ${stats.latestDate} vs ${stats.prevDate} (each game contributes its most recent reading on or before each date)`}
              >
                {stats.dailyDelta >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {stats.dailyDelta >= 0 ? "+" : ""}
                {compactFmt(stats.dailyDelta)}
                {stats.dailyPct != null && (
                  <span>({stats.dailyPct >= 0 ? "+" : ""}{stats.dailyPct.toFixed(1)}%)</span>
                )}
                <span className="text-muted-foreground font-normal ml-1">vs prev day</span>
              </div>
            )}
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Featured</CardDescription>
            <CardTitle className="text-3xl">{stats.featured}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Popular</CardDescription>
            <CardTitle className="text-3xl">{stats.popular}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In New</CardDescription>
            <CardTitle className="text-3xl">{stats.fresh}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Game Adoption
            </CardTitle>
            <CardDescription>Total rolling 7-day active users across all tracked games, per measurement.</CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyAdoption.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                No weekly data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={weeklyAdoption} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v: number) => compactFmt(v)} />
                  <Tooltip formatter={(v: number) => numberFmt(v)} />
                  <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {insights.length > 0 && (
        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/60 to-purple-50/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" /> AI Insights
            </CardTitle>
            <CardDescription>Auto-generated from the latest tracked data.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {insights.map(ins => (
                <div key={ins.title} className="rounded-lg border bg-background/70 p-4">
                  <div className="text-sm font-semibold mb-1">{ins.title}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{ins.body}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {newHotGames.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">New Hot Games</CardTitle>
            <CardDescription>New trending games.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {newHotGames.map(g => (
                <Link
                  key={g.gameId}
                  to={`${basePath}/${g.gameId}`}
                  title={g.gameName}
                  style={{ rotate: `${g.tilt}deg` }}
                  className="relative block overflow-hidden rounded-md border bg-background hover:ring-2 hover:ring-primary transition"
                >
                  <img
                    src={g.url}
                    alt={g.gameName}
                    loading="lazy"
                    className="w-full h-56 object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent text-white px-2 py-1.5">
                    <div className="text-xs font-medium line-clamp-1">{g.gameName}</div>
                    {g.users > 0 && (
                      <div className="text-[10px] opacity-80">{compactFmt(g.users)} weekly users</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4" /> Top Games by Weekly Users
          </CardTitle>
            <CardDescription>Most active subreddits this week.</CardDescription>
          </CardHeader>
          <CardContent>
            {topGames.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                No weekly data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(260, topGames.length * 32)}>
                <BarChart
                  data={topGames.map(t => ({
                    name: t.game.game_name,
                    users: t.latest!.users,
                    gameId: t.game.id,
                    screenshot: firstScreenshotByGameId.get(t.game.id) ?? null,
                  }))}
                  layout="vertical"
                  margin={{ left: 12, right: 56, top: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" tickFormatter={(v: number) => compactFmt(v)} />
                  <YAxis type="category" dataKey="name" width={160} interval={0} className="text-xs cursor-pointer" />
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (!active || !payload?.[0]?.payload) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-md border bg-background shadow-md p-2 text-xs space-y-1 max-w-[220px]">
                          <div className="font-medium">{d.name}</div>
                          <div className="text-muted-foreground">{numberFmt(d.users)} weekly users</div>
                          {d.screenshot && (
                            <img src={d.screenshot} alt={d.name} className="w-full h-28 object-cover rounded" />
                          )}
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="users"
                    fill="#6366f1"
                    radius={[0, 4, 4, 0]}
                    style={{ cursor: "pointer" }}
                    onClick={(d: any) => d?.gameId && navigate(`${basePath}/${d.gameId}`)}
                  >
                    <LabelList
                      dataKey="users"
                      position="right"
                      className="fill-foreground text-xs"
                      formatter={(v: number) => compactFmt(v)}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Rocket className="h-4 w-4" /> Top Growing Games
            </CardTitle>
            <CardDescription>Day-over-day change.</CardDescription>
          </CardHeader>
          <CardContent>
            {growth.topGames.length === 0 ? (
              <div className="text-sm text-muted-foreground">Need 2+ readings per game.</div>
            ) : (
              <ul className="space-y-2">
                {growth.topGames.map(({ game, curr, delta, pct }) => {
                  const positive = delta >= 0;
                  const shot = firstScreenshotByGameId.get(game.id);
                  const featured = game.listings?.includes("featured");
                  const NameLink = (
                    <Link to={`${basePath}/${game.id}`} className="font-medium truncate hover:text-primary hover:underline">
                      {game.game_name}
                    </Link>
                  );
                  return (
                    <li key={game.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 min-w-0">
                        {shot ? (
                          <HoverCard openDelay={150} closeDelay={50}>
                            <HoverCardTrigger asChild>{NameLink}</HoverCardTrigger>
                            <HoverCardContent side="left" className="w-64 p-2">
                              <img src={shot} alt={game.game_name} className="w-full h-40 object-cover rounded" loading="lazy" />
                            </HoverCardContent>
                          </HoverCard>
                        ) : NameLink}
                        {featured && (
                          <Badge className="bg-amber-500 hover:bg-amber-500 text-white border-transparent shrink-0 text-[10px] px-1.5 py-0">
                            Featured
                          </Badge>
                        )}
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-xs text-muted-foreground">{compactFmt(curr)}</span>
                        <span className={`inline-flex items-center gap-0.5 font-mono text-xs ${positive ? "text-green-600" : "text-red-600"}`}>
                          {positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          {pct == null ? `${positive ? "+" : ""}${compactFmt(delta)}` : `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Rocket className="h-4 w-4 rotate-180" /> Top Declining Games
            </CardTitle>
            <CardDescription>Day-over-day change.</CardDescription>
          </CardHeader>
          <CardContent>
            {growth.decliningGames.length === 0 ? (
              <div className="text-sm text-muted-foreground">No declines vs the previous reading.</div>
            ) : (
              <ul className="space-y-2">
                {growth.decliningGames.map(({ game, curr, delta, pct }) => {
                  const shot = firstScreenshotByGameId.get(game.id);
                  const NameLink = (
                    <Link to={`${basePath}/${game.id}`} className="font-medium truncate hover:text-primary hover:underline">
                      {game.game_name}
                    </Link>
                  );
                  return (
                    <li key={game.id} className="flex items-center justify-between gap-3 text-sm">
                      {shot ? (
                        <HoverCard openDelay={150} closeDelay={50}>
                          <HoverCardTrigger asChild>{NameLink}</HoverCardTrigger>
                          <HoverCardContent side="left" className="w-64 p-2">
                            <img src={shot} alt={game.game_name} className="w-full h-40 object-cover rounded" loading="lazy" />
                          </HoverCardContent>
                        </HoverCard>
                      ) : NameLink}
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-xs text-muted-foreground">{compactFmt(curr)}</span>
                        <span className="inline-flex items-center gap-0.5 font-mono text-xs text-red-600">
                          <ArrowDown className="h-3 w-3" />
                          {pct == null ? compactFmt(delta) : `${pct.toFixed(1)}%`}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Rocket className="h-4 w-4" /> Top Growing Genres
          </CardTitle>
          <CardDescription>Aggregate day-over-day growth by genre (requires games to have a matching genre assigned).</CardDescription>
        </CardHeader>
        <CardContent>
          {growth.topGenres.length === 0 ? (
            <div className="text-sm text-muted-foreground">No genres with 2+ weeks of data yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button onClick={() => toggleGenreSort("genre")} className="inline-flex items-center hover:text-foreground">
                        Genre <GenreSortIcon k="genre" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button onClick={() => toggleGenreSort("curr")} className="inline-flex items-center hover:text-foreground">
                        Today <GenreSortIcon k="curr" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button onClick={() => toggleGenreSort("prev")} className="inline-flex items-center hover:text-foreground">
                        Yesterday <GenreSortIcon k="prev" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button onClick={() => toggleGenreSort("delta")} className="inline-flex items-center hover:text-foreground">
                        Δ Users <GenreSortIcon k="delta" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button onClick={() => toggleGenreSort("pct")} className="inline-flex items-center hover:text-foreground">
                        Growth <GenreSortIcon k="pct" />
                      </button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTopGenres.map(g => {
                    const positive = g.delta >= 0;
                    return (
                      <TableRow key={g.genre}>
                        <TableCell className="font-medium">{g.genre}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{numberFmt(g.curr)}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-muted-foreground">{numberFmt(g.prev)}</TableCell>
                        <TableCell className={`text-right font-mono text-sm ${positive ? "text-green-600" : "text-red-600"}`}>
                          {positive ? "+" : ""}{numberFmt(g.delta)}
                        </TableCell>
                        <TableCell className={`text-right font-mono text-sm ${positive ? "text-green-600" : "text-red-600"}`}>
                          {g.pct == null ? "—" : `${g.pct >= 0 ? "+" : ""}${g.pct.toFixed(1)}%`}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Genres</CardTitle>
          <CardDescription>Game count per genre (case-insensitive match).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {GENRES.map(g => (
              <span
                key={g}
                className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm"
              >
                <span>{g}</span>
                <span className="text-xs font-medium text-muted-foreground">{genreCounts[g]}</span>
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search games, genre, subreddit…"
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {(["all", "featured", "popular", "new"] as ListingFilter[]).map(f => (
                <Button
                  key={f}
                  size="sm"
                  variant={listingFilter === f ? "default" : "outline"}
                  onClick={() => setListingFilter(f)}
                >
                  {f === "all" ? "All" : f === "popular" ? "Popular" : f === "new" ? "New" : "Featured"}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
          ) : filteredSorted.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No games match.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button onClick={() => toggleSort("name")} className="inline-flex items-center gap-1 hover:text-foreground">
                        Game <SortIcon k="name" />
                      </button>
                    </TableHead>
                    <TableHead>Listings</TableHead>
                    <TableHead>Subreddit</TableHead>
                    <TableHead>Genre</TableHead>
                    <TableHead className="text-right">
                      <button onClick={() => toggleSort("users")} className="inline-flex items-center gap-1 hover:text-foreground">
                        <Users className="h-3.5 w-3.5" />Weekly Users <SortIcon k="users" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button onClick={() => toggleSort("contributions")} className="inline-flex items-center gap-1 hover:text-foreground">
                        <MessageSquare className="h-3.5 w-3.5" />Contributions <SortIcon k="contributions" />
                      </button>
                    </TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Update</TableHead>
                    <TableHead className="text-right">Mods</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSorted.map(game => {
                    const latest = latestMetric(game.tracked_game_weekly_metrics);
                    return (
                      <TableRow key={game.id}>
                        <TableCell>
                          {game.screenshots?.length ? (
                            <HoverCard openDelay={150} closeDelay={50}>
                              <HoverCardTrigger asChild>
                                <Link
                                  to={`${basePath}/${game.id}`}
                                  className="font-medium hover:text-primary hover:underline"
                                >
                                  {game.game_name}
                                </Link>
                              </HoverCardTrigger>
                              <HoverCardContent side="right" className="w-64 p-2">
                                <img
                                  src={game.screenshots[0]}
                                  alt={game.game_name}
                                  className="w-full h-40 object-cover rounded"
                                  loading="lazy"
                                />
                                {game.screenshots.length > 1 && (
                                  <p className="text-xs text-muted-foreground pt-1 text-center">
                                    +{game.screenshots.length - 1} more
                                  </p>
                                )}
                              </HoverCardContent>
                            </HoverCard>
                          ) : (
                            <Link
                              to={`${basePath}/${game.id}`}
                              className="font-medium hover:text-primary hover:underline"
                            >
                              {game.game_name}
                            </Link>
                          )}
                          {game.description && (
                            <div className="text-xs text-muted-foreground truncate max-w-[260px]" title={game.description}>
                              {game.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {game.listings?.length
                              ? game.listings.map(l => (
                                  <Badge
                                    key={l}
                                    variant={l === "popular" ? "default" : "secondary"}
                                    className={l === "featured" ? "bg-amber-500 hover:bg-amber-500 text-white border-transparent" : ""}
                                  >
                                    {l}
                                  </Badge>
                                ))
                              : <span className="text-muted-foreground text-xs">—</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {game.sub_address ? (
                            <a
                              href={game.sub_address}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                            >
                              {game.sub_address.replace(/^https?:\/\/(www\.)?reddit\.com/, "")}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {gameGenres(game).length ? (
                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                              {gameGenres(game).map(gen => (
                                <Badge key={gen} variant="outline" className="text-[10px] px-1.5 py-0">{gen}</Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{numberFmt(latest?.users)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{numberFmt(latest?.contributions)}</TableCell>
                        <TableCell className="text-sm">{dateFmt(game.created_date)}</TableCell>
                        <TableCell className="text-sm">{dateFmt(game.last_update)}</TableCell>
                        <TableCell className="text-right text-sm" title={game.moderators?.join(", ")}>
                          {game.moderators?.length ?? 0}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(game)} aria-label={`Edit ${game.game_name}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit {editing?.game_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="sub-address">Subreddit URL</Label>
              <Input
                id="sub-address"
                placeholder="https://www.reddit.com/r/example"
                value={draftSub}
                onChange={e => setDraftSub(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What is this game about?"
                rows={3}
                value={draftDescription}
                onChange={e => setDraftDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Genres</Label>
              <div className="flex flex-wrap gap-1.5">
                {GENRES.map(gen => {
                  const active = draftGenres.includes(gen);
                  return (
                    <button
                      key={gen}
                      type="button"
                      onClick={() =>
                        setDraftGenres(active ? draftGenres.filter(x => x !== gen) : [...draftGenres, gen])
                      }
                      className={`rounded-full px-3 py-1 text-xs transition border ${
                        active
                          ? "bg-primary text-primary-foreground border-transparent"
                          : "bg-muted text-muted-foreground border-transparent hover:bg-muted/70"
                      }`}
                    >
                      {gen}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Moderators</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="u/username"
                  value={newMod}
                  onChange={e => setNewMod(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addMod();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addMod}>Add</Button>
              </div>
              {draftMods.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {draftMods.map(m => (
                    <Badge key={m} variant="secondary" className="gap-1">
                      {m}
                      <button
                        type="button"
                        onClick={() => removeMod(m)}
                        className="ml-1 hover:text-destructive"
                        aria-label={`Remove ${m}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="screenshots">Screenshots</Label>
              <Input
                id="screenshots"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                disabled={uploading}
                onChange={e => {
                  onUploadScreenshots(e.target.files);
                  e.target.value = "";
                }}
              />
              {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
              {draftScreenshots.length > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {draftScreenshots.map(url => (
                    <div key={url} className="relative group">
                      <a href={url} target="_blank" rel="noreferrer">
                        <img
                          src={url}
                          alt="screenshot"
                          className="w-full h-20 object-cover rounded border"
                        />
                      </a>
                      <button
                        type="button"
                        onClick={() => removeScreenshot(url)}
                        className="absolute -top-1 -right-1 bg-background border rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition hover:text-destructive"
                        aria-label="Remove screenshot"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEdit} disabled={saving}>Cancel</Button>
            <Button onClick={saveEdit} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

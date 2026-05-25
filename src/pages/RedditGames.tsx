import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Gamepad2, ExternalLink, Search, Users, MessageSquare, Pencil, X, ArrowUp, ArrowDown, ArrowUpDown, TrendingUp, Trophy, Rocket } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface WeeklyMetric {
  week_of: string;
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
  tracked_game_weekly_metrics: WeeklyMetric[];
}

type ListingFilter = "all" | "popular" | "new";
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
  return [...metrics].sort((a, b) => (a.week_of < b.week_of ? 1 : -1))[0];
}

export function RedditGames() {
  const [games, setGames] = useState<TrackedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [listingFilter, setListingFilter] = useState<ListingFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [editing, setEditing] = useState<TrackedGame | null>(null);
  const [draftSub, setDraftSub] = useState("");
  const [draftGenre, setDraftGenre] = useState("");
  const [draftMods, setDraftMods] = useState<string[]>([]);
  const [newMod, setNewMod] = useState("");
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
    setDraftGenre(game.genre ?? "");
    setDraftMods(game.moderators ?? []);
    setNewMod("");
  };

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
      genre: draftGenre.trim() || null,
      moderators: draftMods,
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
        .select("*, tracked_game_weekly_metrics(week_of, users, contributions)")
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
        g.genre?.toLowerCase().includes(q) ||
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
    let totalUsers = 0;
    for (const g of games) {
      const latest = latestMetric(g.tracked_game_weekly_metrics);
      if (latest?.users) totalUsers += latest.users;
    }
    return { popular, fresh, totalUsers };
  }, [games]);

  const genreCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    GENRES.forEach(g => (counts[g] = 0));
    for (const game of games) {
      if (!game.genre) continue;
      // Normalize case-insensitively against known genres
      const match = GENRES.find(g => g.toLowerCase() === game.genre!.toLowerCase());
      if (match) counts[match] += 1;
    }
    return counts;
  }, [games]);

  const weeklyAdoption = useMemo(() => {
    // Aggregate users across all games per week_of
    const byWeek = new Map<string, number>();
    for (const game of games) {
      for (const m of game.tracked_game_weekly_metrics ?? []) {
        if (m.users == null) continue;
        byWeek.set(m.week_of, (byWeek.get(m.week_of) ?? 0) + m.users);
      }
    }
    return [...byWeek.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([week, users]) => ({ week, users }));
  }, [games]);

  const topGames = useMemo(() => {
    return games
      .map(g => ({ game: g, latest: latestMetric(g.tracked_game_weekly_metrics) }))
      .filter(x => x.latest?.users != null)
      .sort((a, b) => (b.latest!.users! - a.latest!.users!))
      .slice(0, 10);
  }, [games]);

  const growth = useMemo(() => {
    // For each game, compare latest vs previous week. Need at least 2 snapshots.
    const perGame = games
      .map(g => {
        const sorted = [...(g.tracked_game_weekly_metrics ?? [])]
          .filter(m => m.users != null)
          .sort((a, b) => (a.week_of < b.week_of ? 1 : -1));
        if (sorted.length < 2) return null;
        const [curr, prev] = sorted;
        const delta = curr.users! - prev.users!;
        const pct = prev.users! === 0 ? null : (delta / prev.users!) * 100;
        return { game: g, curr: curr.users!, prev: prev.users!, delta, pct };
      })
      .filter((x): x is { game: TrackedGame; curr: number; prev: number; delta: number; pct: number | null } => !!x);
    // Top growing games: sort by absolute delta (positive first), tie-break by pct
    const topGames = [...perGame].sort((a, b) => b.delta - a.delta).slice(0, 10);

    // Aggregate per genre using known GENRES (case-insensitive)
    const genreAgg = new Map<string, { curr: number; prev: number }>();
    for (const row of perGame) {
      const raw = row.game.genre;
      if (!raw) continue;
      const matched = GENRES.find(g => g.toLowerCase() === raw.toLowerCase());
      if (!matched) continue;
      const acc = genreAgg.get(matched) ?? { curr: 0, prev: 0 };
      acc.curr += row.curr;
      acc.prev += row.prev;
      genreAgg.set(matched, acc);
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

    return { topGames, topGenres };
  }, [games]);

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  return (
    <div className="p-6 space-y-6">
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Game Adoption Weekly
            </CardTitle>
            <CardDescription>Total weekly users across all tracked games.</CardDescription>
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
                  <XAxis dataKey="week" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v: number) => compactFmt(v)} />
                  <Tooltip formatter={(v: number) => numberFmt(v)} />
                  <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
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
                  data={topGames.map(t => ({ name: t.game.game_name, users: t.latest!.users }))}
                  layout="vertical"
                  margin={{ left: 12, right: 24, top: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" tickFormatter={(v: number) => compactFmt(v)} />
                  <YAxis type="category" dataKey="name" width={160} interval={0} className="text-xs" />
                  <Tooltip formatter={(v: number) => numberFmt(v)} />
                  <Bar dataKey="users" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Rocket className="h-4 w-4" /> Top Growing Games
            </CardTitle>
            <CardDescription>Week-over-week change.</CardDescription>
          </CardHeader>
          <CardContent>
            {growth.topGames.length === 0 ? (
              <div className="text-sm text-muted-foreground">Need 2+ weeks of data per game.</div>
            ) : (
              <ul className="space-y-2">
                {growth.topGames.map(({ game, curr, delta, pct }) => {
                  const positive = delta >= 0;
                  return (
                    <li key={game.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium truncate">{game.game_name}</span>
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Rocket className="h-4 w-4" /> Top Growing Genres
          </CardTitle>
          <CardDescription>Aggregate week-over-week growth by genre (requires games to have a matching genre assigned).</CardDescription>
        </CardHeader>
        <CardContent>
          {growth.topGenres.length === 0 ? (
            <div className="text-sm text-muted-foreground">No genres with 2+ weeks of data yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Genre</TableHead>
                    <TableHead className="text-right">This Week</TableHead>
                    <TableHead className="text-right">Last Week</TableHead>
                    <TableHead className="text-right">Δ Users</TableHead>
                    <TableHead className="text-right">Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {growth.topGenres.map(g => {
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
              {(["all", "popular", "new"] as ListingFilter[]).map(f => (
                <Button
                  key={f}
                  size="sm"
                  variant={listingFilter === f ? "default" : "outline"}
                  onClick={() => setListingFilter(f)}
                >
                  {f === "all" ? "All" : f === "popular" ? "Popular" : "New"}
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
                          <div className="font-medium">{game.game_name}</div>
                          {game.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1">{game.description}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {game.listings?.length
                              ? game.listings.map(l => (
                                  <Badge key={l} variant={l === "popular" ? "default" : "secondary"}>
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
                        <TableCell className="text-sm">{game.genre ?? <span className="text-muted-foreground text-xs">—</span>}</TableCell>
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
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                placeholder="e.g. Puzzle, Strategy"
                value={draftGenre}
                onChange={e => setDraftGenre(e.target.value)}
              />
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

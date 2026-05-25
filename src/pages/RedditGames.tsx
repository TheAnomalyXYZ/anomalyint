import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Gamepad2, ExternalLink, Search, Users, MessageSquare, Pencil, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

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

const numberFmt = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("en-US");

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
  const [editing, setEditing] = useState<TrackedGame | null>(null);
  const [draftSub, setDraftSub] = useState("");
  const [draftGenre, setDraftGenre] = useState("");
  const [draftMods, setDraftMods] = useState<string[]>([]);
  const [newMod, setNewMod] = useState("");
  const [saving, setSaving] = useState(false);

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return games.filter(g => {
      if (listingFilter !== "all" && !g.listings?.includes(listingFilter)) return false;
      if (!q) return true;
      return (
        g.game_name.toLowerCase().includes(q) ||
        g.genre?.toLowerCase().includes(q) ||
        g.sub_address?.toLowerCase().includes(q)
      );
    });
  }, [games, search, listingFilter]);

  const totals = useMemo(() => {
    const popular = games.filter(g => g.listings?.includes("popular")).length;
    const fresh = games.filter(g => g.listings?.includes("new")).length;
    return { popular, fresh };
  }, [games]);

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Games</CardDescription>
            <CardTitle className="text-3xl">{games.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Popular</CardDescription>
            <CardTitle className="text-3xl">{totals.popular}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In New</CardDescription>
            <CardTitle className="text-3xl">{totals.fresh}</CardTitle>
          </CardHeader>
        </Card>
      </div>

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
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No games match.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Game</TableHead>
                    <TableHead>Listings</TableHead>
                    <TableHead>Subreddit</TableHead>
                    <TableHead>Genre</TableHead>
                    <TableHead className="text-right">
                      <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />Weekly Users</span>
                    </TableHead>
                    <TableHead className="text-right">
                      <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />Contributions</span>
                    </TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Update</TableHead>
                    <TableHead className="text-right">Mods</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(game => {
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

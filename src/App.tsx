import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { Overview } from "./pages/Overview";
import { Markets } from "./pages/Markets";
import { ManageQuestions } from "./pages/ManageQuestions";
import { Profiles } from "./pages/Profiles";
import { TrackedContent } from "./pages/TrackedContent";
import { Agents } from "./pages/Agents";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { TwitterSettings } from "./pages/TwitterSettings";
import { NewsSettings } from "./pages/NewsSettings";
import { TelegramSettings } from "./pages/TelegramSettings";
import { DiscordSettings } from "./pages/DiscordSettings";
import { RedditSettings } from "./pages/RedditSettings";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/questions" element={<ManageQuestions />} />
          <Route path="/profiles" element={<Profiles />} />
          <Route path="/tracked-content" element={<TrackedContent />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/sources/twitter" element={<TwitterSettings />} />
          <Route path="/sources/news" element={<NewsSettings />} />
          <Route path="/sources/telegram" element={<TelegramSettings />} />
          <Route path="/sources/discord" element={<DiscordSettings />} />
          <Route path="/sources/reddit" element={<RedditSettings />} />
        </Routes>
      </AppShell>
      <Toaster />
    </BrowserRouter>
  );
}
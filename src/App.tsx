import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { Overview } from "./pages/Overview";
import { Markets } from "./pages/Markets";
import { ManageQuestions } from "./pages/ManageQuestions";
import { Profiles } from "./pages/Profiles";
import { TrackedContent } from "./pages/TrackedContent";
import { Agents } from "./pages/Agents";
import { KnowledgeCorpus } from "./pages/KnowledgeCorpus";
import { OAuthCallback } from "./pages/OAuthCallback";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { TwitterSettings } from "./pages/TwitterSettings";
import { NewsSettings } from "./pages/NewsSettings";
import { TelegramSettings } from "./pages/TelegramSettings";
import { DiscordSettings } from "./pages/DiscordSettings";
import { RedditSettings } from "./pages/RedditSettings";
import { Clerk } from "./pages/Clerk";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="*" element={
          <AppShell>
            <Routes>
              <Route path="/" element={<Navigate to="/overview" replace />} />
              <Route path="/overview" element={<Overview />} />
              <Route path="/markets" element={<Markets />} />
              <Route path="/questions" element={<ManageQuestions />} />
              <Route path="/profiles" element={<Profiles />} />
              <Route path="/tracked-content" element={<TrackedContent />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/knowledge-corpus" element={<KnowledgeCorpus />} />
              <Route path="/clerk" element={<Clerk />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/sources/twitter" element={<TwitterSettings />} />
              <Route path="/sources/news" element={<NewsSettings />} />
              <Route path="/sources/telegram" element={<TelegramSettings />} />
              <Route path="/sources/discord" element={<DiscordSettings />} />
              <Route path="/sources/reddit" element={<RedditSettings />} />
            </Routes>
          </AppShell>
        } />
      </Routes>
      <Toaster position="bottom-right" closeButton duration={5000} />
    </BrowserRouter>
  );
}
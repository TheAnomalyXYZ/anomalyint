import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarHeader,
  SidebarTrigger,
  SidebarFooter,
} from "../ui/sidebar";
import {
  LayoutDashboard,
  Sparkles,
  BarChart3,
  Settings,
  Search,
  Plus,
  User,
  Bot,
  Building2,
  ChevronUp,
  MessageCircle,
  Database,
  FileText,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Separator } from "../ui/separator";
import { RagChatButton } from "../shared/RagChatButton";

interface AppShellProps {
  children: ReactNode;
}

const navigation = [
  {
    label: "Main",
    items: [
      { id: "overview", label: "Overview", icon: LayoutDashboard, path: "/overview" },
      { id: "pulse", label: "Pulse", icon: Sparkles, path: "/pulse" },
      { id: "profiles", label: "Profiles", icon: Building2, path: "/profiles" },
      { id: "tracked-content", label: "Tracked Content", icon: MessageCircle, path: "/tracked-content" },
      { id: "agents", label: "AI Agents", icon: Bot, path: "/agents" },
      { id: "knowledge-corpus", label: "Knowledge Corpus", icon: Database, path: "/knowledge-corpus" },
      { id: "clerk", label: "Clerk", icon: FileText, path: "/clerk" },
    ],
  },
  {
    label: "Admin",
    items: [
      { id: "reports", label: "Reports", icon: BarChart3, path: "/reports" },
      { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
    ],
  },
];

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <Sidebar className="!border-0 bg-transparent p-2 [&_[data-slot=sidebar-container]]:!border-0 [&_[data-slot=sidebar-inner]]:!border-0">
        <div className="flex-1 bg-card backdrop-blur-sm rounded-3xl flex flex-col h-full">
          <SidebarHeader className="px-2 py-4 lg:p-4">
            <Link
              to="/overview"
              className="flex items-center justify-center lg:justify-start gap-3 hover:opacity-80 transition-opacity w-full"
            >
              <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-xl font-semibold text-primary hidden lg:block">
                Intelligence
              </span>
            </Link>
          </SidebarHeader>

          <SidebarContent className="px-2 lg:px-4">
            {navigation.map((section) => (
              <SidebarGroup key={section.label}>
                <div className="text-xs text-muted px-4 mb-2 hidden lg:block">
                  {section.label}
                </div>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <SidebarMenuItem key={item.id}>
                          <Link
                            to={item.path}
                            className={`flex items-center justify-center lg:justify-start lg:gap-3 lg:px-4 lg:py-3 w-10 h-10 lg:w-full lg:h-auto rounded-full lg:rounded-lg text-sm font-medium transition-colors ${
                              isActive
                                ? "bg-[#A192F8] text-white"
                                : "text-secondary hover:bg-hover hover:text-primary"
                            }`}
                          >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            <span className="hidden lg:inline">{item.label}</span>
                          </Link>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter className="px-2 py-4 lg:px-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center justify-center lg:justify-start lg:gap-3 p-3 rounded-lg hover:bg-hover transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#A192F8] to-[#8B5CF6] flex items-center justify-center text-white font-semibold flex-shrink-0">
                    AI
                  </div>
                  <div className="flex-1 text-left hidden lg:block">
                    <div className="text-sm font-medium text-primary">AI Admin</div>
                    <div className="text-xs text-muted">Admin</div>
                  </div>
                  <ChevronUp className="w-4 h-4 text-muted transition-transform hidden lg:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </div>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 items-center gap-4 bg-background px-6">
          <SidebarTrigger />
          <div className="flex-1 flex items-center gap-4">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search questions, suggestions..." className="pl-10" />
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>

      {/* Floating RAG Chat Button */}
      <RagChatButton />
    </SidebarProvider>
  );
}
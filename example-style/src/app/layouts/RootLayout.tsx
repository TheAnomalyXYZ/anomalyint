import { Outlet, useLocation, useNavigate } from 'react-router';
import { ThemeProvider } from '@/app/contexts/ThemeContext';
import { Sidebar } from '@/app/components/Sidebar';
import { TopBar } from '@/app/components/TopBar';

export function RootLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active item based on current path
  const getActiveItem = () => {
    const path = location.pathname;
    if (path === '/') return 'overview';
    if (path.startsWith('/users')) return 'users';
    if (path.startsWith('/wallets')) return 'wallets';
    if (path.startsWith('/transactions')) return 'transactions';
    if (path.startsWith('/campaigns')) return 'campaigns';
    if (path.startsWith('/messaging')) return 'messaging';
    if (path.startsWith('/partners/somnia/events')) return 'somnia-events';
    if (path.startsWith('/partners/somnia/dashboard')) return 'somnia-dashboard';
    if (path.startsWith('/partners/plume/events')) return 'plume-events';
    if (path.startsWith('/partners/plume/dashboard')) return 'plume-dashboard';
    if (path.startsWith('/partners')) return 'partner-pages';
    return 'overview';
  };

  // Handle navigation from sidebar
  const handleNavigate = (itemId: string) => {
    switch (itemId) {
      case 'overview':
        navigate('/');
        break;
      case 'users':
        navigate('/users');
        break;
      case 'wallets':
        navigate('/wallets');
        break;
      case 'transactions':
        navigate('/transactions');
        break;
      case 'campaigns':
        navigate('/campaigns');
        break;
      case 'messaging':
        navigate('/messaging');
        break;
      case 'partner-pages':
        navigate('/partners');
        break;
      case 'somnia-events':
        navigate('/partners/somnia/events');
        break;
      case 'somnia-dashboard':
        navigate('/partners/somnia/dashboard');
        break;
      case 'plume-events':
        navigate('/partners/plume/events');
        break;
      case 'plume-dashboard':
        navigate('/partners/plume/dashboard');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <ThemeProvider>
      <div className="flex h-screen bg-page-gradient overflow-hidden">
        {/* Sidebar */}
        <Sidebar activeItem={getActiveItem()} onNavigate={handleNavigate} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <TopBar />

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
import {
  Type,
  Palette,
  Layout,
  MousePointer,
  FileText,
  Table,
  Tag,
  Navigation,
  BarChart3,
  Smile,
  Sparkles,
  Check,
  Users,
  LayoutGrid,
  Image,
  X,
} from 'lucide-react';
import { ThemeProvider } from '@/app/contexts/ThemeContext';
import { ThemeToggle } from '@/app/components/ThemeToggle';
import LogoMark from '@/imports/A-64-2075';
import Wordmark from '@/imports/Novalink';
import HorizontalLogo from '@/imports/Container';

const sections = [
  { id: 'brand', label: 'Brand & Logo', icon: Image },
  { id: 'typography', label: 'Typography', icon: Type },
  { id: 'colors', label: 'Colors', icon: Palette },
  { id: 'spacing', label: 'Spacing & Layout', icon: Layout },
  { id: 'buttons', label: 'Buttons', icon: MousePointer },
  { id: 'inputs', label: 'Inputs & Forms', icon: FileText },
  { id: 'cards', label: 'Cards & Containers', icon: FileText },
  { id: 'tables', label: 'Tables', icon: Table },
  { id: 'badges', label: 'Badges & Status', icon: Tag },
  { id: 'navigation', label: 'Navigation', icon: Navigation },
  { id: 'charts', label: 'Charts & Visualization', icon: BarChart3 },
  { id: 'icons', label: 'Iconography', icon: Smile },
  { id: 'patterns', label: 'Interaction Patterns', icon: Sparkles },
];

export function StyleGuidePage() {
  return (
    <ThemeProvider>
      <style>{`html { scroll-behavior: smooth; scroll-padding-top: 120px; }`}</style>
      <div className="min-h-screen bg-page">
        {/* Header */}
        <div className="bg-card border-b border-default sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
            <div>
              <h1 className="text-[28px] font-semibold text-primary mb-2">Novalink Design System</h1>
              <p className="text-secondary">
                Comprehensive UI style guide and component reference
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar Navigation */}
        <aside className="w-64 sticky top-[112px] h-[calc(100vh-112px)] overflow-y-auto border-r border-default bg-card p-4 hidden lg:block">
          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-secondary hover:bg-hover hover:text-primary"
                >
                  <Icon className="w-4 h-4" />
                  {section.label}
                </a>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Navigation */}
        <div className="lg:hidden w-full bg-card border-b border-default p-4 sticky top-[112px] z-30">
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="px-3 py-2 bg-page border border-default rounded-lg text-xs font-medium text-secondary hover:bg-hover hover:text-primary transition-colors"
              >
                {section.label}
              </a>
            ))}
          </div>
        </div>

        {/* Main Content - All Sections */}
        <main className="flex-1 p-6 space-y-16">
          <div id="brand"><BrandSection /></div>
          <div id="typography"><TypographySection /></div>
          <div id="colors"><ColorsSection /></div>
          <div id="spacing"><SpacingSection /></div>
          <div id="buttons"><ButtonsSection /></div>
          <div id="inputs"><InputsSection /></div>
          <div id="cards"><CardsSection /></div>
          <div id="tables"><TablesSection /></div>
          <div id="badges"><BadgesSection /></div>
          <div id="navigation"><NavigationSection /></div>
          <div id="charts"><ChartsSection /></div>
          <div id="icons"><IconsSection /></div>
          <div id="patterns"><PatternsSection /></div>
        </main>
      </div>
    </div>
    </ThemeProvider>
  );
}

// ============================================
// SECTION 0: BRAND & LOGO
// ============================================
function BrandSection() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-primary mb-4">Brand & Logo</h2>
        <p className="text-secondary mb-6">
          Novalink logo system, variations, usage guidelines, and brand assets.
        </p>
      </div>

      {/* Logo Mark (Icon Only) */}
      <SpecSection title="Logo Mark">
        <div className="bg-card border border-default rounded-lg p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-32" style={{ aspectRatio: '304/223' }}>
              <LogoMark />
            </div>
          </div>
          <div className="space-y-2 text-sm text-secondary">
            <div>
              <strong>Usage:</strong> App icons, favicons, social media avatars, small spaces
            </div>
            <div>
              <strong>Format:</strong> SVG, PNG (transparent background)
            </div>
            <div>
              <strong>Color:</strong> Novalink Purple (#A192F8)
            </div>
            <div>
              <strong>Minimum size:</strong> 24px × 24px
            </div>
          </div>
        </div>
      </SpecSection>

      {/* Wordmark (Text Only) */}
      <SpecSection title="Wordmark">
        <div className="bg-card border border-default rounded-lg p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-[400px]" style={{ aspectRatio: '191.93/33.65', '--fill-0': 'var(--text-primary)' } as React.CSSProperties}>
              <Wordmark />
            </div>
          </div>
          <div className="space-y-2 text-sm text-secondary">
            <div>
              <strong>Usage:</strong> Text-only contexts, headers, print materials
            </div>
            <div>
              <strong>Font:</strong> Abotek
            </div>
            <div>
              <strong>Case:</strong> Uppercase
            </div>
            <div>
              <strong>Color:</strong> Theme-aware (white/dark)
            </div>
          </div>
        </div>
      </SpecSection>

      {/* Horizontal Logo */}
      <SpecSection title="Horizontal Logo">
        <div className="bg-card border border-default rounded-lg p-8">
          <div className="flex items-center justify-center mb-6">
            <div 
              className="w-40 [&_[data-name='Novalink']_path]:!fill-[var(--text-primary)]" 
              style={{ '--fill-0': '#A192F8' } as React.CSSProperties}
            >
              <HorizontalLogo />
            </div>
          </div>
          <div className="space-y-2 text-sm text-secondary">
            <div>
              <strong>Usage:</strong> Website headers, navigation bars, banners
            </div>
            <div>
              <strong>Layout:</strong> Logo mark on left, wordmark on right
            </div>
            <div>
              <strong>Spacing:</strong> 1.5× logo mark width between mark and wordmark
            </div>
            <div>
              <strong>Alignment:</strong> Vertically centered
            </div>
            <div>
              <strong>Minimum width:</strong> 180px
            </div>
          </div>
        </div>
      </SpecSection>

      {/* Vertical Logo */}
      <SpecSection title="Vertical Logo (Stacked)">
        <div className="bg-card border border-default rounded-lg p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16" style={{ aspectRatio: '304/223' }}>
                <LogoMark />
              </div>
              <div className="w-[110px]" style={{ aspectRatio: '191.93/33.65', '--fill-0': 'var(--text-primary)' } as React.CSSProperties}>
                <Wordmark />
              </div>
            </div>
          </div>
          <div className="space-y-2 text-sm text-secondary">
            <div>
              <strong>Usage:</strong> Splash screens, narrow layouts, mobile apps, square formats
            </div>
            <div>
              <strong>Layout:</strong> Logo mark on top, wordmark below
            </div>
            <div>
              <strong>Spacing:</strong> 0.5× logo mark height between mark and wordmark
            </div>
            <div>
              <strong>Alignment:</strong> Horizontally centered
            </div>
            <div>
              <strong>Minimum height:</strong> 120px
            </div>
          </div>
        </div>
      </SpecSection>

      {/* Color Variations */}
      <SpecSection title="Color Variations">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Light Background */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
            <div className="flex flex-col items-center gap-2 mb-4">
              <div className="w-10" style={{ aspectRatio: '304/223' }}>
                <LogoMark />
              </div>
              <div className="w-[90px]" style={{ aspectRatio: '191.93/33.65', '--fill-0': '#1A1A2E' } as React.CSSProperties}>
                <Wordmark />
              </div>
            </div>
            <div className="text-xs text-gray-600">
              <strong>Light Mode</strong><br />
              Logo: #A192F8<br />
              Text: Dark
            </div>
          </div>

          {/* Dark Background */}
          <div className="bg-[#0A0A0F] border-2 border-gray-700 rounded-lg p-6">
            <div className="flex flex-col items-center gap-2 mb-4">
              <div className="w-10" style={{ aspectRatio: '304/223' }}>
                <LogoMark />
              </div>
              <div className="w-[90px]" style={{ aspectRatio: '191.93/33.65', '--fill-0': 'white' } as React.CSSProperties}>
                <Wordmark />
              </div>
            </div>
            <div className="text-xs text-gray-400">
              <strong>Dark Mode</strong><br />
              Logo: #A192F8<br />
              Text: White
            </div>
          </div>

          {/* Monochrome White */}
          <div className="bg-[#A192F8] border-2 border-[#A192F8] rounded-lg p-6">
            <div className="flex flex-col items-center gap-2 mb-4">
              <div className="w-10" style={{ aspectRatio: '304/223', filter: 'brightness(0) invert(1)' }}>
                <LogoMark />
              </div>
              <div className="w-[90px]" style={{ aspectRatio: '191.93/33.65', '--fill-0': 'white' } as React.CSSProperties}>
                <Wordmark />
              </div>
            </div>
            <div className="text-xs text-white/90">
              <strong>Monochrome</strong><br />
              Logo: White<br />
              Text: White
            </div>
          </div>
        </div>
      </SpecSection>

      {/* Usage Don'ts */}
      <SpecSection title="Usage Guidelines - Don't">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border-2 border-red-500/30 rounded-lg p-6">
            <div className="flex items-center justify-center mb-3 opacity-50">
              <div className="w-[140px] h-[24px]">
                <div className="text-xl font-bold text-primary" style={{ fontFamily: 'Arial, sans-serif' }}>
                  NOVALINK
                </div>
              </div>
            </div>
            <p className="text-sm text-red-500 font-medium text-center">
              ✗ Don't use different fonts
            </p>
          </div>

          <div className="bg-card border-2 border-red-500/30 rounded-lg p-6">
            <div className="flex items-center justify-center mb-3 opacity-50">
              <div className="w-10 transform scale-y-150" style={{ aspectRatio: '304/223' }}>
                <LogoMark />
              </div>
            </div>
            <p className="text-sm text-red-500 font-medium text-center">
              ✗ Don't distort or stretch
            </p>
          </div>

          <div className="bg-card border-2 border-red-500/30 rounded-lg p-6">
            <div className="flex items-center justify-center mb-3 opacity-50">
              <div className="w-10" style={{ aspectRatio: '304/223', filter: 'hue-rotate(180deg)' }}>
                <LogoMark />
              </div>
            </div>
            <p className="text-sm text-red-500 font-medium text-center">
              ✗ Don't change brand colors
            </p>
          </div>

          <div className="bg-card border-2 border-red-500/30 rounded-lg p-6">
            <div className="flex items-center justify-center mb-3 opacity-50">
              <div className="w-10 transform rotate-45" style={{ aspectRatio: '304/223' }}>
                <LogoMark />
              </div>
            </div>
            <p className="text-sm text-red-500 font-medium text-center">
              ✗ Don't rotate the logo
            </p>
          </div>
        </div>
      </SpecSection>
    </div>
  );
}

// ============================================
// SECTION 1: TYPOGRAPHY
// ============================================
function TypographySection() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-primary mb-4">Typography</h2>
        <p className="text-secondary mb-6">
          Font families, sizes, weights, and text styles used across the Novalink platform.
        </p>
      </div>

      {/* Font Family */}
      <SpecSection title="Font Family">
        <div className="bg-card border border-default rounded-lg p-6">
          <code className="text-sm text-[#A192F8] font-mono">
            --font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro',
            system-ui, sans-serif;
          </code>
          <p className="text-secondary mt-4">
            Primary: <span className="font-semibold">Outfit</span> (modern, rounded sans-serif)
            <br />
            Fallback: Inter, system fonts
          </p>
        </div>
      </SpecSection>

      {/* Headings */}
      <SpecSection title="Headings">
        <div className="space-y-6">
          <TypeSpecimen
            tag="h1"
            label="Heading 1"
            specs="28px / 600 weight / 1.3 line-height"
            usage="Page titles"
          >
            <h1>The quick brown fox jumps over the lazy dog</h1>
          </TypeSpecimen>

          <TypeSpecimen
            tag="h2"
            label="Heading 2"
            specs="20px / 600 weight / 1.4 line-height"
            usage="Section headings"
          >
            <h2>The quick brown fox jumps over the lazy dog</h2>
          </TypeSpecimen>

          <TypeSpecimen
            tag="h3"
            label="Heading 3"
            specs="16px / 500 weight / 1.5 line-height"
            usage="Subsection titles"
          >
            <h3>The quick brown fox jumps over the lazy dog</h3>
          </TypeSpecimen>

          <TypeSpecimen
            tag="h4"
            label="Heading 4"
            specs="14px / 500 weight / 1.5 line-height"
            usage="Card headers, labels"
          >
            <h4>The quick brown fox jumps over the lazy dog</h4>
          </TypeSpecimen>
        </div>
      </SpecSection>

      {/* Body Text */}
      <SpecSection title="Body Text">
        <div className="space-y-6">
          <TypeSpecimen
            tag="p"
            label="Paragraph"
            specs="14px / 400 weight / 1.6 line-height"
            usage="Body copy, descriptions"
          >
            <p>
              The quick brown fox jumps over the lazy dog. This is body text used throughout the
              application for descriptions, content, and general information display.
            </p>
          </TypeSpecimen>

          <TypeSpecimen
            tag="label"
            label="Label"
            specs="14px / 500 weight / 1.5 line-height"
            usage="Form labels, table headers"
          >
            <label>Email Address</label>
          </TypeSpecimen>

          <TypeSpecimen
            tag="button"
            label="Button Text"
            specs="14px / 500 weight / 1.5 line-height"
            usage="All buttons and interactive elements"
          >
            <button className="px-4 py-2 bg-[#A192F8] text-white rounded-lg">
              Button Text
            </button>
          </TypeSpecimen>

          <TypeSpecimen
            tag="input"
            label="Input Text"
            specs="14px / 400 weight / 1.5 line-height"
            usage="Form inputs, text fields"
          >
            <input
              type="text"
              placeholder="Enter text here..."
              className="px-4 py-2 bg-page border border-default rounded-lg w-full"
            />
          </TypeSpecimen>
        </div>
      </SpecSection>

      {/* Text Colors */}
      <SpecSection title="Text Color Hierarchy">
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-card border border-default rounded-lg p-4">
            <span className="text-primary text-lg font-medium">Primary Text</span>
            <code className="text-sm text-muted">var(--text-primary)</code>
          </div>
          <div className="flex items-center justify-between bg-card border border-default rounded-lg p-4">
            <span className="text-secondary text-lg">Secondary Text</span>
            <code className="text-sm text-muted">var(--text-secondary)</code>
          </div>
          <div className="flex items-center justify-between bg-card border border-default rounded-lg p-4">
            <span className="text-muted text-lg">Muted Text</span>
            <code className="text-sm text-muted">var(--text-muted)</code>
          </div>
        </div>
      </SpecSection>
    </div>
  );
}

// ============================================
// SECTION 2: COLORS
// ============================================
function ColorsSection() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-primary mb-4">Color Palette</h2>
        <p className="text-secondary mb-6">
          All colors used in the Novalink design system with light and dark theme variants.
        </p>
      </div>

      {/* Brand Colors */}
      <SpecSection title="Brand Color">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ColorSwatch
            name="Novalink Purple"
            hex="#A192F8"
            usage="Primary actions, active states, brand identity"
            preview={<div className="w-full h-24 bg-[#A192F8] rounded-lg" />}
          />
          <ColorSwatch
            name="Purple Hover"
            hex="#9178E8"
            usage="Hover state for primary buttons"
            preview={<div className="w-full h-24 bg-[#9178E8] rounded-lg" />}
          />
        </div>
      </SpecSection>

      {/* Background Colors */}
      <SpecSection title="Background Colors">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-primary">Light Theme</h4>
            <ColorSwatch
              name="Page Background"
              cssVar="--background"
              hex="#F5F7FA"
              usage="Main page background"
              preview={<div className="w-full h-20 bg-[#F5F7FA] rounded-lg border border-default" />}
            />
            <ColorSwatch
              name="Card Background"
              cssVar="--card-background"
              hex="#FFFFFF"
              usage="Cards, modals, panels"
              preview={<div className="w-full h-20 bg-white rounded-lg border border-default" />}
            />
            <ColorSwatch
              name="Hover Background"
              cssVar="--hover-background"
              hex="#F0F2F5"
              usage="Hover states for rows, buttons"
              preview={<div className="w-full h-20 bg-[#F0F2F5] rounded-lg border border-default" />}
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-primary">Dark Theme</h4>
            <ColorSwatch
              name="Page Background"
              cssVar="--background"
              hex="#0F1117"
              usage="Main page background"
              preview={<div className="w-full h-20 bg-[#0F1117] rounded-lg border border-[#2D3343]" />}
            />
            <ColorSwatch
              name="Card Background"
              cssVar="--card-background"
              hex="#1A1D26"
              usage="Cards, modals, panels"
              preview={<div className="w-full h-20 bg-[#1A1D26] rounded-lg border border-[#2D3343]" />}
            />
            <ColorSwatch
              name="Hover Background"
              cssVar="--hover-background"
              hex="#252A36"
              usage="Hover states for rows, buttons"
              preview={<div className="w-full h-20 bg-[#252A36] rounded-lg border border-[#2D3343]" />}
            />
          </div>
        </div>
      </SpecSection>

      {/* Text Colors */}
      <SpecSection title="Text Colors">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-primary">Light Theme</h4>
            <ColorSwatch
              name="Primary Text"
              cssVar="--text-primary"
              hex="#1A1A2E"
              usage="Headings, primary content"
            />
            <ColorSwatch
              name="Secondary Text"
              cssVar="--text-secondary"
              hex="#6B7280"
              usage="Supporting text, labels"
            />
            <ColorSwatch
              name="Muted Text"
              cssVar="--text-muted"
              hex="#9CA3AF"
              usage="Placeholder, disabled states"
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-primary">Dark Theme</h4>
            <ColorSwatch
              name="Primary Text"
              cssVar="--text-primary"
              hex="#F9FAFB"
              usage="Headings, primary content"
            />
            <ColorSwatch
              name="Secondary Text"
              cssVar="--text-secondary"
              hex="#9CA3AF"
              usage="Supporting text, labels"
            />
            <ColorSwatch
              name="Muted Text"
              cssVar="--text-muted"
              hex="#6B7280"
              usage="Placeholder, disabled states"
            />
          </div>
        </div>
      </SpecSection>

      {/* Metric Card Colors */}
      <SpecSection title="Metric Card Accent Colors">
        <p className="text-secondary mb-4">
          Colorful accent colors used for metric cards and data visualization
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <ColorSwatch
            name="Lime"
            hex="#CBF083"
            darkHex="#3D5A1F"
            usage="Users, growth metrics"
            preview={
              <div className="flex gap-2">
                <div className="flex-1 h-16 bg-[#CBF083] rounded-lg" />
                <div className="flex-1 h-16 bg-[#3D5A1F] rounded-lg" />
              </div>
            }
          />
          <ColorSwatch
            name="Peach"
            hex="#FFBFB3"
            darkHex="#5A3D37"
            usage="Revenue, financial"
            preview={
              <div className="flex gap-2">
                <div className="flex-1 h-16 bg-[#FFBFB3] rounded-lg" />
                <div className="flex-1 h-16 bg-[#5A3D37] rounded-lg" />
              </div>
            }
          />
          <ColorSwatch
            name="Pink"
            hex="#F0B4D4"
            darkHex="#5A3D4D"
            usage="Transactions, activity"
            preview={
              <div className="flex gap-2">
                <div className="flex-1 h-16 bg-[#F0B4D4] rounded-lg" />
                <div className="flex-1 h-16 bg-[#5A3D4D] rounded-lg" />
              </div>
            }
          />
          <ColorSwatch
            name="Blue"
            hex="#93C5FD"
            darkHex="#1E3A5F"
            usage="Active users, engagement"
            preview={
              <div className="flex gap-2">
                <div className="flex-1 h-16 bg-[#93C5FD] rounded-lg" />
                <div className="flex-1 h-16 bg-[#1E3A5F] rounded-lg" />
              </div>
            }
          />
          <ColorSwatch
            name="Mint"
            hex="#93E5DB"
            darkHex="#1F4A47"
            usage="Referrals, network"
            preview={
              <div className="flex gap-2">
                <div className="flex-1 h-16 bg-[#93E5DB] rounded-lg" />
                <div className="flex-1 h-16 bg-[#1F4A47] rounded-lg" />
              </div>
            }
          />
          <ColorSwatch
            name="Purple"
            hex="#C4B5FD"
            darkHex="#3D3A5A"
            usage="Quests, achievements"
            preview={
              <div className="flex gap-2">
                <div className="flex-1 h-16 bg-[#C4B5FD] rounded-lg" />
                <div className="flex-1 h-16 bg-[#3D3A5A] rounded-lg" />
              </div>
            }
          />
        </div>
      </SpecSection>

      {/* Status Colors */}
      <SpecSection title="Status & Semantic Colors">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ColorSwatch
            name="Success / Active"
            hex="#22C55E"
            usage="Success messages, active states, production badge"
            preview={<div className="w-full h-20 bg-[#22C55E] rounded-lg" />}
          />
          <ColorSwatch
            name="Warning / Staging"
            hex="#F59E0B"
            usage="Warning alerts, staging environment badge"
            preview={<div className="w-full h-20 bg-[#F59E0B] rounded-lg" />}
          />
          <ColorSwatch
            name="Error / Danger"
            hex="#EF4444"
            usage="Error messages, destructive actions"
            preview={<div className="w-full h-20 bg-[#EF4444] rounded-lg" />}
          />
          <ColorSwatch
            name="Info"
            hex="#3B82F6"
            usage="Information alerts, links"
            preview={<div className="w-full h-20 bg-[#3B82F6] rounded-lg" />}
          />
        </div>
      </SpecSection>

      {/* Border Colors */}
      <SpecSection title="Border Colors">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-primary">Light Theme</h4>
            <ColorSwatch
              name="Default Border"
              cssVar="--border"
              hex="#E5E7EB"
              usage="Cards, inputs, dividers"
              preview={
                <div className="w-full h-20 bg-white rounded-lg border-2 border-[#E5E7EB]" />
              }
            />
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-primary">Dark Theme</h4>
            <ColorSwatch
              name="Default Border"
              cssVar="--border"
              hex="#2D3343"
              usage="Cards, inputs, dividers"
              preview={
                <div className="w-full h-20 bg-[#1A1D26] rounded-lg border-2 border-[#2D3343]" />
              }
            />
          </div>
        </div>
      </SpecSection>
    </div>
  );
}

// ============================================
// SECTION 3: SPACING & LAYOUT
// ============================================
function SpacingSection() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-primary mb-4">Spacing & Layout</h2>
        <p className="text-secondary mb-6">
          Spacing system, layout patterns, and structural guidelines.
        </p>
      </div>

      {/* Border Radius */}
      <SpecSection title="Border Radius">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-card border border-default rounded-lg p-4">
            <div className="w-20 h-20 bg-[#A192F8] rounded-[8px] mb-3" />
            <div className="text-sm font-medium text-primary">Small</div>
            <code className="text-xs text-muted">8px / --radius-sm</code>
            <p className="text-xs text-muted mt-1">Small buttons, badges</p>
          </div>
          <div className="bg-card border border-default rounded-lg p-4">
            <div className="w-20 h-20 bg-[#A192F8] rounded-[12px] mb-3" />
            <div className="text-sm font-medium text-primary">Medium</div>
            <code className="text-xs text-muted">12px / --radius-md</code>
            <p className="text-xs text-muted mt-1">Inputs, regular buttons</p>
          </div>
          <div className="bg-card border border-default rounded-lg p-4">
            <div className="w-20 h-20 bg-[#A192F8] rounded-[16px] mb-3" />
            <div className="text-sm font-medium text-primary">Large</div>
            <code className="text-xs text-muted">16px / --radius-lg</code>
            <p className="text-xs text-muted mt-1">Cards, panels</p>
          </div>
          <div className="bg-card border border-default rounded-lg p-4">
            <div className="w-20 h-20 bg-[#A192F8] rounded-[20px] mb-3" />
            <div className="text-sm font-medium text-primary">XL</div>
            <code className="text-xs text-muted">20px / --radius-xl</code>
            <p className="text-xs text-muted mt-1">Modals, drawers</p>
          </div>
          <div className="bg-card border border-default rounded-lg p-4">
            <div className="w-20 h-20 bg-[#A192F8] rounded-full mb-3" />
            <div className="text-sm font-medium text-primary">Full</div>
            <code className="text-xs text-muted">999px / --radius-full</code>
            <p className="text-xs text-muted mt-1">Pills, avatars, badges</p>
          </div>
        </div>
      </SpecSection>

      {/* Shadows */}
      <SpecSection title="Shadows (Light Theme Only)">
        <div className="space-y-4">
          <div className="bg-page p-6 rounded-lg">
            <div className="bg-card border border-default rounded-lg p-6" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
              <div className="text-sm font-medium text-primary mb-1">Small Shadow</div>
              <code className="text-xs text-muted">
                0 1px 3px rgba(0, 0, 0, 0.05) / --shadow-sm
              </code>
              <p className="text-xs text-muted mt-2">Subtle elevation for cards</p>
            </div>
          </div>
          <div className="bg-page p-6 rounded-lg">
            <div className="bg-card border border-default rounded-lg p-6" style={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)' }}>
              <div className="text-sm font-medium text-primary mb-1">Medium Shadow</div>
              <code className="text-xs text-muted">
                0 4px 6px rgba(0, 0, 0, 0.07) / --shadow-md
              </code>
              <p className="text-xs text-muted mt-2">Dropdowns, tooltips</p>
            </div>
          </div>
          <div className="bg-page p-6 rounded-lg">
            <div className="bg-card border border-default rounded-lg p-6" style={{ boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)' }}>
              <div className="text-sm font-medium text-primary mb-1">Large Shadow</div>
              <code className="text-xs text-muted">
                0 10px 15px rgba(0, 0, 0, 0.1) / --shadow-lg
              </code>
              <p className="text-xs text-muted mt-2">Modals, popovers</p>
            </div>
          </div>
          <div className="bg-card border border-default rounded-lg p-4">
            <p className="text-sm text-muted">
              <strong>Note:</strong> Dark theme uses no shadows (--shadow-*: none)
            </p>
          </div>
        </div>
      </SpecSection>

      {/* Layout Structure */}
      <SpecSection title="Common Layout Patterns">
        <div className="space-y-6">
          <div className="bg-card border border-default rounded-lg p-6">
            <h4 className="text-sm font-semibold text-primary mb-3">Sidebar Layout</h4>
            <div className="space-y-2 text-sm text-secondary">
              <div className="flex justify-between">
                <span>Sidebar width (mobile):</span>
                <code className="text-muted">80px (w-20)</code>
              </div>
              <div className="flex justify-between">
                <span>Sidebar width (desktop):</span>
                <code className="text-muted">256px (w-64)</code>
              </div>
              <div className="flex justify-between">
                <span>Sidebar padding:</span>
                <code className="text-muted">8px (p-2)</code>
              </div>
              <div className="flex justify-between">
                <span>Sidebar border radius:</span>
                <code className="text-muted">24px (rounded-3xl)</code>
              </div>
            </div>
          </div>

          <div className="bg-card border border-default rounded-lg p-6">
            <h4 className="text-sm font-semibold text-primary mb-3">Top Bar</h4>
            <div className="space-y-2 text-sm text-secondary">
              <div className="flex justify-between">
                <span>Height:</span>
                <code className="text-muted">64px (h-16)</code>
              </div>
              <div className="flex justify-between">
                <span>Horizontal padding:</span>
                <code className="text-muted">12px (px-3)</code>
              </div>
            </div>
          </div>

          <div className="bg-card border border-default rounded-lg p-6">
            <h4 className="text-sm font-semibold text-primary mb-3">Page Content</h4>
            <div className="space-y-2 text-sm text-secondary">
              <div className="flex justify-between">
                <span>Page padding:</span>
                <code className="text-muted">12px (p-3)</code>
              </div>
              <div className="flex justify-between">
                <span>Card gap:</span>
                <code className="text-muted">16px (gap-4)</code>
              </div>
              <div className="flex justify-between">
                <span>Section margin bottom:</span>
                <code className="text-muted">16px (mb-4)</code>
              </div>
            </div>
          </div>

          <div className="bg-card border border-default rounded-lg p-6">
            <h4 className="text-sm font-semibold text-primary mb-3">Card Padding</h4>
            <div className="space-y-2 text-sm text-secondary">
              <div className="flex justify-between">
                <span>Standard card:</span>
                <code className="text-muted">24px (p-6)</code>
              </div>
              <div className="flex justify-between">
                <span>Compact card:</span>
                <code className="text-muted">16px (p-4)</code>
              </div>
              <div className="flex justify-between">
                <span>Large card:</span>
                <code className="text-muted">32px (p-8)</code>
              </div>
            </div>
          </div>
        </div>
      </SpecSection>

      {/* Grid System */}
      <SpecSection title="Grid System">
        <div className="bg-card border border-default rounded-lg p-6">
          <h4 className="text-sm font-semibold text-primary mb-4">Responsive Grid</h4>
          <div className="space-y-3 text-sm text-secondary">
            <div>
              <div className="font-medium text-primary mb-1">Metric Cards Grid:</div>
              <code className="text-xs text-muted">
                grid-cols-1 md:grid-cols-2 lg:grid-cols-3
              </code>
              <p className="text-xs text-muted mt-1">
                1 column mobile, 2 columns tablet, 3 columns desktop
              </p>
            </div>
            <div>
              <div className="font-medium text-primary mb-1">Two Column Layout:</div>
              <code className="text-xs text-muted">grid-cols-1 lg:grid-cols-2</code>
              <p className="text-xs text-muted mt-1">
                Stacked on mobile/tablet, side-by-side on desktop
              </p>
            </div>
            <div>
              <div className="font-medium text-primary mb-1">Gap spacing:</div>
              <code className="text-xs text-muted">gap-4 (16px)</code>
            </div>
          </div>
        </div>
      </SpecSection>
    </div>
  );
}

// ============================================
// SECTION 4: BUTTONS
// ============================================
function ButtonsSection() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-primary mb-4">Buttons</h2>
        <p className="text-secondary mb-6">All button variants, sizes, and states.</p>
      </div>

      {/* Primary Buttons */}
      <SpecSection title="Primary Button">
        <div className="space-y-6">
          <div className="bg-card border border-default rounded-lg p-6">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <button className="px-5 py-2.5 bg-[#A192F8] text-white rounded-lg text-sm font-medium hover:bg-[#9178E8] transition-colors cursor-pointer">
                Primary Button
              </button>
              <button className="px-5 py-2.5 bg-[#9178E8] text-white rounded-lg text-sm font-medium cursor-pointer">
                Hover State
              </button>
              <button
                className="px-5 py-2.5 bg-[#A192F8]/50 text-white/50 rounded-lg text-sm font-medium cursor-not-allowed"
                disabled
              >
                Disabled
              </button>
            </div>
            <div className="space-y-1 text-sm text-secondary">
              <div>
                <strong>Default:</strong>{' '}
                <code className="text-xs">bg-[#A192F8] text-white rounded-lg</code>
              </div>
              <div>
                <strong>Hover:</strong> <code className="text-xs">hover:bg-[#9178E8]</code>
              </div>
              <div>
                <strong>Padding:</strong> <code className="text-xs">px-5 py-2.5</code>
              </div>
              <div>
                <strong>Usage:</strong> Primary actions, CTAs, submit buttons
              </div>
            </div>
          </div>

          {/* With Icon */}
          <div className="bg-card border border-default rounded-lg p-6">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <button className="px-5 py-2.5 bg-[#A192F8] text-white rounded-lg text-sm font-medium hover:bg-[#9178E8] transition-colors flex items-center gap-2 cursor-pointer">
                <Check className="w-4 h-4" />
                With Icon
              </button>
              <button className="px-5 py-2.5 bg-[#A192F8] text-white rounded-lg text-sm font-medium hover:bg-[#9178E8] transition-colors flex items-center gap-2 cursor-pointer">
                Save Changes
                <Check className="w-4 h-4" />
              </button>
            </div>
            <div className="text-sm text-secondary">
              <strong>Icon gap:</strong> <code className="text-xs">gap-2</code>
              <br />
              <strong>Icon size:</strong> <code className="text-xs">w-4 h-4 (16px)</code>
            </div>
          </div>
        </div>
      </SpecSection>

      {/* Secondary/Ghost Buttons */}
      <SpecSection title="Secondary & Ghost Buttons">
        <div className="space-y-6">
          <div className="bg-card border border-default rounded-lg p-6">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <button className="px-4 py-2 bg-page border border-default rounded-lg text-sm font-medium text-primary hover:bg-hover transition-colors cursor-pointer">
                Secondary
              </button>
              <button className="px-4 py-2 text-secondary hover:bg-hover hover:text-primary rounded-lg text-sm font-medium transition-colors cursor-pointer">
                Ghost Button
              </button>
            </div>
            <div className="space-y-1 text-sm text-secondary">
              <div>
                <strong>Secondary:</strong>{' '}
                <code className="text-xs">bg-page border border-default</code>
              </div>
              <div>
                <strong>Ghost:</strong>{' '}
                <code className="text-xs">text-secondary hover:bg-hover</code>
              </div>
            </div>
          </div>
        </div>
      </SpecSection>

      {/* Filter/Action Buttons */}
      <SpecSection title="Filter & Action Buttons">
        <div className="bg-card border border-default rounded-lg p-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-page border border-default rounded-lg text-sm font-medium text-primary hover:bg-hover transition-colors cursor-pointer">
              <Type className="w-4 h-4" />
              Filters
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-page border border-default rounded-lg text-sm font-medium text-primary hover:bg-hover transition-colors cursor-pointer">
              <Table className="w-4 h-4" />
              Columns
            </button>
          </div>
          <div className="text-sm text-secondary">
            <strong>Usage:</strong> Table actions, filters, column toggles
          </div>
        </div>
      </SpecSection>

      {/* Icon-only Buttons */}
      <SpecSection title="Icon-Only Buttons">
        <div className="bg-card border border-default rounded-lg p-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-page border border-default hover:bg-hover transition-colors cursor-pointer">
              <Type className="w-5 h-5 text-secondary" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-[#A192F8] text-white hover:bg-[#9178E8] transition-colors cursor-pointer">
              <Check className="w-5 h-5" />
            </button>
          </div>
          <div className="text-sm text-secondary">
            <strong>Size:</strong> <code className="text-xs">w-10 h-10 (40px)</code>
            <br />
            <strong>Icon:</strong> <code className="text-xs">w-5 h-5 (20px)</code>
          </div>
        </div>
      </SpecSection>

      {/* Button Sizes */}
      <SpecSection title="Button Sizes">
        <div className="bg-card border border-default rounded-lg p-6">
          <div className="flex flex-wrap items-end gap-4 mb-4">
            <button className="px-3 py-1.5 bg-[#A192F8] text-white rounded-lg text-xs font-medium cursor-pointer">
              Small
            </button>
            <button className="px-4 py-2 bg-[#A192F8] text-white rounded-lg text-sm font-medium cursor-pointer">
              Medium (Default)
            </button>
            <button className="px-5 py-2.5 bg-[#A192F8] text-white rounded-lg text-sm font-medium cursor-pointer">
              Large
            </button>
          </div>
          <div className="space-y-1 text-sm text-secondary">
            <div>
              <strong>Small:</strong> <code className="text-xs">px-3 py-1.5 text-xs</code>
            </div>
            <div>
              <strong>Medium:</strong> <code className="text-xs">px-4 py-2 text-sm</code>
            </div>
            <div>
              <strong>Large:</strong> <code className="text-xs">px-5 py-2.5 text-sm</code>
            </div>
          </div>
        </div>
      </SpecSection>
    </div>
  );
}

// ============================================
// SECTION 5: INPUTS & FORMS
// ============================================
function InputsSection() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-primary mb-4">Inputs & Forms</h2>
        <p className="text-secondary mb-6">Form elements, input fields, and interactive controls.</p>
      </div>

      {/* Text Input */}
      <SpecSection title="Text Input">
        <div className="space-y-4">
          <div className="bg-card border border-default rounded-lg p-6">
            <label className="block text-sm font-medium text-primary mb-2">Email Address</label>
            <input
              type="email"
              placeholder="Enter your email..."
              className="w-full px-4 py-2.5 bg-page border border-default rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#A192F8] focus:border-transparent transition-all"
            />
            <div className="mt-4 space-y-1 text-sm text-secondary">
              <div>
                <strong>Base:</strong>{' '}
                <code className="text-xs">bg-page border border-default rounded-lg</code>
              </div>
              <div>
                <strong>Padding:</strong> <code className="text-xs">px-4 py-2.5</code>
              </div>
              <div>
                <strong>Focus:</strong>{' '}
                <code className="text-xs">focus:ring-2 focus:ring-[#A192F8]</code>
              </div>
            </div>
          </div>

          <div className="bg-card border border-default rounded-lg p-6">
            <label className="block text-sm font-medium text-primary mb-2">Disabled Input</label>
            <input
              type="text"
              placeholder="Disabled input"
              disabled
              className="w-full px-4 py-2.5 bg-page border border-default rounded-lg text-muted cursor-not-allowed opacity-50"
            />
          </div>
        </div>
      </SpecSection>

      {/* Search Input */}
      <SpecSection title="Search Input">
        <div className="bg-card border border-default rounded-lg p-6">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">
              <Type className="w-4 h-4" />
            </div>
            <input
              type="search"
              placeholder="Search by email, wallet, IP, or user ID"
              className="w-full pl-11 pr-4 py-2.5 bg-page border border-default rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#A192F8] focus:border-transparent transition-all"
            />
          </div>
          <div className="mt-4 space-y-1 text-sm text-secondary">
            <div>
              <strong>Icon position:</strong> <code className="text-xs">absolute left-4</code>
            </div>
            <div>
              <strong>Input padding:</strong> <code className="text-xs">pl-11 (for icon space)</code>
            </div>
          </div>
        </div>
      </SpecSection>

      {/* Select/Dropdown */}
      <SpecSection title="Select / Dropdown">
        <div className="bg-card border border-default rounded-lg p-6">
          <label className="block text-sm font-medium text-primary mb-2">Select Option</label>
          <select className="w-full px-4 py-2.5 bg-page border border-default rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-[#A192F8] focus:border-transparent transition-all cursor-pointer">
            <option>Option 1</option>
            <option>Option 2</option>
            <option>Option 3</option>
          </select>
          <div className="mt-4 text-sm text-secondary">
            <strong>Styling:</strong> Same as text input
          </div>
        </div>
      </SpecSection>

      {/* Checkbox */}
      <SpecSection title="Checkbox">
        <div className="bg-card border border-default rounded-lg p-6">
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-default text-[#A192F8] focus:ring-2 focus:ring-[#A192F8] cursor-pointer"
              />
              <span className="text-sm text-secondary group-hover:text-primary transition-colors">
                Checkbox option
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked
                readOnly
                className="w-4 h-4 rounded border-default text-[#A192F8] focus:ring-2 focus:ring-[#A192F8] cursor-pointer"
              />
              <span className="text-sm text-secondary group-hover:text-primary transition-colors">
                Checked state
              </span>
            </label>
          </div>
          <div className="mt-4 space-y-1 text-sm text-secondary">
            <div>
              <strong>Size:</strong> <code className="text-xs">w-4 h-4</code>
            </div>
            <div>
              <strong>Color:</strong> <code className="text-xs">text-[#A192F8]</code>
            </div>
          </div>
        </div>
      </SpecSection>

      {/* Toggle Switch */}
      <SpecSection title="Toggle Switch">
        <div className="bg-card border border-default rounded-lg p-6">
          <div className="bg-page rounded-full p-1 flex w-fit mb-4">
            <button className="px-4 py-1.5 rounded-full text-sm font-medium bg-[#22C55E] text-white cursor-pointer">
              Option A
            </button>
            <button className="px-4 py-1.5 rounded-full text-sm font-medium text-secondary hover:text-primary cursor-pointer">
              Option B
            </button>
          </div>
          <div className="space-y-1 text-sm text-secondary">
            <div>
              <strong>Usage:</strong> Binary state toggles, environment switchers
            </div>
            <div>
              <strong>Container:</strong> <code className="text-xs">bg-page rounded-full p-1</code>
            </div>
            <div>
              <strong>Active:</strong> <code className="text-xs">bg-[#22C55E] text-white</code>
            </div>
            <div>
              <strong>Inactive:</strong> <code className="text-xs">text-secondary hover:text-primary</code>
            </div>
          </div>
        </div>
      </SpecSection>

      {/* Textarea */}
      <SpecSection title="Textarea">
        <div className="bg-card border border-default rounded-lg p-6">
          <label className="block text-sm font-medium text-primary mb-2">Message</label>
          <textarea
            rows={4}
            placeholder="Enter your message..."
            className="w-full px-4 py-2.5 bg-page border border-default rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#A192F8] focus:border-transparent transition-all resize-none"
          />
          <div className="mt-4 text-sm text-secondary">
            <strong>Styling:</strong> Same as text input, with{' '}
            <code className="text-xs">resize-none</code>
          </div>
        </div>
      </SpecSection>
    </div>
  );
}

// ============================================
// SECTION 6: CARDS & CONTAINERS
// ============================================
function CardsSection() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-primary mb-4">Cards & Containers</h2>
        <p className="text-secondary mb-6">Card styles, panels, modals, and container patterns.</p>
      </div>

      {/* Standard Card */}
      <SpecSection title="Standard Card">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Light Mode */}
          <div>
            <div className="text-xs font-medium text-muted mb-2 text-center">Light Mode</div>
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Card Title</h3>
              <p className="text-[#64748B] mb-4">
                This is a standard card component used throughout the dashboard for grouping related
                content.
              </p>
              <div className="space-y-1 text-sm text-[#64748B]">
                <div>
                  <strong>Background:</strong> <code className="text-xs">bg-card</code>
                </div>
                <div>
                  <strong>Border:</strong> <code className="text-xs">border border-default</code>
                </div>
                <div>
                  <strong>Radius:</strong> <code className="text-xs">rounded-lg (12px)</code>
                </div>
                <div>
                  <strong>Padding:</strong> <code className="text-xs">p-6 (24px)</code>
                </div>
                <div>
                  <strong>Shadow:</strong> <code className="text-xs">Optional shadow-card (light theme)</code>
                </div>
              </div>
            </div>
          </div>

          {/* Dark Mode */}
          <div>
            <div className="text-xs font-medium text-muted mb-2 text-center">Dark Mode</div>
            <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-[#F8FAFC] mb-2">Card Title</h3>
              <p className="text-[#94A3B8] mb-4">
                This is a standard card component used throughout the dashboard for grouping related
                content.
              </p>
              <div className="space-y-1 text-sm text-[#94A3B8]">
                <div>
                  <strong>Background:</strong> <code className="text-xs">bg-card</code>
                </div>
                <div>
                  <strong>Border:</strong> <code className="text-xs">border border-default</code>
                </div>
                <div>
                  <strong>Radius:</strong> <code className="text-xs">rounded-lg (12px)</code>
                </div>
                <div>
                  <strong>Padding:</strong> <code className="text-xs">p-6 (24px)</code>
                </div>
                <div>
                  <strong>Shadow:</strong> <code className="text-xs">Optional shadow-card (light theme)</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SpecSection>

      {/* Metric Card */}
      <SpecSection title="Colorful Metric Card">
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Light Mode */}
            <div>
              <div className="text-xs font-medium text-muted mb-2 text-center">Light Mode</div>
              <div className="bg-[#CBF083] text-[#1A1A2E] rounded-lg p-6 border-2 border-transparent">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm font-medium mb-1">Total Users</div>
                    <div className="text-3xl font-semibold">184,939</div>
                  </div>
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-sm opacity-80">+12% vs last week</div>
              </div>
            </div>

            {/* Dark Mode */}
            <div>
              <div className="text-xs font-medium text-muted mb-2 text-center">Dark Mode</div>
              <div className="bg-[#3D5A1F] text-[#FFFFFF] rounded-lg p-6 border-2 border-transparent">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm font-medium mb-1">Total Users</div>
                    <div className="text-3xl font-semibold">184,939</div>
                  </div>
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-sm opacity-80">+12% vs last week</div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-default rounded-lg p-6">
            <div className="space-y-2 text-sm text-secondary">
              <div>
                <strong>Colors:</strong> 6 accent colors (lime, peach, pink, blue, mint, purple)
              </div>
              <div>
                <strong>Icon container:</strong>{' '}
                <code className="text-xs">bg-white/20 w-10 h-10 rounded-lg</code>
              </div>
              <div>
                <strong>Border:</strong> <code className="text-xs">border-2 border-transparent</code>
              </div>
              <div>
                <strong>Usage:</strong> Overview page KPIs, important metrics
              </div>
              <div>
                <strong>Note:</strong> Metric cards use solid colors and remain the same in both light and dark modes
              </div>
            </div>
          </div>
        </div>
      </SpecSection>

      {/* Data Card */}
      <SpecSection title="Data Card (with Header)">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Light Mode */}
          <div>
            <div className="text-xs font-medium text-muted mb-2 text-center">Light Mode</div>
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg overflow-hidden">
              <div className="border-b border-[#E5E7EB] px-6 py-4 bg-[#F9FAFB]">
                <h3 className="text-base font-semibold text-[#0F172A]">Recent Activity</h3>
              </div>
              <div className="p-6">
                <p className="text-[#64748B] text-sm">
                  Card content goes here. Header uses a slightly different background.
                </p>
              </div>
              <div className="px-6 pb-6 space-y-1 text-sm text-[#64748B]">
                <div>
                  <strong>Header:</strong>{' '}
                  <code className="text-xs">bg-hover border-b border-default px-6 py-4</code>
                </div>
                <div>
                  <strong>Body:</strong> <code className="text-xs">p-6</code>
                </div>
                <div>
                  <strong>Container:</strong> <code className="text-xs">overflow-hidden</code> (for clean corners)
                </div>
              </div>
            </div>
          </div>

          {/* Dark Mode */}
          <div>
            <div className="text-xs font-medium text-muted mb-2 text-center">Dark Mode</div>
            <div className="bg-[#1E293B] border border-[#334155] rounded-lg overflow-hidden">
              <div className="border-b border-[#334155] px-6 py-4 bg-[#1E293B]/80">
                <h3 className="text-base font-semibold text-[#F8FAFC]">Recent Activity</h3>
              </div>
              <div className="p-6">
                <p className="text-[#94A3B8] text-sm">
                  Card content goes here. Header uses a slightly different background.
                </p>
              </div>
              <div className="px-6 pb-6 space-y-1 text-sm text-[#94A3B8]">
                <div>
                  <strong>Header:</strong>{' '}
                  <code className="text-xs">bg-hover border-b border-default px-6 py-4</code>
                </div>
                <div>
                  <strong>Body:</strong> <code className="text-xs">p-6</code>
                </div>
                <div>
                  <strong>Container:</strong> <code className="text-xs">overflow-hidden</code> (for clean corners)
                </div>
              </div>
            </div>
          </div>
        </div>
      </SpecSection>

      {/* Alert Card */}
      <SpecSection title="Alert Cards">
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Light Mode */}
            <div className="space-y-4">
              <div className="text-xs font-medium text-muted mb-2 text-center">Light Mode</div>
              
              <div className="bg-[#F59E0B]/10 border-l-4 border-[#F59E0B] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Type className="w-5 h-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-[#0F172A] mb-1">Warning Alert</div>
                    <div className="text-sm text-[#64748B] mb-2">
                      This is a warning message to draw attention to important information.
                    </div>
                    <div className="text-xs text-[#94A3B8]">2 minutes ago</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#3B82F6]/10 border-l-4 border-[#3B82F6] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Type className="w-5 h-5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-[#0F172A] mb-1">Info Alert</div>
                    <div className="text-sm text-[#64748B] mb-2">
                      Informational message with helpful context.
                    </div>
                    <div className="text-xs text-[#94A3B8]">15 minutes ago</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dark Mode */}
            <div className="space-y-4">
              <div className="text-xs font-medium text-muted mb-2 text-center">Dark Mode</div>
              
              <div className="bg-[#1E293B] border-l-4 border-[#F59E0B] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Type className="w-5 h-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-[#F8FAFC] mb-1">Warning Alert</div>
                    <div className="text-sm text-[#94A3B8] mb-2">
                      This is a warning message to draw attention to important information.
                    </div>
                    <div className="text-xs text-[#64748B]">2 minutes ago</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#1E293B] border-l-4 border-[#3B82F6] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Type className="w-5 h-5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-[#F8FAFC] mb-1">Info Alert</div>
                    <div className="text-sm text-[#94A3B8] mb-2">
                      Informational message with helpful context.
                    </div>
                    <div className="text-xs text-[#64748B]">15 minutes ago</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-default rounded-lg p-4">
            <div className="space-y-1 text-sm text-secondary">
              <div>
                <strong>Background:</strong> <code className="text-xs">bg-[color]/10</code> (light), <code className="text-xs">bg-card</code> (dark)
              </div>
              <div>
                <strong>Border:</strong> <code className="text-xs">border-l-4 border-[color]</code>
              </div>
              <div>
                <strong>Icon color:</strong> <code className="text-xs">text-[color]</code>
              </div>
              <div>
                <strong>Colors:</strong> Warning (#F59E0B), Info (#3B82F6), Error (#EF4444), Success
                (#22C55E)
              </div>
            </div>
          </div>
        </div>
      </SpecSection>

      {/* Modal/Drawer */}
      <SpecSection title="Modals & Drawers">
        <div className="space-y-6">
          {/* Drawer Examples */}
          <div>
            <h3 className="text-base font-semibold text-primary mb-4">Drawer (Side Panel)</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Light Mode */}
              <div>
                <div className="text-xs font-medium text-muted mb-2 text-center">Light Mode</div>
                <div className="bg-[#F1F5F9] rounded-lg p-4 relative" style={{ minHeight: '280px' }}>
                  <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#FFFFFF] border-l border-[#E2E8F0] shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-[#0F172A]">Settings</h3>
                      <button className="w-8 h-8 rounded-lg hover:bg-[#F1F5F9] flex items-center justify-center">
                        <X className="w-5 h-5 text-[#64748B]" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-[#0F172A] block mb-2">Theme</label>
                        <select className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]">
                          <option>Light</option>
                          <option>Dark</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[#0F172A] block mb-2">Notifications</label>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="w-4 h-4" />
                          <span className="text-sm text-[#64748B]">Enable push notifications</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dark Mode */}
              <div>
                <div className="text-xs font-medium text-muted mb-2 text-center">Dark Mode</div>
                <div className="bg-[#0F172A] rounded-lg p-4 relative" style={{ minHeight: '280px' }}>
                  <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#1E293B] border-l border-[#334155] shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-[#F8FAFC]">Settings</h3>
                      <button className="w-8 h-8 rounded-lg hover:bg-[#334155] flex items-center justify-center">
                        <X className="w-5 h-5 text-[#94A3B8]" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-[#F8FAFC] block mb-2">Theme</label>
                        <select className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-[#F8FAFC]">
                          <option>Light</option>
                          <option>Dark</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[#F8FAFC] block mb-2">Notifications</label>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="w-4 h-4" />
                          <span className="text-sm text-[#94A3B8]">Enable push notifications</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-card border border-default rounded-lg p-4 mt-4">
              <div className="space-y-1 text-sm text-secondary">
                <div>
                  <strong>Position:</strong> <code className="text-xs">fixed right-0 top-0 h-full</code>
                </div>
                <div>
                  <strong>Width:</strong> <code className="text-xs">w-full max-w-96 (max 384px)</code>
                </div>
                <div>
                  <strong>Background:</strong> <code className="text-xs">bg-card border-l border-default</code>
                </div>
                <div>
                  <strong>Z-index:</strong> <code className="text-xs">z-50</code>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Examples */}
          <div>
            <h3 className="text-base font-semibold text-primary mb-4">Modal (Center)</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Light Mode */}
              <div>
                <div className="text-xs font-medium text-muted mb-2 text-center">Light Mode</div>
                <div className="bg-black/50 rounded-lg p-8 flex items-center justify-center" style={{ minHeight: '280px' }}>
                  <div className="bg-[#FFFFFF] rounded-xl shadow-xl max-w-md w-full p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-[#0F172A]">Confirm Action</h3>
                      <button className="w-8 h-8 rounded-lg hover:bg-[#F1F5F9] flex items-center justify-center">
                        <X className="w-5 h-5 text-[#64748B]" />
                      </button>
                    </div>
                    <p className="text-sm text-[#64748B] mb-6">
                      Are you sure you want to proceed with this action? This cannot be undone.
                    </p>
                    <div className="flex gap-3 justify-end">
                      <button className="px-4 py-2 text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9] rounded-lg">
                        Cancel
                      </button>
                      <button className="px-4 py-2 text-sm font-medium bg-[#A192F8] text-white rounded-lg hover:bg-[#9182E7]">
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dark Mode */}
              <div>
                <div className="text-xs font-medium text-muted mb-2 text-center">Dark Mode</div>
                <div className="bg-black/50 rounded-lg p-8 flex items-center justify-center" style={{ minHeight: '280px' }}>
                  <div className="bg-[#1E293B] rounded-xl shadow-xl max-w-md w-full p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-[#F8FAFC]">Confirm Action</h3>
                      <button className="w-8 h-8 rounded-lg hover:bg-[#334155] flex items-center justify-center">
                        <X className="w-5 h-5 text-[#94A3B8]" />
                      </button>
                    </div>
                    <p className="text-sm text-[#94A3B8] mb-6">
                      Are you sure you want to proceed with this action? This cannot be undone.
                    </p>
                    <div className="flex gap-3 justify-end">
                      <button className="px-4 py-2 text-sm font-medium text-[#94A3B8] hover:bg-[#334155] rounded-lg">
                        Cancel
                      </button>
                      <button className="px-4 py-2 text-sm font-medium bg-[#A192F8] text-white rounded-lg hover:bg-[#9182E7]">
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-card border border-default rounded-lg p-4 mt-4">
              <div className="space-y-1 text-sm text-secondary">
                <div>
                  <strong>Backdrop:</strong> <code className="text-xs">bg-black/50 fixed inset-0</code>
                </div>
                <div>
                  <strong>Container:</strong> <code className="text-xs">max-w-lg rounded-xl bg-card</code>
                </div>
                <div>
                  <strong>Shadow:</strong> <code className="text-xs">shadow-xl</code>
                </div>
                <div>
                  <strong>Z-index:</strong> <code className="text-xs">z-50</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SpecSection>
    </div>
  );
}

// ============================================
// SECTION 7: TABLES
// ============================================
function TablesSection() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-primary mb-4">Tables</h2>
        <p className="text-secondary mb-6">Table styling, headers, rows, and data display.</p>
      </div>

      {/* Table Example */}
      <SpecSection title="Standard Table">
        <div className="bg-card border border-default rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-default bg-hover">
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4 rounded cursor-pointer" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-default hover:bg-hover transition-colors">
                <td className="px-4 py-4">
                  <input type="checkbox" className="w-4 h-4 rounded cursor-pointer" />
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-secondary font-mono">abc123def456</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-primary">user@example.com</span>
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30">
                    Active
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-hover transition-colors">
                <td className="px-4 py-4">
                  <input type="checkbox" className="w-4 h-4 rounded cursor-pointer" />
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-secondary font-mono">xyz789ghi012</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-primary">another@example.com</span>
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium bg-muted/10 text-muted border-muted/30">
                    Inactive
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 bg-card border border-default rounded-lg p-6">
          <h4 className="text-sm font-semibold text-primary mb-4">Table Specifications</h4>
          <div className="space-y-3 text-sm text-secondary">
            <div>
              <strong>Container:</strong>{' '}
              <code className="text-xs">bg-card border border-default rounded-lg overflow-hidden</code>
            </div>
            <div>
              <strong>Header row:</strong>{' '}
              <code className="text-xs">bg-hover border-b border-default</code>
            </div>
            <div>
              <strong>Header text:</strong>{' '}
              <code className="text-xs">text-xs font-semibold text-muted uppercase tracking-wider</code>
            </div>
            <div>
              <strong>Body row:</strong>{' '}
              <code className="text-xs">border-b border-default hover:bg-hover</code>
            </div>
            <div>
              <strong>Cell padding:</strong> <code className="text-xs">px-4 py-3 (header), px-4 py-4 (body)</code>
            </div>
            <div>
              <strong>Text alignment:</strong> <code className="text-xs">text-left (default)</code>
            </div>
            <div>
              <strong>Hover state:</strong>{' '}
              <code className="text-xs">hover:bg-hover transition-colors</code>
            </div>
          </div>
        </div>
      </SpecSection>

      {/* Table Header Tools */}
      <SpecSection title="Table Controls">
        <div className="bg-card border border-default rounded-lg p-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">
                <Type className="w-4 h-4" />
              </div>
              <input
                type="search"
                placeholder="Search by email, wallet, IP, or user ID"
                className="w-full pl-11 pr-4 py-2.5 bg-page border border-default rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#A192F8] transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-page border border-default rounded-lg text-sm font-medium text-primary hover:bg-hover transition-colors cursor-pointer">
              <Type className="w-4 h-4" />
              Filters
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-page border border-default rounded-lg text-sm font-medium text-primary hover:bg-hover transition-colors cursor-pointer">
              <Table className="w-4 h-4" />
              Columns
            </button>
            <button className="p-2 bg-page border border-default rounded-lg text-primary hover:bg-hover transition-colors cursor-pointer">
              <Type className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-6 space-y-2 text-sm text-secondary">
            <div>
              <strong>Usage:</strong> Search input + action buttons above table
            </div>
            <div>
              <strong>Layout:</strong> Flex container with gap-3
            </div>
          </div>
        </div>
      </SpecSection>

      {/* Data Freshness */}
      <SpecSection title="Data Freshness Indicator">
        <div className="bg-card border border-default rounded-lg p-6">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Type className="w-4 h-4" />
            <span>Data as of 2 min ago</span>
          </div>
          <div className="mt-4 text-sm text-secondary">
            <strong>Usage:</strong> Above or below table to show last update time
            <br />
            <strong>Styling:</strong> <code className="text-xs">text-muted with icon</code>
          </div>
        </div>
      </SpecSection>
    </div>
  );
}

// ============================================
// SECTION 8: BADGES & STATUS
// ============================================
function BadgesSection() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-primary mb-4">Badges & Status Indicators</h2>
        <p className="text-secondary mb-6">
          Status badges, tags, labels, and indicator components.
        </p>
      </div>

      {/* Status Badges */}
      <SpecSection title="Status Badges">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-default rounded-lg p-6">
            <h4 className="text-sm font-semibold text-primary mb-4">Small Badges</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30">
                Active
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30">
                Pending
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30">
                Error
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30">
                Info
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium bg-muted/10 text-muted border-muted/30">
                Inactive
              </span>
            </div>
            <div className="text-sm text-secondary">
              <strong>Size:</strong> <code className="text-xs">px-2 py-0.5 text-xs</code>
            </div>
          </div>

          <div className="bg-card border border-default rounded-lg p-6">
            <h4 className="text-sm font-semibold text-primary mb-4">Medium Badges</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30">
                Success
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30">
                Warning
              </span>
            </div>
            <div className="text-sm text-secondary">
              <strong>Size:</strong> <code className="text-xs">px-3 py-1 text-sm</code>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-card border border-default rounded-lg p-6">
          <h4 className="text-sm font-semibold text-primary mb-4">Badge Anatomy</h4>
          <div className="space-y-2 text-sm text-secondary">
            <div>
              <strong>Base:</strong>{' '}
              <code className="text-xs">rounded-full border font-medium</code>
            </div>
            <div>
              <strong>Background pattern:</strong>{' '}
              <code className="text-xs">bg-[color]/10</code>
            </div>
            <div>
              <strong>Text pattern:</strong> <code className="text-xs">text-[color]</code>
            </div>
            <div>
              <strong>Border pattern:</strong>{' '}
              <code className="text-xs">border-[color]/30</code>
            </div>
          </div>
        </div>
      </SpecSection>

      {/* Chain/Network Badges */}
      <SpecSection title="Chain/Network Badges">
        <div className="bg-card border border-default rounded-lg p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/30">
              Ethereum
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#E84142]/10 text-[#E84142] border border-[#E84142]/30">
              Somnia
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/30">
              Avalanche
            </span>
          </div>
          <div className="text-sm text-secondary">
            <strong>Usage:</strong> Blockchain networks, wallet types
            <br />
            <strong>Colors:</strong> Custom per chain/network
          </div>
        </div>
      </SpecSection>

      {/* Text Badges */}
      <SpecSection title="Text-only Badges">
        <div className="bg-card border border-default rounded-lg p-6">
          <div className="flex flex-wrap gap-3 mb-4">
            <span className="text-xs font-medium text-secondary bg-page px-2 py-1 rounded">
              L1
            </span>
            <span className="text-xs font-medium text-secondary bg-page px-2 py-1 rounded">
              L2
            </span>
            <span className="text-xs font-medium text-secondary bg-page px-2 py-1 rounded">
              +2
            </span>
          </div>
          <div className="text-sm text-secondary">
            <strong>Usage:</strong> KYC levels, counts, simple labels
            <br />
            <strong>Styling:</strong> <code className="text-xs">bg-page px-2 py-1 rounded</code>
          </div>
        </div>
      </SpecSection>
    </div>
  );
}

// ============================================
// SECTION 9: NAVIGATION
// ============================================
function NavigationSection() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-primary mb-4">Navigation</h2>
        <p className="text-secondary mb-6">Navigation patterns, sidebar, top bar, and menus.</p>
      </div>

      {/* Sidebar Navigation */}
      <SpecSection title="Sidebar Navigation">
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Light Mode - Expanded */}
            <div>
              <div className="text-xs font-medium text-muted mb-2 text-center">Light Mode - Expanded</div>
              <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-3xl p-4 w-64">
                <div className="pb-4 mb-4 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-3">
                    <div className="w-8" style={{ aspectRatio: '304/223' }}>
                      <LogoMark />
                    </div>
                    <div className="w-[90px]" style={{ aspectRatio: '191.93/33.65', '--fill-0': '#0F172A' } as React.CSSProperties}>
                      <Wordmark />
                    </div>
                  </div>
                </div>

                <nav className="space-y-1">
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-[#A192F8] text-white">
                    <LayoutGrid className="w-5 h-5" />
                    Overview
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors">
                    <Users className="w-5 h-5" />
                    Users
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors">
                    <Type className="w-5 h-5" />
                    Campaigns
                  </button>
                </nav>
              </div>
            </div>

            {/* Light Mode - Collapsed */}
            <div>
              <div className="text-xs font-medium text-muted mb-2 text-center">Light Mode - Collapsed (Mobile)</div>
              <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-3xl p-2 w-20">
                <div className="pb-3 mb-3 border-b border-[#E5E7EB] flex justify-center">
                  <div className="w-10" style={{ aspectRatio: '304/223' }}>
                    <LogoMark />
                  </div>
                </div>

                <nav className="space-y-1 flex flex-col items-center">
                  <button className="flex items-center justify-center w-10 h-10 rounded-full bg-[#A192F8] text-white">
                    <LayoutGrid className="w-5 h-5" />
                  </button>
                  <button className="flex items-center justify-center w-10 h-10 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors">
                    <Users className="w-5 h-5" />
                  </button>
                  <button className="flex items-center justify-center w-10 h-10 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors">
                    <Type className="w-5 h-5" />
                  </button>
                </nav>
              </div>
            </div>

            {/* Dark Mode - Expanded */}
            <div>
              <div className="text-xs font-medium text-muted mb-2 text-center">Dark Mode - Expanded</div>
              <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-4 w-64">
                <div className="pb-4 mb-4 border-b border-[#334155]">
                  <div className="flex items-center gap-3">
                    <div className="w-8" style={{ aspectRatio: '304/223' }}>
                      <LogoMark />
                    </div>
                    <div className="w-[90px]" style={{ aspectRatio: '191.93/33.65', '--fill-0': '#F8FAFC' } as React.CSSProperties}>
                      <Wordmark />
                    </div>
                  </div>
                </div>

                <nav className="space-y-1">
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-[#A192F8] text-white">
                    <LayoutGrid className="w-5 h-5" />
                    Overview
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[#94A3B8] hover:bg-[#334155] hover:text-[#F8FAFC] transition-colors">
                    <Users className="w-5 h-5" />
                    Users
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[#94A3B8] hover:bg-[#334155] hover:text-[#F8FAFC] transition-colors">
                    <Type className="w-5 h-5" />
                    Campaigns
                  </button>
                </nav>
              </div>
            </div>

            {/* Dark Mode - Collapsed */}
            <div>
              <div className="text-xs font-medium text-muted mb-2 text-center">Dark Mode - Collapsed (Mobile)</div>
              <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-2 w-20">
                <div className="pb-3 mb-3 border-b border-[#334155] flex justify-center">
                  <div className="w-10" style={{ aspectRatio: '304/223' }}>
                    <LogoMark />
                  </div>
                </div>

                <nav className="space-y-1 flex flex-col items-center">
                  <button className="flex items-center justify-center w-10 h-10 rounded-full bg-[#A192F8] text-white">
                    <LayoutGrid className="w-5 h-5" />
                  </button>
                  <button className="flex items-center justify-center w-10 h-10 text-[#94A3B8] hover:bg-[#334155] hover:text-[#F8FAFC] transition-colors">
                    <Users className="w-5 h-5" />
                  </button>
                  <button className="flex items-center justify-center w-10 h-10 text-[#94A3B8] hover:bg-[#334155] hover:text-[#F8FAFC] transition-colors">
                    <Type className="w-5 h-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-card border border-default rounded-lg p-6">
          <h4 className="text-sm font-semibold text-primary mb-4">Sidebar Specs</h4>
          <div className="space-y-2 text-sm text-secondary">
            <div>
              <strong>Width:</strong>{' '}
              <code className="text-xs">w-20 (mobile/collapsed), w-64 (desktop/expanded)</code>
            </div>
            <div>
              <strong>Container:</strong>{' '}
              <code className="text-xs">bg-card rounded-3xl p-4 (expanded), p-2 (collapsed)</code>
            </div>
            <div>
              <strong>Active item (expanded):</strong>{' '}
              <code className="text-xs">bg-[#A192F8] text-white rounded-lg</code>
            </div>
            <div>
              <strong>Active item (collapsed):</strong>{' '}
              <code className="text-xs">bg-[#A192F8] text-white rounded-full</code>
            </div>
            <div>
              <strong>Inactive item:</strong>{' '}
              <code className="text-xs">text-secondary hover:bg-hover</code>
            </div>
            <div>
              <strong>Button size:</strong> <code className="text-xs">w-10 h-10 rounded-full (collapsed), w-full rounded-lg px-4 py-3 (expanded)</code>
            </div>
            <div>
              <strong>Icon size:</strong> <code className="text-xs">w-5 h-5</code>
            </div>
          </div>
        </div>
      </SpecSection>

      {/* Dropdowns */}
      <SpecSection title="Dropdown Menus">
        <div className="relative">
          <div className="bg-card border border-default rounded-xl shadow-lg overflow-hidden min-w-[180px]">
            <button className="w-full px-4 py-2 text-left text-sm text-secondary hover:bg-hover hover:text-primary transition-colors cursor-pointer">
              Option 1
            </button>
            <button className="w-full px-4 py-2 text-left text-sm text-secondary hover:bg-hover hover:text-primary transition-colors cursor-pointer">
              Option 2
            </button>
            <button className="w-full px-4 py-2 text-left text-sm text-secondary hover:bg-hover hover:text-primary transition-colors cursor-pointer">
              Option 3
            </button>
          </div>
        </div>

        <div className="mt-6 bg-card border border-default rounded-lg p-6">
          <h4 className="text-sm font-semibold text-primary mb-4">Dropdown Specs</h4>
          <div className="space-y-2 text-sm text-secondary">
            <div>
              <strong>Container:</strong>{' '}
              <code className="text-xs">bg-card border border-default rounded-xl shadow-lg</code>
            </div>
            <div>
              <strong>Item:</strong>{' '}
              <code className="text-xs">px-4 py-2 hover:bg-hover hover:text-primary</code>
            </div>
            <div>
              <strong>Min width:</strong> <code className="text-xs">min-w-[180px]</code>
            </div>
            <div>
              <strong>Z-index:</strong> <code className="text-xs">z-50</code>
            </div>
          </div>
        </div>
      </SpecSection>
    </div>
  );
}

// ============================================
// SECTION 10: CHARTS & VISUALIZATION
// ============================================
function ChartsSection() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-primary mb-4">Charts & Data Visualization</h2>
        <p className="text-secondary mb-6">
          Chart styles, data visualization patterns, and color usage.
        </p>
      </div>

      <SpecSection title="Chart Colors">
        <div className="bg-card border border-default rounded-lg p-6">
          <h4 className="text-sm font-semibold text-primary mb-4">Primary Chart Color</h4>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-[#A192F8] rounded-lg" />
            <div>
              <div className="text-sm font-medium text-primary">Novalink Purple</div>
              <code className="text-xs text-muted">#A192F8</code>
            </div>
          </div>

          <h4 className="text-sm font-semibold text-primary mb-4 mt-6">
            Multi-series Chart Colors
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#A192F8] rounded" />
              <span className="text-xs text-secondary">Series 1</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#93C5FD] rounded" />
              <span className="text-xs text-secondary">Series 2</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#93E5DB] rounded" />
              <span className="text-xs text-secondary">Series 3</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#FFBFB3] rounded" />
              <span className="text-xs text-secondary">Series 4</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#F0B4D4] rounded" />
              <span className="text-xs text-secondary">Series 5</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#CBF083] rounded" />
              <span className="text-xs text-secondary">Series 6</span>
            </div>
          </div>

          <div className="mt-6 text-sm text-secondary">
            <strong>Note:</strong> Use metric card accent colors for multi-series charts
          </div>
        </div>
      </SpecSection>

      <SpecSection title="Chart Container">
        <div className="bg-card border border-default rounded-lg p-6">
          <div className="space-y-2 text-sm text-secondary">
            <div>
              <strong>Container:</strong>{' '}
              <code className="text-xs">bg-card border border-default rounded-lg p-6</code>
            </div>
            <div>
              <strong>Title:</strong> <code className="text-xs">text-base font-semibold mb-4</code>
            </div>
            <div>
              <strong>Chart height:</strong>{' '}
              <code className="text-xs">h-64 to h-80 (256px-320px)</code>
            </div>
            <div>
              <strong>Grid lines:</strong> <code className="text-xs">stroke: var(--border)</code>
            </div>
            <div>
              <strong>Axis labels:</strong>{' '}
              <code className="text-xs">text-xs text-muted</code>
            </div>
          </div>
        </div>
      </SpecSection>

      <SpecSection title="Tooltip Styling">
        <div className="bg-card border border-default rounded-lg p-6">
          <div className="inline-block bg-card border border-default rounded-lg p-3 shadow-lg">
            <div className="text-xs text-muted mb-1">Jan 15, 2024</div>
            <div className="text-sm font-semibold text-primary">$12,450</div>
            <div className="text-xs text-secondary">+8.2% from previous</div>
          </div>

          <div className="mt-6 space-y-2 text-sm text-secondary">
            <div>
              <strong>Container:</strong>{' '}
              <code className="text-xs">bg-card border border-default rounded-lg p-3 shadow-lg</code>
            </div>
            <div>
              <strong>Label:</strong> <code className="text-xs">text-xs text-muted</code>
            </div>
            <div>
              <strong>Value:</strong>{' '}
              <code className="text-xs">text-sm font-semibold text-primary</code>
            </div>
          </div>
        </div>
      </SpecSection>
    </div>
  );
}

// ============================================
// SECTION 11: ICONOGRAPHY
// ============================================
function IconsSection() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-primary mb-4">Iconography</h2>
        <p className="text-secondary mb-6">Icon library, sizes, and usage patterns.</p>
      </div>

      <SpecSection title="Icon Library">
        <div className="bg-card border border-default rounded-lg p-6">
          <div className="mb-4">
            <strong className="text-sm text-primary">Library:</strong>{' '}
            <code className="text-sm text-[#A192F8]">lucide-react</code>
          </div>
          <div className="text-sm text-secondary">
            <strong>Style:</strong> Outline icons (consistent stroke width)
            <br />
            <strong>Import:</strong>{' '}
            <code className="text-xs">import {`{ IconName }`} from 'lucide-react'</code>
          </div>
        </div>
      </SpecSection>

      <SpecSection title="Icon Sizes">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-default rounded-lg p-6">
            <h4 className="text-sm font-semibold text-primary mb-4">Standard Sizes</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Type className="w-4 h-4 text-secondary" />
                <div className="text-sm">
                  <strong className="text-primary">Small:</strong>{' '}
                  <code className="text-xs text-muted">w-4 h-4 (16px)</code>
                  <div className="text-xs text-muted">Buttons, badges, inline icons</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Type className="w-5 h-5 text-secondary" />
                <div className="text-sm">
                  <strong className="text-primary">Medium:</strong>{' '}
                  <code className="text-xs text-muted">w-5 h-5 (20px)</code>
                  <div className="text-xs text-muted">Navigation, table headers, cards</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Type className="w-6 h-6 text-secondary" />
                <div className="text-sm">
                  <strong className="text-primary">Large:</strong>{' '}
                  <code className="text-xs text-muted">w-6 h-6 (24px)</code>
                  <div className="text-xs text-muted">Empty states, large buttons</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-default rounded-lg p-6">
            <h4 className="text-sm font-semibold text-primary mb-4">Color Usage</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Type className="w-5 h-5 text-primary" />
                <code className="text-xs text-muted">text-primary</code>
              </div>
              <div className="flex items-center gap-3">
                <Type className="w-5 h-5 text-secondary" />
                <code className="text-xs text-muted">text-secondary</code>
              </div>
              <div className="flex items-center gap-3">
                <Type className="w-5 h-5 text-muted" />
                <code className="text-xs text-muted">text-muted</code>
              </div>
              <div className="flex items-center gap-3">
                <Type className="w-5 h-5 text-[#A192F8]" />
                <code className="text-xs text-muted">text-[#A192F8]</code>
              </div>
            </div>
          </div>
        </div>
      </SpecSection>

      <SpecSection title="Common Icons & Usage">
        <div className="bg-card border border-default rounded-lg p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-secondary" />
              <span className="text-sm text-secondary">Users</span>
            </div>
            <div className="flex items-center gap-2">
              <Type className="w-5 h-5 text-secondary" />
              <span className="text-sm text-secondary">Search</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-secondary" />
              <span className="text-sm text-secondary">Success</span>
            </div>
            <div className="flex items-center gap-2">
              <Type className="w-5 h-5 text-secondary" />
              <span className="text-sm text-secondary">Filter</span>
            </div>
            <div className="flex items-center gap-2">
              <Table className="w-5 h-5 text-secondary" />
              <span className="text-sm text-secondary">Columns</span>
            </div>
            <div className="flex items-center gap-2">
              <Type className="w-5 h-5 text-secondary" />
              <span className="text-sm text-secondary">Refresh</span>
            </div>
          </div>
        </div>
      </SpecSection>
    </div>
  );
}

// ============================================
// SECTION 12: INTERACTION PATTERNS
// ============================================
function PatternsSection() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-primary mb-4">Interaction Patterns</h2>
        <p className="text-secondary mb-6">
          Common UI patterns, states, and interactive behaviors.
        </p>
      </div>

      {/* Hover States */}
      <SpecSection title="Hover States">
        <div className="space-y-4">
          <div className="bg-card border border-default rounded-lg p-6">
            <h4 className="text-sm font-semibold text-primary mb-3">Button Hover</h4>
            <div className="space-y-2 text-sm text-secondary">
              <div>
                <strong>Primary:</strong>{' '}
                <code className="text-xs">bg-[#A192F8] hover:bg-[#9178E8]</code>
              </div>
              <div>
                <strong>Secondary:</strong> <code className="text-xs">hover:bg-hover</code>
              </div>
              <div>
                <strong>Text:</strong> <code className="text-xs">hover:text-primary</code>
              </div>
            </div>
          </div>

          <div className="bg-card border border-default rounded-lg p-6">
            <h4 className="text-sm font-semibold text-primary mb-3">Table Row Hover</h4>
            <code className="text-sm text-secondary">hover:bg-hover transition-colors</code>
          </div>

          <div className="bg-card border border-default rounded-lg p-6">
            <h4 className="text-sm font-semibold text-primary mb-3">Card Hover</h4>
            <code className="text-sm text-secondary">
              hover:border-[#A192F8] transition-colors
            </code>
          </div>
        </div>
      </SpecSection>

      {/* Loading States */}
      <SpecSection title="Loading States">
        <div className="space-y-4">
          <div className="bg-card border border-default rounded-lg p-6">
            <h4 className="text-sm font-semibold text-primary mb-3">Spinner</h4>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-5 h-5 border-2 border-[#A192F8] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-secondary">Loading...</span>
            </div>
            <code className="text-xs text-muted">
              border-2 border-[#A192F8] border-t-transparent rounded-full animate-spin
            </code>
          </div>

          <div className="bg-card border border-default rounded-lg p-6">
            <h4 className="text-sm font-semibold text-primary mb-3">Skeleton Loading</h4>
            <div className="space-y-2 mb-3">
              <div className="h-4 bg-hover rounded animate-pulse" />
              <div className="h-4 bg-hover rounded animate-pulse w-3/4" />
              <div className="h-4 bg-hover rounded animate-pulse w-1/2" />
            </div>
            <code className="text-xs text-muted">bg-hover rounded animate-pulse</code>
          </div>
        </div>
      </SpecSection>

      {/* Empty States */}
      <SpecSection title="Empty States">
        <div className="bg-card border border-default rounded-lg p-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-hover rounded-full flex items-center justify-center mx-auto mb-4">
              <Type className="w-8 h-8 text-muted" />
            </div>
            <h3 className="text-base font-semibold text-primary mb-2">No data found</h3>
            <p className="text-sm text-secondary mb-4">
              There are no items to display at the moment.
            </p>
            <button className="px-5 py-2.5 bg-[#A192F8] text-white rounded-lg text-sm font-medium hover:bg-[#9178E8] transition-colors cursor-pointer">
              Create New
            </button>
          </div>

          <div className="mt-6 space-y-2 text-sm text-secondary border-t border-default pt-6">
            <div>
              <strong>Icon container:</strong>{' '}
              <code className="text-xs">w-16 h-16 bg-hover rounded-full</code>
            </div>
            <div>
              <strong>Icon size:</strong> <code className="text-xs">w-8 h-8</code>
            </div>
            <div>
              <strong>Padding:</strong> <code className="text-xs">py-12</code>
            </div>
          </div>
        </div>
      </SpecSection>

      {/* Transitions */}
      <SpecSection title="Transitions">
        <div className="bg-card border border-default rounded-lg p-6">
          <div className="space-y-3 text-sm text-secondary">
            <div>
              <strong className="text-primary">Standard transition:</strong>
              <br />
              <code className="text-xs">transition-colors</code>
              <div className="text-xs mt-1">For color changes (hover, active states)</div>
            </div>
            <div>
              <strong className="text-primary">All properties:</strong>
              <br />
              <code className="text-xs">transition-all</code>
              <div className="text-xs mt-1">For complex animations</div>
            </div>
            <div>
              <strong className="text-primary">Theme transition:</strong>
              <br />
              <code className="text-xs">transition: background-color 0.3s ease, color 0.3s ease</code>
              <div className="text-xs mt-1">Applied to body for light/dark mode switching</div>
            </div>
          </div>
        </div>
      </SpecSection>

      {/* Focus States */}
      <SpecSection title="Focus States">
        <div className="bg-card border border-default rounded-lg p-6">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Focus on this input"
              className="w-full px-4 py-2.5 bg-page border border-default rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-[#A192F8] focus:border-transparent transition-all"
            />
            <div className="space-y-2 text-sm text-secondary">
              <div>
                <strong>Input focus:</strong>
                <br />
                <code className="text-xs">
                  focus:outline-none focus:ring-2 focus:ring-[#A192F8] focus:border-transparent
                </code>
              </div>
              <div>
                <strong>Ring width:</strong> <code className="text-xs">2px</code>
              </div>
              <div>
                <strong>Ring color:</strong> <code className="text-xs">#A192F8</code>
              </div>
            </div>
          </div>
        </div>
      </SpecSection>

      {/* Disabled States */}
      <SpecSection title="Disabled States">
        <div className="space-y-4">
          <div className="bg-card border border-default rounded-lg p-6">
            <button
              disabled
              className="px-5 py-2.5 bg-[#A192F8]/50 text-white/50 rounded-lg text-sm font-medium cursor-not-allowed mb-3"
            >
              Disabled Button
            </button>
            <code className="text-xs text-muted block">
              opacity-50 or /50 alpha, cursor-not-allowed
            </code>
          </div>

          <div className="bg-card border border-default rounded-lg p-6">
            <input
              type="text"
              placeholder="Disabled input"
              disabled
              className="w-full px-4 py-2.5 bg-page border border-default rounded-lg text-muted cursor-not-allowed opacity-50 mb-3"
            />
            <code className="text-xs text-muted block">
              text-muted opacity-50 cursor-not-allowed
            </code>
          </div>
        </div>
      </SpecSection>
    </div>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================

interface SpecSectionProps {
  title: string;
  children: React.ReactNode;
}

function SpecSection({ title, children }: SpecSectionProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-primary mb-4">{title}</h3>
      {children}
    </div>
  );
}

interface TypeSpecimenProps {
  tag: string;
  label: string;
  specs: string;
  usage: string;
  children: React.ReactNode;
}

function TypeSpecimen({ label, specs, usage, children }: TypeSpecimenProps) {
  return (
    <div className="bg-card border border-default rounded-lg p-6">
      <div className="mb-3">{children}</div>
      <div className="space-y-1 text-sm text-secondary border-t border-default pt-3">
        <div>
          <strong>{label}:</strong> {specs}
        </div>
        <div className="text-xs text-muted">Usage: {usage}</div>
      </div>
    </div>
  );
}

interface ColorSwatchProps {
  name: string;
  hex?: string;
  darkHex?: string;
  cssVar?: string;
  usage: string;
  preview?: React.ReactNode;
}

function ColorSwatch({ name, hex, darkHex, cssVar, usage, preview }: ColorSwatchProps) {
  return (
    <div className="bg-card border border-default rounded-lg p-4">
      {preview ? (
        <div className="mb-3">{preview}</div>
      ) : (
        <div
          className="w-full h-20 rounded-lg mb-3 border border-default"
          style={{ backgroundColor: hex }}
        />
      )}
      <div className="space-y-1">
        <div className="text-sm font-medium text-primary">{name}</div>
        {hex && (
          <div className="text-xs text-secondary">
            Light: <code className="text-muted">{hex}</code>
          </div>
        )}
        {darkHex && (
          <div className="text-xs text-secondary">
            Dark: <code className="text-muted">{darkHex}</code>
          </div>
        )}
        {cssVar && (
          <div className="text-xs text-secondary">
            <code className="text-muted">{cssVar}</code>
          </div>
        )}
        <div className="text-xs text-muted">{usage}</div>
      </div>
    </div>
  );
}

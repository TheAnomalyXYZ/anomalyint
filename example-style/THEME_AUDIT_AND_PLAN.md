# Novalink Dashboard Theme Audit & Implementation Plan

## Executive Summary

This document outlines a comprehensive strategy to apply the established modern fintech theme across all subpages of the Novalink admin dashboard. The goal is to create a scalable, maintainable theming system that ensures visual consistency and supports light/dark mode throughout the application.

---

## 1. Current State Assessment

### ✅ Successfully Themed Components

- **OverviewPage**: Fully updated with ColorfulMetricCard components, theme-aware backgrounds, and proper text colors
- **WalletsPage**: Uses theme utility classes (text-primary, text-secondary, bg-card)
- **TopBar**: Theme toggle, environment switcher
- **Sidebar**: Floating rounded frame with theme-aware styling
- **ColorfulMetricCard**: Theme-aware metric cards with CSS variable colors
- **AlertCard**: Uses theme colors
- **RecentTransactions & RecentCampaigns**: Theme-aware panels

### ❌ Pages Requiring Theme Updates

| Page | Current State | Theme Issues | Priority |
|------|--------------|--------------|----------|
| **UsersPage** | Hardcoded dark theme | Uses #1E293B, #334155, #0F172A throughout | HIGH |
| **TransactionsPage** | Hardcoded dark theme | Tab navigation and background colors | HIGH |
| **CampaignsPage** | Hardcoded dark theme | Entire page uses hardcoded colors | HIGH |
| **MessagingPage** | Hardcoded dark theme | Complex layout with many hardcoded colors | HIGH |
| **SomniaDashboardPage** | Hardcoded dark theme | Charts, cards, all elements hardcoded | MEDIUM |
| **PlumeDashboardPage** | Unknown | Needs audit | MEDIUM |
| **SomniaEventsPage** | Unknown | Needs audit | MEDIUM |
| **PlumeEventsPage** | Unknown | Needs audit | MEDIUM |
| **PartnersPage** | Unknown | Needs audit | LOW |
| **NotFoundPage** | Unknown | Needs audit | LOW |

### 🔧 Components Requiring Theme Updates

| Component | Usage | Issues |
|-----------|-------|--------|
| **UsersTable** | Users page | Hardcoded colors |
| **PurchasesTable** | Transactions | Hardcoded colors |
| **NFTMintsTable** | Transactions | Hardcoded colors |
| **FiltersPanel** | Users, others | Hardcoded drawer/panel colors |
| **ColumnsDropdown** | Users | Hardcoded dropdown colors |
| **UserDetailDrawer** | Users | Hardcoded drawer colors |
| **CampaignCard** | Campaigns | Hardcoded card colors |
| **CampaignDetailDrawer** | Campaigns | Hardcoded drawer colors |
| **CreateCampaignModal** | Campaigns | Hardcoded modal colors |
| **TemplateManagerModal** | Messaging | Hardcoded modal colors |
| **MessageQueuePanel** | Messaging | Hardcoded panel colors |
| **PurchaseDetailDrawer** | Transactions | Hardcoded drawer colors |
| **NFTMintDetailDrawer** | Transactions | Hardcoded drawer colors |

---

## 2. Established Design System

### Theme Architecture

**Location**: `/src/app/contexts/ThemeContext.tsx` and `/src/styles/theme.css`

### Color Tokens

```css
/* Light Theme */
--background: #F5F7FA
--background-gradient: linear-gradient(135deg, #F5F7FA 0%, #E8EDF5 50%, #F0F4FA 100%)
--card-background: #FFFFFF
--sidebar-background: #E8EDF5
--hover-background: #F0F2F5
--text-primary: #1A1A2E
--text-secondary: #6B7280
--text-muted: #9CA3AF
--border: #E5E7EB
--border-hover: #D1D5DB

/* Dark Theme */
--background: #0F1117
--background-gradient: linear-gradient(135deg, #0F1117 0%, #1A1D26 50%, #12141D 100%)
--card-background: #1A1D26
--sidebar-background: #0A0C12
--hover-background: #252A36
--text-primary: #F9FAFB
--text-secondary: #9CA3AF
--text-muted: #6B7280
--border: #2D3343
--border-hover: #3D4354
```

### Colorful Metric Cards

```css
/* Light Mode */
--metric-lime: #CBF083
--metric-peach: #FFBFB3
--metric-pink: #F0B4D4
--metric-blue: #93C5FD
--metric-mint: #93E5DB
--metric-purple: #C4B5FD

/* Dark Mode (muted) */
--metric-lime: #3D5A1F
--metric-peach: #5A3D37
--metric-pink: #5A3D4D
--metric-blue: #1E3A5F
--metric-mint: #1F4A47
--metric-purple: #3D3A5A
```

### Utility Classes

```css
.bg-page          /* Page background */
.bg-page-gradient /* Gradient background */
.bg-card          /* Card background */
.bg-sidebar       /* Sidebar background */
.bg-hover         /* Hover state */
.text-primary     /* Primary text */
.text-secondary   /* Secondary text */
.text-muted       /* Muted text */
.border-default   /* Border color */
.shadow-card      /* Card shadow (none in dark mode) */
```

### Brand Colors

- **Primary**: #A192F8 (Novalink purple)
- **Success**: #22C55E
- **Warning**: #F59E0B
- **Error**: #EF4444
- **Info**: #3B82F6

### Spacing & Radius

```css
--radius-sm: 8px
--radius-md: 12px
--radius-lg: 16px
--radius-xl: 20px
--radius-full: 999px
```

---

## 3. Reusable Component Strategy

### Phase 1: Base UI Components (Create New)

#### A. `PageHeader` Component
**Purpose**: Standardized page headers with title, subtitle, and action buttons

```tsx
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}
```

**Usage**:
```tsx
<PageHeader 
  title="Users" 
  subtitle="Manage and monitor user accounts"
  actions={<RefreshButton />}
/>
```

#### B. `DataCard` Component
**Purpose**: Standardized card wrapper with theme-aware styling

```tsx
interface DataCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}
```

**Features**:
- Uses `bg-card`, `border-default`, `shadow-card`
- Consistent rounded corners (rounded-2xl)
- Hover states

#### C. `MetricCard` Component (Standard)
**Purpose**: Non-colorful metric cards for dashboards

```tsx
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: string; direction: 'up' | 'down' };
  sparkline?: number[];
}
```

#### D. `SearchInput` Component
**Purpose**: Standardized search bars

```tsx
interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}
```

#### E. `FilterButton` Component
**Purpose**: Standardized filter/action buttons

```tsx
interface FilterButtonProps {
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}
```

#### F. `DataFreshness` Component
**Purpose**: Show when data was last updated

```tsx
interface DataFreshnessProps {
  timestamp: string;
  onRefresh?: () => void;
}
```

#### G. `StatusBadge` Component
**Purpose**: Consistent status indicators

```tsx
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'success' | 'error' | 'warning';
  label: string;
  size?: 'sm' | 'md';
}
```

#### H. `StatCard` Component
**Purpose**: Simple stat cards for partner dashboards

```tsx
interface StatCardProps {
  label: string;
  value: string | number;
  trend?: { value: string; isPositive: boolean };
  sparkline?: React.ReactNode;
}
```

### Phase 2: Enhanced Existing Components

#### Update Existing UI Components
- **Table**: Add theme-aware variants
- **Button**: Ensure all variants support theme
- **Input**: Standardize with theme colors
- **Select**: Theme-aware dropdowns
- **Modal/Dialog**: Theme-aware overlays
- **Drawer**: Theme-aware side panels

---

## 4. Implementation Approach

### Migration Strategy: Step-by-Step

#### Step 1: Create Base Components (Week 1)
1. Create `/src/app/components/base/PageHeader.tsx`
2. Create `/src/app/components/base/DataCard.tsx`
3. Create `/src/app/components/base/MetricCard.tsx`
4. Create `/src/app/components/base/SearchInput.tsx`
5. Create `/src/app/components/base/FilterButton.tsx`
6. Create `/src/app/components/base/DataFreshness.tsx`
7. Create `/src/app/components/base/StatusBadge.tsx`
8. Create `/src/app/components/base/StatCard.tsx`

#### Step 2: Update High-Priority Pages (Week 2)

**UsersPage**:
- Replace hardcoded `bg-[#1E293B]` → `bg-card`
- Replace `border-[#334155]` → `border-default`
- Replace `text-white` → `text-primary`
- Replace `text-gray-400` → `text-secondary`
- Use `PageHeader` component
- Use `SearchInput` component
- Use `DataCard` for table wrapper

**CampaignsPage**:
- Same color replacements
- Update summary cards to use `MetricCard`
- Use `PageHeader` component
- Use `SearchInput` component
- Use `StatusBadge` for campaign status

**TransactionsPage**:
- Update tab navigation with theme colors
- Ensure tab content uses theme-aware components

#### Step 3: Update Medium-Priority Pages (Week 3)

**MessagingPage**:
- Complex layout, section-by-section updates
- Left panel: theme-aware cards
- Right panel: theme-aware composer
- Template dropdown: theme colors

**SomniaDashboardPage & PlumeDashboardPage**:
- Update metric cards to use `StatCard`
- Chart containers: `bg-card`, `border-default`
- Table: theme-aware styling

**Partner Events Pages**:
- Similar to transaction tables
- Use theme-aware table styling

#### Step 4: Update Supporting Components (Week 4)

- UsersTable
- PurchasesTable
- NFTMintsTable
- FiltersPanel
- ColumnsDropdown
- All Drawers (UserDetailDrawer, CampaignDetailDrawer, etc.)
- All Modals (CreateCampaignModal, TemplateManagerModal)

#### Step 5: Polish & Verification (Week 5)
- Test all pages in light mode
- Test all pages in dark mode
- Verify transitions are smooth
- Check for any missed hardcoded colors
- Update NotFoundPage and PartnersPage

---

## 5. Pattern Replacements Guide

### Color Replacements

| Hardcoded Color | Replace With | Usage |
|-----------------|--------------|-------|
| `#0F172A` | `bg-page` or parent's natural background | Main page background |
| `#1E293B` | `bg-card` | Card/panel background |
| `#334155` | `border-default` | Borders |
| `text-white` | `text-primary` | Primary text |
| `text-gray-400` | `text-secondary` | Secondary text |
| `text-gray-500` | `text-muted` | Muted/placeholder text |
| `bg-[#A192F8]` | `bg-[#A192F8]` (keep) | Brand purple buttons |
| `hover:bg-[#334155]` | `hover:bg-hover` | Hover states |

### Component Patterns

**Before**:
```tsx
<div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
  <h2 className="text-white mb-4">Title</h2>
  <p className="text-gray-400">Description</p>
</div>
```

**After**:
```tsx
<DataCard>
  <h2 className="text-primary mb-4">Title</h2>
  <p className="text-secondary">Description</p>
</DataCard>
```

---

## 6. Maintainability Guidelines

### 🚫 DON'T

- ❌ Use hardcoded hex colors for backgrounds/borders/text
- ❌ Create component-specific color schemes
- ❌ Use Tailwind color utilities (gray-400, slate-800, etc.) for backgrounds
- ❌ Duplicate card/panel styling

### ✅ DO

- ✅ Use CSS variables via utility classes
- ✅ Use base components (PageHeader, DataCard, etc.)
- ✅ Test in both light and dark modes
- ✅ Use semantic class names (text-primary, not text-white)
- ✅ Keep brand purple (#A192F8) for CTAs and accents

### Code Review Checklist

When reviewing new features:
- [ ] No hardcoded colors (except brand purple)
- [ ] Uses theme utility classes
- [ ] Uses base components where applicable
- [ ] Tested in both light and dark modes
- [ ] Follows established spacing/radius conventions
- [ ] Uses theme-aware icons (text-secondary color)

---

## 7. Testing Strategy

### Visual Regression Testing

For each page, verify:
1. **Light Mode**: All elements visible, proper contrast
2. **Dark Mode**: All elements visible, proper contrast
3. **Theme Toggle**: Smooth transition, no flash
4. **Hover States**: Consistent across modes
5. **Focus States**: Visible and consistent
6. **Shadows**: Visible in light, hidden in dark

### Component Checklist

Test each component in isolation:
- [ ] Light mode rendering
- [ ] Dark mode rendering
- [ ] Hover states
- [ ] Active states
- [ ] Disabled states (if applicable)
- [ ] Loading states (if applicable)
- [ ] Empty states (if applicable)

---

## 8. Quick Reference: Common Elements

### Buttons

**Primary CTA** (brand purple):
```tsx
<button className="px-4 py-2.5 bg-[#A192F8] text-white rounded-lg hover:bg-[#9178E8] transition-colors">
```

**Secondary**:
```tsx
<button className="px-4 py-2.5 bg-card border border-default rounded-lg text-primary hover:bg-hover transition-colors">
```

**Ghost**:
```tsx
<button className="px-4 py-2.5 rounded-lg text-secondary hover:bg-hover transition-colors">
```

### Input Fields

```tsx
<input className="w-full bg-card border border-default rounded-lg px-4 py-2.5 text-primary placeholder-muted focus:outline-none focus:border-[#A192F8]" />
```

### Select Dropdowns

```tsx
<select className="appearance-none bg-card border border-default rounded-lg px-4 py-2.5 text-primary focus:outline-none focus:border-[#A192F8]">
```

### Cards

```tsx
<div className="bg-card border border-default rounded-2xl p-6 shadow-card">
```

### Tables

```tsx
<div className="bg-card rounded-lg border border-default overflow-hidden">
  <table className="w-full">
    <thead className="bg-sidebar">
      <tr>
        <th className="text-left text-xs font-medium text-secondary px-6 py-3">
    </thead>
    <tbody className="divide-y divide-[var(--border)]">
      <tr className="hover:bg-hover">
        <td className="px-6 py-4 text-sm text-primary">
```

---

## 9. Migration Timeline

### Week 1: Foundation
- Day 1-2: Create base components
- Day 3: Test base components in Storybook/isolation
- Day 4-5: Document usage patterns

### Week 2: High-Priority Pages
- Day 1: UsersPage + UsersTable
- Day 2: CampaignsPage + CampaignCard
- Day 3: TransactionsPage + transaction tables
- Day 4: Testing & fixes
- Day 5: Buffer/polish

### Week 3: Medium-Priority Pages
- Day 1-2: MessagingPage
- Day 3: SomniaDashboardPage
- Day 4: PlumeDashboardPage + Events pages
- Day 5: Testing & fixes

### Week 4: Supporting Components
- Day 1: Drawers (User, Campaign, Purchase, NFTMint)
- Day 2: Modals (CreateCampaign, TemplateManager)
- Day 3: Panels (Filters, MessageQueue)
- Day 4: Dropdowns (Columns, various filters)
- Day 5: Testing & fixes

### Week 5: Final Polish
- Day 1-2: NotFoundPage, PartnersPage, any missed components
- Day 3: Comprehensive light/dark mode testing
- Day 4: Fix any edge cases
- Day 5: Documentation update & celebration 🎉

---

## 10. Success Metrics

### Quantitative Goals
- ✅ 0 hardcoded colors (except #A192F8 for brand)
- ✅ 100% of pages support light/dark mode
- ✅ <100ms theme transition time
- ✅ 90%+ code reuse for common patterns (cards, headers, etc.)

### Qualitative Goals
- ✅ Consistent visual appearance across all pages
- ✅ Easy for developers to add new features
- ✅ No visual regressions when toggling theme
- ✅ Professional, investor-ready appearance maintained

---

## 11. Emergency Rollback Plan

If issues arise during migration:

1. **Git Tags**: Tag each page migration (`theme/users-page`, etc.)
2. **Feature Flag**: Consider adding theme opt-in per page during dev
3. **Rollback Strategy**: Can revert individual page updates without affecting others

---

## Contact & Questions

For questions about theme implementation:
- Review this document
- Check `/src/styles/theme.css` for available tokens
- Look at `OverviewPage.tsx` for reference implementation
- Use base components from `/src/app/components/base/`

---

**Last Updated**: January 2026  
**Status**: Ready for Implementation

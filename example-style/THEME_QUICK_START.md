# Theme Implementation Quick Start

## Using Base Components

Import from the base components directory:

```tsx
import { PageHeader, DataCard, SearchInput, MetricCard } from '@/app/components/base';
```

## Quick Examples

### Page Structure

```tsx
import { PageHeader, DataCard, SearchInput, FilterButton, DataFreshness } from '@/app/components/base';
import { RefreshCw, Filter } from 'lucide-react';

export function MyPage() {
  return (
    <div className="p-6 bg-transparent min-h-full">
      {/* Header */}
      <PageHeader
        title="My Page"
        subtitle="Page description"
        actions={
          <>
            <FilterButton icon={<Filter className="w-4 h-4" />} label="Filters" onClick={() => {}} />
            <FilterButton
              icon={<RefreshCw className="w-4 h-4" />}
              label="Refresh"
              onClick={() => {}}
              variant="primary"
            />
          </>
        }
      />

      {/* Search & Controls */}
      <div className="mb-6">
        <SearchInput
          placeholder="Search..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="flex-1"
        />
      </div>

      {/* Data Freshness */}
      <DataFreshness
        timestamp="2 min ago"
        showCount
        count={150}
        onRefresh={() => {}}
      />

      {/* Content */}
      <DataCard>
        <h3 className="text-primary mb-4">Card Title</h3>
        <p className="text-secondary">Card content</p>
      </DataCard>
    </div>
  );
}
```

### Metrics Grid

```tsx
import { MetricCard } from '@/app/components/base';
import { Users, DollarSign, Activity } from 'lucide-react';

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <MetricCard
    title="Total Users"
    value="184,939"
    subtitle="+12% vs last week"
    icon={<Users className="w-5 h-5" />}
    trend={{ value: '+12%', direction: 'up' }}
  />
  <MetricCard
    title="Revenue"
    value="$4,270"
    icon={<DollarSign className="w-5 h-5" />}
    trend={{ value: '+8%', direction: 'up' }}
  />
  <MetricCard
    title="Active Users"
    value="12,450"
    icon={<Activity className="w-5 h-5" />}
  />
</div>
```

### Status Badges

```tsx
import { StatusBadge } from '@/app/components/base';

<StatusBadge status="active" label="Active" />
<StatusBadge status="pending" label="Pending" />
<StatusBadge status="error" label="Failed" size="md" />
```

### Stat Cards (Partner Dashboards)

```tsx
import { StatCard } from '@/app/components/base';

<div className="grid grid-cols-3 gap-6">
  <StatCard
    label="Total Users"
    value="184,939"
    trend={{ value: '+15%', isPositive: true }}
    sparkline={<svg>...</svg>}
  />
</div>
```

## Theme Color Classes

### Backgrounds
- `bg-page` - Main page background
- `bg-page-gradient` - Gradient background
- `bg-card` - Card/panel background
- `bg-hover` - Hover state background
- `bg-sidebar` - Sidebar background

### Text
- `text-primary` - Main text color
- `text-secondary` - Secondary text
- `text-muted` - Muted/placeholder text

### Borders
- `border-default` - Standard border
- `border-hover` - Hover state border

### Shadows
- `shadow-card` - Card shadow (auto-hides in dark mode)

## Common Patterns

### Button - Primary CTA
```tsx
<button className="px-4 py-2.5 bg-[#A192F8] text-white rounded-lg hover:bg-[#9178E8] transition-colors">
  Action
</button>
```

### Button - Secondary
```tsx
<button className="px-4 py-2.5 bg-card border border-default rounded-lg text-primary hover:bg-hover transition-colors">
  Cancel
</button>
```

### Input Field
```tsx
<input className="w-full bg-card border border-default rounded-lg px-4 py-2.5 text-primary placeholder-muted focus:outline-none focus:border-[#A192F8]" />
```

### Select Dropdown
```tsx
<select className="appearance-none bg-card border border-default rounded-lg px-4 py-2.5 text-primary focus:outline-none focus:border-[#A192F8]">
  <option>Option 1</option>
</select>
```

### Table
```tsx
<DataCard padding="none">
  <table className="w-full">
    <thead className="bg-sidebar">
      <tr>
        <th className="text-left text-xs font-medium text-secondary px-6 py-3">
          Column
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-[var(--border)]">
      <tr className="hover:bg-hover">
        <td className="px-6 py-4 text-sm text-primary">
          Cell content
        </td>
      </tr>
    </tbody>
  </table>
</DataCard>
```

## Migration Checklist

When updating a page:

- [ ] Replace `bg-[#0F172A]` → `bg-page` or remove (parent handles it)
- [ ] Replace `bg-[#1E293B]` → `bg-card`
- [ ] Replace `border-[#334155]` → `border-default`
- [ ] Replace `text-white` → `text-primary`
- [ ] Replace `text-gray-400` → `text-secondary`
- [ ] Replace `text-gray-500` → `text-muted`
- [ ] Replace `hover:bg-[#334155]` → `hover:bg-hover`
- [ ] Use `PageHeader` component
- [ ] Use `SearchInput` instead of custom search
- [ ] Use `DataCard` for panels
- [ ] Test in both light and dark modes

## Need Help?

- See `/THEME_AUDIT_AND_PLAN.md` for comprehensive guide
- Check `/src/styles/theme.css` for all available CSS variables
- Look at `/src/app/components/OverviewPage.tsx` for reference
- Use base components from `/src/app/components/base/`

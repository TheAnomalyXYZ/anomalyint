import { createBrowserRouter, Navigate } from 'react-router';
import { RootLayout } from '@/app/layouts/RootLayout';
import { OverviewPage } from '@/app/components/OverviewPage';
import { UsersPage } from '@/app/components/UsersPage';
import { WalletsPage } from '@/app/components/WalletsPage';
import { TransactionsPage } from '@/app/components/TransactionsPage';
import { CampaignsPage } from '@/app/components/CampaignsPage';
import { MessagingPage } from '@/app/components/MessagingPage';
import { PartnersPage } from '@/app/components/PartnersPage';
import { SomniaEventsPage } from '@/app/components/SomniaEventsPage';
import { SomniaDashboardPage } from '@/app/components/SomniaDashboardPage';
import { PlumeEventsPage } from '@/app/components/PlumeEventsPage';
import { PlumeDashboardPage } from '@/app/components/PlumeDashboardPage';
import { StyleGuidePage } from '@/app/components/StyleGuidePage';
import { NotFoundPage } from '@/app/components/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: OverviewPage },
      { path: 'users', Component: UsersPage },
      { path: 'wallets', Component: WalletsPage },
      {
        path: 'transactions',
        children: [
          { index: true, element: <Navigate to="/transactions/nft-mints" replace /> },
          { path: 'nft-mints', Component: TransactionsPage },
          { path: 'purchases', Component: TransactionsPage },
        ],
      },
      { path: 'campaigns', Component: CampaignsPage },
      { path: 'messaging', Component: MessagingPage },
      {
        path: 'partners',
        children: [
          { index: true, Component: PartnersPage },
          {
            path: 'somnia',
            children: [
              { index: true, element: <Navigate to="/partners/somnia/dashboard" replace /> },
              { path: 'events', Component: SomniaEventsPage },
              { path: 'dashboard', Component: SomniaDashboardPage },
            ],
          },
          {
            path: 'plume',
            children: [
              { index: true, element: <Navigate to="/partners/plume/dashboard" replace /> },
              { path: 'events', Component: PlumeEventsPage },
              { path: 'dashboard', Component: PlumeDashboardPage },
            ],
          },
        ],
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
  {
    path: 'style-guide',
    Component: StyleGuidePage,
  },
]);
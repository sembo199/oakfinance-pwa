import { Routes } from '@angular/router';
import { TabsComponent } from './components/tabs/tabs.component';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsComponent,
    children: [
      {
        path: 'payments',
        loadComponent: () =>
          import('./pages/recurring-payments/recurring-payments.page').then((m) => m.RecurringPaymentsPage),
      },
      {
        path: 'tracker',
        loadComponent: () =>
          import('./pages/payment-tracker/payment-tracker.page').then((m) => m.PaymentTrackerPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings.page').then((m) => m.Settings),
      },
      {
        path: '',
        redirectTo: '/tabs/payments',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/payments',
    pathMatch: 'full',
  },
];

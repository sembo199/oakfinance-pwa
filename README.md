# OakFinance - Monthly Payment Tracker

A mobile-first financial tracking application built with Ionic 8 and Angular. Track your monthly recurring bills and income with custom payment periods based on your payday.

## Features

### 🏦 Recurring Payments (Tab 1)
- Add income and expense entries with custom icons
- Set payment day (1-31) for each month
- Edit or delete recurring payments
- Separate views for income vs expenses
- Swipe-to-edit/delete functionality

### 📊 Payment Tracker (Tab 2)
- Custom month periods (e.g., 25th to 24th)
- Navigate between months with arrow buttons
- Auto-generates payment logs from recurring payments
- Mark payments as completed/pending
- Edit individual log amounts (e.g., variable income)
- Visual grouping:
  - Overdue (red)
  - Upcoming (gray)
  - Completed (green)
- **Fixed Footer with Financial Forecast:**
  - Input current account balance
  - See pending income and expenses
  - View forecasted end-of-period balance
  - Color-coded forecast (green/yellow/red)

### ⚙️ Settings (Tab 3)
- Configure month start day (e.g., set to 25 for payday)
- Currency settings
- App information and usage guide

## Technology Stack

- **Framework:** Ionic 8 + Angular (Standalone Components)
- **Storage:** @ionic/storage-angular (local-only, no API)
- **State Management:** RxJS BehaviorSubjects
- **Icons:** Ionicons
- **Routing:** Angular Router with lazy loading

## Architecture

```
src/app/
├── models/               # Data models (RecurringPayment, PaymentLog, etc.)
├── services/             # Business logic and data persistence
│   ├── date-period.service.ts      # Custom month period calculations
│   ├── recurring-payment.service.ts # CRUD for recurring payments
│   ├── payment-log.service.ts      # Log management and forecasting
│   ├── balance.service.ts          # Account balance per period
│   └── settings.service.ts         # App settings
├── pages/
│   ├── recurring-payments/  # Tab 1
│   ├── payment-tracker/     # Tab 2
│   └── tab3/               # Tab 3 (Settings)
├── components/
│   ├── icon-picker-modal/   # Searchable icon selector
│   └── payment-form-modal/  # Add/Edit payment form
├── constants/
│   └── icons.ts            # Curated ionicons for finance
└── tabs/                   # Tab navigation

```

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Ionic CLI: `npm install -g @ionic/cli`

### Installation

```bash
# Navigate to project directory
cd D:\Projects\OakFinance

# Install dependencies (already done)
npm install

# Start development server
ionic serve
```

The app will open in your browser at `http://localhost:8100`

### Build for Production

```bash
# Web build
ionic build

# Add mobile platforms
ionic capacitor add android
ionic capacitor add ios

# Build and open in native IDE
ionic capacitor build android
ionic capacitor build ios
```

## Usage

1. **Set up your month start day** in Settings (e.g., 25 if you get paid on the 25th)
2. **Add recurring payments** in the Payments tab:
   - Income: salary, freelance, etc.
   - Expenses: rent, utilities, subscriptions, etc.
3. **Track payments** in the Tracker tab:
   - Set your current account balance
   - Mark payments as completed when paid
   - Edit amounts for variable payments
   - View your forecasted balance

## Data Storage

All data is stored locally on your device using Ionic Storage:
- No cloud sync
- No API calls
- Complete privacy
- Works offline

Storage locations:
- **Web:** IndexedDB
- **Android:** SQLite
- **iOS:** SQLite

## Key Features Explained

### Custom Month Periods
Unlike traditional calendar months, OakFinance lets you define months based on your payday. If you're paid on the 25th, your "month" runs from the 25th of one month to the 24th of the next.

### Editable Log Amounts
While recurring payments have default amounts, you can edit individual log entries. Perfect for:
- Variable income (different salary each month)
- One-time adjustments (higher utility bill)
- Bonuses or irregular payments

### Financial Forecast
The fixed footer shows:
- **Current Balance:** What's in your account now
- **Pending Expenses:** Sum of unpaid bills
- **Pending Income:** Sum of expected income
- **Forecasted Balance:** `Current - Expenses + Income`

Color coding:
- 🟢 Green: Positive forecast
- 🟡 Yellow: Low balance (-$100 to $0)
- 🔴 Red: Negative forecast

## Development

### Project Structure
- Standalone Angular components (no NgModules)
- Service-based architecture with Observables
- Reactive forms for data entry
- Ionic components for UI

### Services
- **DatePeriodService:** Calculates custom month periods, handles edge cases (31st day in February)
- **RecurringPaymentService:** CRUD operations for payment templates
- **PaymentLogService:** Auto-generates logs, tracks completion, calculates forecasts
- **BalanceService:** Persists account balance per period
- **SettingsService:** Manages app configuration

## Future Enhancements

- [ ] Data export/import (JSON)
- [ ] Charts and analytics
- [ ] Notifications for upcoming bills
- [ ] Multiple accounts
- [ ] Budget categories
- [ ] Receipt photo attachments
- [ ] Recurring payment history
- [x] Dark mode theme ✓ (Implemented)

## Design System

OakFinance uses a modern dark theme inspired by contemporary financial apps.

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Green | `#5CB299` | Primary actions, income indicators, active states |
| Coral Pink | `#F5A9B8` | Secondary accent |
| Golden Yellow | `#E8C547` | Warnings, tertiary accent |
| Danger Red | `#E57373` | Expenses, errors, negative values |
| Background Dark | `#1A1A1A` | Main background |
| Card Background | `#252525` | Card surfaces |
| Input Background | `#333333` | Form inputs, segments |

### Typography

- **Font Family**: System fonts (SF Pro Display, Segoe UI, Roboto)
- **Font Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
- **Text Colors**: 
  - Primary: `#FFFFFF`
  - Secondary: `#B3B3B3`
  - Muted: `#808080`

### Spacing

- Extra Small (xs): 4px
- Small (sm): 8px
- Medium (md): 16px
- Large (lg): 24px
- Extra Large (xl): 32px

### Border Radius

- Small: 8px
- Medium: 12px
- Large: 16px
- Extra Large: 20px

### Components

- **Cards**: Dark backgrounds with subtle borders and shadows
- **Buttons**: Rounded with primary green accent
- **Inputs**: Dark backgrounds with focus ring highlights
- **Badges**: Semi-transparent backgrounds with colored text
- **Tabs**: Dark background with green active indicator

## License

Private project - All rights reserved

## Version

1.0.0 - Initial release

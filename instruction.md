# instruction.md

## Additional Features

### 1. Monthly Savings Goals
- Users can create monthly savings goals.
- Display animated circular progress.
- Show remaining amount, percentage, and status.

### 2. Custom Expense Categories
- Users can create/edit/delete custom categories.
- Each category supports:
  - Name
  - Icon (Lucide)
  - Color
- Used across forms, logs, charts.

### 3. Calendar View
- Monthly calendar showing all transactions.
- Click a date to view entries.
- Color-code savings, expenses, cash received, bank transactions.

### 4. Advanced Analytics
Provide comparisons for:
- Weekly
- Monthly
- Yearly
Include:
- Pie charts
- Bar charts
- Line charts
- Trend indicators
- Highest spending categories
- Period-over-period comparison.

### 5. Offline Support
Use IndexedDB.
- Cache transactions locally.
- Queue CRUD actions while offline.
- Auto-sync when internet returns.
- Show sync status indicator.

### 6. Automatic Backup & Restore
- Export/import JSON snapshots.
- Optional scheduled local backup.
- Restore from previous backup.
- Validate imported data before restore.

### 7. Progressive Web App (PWA)
- Installable on desktop/mobile.
- Manifest and service worker.
- Offline shell.
- App icons and splash screens.
- Background asset caching.
- Update notification when a new version is available.

## Integration Notes
Integrate these features with the existing specification:
- React + Vite
- TailwindCSS
- shadcn/ui
- Supabase
- Recharts
- React Hook Form + Zod
- Framer Motion
- IndexedDB (Dexie or idb)
- Workbox/Vite PWA plugin

All existing requirements remain unchanged; these features are additive.

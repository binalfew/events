# P3-08: Analytics Dashboard

| Field                  | Value                                               |
| ---------------------- | --------------------------------------------------- |
| **Task ID**            | P3-08                                               |
| **Phase**              | 3 — Advanced Features                               |
| **Category**           | Feature                                             |
| **Suggested Assignee** | Senior Frontend Engineer                            |
| **Depends On**         | P3-00                                               |
| **Blocks**             | None                                                |
| **Estimated Effort**   | 6 days                                              |
| **Module References**  | [Module 08](../../modules/08-UI-UX-AND-FRONTEND.md) |

---

## Context

The platform lacks data visualization. Admins need to see registration trends, SLA compliance rates, throughput by step, and funnel analysis. The `AnalyticsSnapshot` model (created in P3-00) stores periodic metric snapshots. This task adds chart components using `recharts` and a dashboard page with configurable widgets.

---

## Deliverables

### 1. Install Dependencies

```bash
npm install recharts
```

### 2. Analytics Service

Create `app/services/analytics.server.ts`:

**Real-time metrics (computed on request):**

```typescript
// Registration funnel: counts by status
getRegistrationFunnel(tenantId: string, eventId: string): Promise<FunnelData[]>

// SLA compliance: % of participants processed within SLA per step
getSLACompliance(tenantId: string, eventId: string): Promise<SLAComplianceData[]>

// Throughput: participants processed per step per time period
getThroughput(tenantId: string, eventId: string, period: "hour" | "day" | "week"): Promise<ThroughputData[]>

// Status distribution: participants by status
getStatusDistribution(tenantId: string, eventId: string): Promise<StatusData[]>

// Top-level summary: total participants, approved, rejected, pending, completion rate
getSummary(tenantId: string, eventId: string): Promise<SummaryData>
```

**Snapshot management (for historical charts):**

```typescript
// Capture current metrics as snapshots (run periodically)
captureSnapshot(tenantId: string, eventId: string): Promise<void>

// Get historical data for a metric
getHistory(tenantId: string, eventId: string, metric: string, period: string, from: Date, to: Date): Promise<AnalyticsSnapshot[]>
```

**Return types:**

```typescript
interface FunnelData {
  stage: string;
  count: number;
  percentage: number;
}

interface SLAComplianceData {
  stepName: string;
  totalProcessed: number;
  withinSLA: number;
  complianceRate: number;
}

interface ThroughputData {
  period: string; // ISO date string
  stepName: string;
  count: number;
}

interface StatusData {
  status: string;
  count: number;
  color: string;
}

interface SummaryData {
  totalParticipants: number;
  approved: number;
  rejected: number;
  pending: number;
  inProgress: number;
  completionRate: number;
  avgProcessingTimeMinutes: number;
}
```

### 3. Chart Components

Create `app/components/analytics/`:

- **`summary-cards.tsx`** — KPI cards: total, approved, rejected, pending, completion rate
- **`funnel-chart.tsx`** — Registration funnel (horizontal bar or funnel shape) using `recharts`
- **`sla-chart.tsx`** — SLA compliance per step (bar chart, green/red threshold line)
- **`throughput-chart.tsx`** — Line chart: participants processed over time, grouped by step
- **`status-pie-chart.tsx`** — Pie/donut chart of participant status distribution
- **`chart-wrapper.tsx`** — Reusable wrapper with loading state, empty state, title, and refresh button

### 4. Dashboard Page

Create `app/routes/admin/analytics.tsx`:

- Top filters: event selector, date range picker, participant type filter
- Grid layout with chart widgets:
  - Row 1: Summary KPI cards (4 across)
  - Row 2: Funnel chart (left), Status pie chart (right)
  - Row 3: Throughput line chart (full width)
  - Row 4: SLA compliance bar chart (full width)
- Refresh button to reload all data
- CSV export button: exports current filtered data as CSV

### 5. CSV Export

Add export utility `app/lib/csv-export.ts`:

- Convert analytics data to CSV format
- Trigger browser download with appropriate filename
- Include date range and filters in filename

### 6. Snapshot Job (Optional)

Create a periodic job (can use existing SLA job pattern):

- Run every hour
- Capture current metrics as `AnalyticsSnapshot` records
- Prune snapshots older than 90 days

### 7. Feature Flag Gate

All analytics features gated behind `FF_ANALYTICS_DASHBOARD`:

- Analytics page returns 403 or shows "feature not available"
- Analytics nav item hidden in sidebar

---

## Acceptance Criteria

- [ ] `recharts` installed and tree-shaken
- [ ] Summary KPI cards show correct counts
- [ ] Funnel chart visualizes registration pipeline
- [ ] SLA compliance chart shows per-step rates with threshold
- [ ] Throughput chart shows time series with step grouping
- [ ] Status pie chart shows participant distribution
- [ ] Event and date range filters work
- [ ] CSV export downloads current data
- [ ] Charts handle empty data gracefully (empty state)
- [ ] Feature flag `FF_ANALYTICS_DASHBOARD` gates the feature
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes

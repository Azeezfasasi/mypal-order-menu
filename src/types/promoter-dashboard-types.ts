export interface IPromoterMetric {
  value: number | string;
  formatted?: string;
  growth_vs_last_week: string;
}

export interface IPromoterMetrics {
  tickets_sold: IPromoterMetric;
  revenue: IPromoterMetric;
  conversion_rate: IPromoterMetric;
  avg_order_value: IPromoterMetric;
}

export interface IPromoterTopPerformingEvent {
  id: string;
  title: string;
  flyer_url: string;
  status: string;
  date: string;
  location: string;
  tickets_sold_percent: string;
  tickets_sold: number;
  total_capacity: number;
  revenue_formatted: string;
  days_left: number;
}

export interface IPromoterSmartSuggestion {
  id: string;
  title: string;
  description: string;
  action: string;
}

export interface IPromoterUpcomingEvent {
  id: string;
  title: string;
  status: string;
  date: string;
  flyer_url: string;
  percentage_sold: string;
  sold_count: number;
  total_capacity: number;
}

export interface IPromoterRecentActivity {
  id: string;
  text: string;
  timestamp: string;
}

export interface IPromoterDashboardOverview {
  metrics: IPromoterMetrics;
  top_performing_event: IPromoterTopPerformingEvent | null;
  smart_suggestions: IPromoterSmartSuggestion[];
  upcoming_events: IPromoterUpcomingEvent[];
  recent_activity: IPromoterRecentActivity[];
}

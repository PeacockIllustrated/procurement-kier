"use client";

import { useState, useEffect } from "react";

interface SummaryData {
  totalVisits: number;
  firstVisit: string | null;
  lastActive: string | null;
  totalPageViews: number;
  uniqueProductsViewed: number;
  mostViewedCategory: { name: string; count: number } | null;
  mostViewedProduct: { name: string; count: number } | null;
  ordersPlaced: number;
  basketAdds: number;
  avgSessionDurationMs: number;
}

interface TimelineEvent {
  event_type: string;
  page: string;
  metadata: Record<string, unknown>;
  duration_ms: number | null;
  created_at: string;
}

interface SessionGroup {
  sessionId: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  pageCount: number;
  events: TimelineEvent[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(iso: string): string {
  return `${formatDate(iso)}, ${formatTime(iso)}`;
}

function formatDuration(ms: number): string {
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.round((ms % 60000) / 1000);
  if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins}m`;
}

function friendlyPageName(page: string): string {
  if (page === "/") return "Homepage";
  if (page === "/basket") return "Basket";
  if (page === "/checkout") return "Checkout";
  if (page === "/orders") return "Orders";
  if (page === "/custom-sign") return "Custom Sign Builder";
  if (page === "/order-confirmation") return "Order Confirmation";
  if (page.startsWith("/category/")) return `Category: ${page.split("/").pop()}`;
  if (page.startsWith("/product/")) return `Product: ${page.split("/").pop()}`;
  return page;
}

const EVENT_STYLES: Record<string, { dot: string; label: (e: TimelineEvent) => string }> = {
  session_start: {
    dot: "bg-green-400",
    label: () => "Session started",
  },
  page_view: {
    dot: "bg-gray-300",
    label: (e) => `Viewed ${friendlyPageName(e.page)}`,
  },
  product_view: {
    dot: "bg-blue-400",
    label: (e) => `Viewed product ${e.metadata.productCode} — ${e.metadata.productName}`,
  },
  category_view: {
    dot: "bg-indigo-400",
    label: (e) => `Browsed category: ${e.metadata.categoryName}`,
  },
  add_to_basket: {
    dot: "bg-amber-400",
    label: (e) => `Added "${e.metadata.productName}" to basket`,
  },
  remove_from_basket: {
    dot: "bg-red-300",
    label: (e) => `Removed "${e.metadata.productName}" from basket`,
  },
  checkout_start: {
    dot: "bg-purple-400",
    label: () => "Started checkout",
  },
  order_placed: {
    dot: "bg-emerald-500",
    label: (e) => `Placed order ${e.metadata.orderNumber}`,
  },
  custom_sign_interact: {
    dot: "bg-pink-400",
    label: () => "Used custom sign builder",
  },
  page_duration: {
    dot: "bg-gray-200",
    label: (e) => `Spent ${formatDuration(e.metadata.durationMs as number)} on ${friendlyPageName(e.metadata.page as string)}`,
  },
};

export default function AdminAnalytics() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [sessions, setSessions] = useState<SessionGroup[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [timelinePage, setTimelinePage] = useState(1);
  const [range, setRange] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchData = async (r: string, p: number) => {
    setLoading(true);
    try {
      const [summaryRes, timelineRes] = await Promise.all([
        fetch(`/api/analytics/summary?range=${r}`),
        fetch(`/api/analytics/timeline?range=${r}&page=${p}`),
      ]);
      const summaryData = await summaryRes.json();
      const timelineData = await timelineRes.json();
      setSummary(summaryData);
      setSessions(timelineData.sessions || []);
      setTotalSessions(timelineData.totalSessions || 0);
    } catch {
      console.error("Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(range, timelinePage);
  }, [range, timelinePage]);

  const changeRange = (newRange: string) => {
    setRange(newRange);
    setTimelinePage(1);
  };

  if (loading && !summary) {
    return (
      <div className="text-center text-gray-400 py-16">Loading analytics...</div>
    );
  }

  const totalPages = Math.ceil(totalSessions / 20);

  return (
    <div>
      {/* Date range filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { value: "7d", label: "Last 7 days" },
          { value: "30d", label: "Last 30 days" },
          { value: "all", label: "All time" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => changeRange(opt.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
              range === opt.value
                ? "bg-brand-navy text-white shadow-sm"
                : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          <StatCard label="Total Visits" value={summary.totalVisits} />
          <StatCard
            label="First Visit"
            value={summary.firstVisit ? formatDate(summary.firstVisit) : "—"}
          />
          <StatCard
            label="Last Active"
            value={summary.lastActive ? formatDateTime(summary.lastActive) : "—"}
          />
          <StatCard label="Page Views" value={summary.totalPageViews} />
          <StatCard label="Products Viewed" value={summary.uniqueProductsViewed} />
          <StatCard
            label="Top Category"
            value={
              summary.mostViewedCategory
                ? `${summary.mostViewedCategory.name} (${summary.mostViewedCategory.count})`
                : "—"
            }
          />
          <StatCard
            label="Top Product"
            value={
              summary.mostViewedProduct
                ? `${summary.mostViewedProduct.name} (${summary.mostViewedProduct.count})`
                : "—"
            }
          />
          <StatCard label="Orders Placed" value={summary.ordersPlaced} />
          <StatCard label="Basket Adds" value={summary.basketAdds} />
          <StatCard
            label="Avg. Session"
            value={
              summary.avgSessionDurationMs > 0
                ? formatDuration(summary.avgSessionDurationMs)
                : "—"
            }
          />
        </div>
      )}

      {/* Activity Timeline */}
      <h3 className="text-lg font-bold text-brand-navy mb-4">Activity Timeline</h3>

      {sessions.length === 0 ? (
        <div className="text-center text-gray-400 py-12 bg-white rounded-2xl border border-gray-100">
          No activity recorded yet
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.sessionId}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
            >
              {/* Session header */}
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-primary" />
                  <span className="text-sm font-semibold text-brand-navy">
                    Session — {formatDateTime(session.startedAt)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{formatDuration(session.durationMs)}</span>
                  <span>{session.pageCount} pages</span>
                </div>
              </div>

              {/* Events */}
              <div className="px-5 py-3">
                <div className="space-y-2">
                  {session.events
                    .filter((e) => e.event_type !== "page_duration")
                    .map((event, i) => {
                      const style = EVENT_STYLES[event.event_type] || {
                        dot: "bg-gray-300",
                        label: () => event.event_type,
                      };
                      return (
                        <div key={i} className="flex items-start gap-3">
                          <span className="text-xs text-gray-300 w-14 shrink-0 pt-0.5 text-right">
                            {formatTime(event.created_at)}
                          </span>
                          <div
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${style.dot}`}
                          />
                          <span className="text-sm text-gray-600">
                            {style.label(event)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setTimelinePage((p) => Math.max(1, p - 1))}
                disabled={timelinePage === 1}
                className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition"
              >
                Previous
              </button>
              <span className="text-sm text-gray-400">
                Page {timelinePage} of {totalPages}
              </span>
              <button
                onClick={() => setTimelinePage((p) => Math.min(totalPages, p + 1))}
                disabled={timelinePage === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-lg font-bold text-brand-navy truncate">{value}</p>
    </div>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isAdminAuthed } from "@/lib/auth";
import { tables } from "@/lib/brand";

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const url = new URL(req.url);
  const range = url.searchParams.get("range") || "all"; // "7d", "30d", "all"

  let query = supabase.from(tables.analytics).select("*");

  if (range === "7d") {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("created_at", since);
  } else if (range === "30d") {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("created_at", since);
  }

  const { data: events, error } = await query.order("created_at", { ascending: true });

  if (error) {
    console.error("Analytics summary error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }

  if (!events || events.length === 0) {
    return NextResponse.json({
      totalVisits: 0,
      firstVisit: null,
      lastActive: null,
      totalPageViews: 0,
      uniqueProductsViewed: 0,
      mostViewedCategory: null,
      mostViewedProduct: null,
      ordersPlaced: 0,
      basketAdds: 0,
      avgSessionDurationMs: 0,
    });
  }

  // Aggregate
  const sessions = new Set<string>();
  let totalPageViews = 0;
  const productCodes = new Set<string>();
  const categoryCounts: Record<string, { name: string; count: number }> = {};
  const productCounts: Record<string, { name: string; count: number }> = {};
  let ordersPlaced = 0;
  let basketAdds = 0;

  // Session timing
  const sessionTimes: Record<string, { min: number; max: number }> = {};

  for (const e of events) {
    sessions.add(e.session_id);

    const ts = new Date(e.created_at).getTime();
    if (!sessionTimes[e.session_id]) {
      sessionTimes[e.session_id] = { min: ts, max: ts };
    } else {
      if (ts < sessionTimes[e.session_id].min) sessionTimes[e.session_id].min = ts;
      if (ts > sessionTimes[e.session_id].max) sessionTimes[e.session_id].max = ts;
    }

    switch (e.event_type) {
      case "page_view":
        totalPageViews++;
        break;
      case "product_view": {
        const code = e.metadata?.productCode as string;
        const name = e.metadata?.productName as string;
        if (code) {
          productCodes.add(code);
          if (!productCounts[code]) productCounts[code] = { name: name || code, count: 0 };
          productCounts[code].count++;
        }
        break;
      }
      case "category_view": {
        const slug = e.metadata?.categorySlug as string;
        const name = e.metadata?.categoryName as string;
        if (slug) {
          if (!categoryCounts[slug]) categoryCounts[slug] = { name: name || slug, count: 0 };
          categoryCounts[slug].count++;
        }
        break;
      }
      case "order_placed":
        ordersPlaced++;
        break;
      case "add_to_basket":
        basketAdds++;
        break;
    }
  }

  // Most viewed
  const mostViewedCategory = Object.values(categoryCounts).sort((a, b) => b.count - a.count)[0] || null;
  const mostViewedProduct = Object.values(productCounts).sort((a, b) => b.count - a.count)[0] || null;

  // Avg session duration
  const durations = Object.values(sessionTimes).map((t) => t.max - t.min).filter((d) => d > 0);
  const avgSessionDurationMs = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  return NextResponse.json({
    totalVisits: sessions.size,
    firstVisit: events[0].created_at,
    lastActive: events[events.length - 1].created_at,
    totalPageViews,
    uniqueProductsViewed: productCodes.size,
    mostViewedCategory,
    mostViewedProduct,
    ordersPlaced,
    basketAdds,
    avgSessionDurationMs,
  });
}

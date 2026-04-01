import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isAdminAuthed } from "@/lib/auth";
import { tables } from "@/lib/brand";

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

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const url = new URL(req.url);
  const range = url.searchParams.get("range") || "all";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const perPage = 20;

  // First, get distinct session IDs ordered by most recent activity
  let sessionsQuery = supabase
    .from(tables.analytics)
    .select("session_id, created_at");

  if (range === "7d") {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    sessionsQuery = sessionsQuery.gte("created_at", since);
  } else if (range === "30d") {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    sessionsQuery = sessionsQuery.gte("created_at", since);
  }

  const { data: allEvents, error } = await sessionsQuery.order("created_at", { ascending: false });

  if (error) {
    console.error("Analytics timeline error:", error);
    return NextResponse.json({ error: "Failed to fetch timeline" }, { status: 500 });
  }

  if (!allEvents || allEvents.length === 0) {
    return NextResponse.json({ sessions: [], totalSessions: 0, page, perPage });
  }

  // Group by session and find each session's latest event
  const sessionLatest: Record<string, string> = {};
  for (const e of allEvents) {
    if (!sessionLatest[e.session_id] || e.created_at > sessionLatest[e.session_id]) {
      sessionLatest[e.session_id] = e.created_at;
    }
  }

  // Sort sessions by most recent activity
  const sortedSessionIds = Object.entries(sessionLatest)
    .sort((a, b) => b[1].localeCompare(a[1]))
    .map(([id]) => id);

  const totalSessions = sortedSessionIds.length;
  const paginatedIds = sortedSessionIds.slice((page - 1) * perPage, page * perPage);

  if (paginatedIds.length === 0) {
    return NextResponse.json({ sessions: [], totalSessions, page, perPage });
  }

  // Fetch full events for paginated sessions
  const { data: sessionEvents, error: eventsError } = await supabase
    .from(tables.analytics)
    .select("*")
    .in("session_id", paginatedIds)
    .order("created_at", { ascending: true });

  if (eventsError) {
    console.error("Analytics session events error:", eventsError);
    return NextResponse.json({ error: "Failed to fetch session events" }, { status: 500 });
  }

  // Group into session objects
  const sessionMap: Record<string, SessionGroup> = {};
  for (const e of sessionEvents || []) {
    if (!sessionMap[e.session_id]) {
      sessionMap[e.session_id] = {
        sessionId: e.session_id,
        startedAt: e.created_at,
        endedAt: e.created_at,
        durationMs: 0,
        pageCount: 0,
        events: [],
      };
    }
    const group = sessionMap[e.session_id];
    if (e.created_at < group.startedAt) group.startedAt = e.created_at;
    if (e.created_at > group.endedAt) group.endedAt = e.created_at;
    if (e.event_type === "page_view") group.pageCount++;
    group.events.push({
      event_type: e.event_type,
      page: e.page,
      metadata: e.metadata || {},
      duration_ms: e.duration_ms,
      created_at: e.created_at,
    });
  }

  // Calculate durations and sort sessions by most recent
  const sessions = paginatedIds
    .map((id) => sessionMap[id])
    .filter(Boolean)
    .map((s) => ({
      ...s,
      durationMs: new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime(),
      events: s.events.reverse(), // Most recent first within session
    }));

  return NextResponse.json({ sessions, totalSessions, page, perPage });
}

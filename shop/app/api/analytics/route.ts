import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isShopAuthed } from "@/lib/auth";
import { tables } from "@/lib/brand";

export async function POST(req: NextRequest) {
  if (!(await isShopAuthed())) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    // Handle both JSON and text/plain (sendBeacon with Blob sends application/json,
    // but raw sendBeacon sends text/plain)
    let body: { events?: unknown };
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const text = await req.text();
      body = JSON.parse(text);
    }

    const { events } = body;
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "No events provided" }, { status: 400 });
    }

    // Validate and sanitize events
    const validEvents = events
      .filter(
        (e: Record<string, unknown>) =>
          typeof e.session_id === "string" &&
          e.session_id.length > 0 &&
          typeof e.event_type === "string" &&
          e.event_type.length > 0 &&
          typeof e.page === "string" &&
          e.page.length > 0
      )
      .slice(0, 100) // Max 100 events per batch
      .map((e: Record<string, unknown>) => ({
        session_id: String(e.session_id),
        event_type: String(e.event_type),
        page: String(e.page),
        metadata: typeof e.metadata === "object" && e.metadata !== null ? e.metadata : {},
        duration_ms:
          typeof e.duration_ms === "number" ? Math.floor(e.duration_ms) : null,
      }));

    if (validEvents.length === 0) {
      return NextResponse.json({ error: "No valid events" }, { status: 400 });
    }

    const { error } = await supabase.from(tables.analytics).insert(validEvents);

    if (error) {
      console.error("Analytics insert error:", error);
      return NextResponse.json(
        { error: "Failed to save events" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

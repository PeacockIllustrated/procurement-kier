"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

interface AnalyticsEvent {
  session_id: string;
  event_type: string;
  page: string;
  metadata: Record<string, unknown>;
  duration_ms: number | null;
}

interface AnalyticsContextType {
  track: (
    eventType: string,
    metadata?: Record<string, unknown>
  ) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

const MAX_QUEUE = 100;
const FLUSH_INTERVAL_MS = 5000;

function getSessionId(): string {
  let id = sessionStorage.getItem("_a_sid");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("_a_sid", id);
  }
  return id;
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const queueRef = useRef<AnalyticsEvent[]>([]);
  const sessionIdRef = useRef<string | null>(null);
  const pageEnteredAtRef = useRef<number>(Date.now());
  const previousPageRef = useRef<string | null>(null);
  const sessionStartedRef = useRef(false);
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get or create session ID
  const getSession = useCallback((): string => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = getSessionId();
    }
    return sessionIdRef.current;
  }, []);

  // Flush queue to API
  const flush = useCallback(() => {
    const events = queueRef.current;
    if (events.length === 0) return;
    queueRef.current = [];

    const body = JSON.stringify({ events });

    // Try sendBeacon first (works during unload), fall back to fetch
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(
        "/api/analytics",
        new Blob([body], { type: "application/json" })
      );
      if (sent) return;
    }

    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // Re-queue on failure (up to max)
      queueRef.current = [...events, ...queueRef.current].slice(-MAX_QUEUE);
    });
  }, []);

  // Core track function
  const track = useCallback(
    (eventType: string, metadata: Record<string, unknown> = {}) => {
      // Skip tracking on admin pages
      if (pathname.startsWith("/admin")) return;

      const event: AnalyticsEvent = {
        session_id: getSession(),
        event_type: eventType,
        page: pathname,
        metadata,
        duration_ms: null,
      };
      queueRef.current = [...queueRef.current.slice(-(MAX_QUEUE - 1)), event];
    },
    [pathname, getSession]
  );

  // Set up flush interval + beforeunload
  useEffect(() => {
    flushTimerRef.current = setInterval(flush, FLUSH_INTERVAL_MS);

    const handleUnload = () => {
      // Send time-on-page for current page
      if (previousPageRef.current !== null) {
        const duration = Date.now() - pageEnteredAtRef.current;
        track("page_duration", {
          page: pathname,
          durationMs: duration,
        });
      }
      flush();
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [flush, track, pathname]);

  // Session start (once per session)
  useEffect(() => {
    if (sessionStartedRef.current) return;
    if (pathname.startsWith("/admin")) return;
    sessionStartedRef.current = true;
    track("session_start");
  }, [track, pathname]);

  // Automatic page_view tracking on route change
  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    // Send duration of previous page
    if (previousPageRef.current !== null) {
      const duration = Date.now() - pageEnteredAtRef.current;
      track("page_duration", {
        page: previousPageRef.current,
        durationMs: duration,
      });
    }

    // Track new page view
    track("page_view");
    pageEnteredAtRef.current = Date.now();
    previousPageRef.current = pathname;
  }, [pathname, track]);

  return (
    <AnalyticsContext.Provider value={{ track }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalytics must be used within AnalyticsProvider");
  }
  return context;
}

"use client";

import { useEffect } from "react";
import { useAnalytics } from "@/components/analytics-provider";

interface TrackEventProps {
  eventType: string;
  metadata?: Record<string, unknown>;
}

export default function TrackEvent({ eventType, metadata = {} }: TrackEventProps) {
  const { track } = useAnalytics();

  useEffect(() => {
    track(eventType, metadata);
    // Only fire on mount — metadata is intentionally excluded from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

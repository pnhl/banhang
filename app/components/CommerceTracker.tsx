"use client";

import { useEffect } from "react";
import {
  CommerceEventName,
  trackCommerceEvent,
} from "../lib/analytics";

export function CommerceTracker({
  name,
  params = {},
}: {
  name: CommerceEventName;
  params?: Record<string, unknown>;
}) {
  const serialized = JSON.stringify(params);
  useEffect(() => {
    trackCommerceEvent(
      name,
      JSON.parse(serialized) as Record<string, unknown>,
    );
  }, [name, serialized]);
  return null;
}

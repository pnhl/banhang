"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "nova-analytics-consent";

export function AnalyticsConsent({ enabled }: { enabled: boolean }) {
  const [choice, setChoice] = useState<"granted" | "denied" | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const stored = window.localStorage.getItem(CONSENT_KEY);
    if (stored === "granted" || stored === "denied") {
      setChoice(stored);
      window.gtag?.("consent", "update", {
        analytics_storage: stored,
        ad_storage: "denied",
      });
    }
  }, [enabled]);

  if (!enabled || choice) return null;

  const update = (value: "granted" | "denied") => {
    window.localStorage.setItem(CONSENT_KEY, value);
    window.gtag?.("consent", "update", {
      analytics_storage: value,
      ad_storage: "denied",
    });
    setChoice(value);
  };

  return (
    <aside className="analytics-consent" aria-label="Quyền riêng tư đo lường">
      <div>
        <b>Đo lường để cải thiện trải nghiệm</b>
        <p>
          LOPA chỉ bật Google Analytics khi bạn đồng ý. Dữ liệu quảng cáo vẫn
          được tắt.
        </p>
      </div>
      <button onClick={() => update("denied")}>Chỉ cần thiết</button>
      <button onClick={() => update("granted")}>Đồng ý phân tích</button>
    </aside>
  );
}

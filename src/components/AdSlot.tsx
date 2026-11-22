import { useEffect, useRef } from "react";
import { ADS_ENABLED, ADSENSE_CLIENT, ADSENSE_SLOTS, type AdPlacement } from "@/lib/ads";

type Props = {
  placement: AdPlacement;
  className?: string;
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

function AdUnit({ slot }: { slot: string }) {
  const ref = useRef<HTMLModElement>(null);

  useEffect(() => {
    const el = ref.current;
    // Guard against double-push (React strict mode / re-mounts) which AdSense rejects.
    if (!el || el.getAttribute("data-adsbygoogle-status")) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ad blockers or not-yet-approved accounts: fail silently, never break the calculator.
    }
  }, []);

  return (
    <ins
      ref={ref}
      className="adsbygoogle block w-full"
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}

export function AdSlot({ placement, className = "" }: Props) {
  const slot = ADSENSE_SLOTS[placement];

  if (!ADS_ENABLED || !slot) return null;

  return (
    <aside
      aria-label="Advertisement"
      className={`ad-slot w-full overflow-hidden ${placement === "header" ? "min-h-[100px]" : "min-h-[250px]"} ${className}`}
    >
      {/* Each route renders its own PageLayout, so units remount (and request a new ad) on navigation. */}
      <AdUnit slot={slot} />
    </aside>
  );
}

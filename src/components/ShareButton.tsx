import { useState, useSyncExternalStore } from "react";
import { Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildShareUrl, shareInputCount, subscribeShareInputs } from "@/lib/shareLink";

export function ShareButton() {
  const count = useSyncExternalStore(subscribeShareInputs, shareInputCount, () => 0);
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  if (count === 0) return null;

  const share = async () => {
    const url = buildShareUrl();
    // Reflect the shared state in the address bar too, without a router navigation.
    window.history.replaceState(window.history.state, "", url);
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    window.setTimeout(() => setStatus("idle"), 2500);
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={share} className="gap-2">
      {status === "copied" ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      {status === "copied"
        ? "Link copied"
        : status === "failed"
          ? "Copy the URL from the address bar"
          : "Copy link to this calculation"}
    </Button>
  );
}

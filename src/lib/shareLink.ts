/**
 * Shareable calculation links.
 *
 * Every `MatrixInput` registers itself under a short key derived from its title (e.g.
 * "Matrix A (numeric)" → "a"). The share button collects the current values into the query
 * string (`?a=1,2;3,4&b=5,6;7,8`), and on load each input restores its value from that string.
 * The URL is only written when someone shares, so normal browsing keeps clean URLs; the
 * canonical link always points at the bare path.
 */
import { matrixToText, parseMatrixText, type Matrix } from "@/lib/matrix";

const MAX_DIM = 10;

export function inputKey(title: string): string {
  const base = title
    .replace(/\([^)]*\)/g, " ")
    .replace(/^\s*matrix\s+/i, "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return base || "m";
}

export function encodeMatrix(m: Matrix): string {
  return matrixToText(m)
    .split("\n")
    .map((row) => row.split("\t").join(","))
    .join(";");
}

export function decodeMatrix(raw: string): Matrix {
  const m = parseMatrixText(raw.split(";").join("\n"));
  if (m.length > MAX_DIM || (m[0]?.length ?? 0) > MAX_DIM) {
    throw new Error(`Shared matrices are limited to ${MAX_DIM}×${MAX_DIM}`);
  }
  return m;
}

type Entry = { key: string; get: () => Matrix };

const entries: Entry[] = [];
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

/** Registers an input; returns the key actually assigned (deduplicated) and an unregister fn. */
export function registerShareInput(baseKey: string, get: () => Matrix) {
  let key = baseKey;
  for (let i = 2; entries.some((e) => e.key === key); i++) key = `${baseKey}${i}`;
  const entry: Entry = { key, get };
  entries.push(entry);
  notify();
  return {
    key,
    unregister: () => {
      const idx = entries.indexOf(entry);
      if (idx >= 0) entries.splice(idx, 1);
      notify();
    },
  };
}

export function subscribeShareInputs(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function shareInputCount() {
  return entries.length;
}

export function buildShareUrl(): string {
  const url = new URL(window.location.href);
  // Keep `,` `;` and `/` readable (all valid in a query string): ?a=1,2;3,4 instead of %2C/%3B.
  const query = entries
    .map(
      ({ key, get }) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(encodeMatrix(get()))
          .replace(/%2C/g, ",")
          .replace(/%3B/g, ";")
          .replace(/%2F/g, "/")}`,
    )
    .join("&");
  return `${url.origin}${url.pathname}${query ? `?${query}` : ""}`;
}

export function readSharedParam(key: string): Matrix | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get(key);
  if (!raw) return null;
  try {
    return decodeMatrix(raw);
  } catch {
    return null;
  }
}

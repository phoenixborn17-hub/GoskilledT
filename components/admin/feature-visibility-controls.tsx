"use client";
// Feature Visibility controls (DR-040 · Tier A). Per feature: set/clear the GLOBAL override (the
// review-window lever), plus per-ROLE and per-USER overrides. Resolution is HIDE-WINS / fail-safe —
// any applicable "hide" hides, so a global hide can't be re-revealed by a stale per-user flag.
// Every change is audited server-side (AdminAction). This is admin UI only — the real enforcement
// lives in the server resolver/route guards.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EyeOff, Eye, RotateCcw, X } from "lucide-react";
import {
  setFeatureVisibilityAction,
  clearFeatureVisibilityAction,
} from "../../app/admin/feature-visibility/actions";
import type { FeatureFlagView } from "../../lib/admin/feature-visibility";

export function FeatureVisibilityControls({ flag }: { flag: FeatureFlagView }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [role, setRole] = useState("REVIEWER");
  const [userId, setUserId] = useState("");

  const effectiveGlobal = flag.globalOverride ?? flag.defaultVisible;

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setErr(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) router.refresh();
      else setErr(res.error ?? "Something went wrong.");
    });
  }

  const setGlobal = (visible: boolean) =>
    run(() =>
      setFeatureVisibilityAction({
        featureKey: flag.key,
        scope: "GLOBAL",
        scopeValue: "",
        visible,
      }),
    );
  const clearGlobal = () =>
    run(() =>
      clearFeatureVisibilityAction({
        featureKey: flag.key,
        scope: "GLOBAL",
        scopeValue: "",
      }),
    );

  const pillBtn = (active: boolean, danger?: boolean) =>
    [
      "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-40",
      active
        ? danger
          ? "bg-danger text-brand-fg"
          : "bg-brand text-brand-fg"
        : "border border-line text-ink hover:bg-charcoal/5",
    ].join(" ");

  return (
    <div className="space-y-4">
      {/* Effective state */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
            effectiveGlobal
              ? "bg-brand text-brand-fg"
              : "bg-charcoal/80 text-white"
          }`}
        >
          {effectiveGlobal ? "VISIBLE" : "HIDDEN"} (default)
        </span>
        <span className="text-xs text-muted">
          Registry default: {flag.defaultVisible ? "visible" : "hidden"} ·
          resolution is hide-wins
        </span>
      </div>

      {/* GLOBAL scope */}
      <div className="rounded-lg border border-line p-3">
        <p className="mb-2 text-sm font-semibold">Global (platform-wide)</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => setGlobal(true)}
            className={pillBtn(flag.globalOverride === true)}
          >
            <Eye className="h-4 w-4" aria-hidden /> Show
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setGlobal(false)}
            className={pillBtn(flag.globalOverride === false, true)}
          >
            <EyeOff className="h-4 w-4" aria-hidden /> Hide
          </button>
          <button
            type="button"
            disabled={pending || flag.globalOverride === null}
            onClick={clearGlobal}
            className={pillBtn(flag.globalOverride === null)}
          >
            <RotateCcw className="h-4 w-4" aria-hidden /> Use default
          </button>
        </div>
      </div>

      {/* ROLE + USER scopes */}
      <div className="grid gap-3 md:grid-cols-2">
        <ScopePanel
          title="Per role"
          placeholder="Role (e.g. REVIEWER)"
          value={role}
          setValue={setRole}
          overrides={flag.roleOverrides}
          pending={pending}
          onSet={(visible) =>
            run(() =>
              setFeatureVisibilityAction({
                featureKey: flag.key,
                scope: "ROLE",
                scopeValue: role,
                visible,
              }),
            )
          }
          onClear={(scopeValue) =>
            run(() =>
              clearFeatureVisibilityAction({
                featureKey: flag.key,
                scope: "ROLE",
                scopeValue,
              }),
            )
          }
        />
        <ScopePanel
          title="Per user"
          placeholder="User id"
          value={userId}
          setValue={setUserId}
          overrides={flag.userOverrides}
          pending={pending}
          onSet={(visible) =>
            run(() =>
              setFeatureVisibilityAction({
                featureKey: flag.key,
                scope: "USER",
                scopeValue: userId,
                visible,
              }),
            )
          }
          onClear={(scopeValue) =>
            run(() =>
              clearFeatureVisibilityAction({
                featureKey: flag.key,
                scope: "USER",
                scopeValue,
              }),
            )
          }
        />
      </div>

      {err && <p className="text-sm text-danger">{err}</p>}
    </div>
  );
}

function ScopePanel({
  title,
  placeholder,
  value,
  setValue,
  overrides,
  pending,
  onSet,
  onClear,
}: {
  title: string;
  placeholder: string;
  value: string;
  setValue: (v: string) => void;
  overrides: { scopeValue: string; visible: boolean }[];
  pending: boolean;
  onSet: (visible: boolean) => void;
  onClear: (scopeValue: string) => void;
}) {
  return (
    <div className="rounded-lg border border-line p-3">
      <p className="mb-2 text-sm font-semibold">{title}</p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-lg border border-line px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          autoComplete="off"
        />
        <button
          type="button"
          disabled={pending || !value.trim()}
          onClick={() => onSet(false)}
          className="rounded-lg border border-danger/30 px-2.5 py-1.5 text-sm font-semibold text-danger hover:bg-danger/10 disabled:opacity-40"
        >
          Hide
        </button>
        <button
          type="button"
          disabled={pending || !value.trim()}
          onClick={() => onSet(true)}
          className="rounded-lg border border-line px-2.5 py-1.5 text-sm font-semibold hover:bg-charcoal/5 disabled:opacity-40"
        >
          Show
        </button>
      </div>
      {overrides.length > 0 && (
        <ul className="mt-2 space-y-1">
          {overrides.map((o) => (
            <li
              key={o.scopeValue}
              className="flex items-center justify-between gap-2 rounded-md bg-charcoal/5 px-2.5 py-1 text-xs"
            >
              <span className="truncate font-mono">{o.scopeValue}</span>
              <span className="flex items-center gap-2">
                <span
                  className={`font-semibold ${o.visible ? "text-brand-deep" : "text-danger"}`}
                >
                  {o.visible ? "show" : "hide"}
                </span>
                <button
                  type="button"
                  aria-label={`Clear override for ${o.scopeValue}`}
                  disabled={pending}
                  onClick={() => onClear(o.scopeValue)}
                  className="text-muted hover:text-ink disabled:opacity-40"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

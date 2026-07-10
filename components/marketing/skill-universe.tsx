"use client";
// ⭐ SIGNATURE MOMENT — the Living Skill Universe (Public Experience charter).
// Centre = You; real skill nodes (from the live catalog) orbit with animated connections. Hover
// (desktop) / tap / keyboard-focus a node → an HONEST reveal: what you'll LEARN + real status +
// a real link. No WebGL (charter "no launch R3F"): crisp SVG connectors + accessible DOM nodes,
// CSS-only motion (transform/opacity → 60fps, CLS 0), fully device-tiered — the network stays
// legible and meaningful with motion off or JS off. D-29: no outcomes, earnings, or fake data.
import * as React from "react";
import Link from "next/link";
import {
  BrainCircuit,
  Megaphone,
  LineChart,
  Code2,
  MessagesSquare,
  BookOpen,
  UserRound,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import type {
  SkillNode,
  NodeIconKey,
} from "../../lib/marketing/skill-universe";
import { cn } from "../../lib/utils";

const ICONS: Record<NodeIconKey, LucideIcon> = {
  ai: BrainCircuit,
  marketing: Megaphone,
  finance: LineChart,
  tech: Code2,
  skills: MessagesSquare,
  generic: BookOpen,
};

export function SkillUniverse({ nodes }: { nodes: SkillNode[] }) {
  // No node selected at rest → the centre shows the brand promise. Selecting reveals honest detail.
  const [active, setActive] = React.useState<string | null>(null);
  const activeNode = nodes.find((n) => n.key === active) ?? null;

  return (
    <div className="su-wrap">
      {/* The canvas: connectors (SVG) behind, nodes (DOM buttons) in front. */}
      <div
        className="su-canvas"
        role="group"
        aria-label="Explore GoSkilled skills"
        onMouseLeave={() => setActive(null)}
      >
        {/* Connection layer — non-scaling stroke so lines stay crisp under the stretched viewBox. */}
        <svg
          className="su-links"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          {nodes.map((n) => {
            const on = active === n.key;
            return (
              <g key={n.key}>
                <line
                  x1={50}
                  y1={50}
                  x2={n.x}
                  y2={n.y}
                  className={cn("su-link", on && "su-link-on")}
                  vectorEffect="non-scaling-stroke"
                />
                {/* Energy pulse travelling You → skill (capable tier only; CSS handles the rest). */}
                <line
                  x1={50}
                  y1={50}
                  x2={n.x}
                  y2={n.y}
                  className="su-pulse"
                  vectorEffect="non-scaling-stroke"
                  style={{
                    animationDelay: `${(nodes.indexOf(n) * 0.6).toFixed(2)}s`,
                  }}
                />
              </g>
            );
          })}
        </svg>

        {/* Centre = You */}
        <div className="su-center" aria-hidden>
          <div className="su-center-ring">
            <UserRound className="h-6 w-6" strokeWidth={2} />
          </div>
          <span className="su-center-label">You</span>
        </div>

        {/* Skill nodes */}
        {nodes.map((n) => {
          const Icon = ICONS[n.iconKey];
          const on = active === n.key;
          return (
            <button
              key={n.key}
              type="button"
              className={cn("su-node", on && "su-node-on")}
              style={{ left: `${n.x}%`, top: `${n.y}%` }}
              onMouseEnter={() => setActive(n.key)}
              onFocus={() => setActive(n.key)}
              // Always SELECT (never toggle) so a tap/click doesn't cancel the hover-set state on
              // devices that fire mouseenter before click — the reveal stays put once chosen.
              onClick={() => setActive(n.key)}
              aria-pressed={on}
              aria-label={`${n.label} — ${n.status === "live" ? "live now" : "coming soon"}`}
            >
              <span
                className={cn(
                  "su-node-badge",
                  n.status === "live" ? "su-node-live" : "su-node-soon",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
              </span>
              <span className="su-node-label">{n.label}</span>
              <span
                className={cn(
                  "su-node-status",
                  n.status === "live" ? "su-status-live" : "su-status-soon",
                )}
              >
                {n.status === "live" ? "Live" : "Soon"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Reveal panel — honest detail for the active node; a calm brand line at rest. aria-live so
          screen-reader users hear the change when they focus a node. */}
      <div className="su-reveal" aria-live="polite">
        {activeNode ? (
          <div className="su-reveal-card" key={activeNode.key}>
            <div className="su-reveal-head">
              <span className="su-reveal-title">{activeNode.label}</span>
              <span
                className={cn(
                  "su-reveal-chip",
                  activeNode.status === "live"
                    ? "su-chip-live"
                    : "su-chip-soon",
                )}
              >
                <span className="su-chip-dot" aria-hidden />
                {activeNode.status === "live" ? "Live now" : "Coming soon"}
              </span>
            </div>
            <p className="su-reveal-blurb">{activeNode.blurb}</p>
            <Link href={activeNode.href} className="su-reveal-link">
              {activeNode.status === "live"
                ? "Explore course"
                : "See the roadmap"}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        ) : (
          <p className="su-reveal-rest">
            You, at the centre.{" "}
            <span className="text-charcoal/60">
              Hover or tap a skill to explore what you can learn.
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef } from "react";
import { Link } from "react-router";
import type { LucideIcon } from "lucide-react";
import {
  ExternalLink,
  GitBranch,
  Github,
  Linkedin,
  Map,
  Puzzle,
  Sparkles,
} from "lucide-react";

import { Button } from "~/components/ui/button";

import type { Route } from "./+types/home";

/** Swap in your real URLs anytime */
const SITE_LINKS = {
  github: "https://github.com/RashedMaaitah/interactive-algos",
  portfolio: "https://rashed.dev",
  linkedin: "https://www.linkedin.com/in/rashed-maaitah",
} as const;

type MiniApp = {
  icon: LucideIcon;
  name: string;
  description: string;
  to?: string;
};

const miniApps: MiniApp[] = [
  {
    icon: Map,
    name: "Pathfinding Visualizer",
    description: "Watch BFS & DFS find paths in real time!",
    to: "/pathfinding",
  },
  {
    icon: GitBranch,
    name: "Tree Explorer",
    description: "Traverse trees and watch each visit light up.",
  },
  {
    icon: Puzzle,
    name: "Puzzle Lab",
    description: "Classic puzzles with step-by-step reveals.",
  },
];

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Algo Playground" },
    {
      name: "description",
      content:
        "Visualize algorithms. Play with trees, grids, and puzzles. Learn by seeing!",
    },
  ];
}

function runHeroCanvas(el: HTMLCanvasElement) {
  const ctx = el.getContext("2d");
  if (!ctx) return;

  let raf = 0;
  let frame = 0;
  const size = { w: 0, h: 0, dpr: 1 };

  function fit() {
    const rect = el.getBoundingClientRect();
    size.dpr = Math.min(window.devicePixelRatio ?? 1, 2);
    size.w = rect.width;
    size.h = rect.height;
    if (size.w < 2 || size.h < 2) return;
    el.width = Math.floor(size.w * size.dpr);
    el.height = Math.floor(size.h * size.dpr);
  }

  fit();
  const ro = new ResizeObserver(fit);
  ro.observe(el);

  const nodes = [
    { x: 0.5, y: 0.12 }, // 0 - root
    { x: 0.27, y: 0.35 }, // 1
    { x: 0.73, y: 0.35 }, // 2
    { x: 0.15, y: 0.58 }, // 3
    { x: 0.39, y: 0.58 }, // 4
    { x: 0.61, y: 0.58 }, // 5
    { x: 0.85, y: 0.58 }, // 6
    { x: 0.08, y: 0.80 }, // 7
    { x: 0.22, y: 0.80 }, // 8
    { x: 0.33, y: 0.80 }, // 9
    { x: 0.47, y: 0.80 }, // 10
  ];

  const edges = [
    [0, 1], [0, 2],
    [1, 3], [1, 4],
    [2, 5], [2, 6],
    [3, 7], [3, 8],
    [4, 9], [4, 10],
  ];
  const bfsOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  let visitedNodes = new Set<number>();
  let visitedEdges = new Set<string>();
  let currentStep = -1;
  let stepFrame = 0;
  const FRAMES_PER_STEP = 100;
  const PAUSE_AFTER_DONE = 90;
  let pauseTimer = 0;
  let done = false;

  function edgeKey(a: number, b: number) {
    return `${Math.min(a, b)}-${Math.max(a, b)}`;
  }

  function edgesRevealedAt(step: number): string[] {
    const node = bfsOrder[step];
    const prev = bfsOrder.slice(0, step);
    return edges
      .filter(([a, b]) => (a === node && prev.includes(b)) || (b === node && prev.includes(a)))
      .map(([a, b]) => edgeKey(a, b));
  }

  function reset() {
    visitedNodes = new Set();
    visitedEdges = new Set();
    currentStep = -1;
    stepFrame = 0;
    pauseTimer = 0;
    done = false;
    frame = 0;
  }

  reset();

  function tick(c2d: CanvasRenderingContext2D) {
    const { w, h, dpr } = size;

    if (w >= 2 && h >= 2) {
      c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      c2d.clearRect(0, 0, w, h);

      if (done) {
        pauseTimer++;
        if (pauseTimer > PAUSE_AFTER_DONE) reset();
      } else {
        stepFrame++;
        if (stepFrame >= FRAMES_PER_STEP) {
          stepFrame = 0;
          currentStep++;
          if (currentStep < bfsOrder.length) {
            const node = bfsOrder[currentStep];
            visitedNodes.add(node);
            edgesRevealedAt(currentStep).forEach(k => visitedEdges.add(k));
          } else {
            done = true;
          }
        }
      }

      const progress = stepFrame / FRAMES_PER_STEP;

      // --- Draw edges ---
      for (const [a, b] of edges) {
        const key = edgeKey(a, b);
        const ax = nodes[a].x * w, ay = nodes[a].y * h;
        const bx = nodes[b].x * w, by = nodes[b].y * h;

        const isVisited = visitedEdges.has(key);
        const isActive =
          currentStep < bfsOrder.length &&
          edgesRevealedAt(currentStep).includes(key);

        c2d.beginPath();
        c2d.moveTo(ax, ay);

        if (isActive) {
          const tx = ax + (bx - ax) * progress;
          const ty = ay + (by - ay) * progress;
          c2d.lineTo(tx, ty);
          c2d.strokeStyle = "oklch(0.65 0.18 240 / 1)";   // vivid blue
          c2d.lineWidth = 1.5;
        } else if (isVisited) {
          c2d.lineTo(bx, by);
          c2d.strokeStyle = "oklch(0.85 0.06 240 / 0.4)"; // soft blue-white
          c2d.lineWidth = 1.5;
        } else {
          c2d.lineTo(bx, by);
          c2d.strokeStyle = "oklch(1 0 0 / 0.1)";          // very faint white
          c2d.lineWidth = 1;
        }

        c2d.stroke();
      }

      // --- Draw nodes ---
      for (let i = 0; i < nodes.length; i++) {
        const nx = nodes[i].x * w;
        const ny = nodes[i].y * h;
        const isVisited = visitedNodes.has(i);
        const isCurrent =
          currentStep >= 0 &&
          currentStep < bfsOrder.length &&
          bfsOrder[currentStep] === i;

        const r = isCurrent ? 5 + 3 * Math.sin(progress * Math.PI) : 5;

        // Glow for active node
        if (isCurrent) {
          c2d.beginPath();
          c2d.arc(nx, ny, r + 6, 0, Math.PI * 2);
          const glow = c2d.createRadialGradient(nx, ny, 0, nx, ny, r + 6);
          glow.addColorStop(0, "oklch(0.65 0.18 240 / 0.35)");
          glow.addColorStop(1, "oklch(0.65 0.18 240 / 0)");
          c2d.fillStyle = glow;
          c2d.fill();
        }

        c2d.beginPath();
        c2d.arc(nx, ny, r, 0, Math.PI * 2);

        if (isCurrent) {
          c2d.fillStyle = "oklch(0.75 0.18 240 / 1)";    // bright blue
        } else if (isVisited) {
          c2d.fillStyle = "oklch(0.9 0.04 240 / 0.6)";   // muted blue-white
        } else {
          c2d.fillStyle = "oklch(1 0 0 / 0.15)";          // very faint white
        }

        c2d.fill();
      }
    }

    frame++;
    raf = requestAnimationFrame(() => tick(c2d));
  }

  tick(ctx);
  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
  };
}

function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cleanup = runHeroCanvas(el);
    return cleanup;
  }, []);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none aspect-5/3 w-full max-w-lg rounded-md border border-border bg-muted/30"
      aria-hidden
    />
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border px-6 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link
            to="/"
            className="text-lg tracking-tight text-foreground underline-offset-4 hover:underline"
          >
            Algo Playground
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <a
              href="#mini-apps"
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              Mini apps
            </a>
            <a
              href="#about"
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              About
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border">
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            aria-hidden
          >
            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl motion-safe:animate-pulse" />
            <div
              className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-muted blur-3xl motion-safe:animate-pulse"
              style={{ animationDelay: "1s" }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,var(--background)_95%)]" />
          </div>

          <div className="relative px-6 py-16 md:py-24">
            <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="mb-3 inline-flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground">
                  <Sparkles className="size-4" aria-hidden />
                  Learn by seeing
                </p>
                <h1 className="max-w-xl text-4xl leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
                  Algo Playground
                </h1>
                <p className="mt-6 max-w-lg text-lg text-muted-foreground md:text-xl">
                  Visualize algorithms. Play with trees, grids, and puzzles.
                  Learn by seeing!
                </p>
                <div className="mt-10 flex flex-wrap gap-3">
                  <Button asChild size="lg">
                    <a href="#mini-apps">Start Exploring</a>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <a
                      href={SITE_LINKS.github}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="size-4" />
                      GitHub
                    </a>
                  </Button>
                </div>
              </div>
              <div className="flex justify-center lg:justify-end">
                <HeroCanvas />
              </div>
            </div>
          </div>
        </section>

        <section
          id="mini-apps"
          className="scroll-mt-24 border-b border-border px-6 py-16 md:py-24"
        >
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl tracking-tight md:text-3xl">
              Mini app showcase
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Each playground focuses on one idea—clear visuals, quick
              experiments, no noise.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {miniApps.map(({ icon: Icon, name, description, to }) => (
                <article
                  key={name}
                  className="flex flex-col border border-border bg-card p-6 shadow-sm"
                >
                  <div className="mb-4 inline-flex border border-border bg-background p-2.5">
                    <Icon className="size-6" aria-hidden />
                  </div>
                  <h3 className="text-lg">{name}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">
                    {description}
                  </p>
                  {to ? (
                    <Button variant="outline" size="sm" className="mt-6 w-full" asChild>
                      <Link
                        to={to}
                        aria-label={`Explore ${name}`}
                      >
                        Explore
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-6 w-full"
                      disabled
                      title="Coming soon"
                    >
                      Explore
                    </Button>
                  )}
                </article>
              ))}
            </div>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Explore unlocks each app as it ships—check the repo for updates.
            </p>
          </div>
        </section>

        <section
          id="about"
          className="scroll-mt-24 px-6 py-16 md:py-20"
        >
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl tracking-tight md:text-3xl">
              Why this project?
            </h2>
            <p className="mt-5 text-lg text-muted-foreground md:text-xl">
              Built to make algorithms fun and interactive. Perfect for
              learning, experimenting, and testing your problem-solving skills.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <a
              href={SITE_LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              GitHub
              <ExternalLink className="size-3.5 opacity-70" aria-hidden />
            </a>
            <a
              href={SITE_LINKS.portfolio}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Portfolio
              <ExternalLink className="size-3.5 opacity-70" aria-hidden />
            </a>
            <a
              href={SITE_LINKS.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              <Linkedin className="size-3.5" aria-hidden />
              LinkedIn
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Rashed. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

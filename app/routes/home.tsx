import { useEffect, useRef } from "react";
import { Link } from "react-router";
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
  github: "https://github.com/rashed/interactive-algos",
  portfolio: "https://rashed.dev",
  linkedin: "https://www.linkedin.com/in/rashed",
} as const;

const miniApps = [
  {
    icon: Map,
    name: "Pathfinding Visualizer",
    description: "Watch BFS & DFS find paths in real time!",
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
] as const;

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

  function tick(c2d: CanvasRenderingContext2D) {
    const { w, h, dpr } = size;
    if (w >= 2 && h >= 2) {
      c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      c2d.clearRect(0, 0, w, h);

      const n = 9;
      const step = Math.min(w, h) / (n + 1);
      const ox = (w - step * (n - 1)) / 2;
      const oy = (h - step * (n - 1)) / 2;

      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const x = ox + i * step;
          const y = oy + j * step;
          const dist = Math.hypot(i - 4, j - 4);
          const phase = frame * 0.06 - dist * 0.35;
          const glow = 0.15 + 0.4 * (0.5 + 0.5 * Math.sin(phase));
          c2d.fillStyle = `oklch(0.92 0.03 270 / ${glow})`;
          c2d.beginPath();
          c2d.arc(x, y, 2 + Math.sin(phase) * 1, 0, Math.PI * 2);
          c2d.fill();
        }
      }

      const wave = Math.floor(frame * 0.1) % 9;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const d = Math.abs(i - 4) + Math.abs(j - 4);
          if (d !== wave) continue;
          const x = ox + i * step;
          const y = oy + j * step;
          c2d.strokeStyle = "oklch(0.72 0.14 264 / 0.9)";
          c2d.lineWidth = 1.5;
          c2d.strokeRect(x - 5, y - 5, 10, 10);
        }
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
              {miniApps.map(({ icon: Icon, name, description }) => (
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-6 w-full"
                    disabled
                    title="Coming soon"
                  >
                    Explore
                    <span className="sr-only">(coming soon)</span>
                  </Button>
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

import { useEffect, useRef, useState, useCallback } from "react";

const COLS = 20;
const ROWS = 14;
const TOTAL = COLS * ROWS;

type CellState = "empty" | "start" | "end" | "obstacle" | "visited" | "path";
type Mode = "start" | "end" | "obstacle" | "erase";

function createGrid(): CellState[] {
    return new Array(TOTAL).fill("empty");
}

function idx(col: number, row: number) {
    return row * COLS + col;
}

function colOf(i: number) {
    return i % COLS;
}

function rowOf(i: number) {
    return Math.floor(i / COLS);
}

function bfs(
    grid: CellState[],
    startIdx: number,
    endIdx: number
): { visited: number[]; path: number[] } {
    const visited: number[] = [];
    const prev = new Array(TOTAL).fill(-1);
    const seen = new Set<number>();
    const queue: number[] = [startIdx];
    seen.add(startIdx);

    while (queue.length) {
        const cur = queue.shift()!;
        if (cur !== startIdx) visited.push(cur);
        if (cur === endIdx) break;

        const col = colOf(cur), row = rowOf(cur);
        const neighbors = [
            row > 0 ? idx(col, row - 1) : -1,
            row < ROWS - 1 ? idx(col, row + 1) : -1,
            col > 0 ? idx(col - 1, row) : -1,
            col < COLS - 1 ? idx(col + 1, row) : -1,
        ].filter((n) => n >= 0 && !seen.has(n) && grid[n] !== "obstacle");

        for (const n of neighbors) {
            seen.add(n);
            prev[n] = cur;
            queue.push(n);
        }
    }

    const path: number[] = [];
    if (prev[endIdx] !== -1 || startIdx === endIdx) {
        let cur = endIdx;
        while (cur !== startIdx && cur !== -1) {
            if (cur !== endIdx) path.unshift(cur);
            cur = prev[cur];
        }
    }

    return { visited, path };
}

export default function PathfindingVisualizer() {
    const [grid, setGrid] = useState<CellState[]>(createGrid);
    const [mode, setMode] = useState<Mode>("obstacle");
    const [isDrawing, setIsDrawing] = useState(false);
    const [isSolving, setIsSolving] = useState(false);
    const [status, setStatus] = useState<"idle" | "solving" | "found" | "none">("idle");
    const animRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    const clearAnimations = useCallback(() => {
        animRef.current.forEach(clearTimeout);
        animRef.current = [];
    }, []);

    const applyMode = useCallback(
        (cellIdx: number, currentGrid: CellState[]) => {
            const cell = currentGrid[cellIdx];
            if (cell === "visited" || cell === "path") return currentGrid;

            const next = [...currentGrid];

            if (mode === "start") {
                // Remove existing start
                next.forEach((c, i) => { if (c === "start") next[i] = "empty"; });
                next[cellIdx] = "start";
            } else if (mode === "end") {
                next.forEach((c, i) => { if (c === "end") next[i] = "empty"; });
                next[cellIdx] = "end";
            } else if (mode === "obstacle") {
                if (cell !== "start" && cell !== "end") next[cellIdx] = "obstacle";
            } else if (mode === "erase") {
                if (cell !== "start" && cell !== "end") next[cellIdx] = "empty";
                else next[cellIdx] = "empty";
            }

            return next;
        },
        [mode]
    );

    const handleCellInteraction = useCallback(
        (cellIdx: number) => {
            if (isSolving) return;
            setGrid((g) => applyMode(cellIdx, g));
        },
        [isSolving, applyMode]
    );

    const handleMouseDown = (cellIdx: number) => {
        setIsDrawing(true);
        handleCellInteraction(cellIdx);
    };

    const handleMouseEnter = (cellIdx: number) => {
        if (!isDrawing) return;
        handleCellInteraction(cellIdx);
    };

    const handleMouseUp = () => setIsDrawing(false);

    const solve = useCallback(() => {
        if (isSolving) return;

        const startIdx = grid.findIndex((c) => c === "start");
        const endIdx = grid.findIndex((c) => c === "end");

        if (startIdx === -1 || endIdx === -1) {
            setStatus("none");
            return;
        }

        // Clear previous solve
        clearAnimations();
        setGrid((g) => g.map((c) => (c === "visited" || c === "path" ? "empty" : c)));
        setIsSolving(true);
        setStatus("solving");

        const cleanGrid = grid.map((c) => (c === "visited" || c === "path" ? "empty" : c));
        const { visited, path } = bfs(cleanGrid, startIdx, endIdx);

        const VISIT_DELAY = 18;
        const PATH_DELAY = 35;

        visited.forEach((cell, i) => {
            const t = setTimeout(() => {
                setGrid((g) => {
                    const next = [...g];
                    if (next[cell] === "empty") next[cell] = "visited";
                    return next;
                });
            }, i * VISIT_DELAY);
            animRef.current.push(t);
        });

        const afterVisit = visited.length * VISIT_DELAY;

        if (path.length === 0) {
            const t = setTimeout(() => {
                setStatus("none");
                setIsSolving(false);
            }, afterVisit);
            animRef.current.push(t);
            return;
        }

        path.forEach((cell, i) => {
            const t = setTimeout(() => {
                setGrid((g) => {
                    const next = [...g];
                    next[cell] = "path";
                    return next;
                });
            }, afterVisit + i * PATH_DELAY);
            animRef.current.push(t);
        });

        const t = setTimeout(() => {
            setStatus("found");
            setIsSolving(false);
        }, afterVisit + path.length * PATH_DELAY);
        animRef.current.push(t);
    }, [grid, isSolving, clearAnimations]);

    const reset = useCallback(() => {
        clearAnimations();
        setIsSolving(false);
        setStatus("idle");
        setGrid((g) => g.map((c) => (c === "visited" || c === "path" ? "empty" : c)));
    }, [clearAnimations]);

    const clear = useCallback(() => {
        clearAnimations();
        setIsSolving(false);
        setStatus("idle");
        setGrid(createGrid());
    }, [clearAnimations]);

    useEffect(() => {
        return () => clearAnimations();
    }, [clearAnimations]);

    const modeConfig: { key: Mode; label: string; color: string }[] = [
        { key: "start", label: "Start", color: "#22c55e" },
        { key: "end", label: "End", color: "#ef4444" },
        { key: "obstacle", label: "Obstacle", color: "#64748b" },
        { key: "erase", label: "Erase", color: "#94a3b8" },
    ];

    function cellColor(state: CellState): string {
        switch (state) {
            case "start": return "#22c55e";
            case "end": return "#ef4444";
            case "obstacle": return "#1e293b";
            case "visited": return "oklch(0.55 0.14 240 / 0.6)";
            case "path": return "oklch(0.75 0.18 240 / 1)";
            default: return "transparent";
        }
    }

    function cellBorder(state: CellState): string {
        if (state === "obstacle") return "1px solid #0f172a";
        return "1px solid oklch(1 0 0 / 0.07)";
    }

    const statusMsg = {
        idle: "",
        solving: "Searching...",
        found: `Path found — ${grid.filter((c) => c === "path").length} steps`,
        none: "No path found",
    }[status];

    return (
        <div
            style={{
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                background: "#080c14",
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem 1rem",
                userSelect: "none",
                WebkitUserSelect: "none",
            }}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Header */}
            <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
                <h1 style={{
                    color: "oklch(0.95 0 0)",
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    margin: 0,
                }}>
                    Pathfinder
                </h1>
                <p style={{
                    color: "oklch(1 0 0 / 0.3)",
                    fontSize: "0.7rem",
                    letterSpacing: "0.1em",
                    marginTop: "0.3rem",
                }}>
                    BFS — Breadth First Search
                </p>
            </div>

            {/* Toolbar */}
            <div style={{
                display: "flex",
                gap: "0.5rem",
                marginBottom: "1rem",
                flexWrap: "wrap",
                justifyContent: "center",
            }}>
                {modeConfig.map(({ key, label, color }) => (
                    <button
                        key={key}
                        onClick={() => setMode(key)}
                        style={{
                            padding: "0.4rem 0.9rem",
                            fontSize: "0.7rem",
                            fontFamily: "inherit",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            fontWeight: 500,
                            border: mode === key
                                ? `1.5px solid ${color}`
                                : "1.5px solid oklch(1 0 0 / 0.12)",
                            borderRadius: "4px",
                            background: mode === key ? `${color}22` : "transparent",
                            color: mode === key ? color : "oklch(1 0 0 / 0.4)",
                            cursor: "pointer",
                            transition: "all 0.15s",
                        }}
                    >
                        {label}
                    </button>
                ))}

                <div style={{ width: "1px", background: "oklch(1 0 0 / 0.1)", margin: "0 0.25rem" }} />

                <button
                    onClick={solve}
                    disabled={isSolving}
                    style={{
                        padding: "0.4rem 1.1rem",
                        fontSize: "0.7rem",
                        fontFamily: "inherit",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        fontWeight: 600,
                        border: "1.5px solid oklch(0.65 0.18 240)",
                        borderRadius: "4px",
                        background: isSolving ? "transparent" : "oklch(0.65 0.18 240 / 0.15)",
                        color: isSolving ? "oklch(0.65 0.18 240 / 0.4)" : "oklch(0.75 0.18 240)",
                        cursor: isSolving ? "not-allowed" : "pointer",
                        transition: "all 0.15s",
                    }}
                >
                    Solve
                </button>

                <button
                    onClick={reset}
                    style={{
                        padding: "0.4rem 0.9rem",
                        fontSize: "0.7rem",
                        fontFamily: "inherit",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        fontWeight: 500,
                        border: "1.5px solid oklch(1 0 0 / 0.12)",
                        borderRadius: "4px",
                        background: "transparent",
                        color: "oklch(1 0 0 / 0.35)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                    }}
                >
                    Reset
                </button>

                <button
                    onClick={clear}
                    style={{
                        padding: "0.4rem 0.9rem",
                        fontSize: "0.7rem",
                        fontFamily: "inherit",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        fontWeight: 500,
                        border: "1.5px solid oklch(1 0 0 / 0.12)",
                        borderRadius: "4px",
                        background: "transparent",
                        color: "oklch(1 0 0 / 0.35)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                    }}
                >
                    Clear
                </button>
            </div>

            {/* Grid */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                    gap: "2px",
                    padding: "10px",
                    background: "oklch(1 0 0 / 0.04)",
                    border: "1px solid oklch(1 0 0 / 0.08)",
                    borderRadius: "6px",
                }}
            >
                {grid.map((state, i) => (
                    <div
                        key={i}
                        onMouseDown={() => handleMouseDown(i)}
                        onMouseEnter={() => handleMouseEnter(i)}
                        style={{
                            width: "36px",
                            height: "36px",
                            background: cellColor(state),
                            border: cellBorder(state),
                            borderRadius: "3px",
                            cursor: isSolving ? "not-allowed" : "pointer",
                            transition: state === "visited" || state === "path"
                                ? "background 0.1s ease"
                                : "background 0.05s",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "14px",
                        }}
                    >
                        {state === "start" && (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <circle cx="7" cy="7" r="4" fill="#080c14" />
                            </svg>
                        )}
                        {state === "end" && (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <rect x="3" y="3" width="8" height="8" rx="1" fill="#080c14" />
                            </svg>
                        )}
                    </div>
                ))}
            </div>

            {/* Status */}
            <div style={{
                marginTop: "1rem",
                height: "1.2rem",
                fontSize: "0.7rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: status === "found" ? "oklch(0.75 0.18 240)"
                    : status === "none" ? "#ef4444"
                        : status === "solving" ? "oklch(1 0 0 / 0.4)"
                            : "transparent",
                transition: "color 0.2s",
            }}>
                {statusMsg}
            </div>

            {/* Legend */}
            <div style={{
                display: "flex",
                gap: "1.2rem",
                marginTop: "1rem",
                flexWrap: "wrap",
                justifyContent: "center",
            }}>
                {[
                    { color: "#22c55e", label: "Start" },
                    { color: "#ef4444", label: "End" },
                    { color: "#1e293b", label: "Obstacle" },
                    { color: "oklch(0.55 0.14 240 / 0.6)", label: "Visited" },
                    { color: "oklch(0.75 0.18 240)", label: "Path" },
                ].map(({ color, label }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{
                            width: "10px", height: "10px",
                            background: color,
                            borderRadius: "2px",
                            border: "1px solid oklch(1 0 0 / 0.1)",
                        }} />
                        <span style={{
                            fontSize: "0.65rem",
                            color: "oklch(1 0 0 / 0.3)",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                        }}>{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
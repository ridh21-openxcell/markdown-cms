"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface MermaidBlockProps {
  code: string;
}

export function MermaidBlock({ code }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);
  const [error, setError] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const container = containerRef.current;
        if (!container) return;

        const mermaid = (await import("mermaid")).default;

        const isDark = document.documentElement.classList.contains("dark");
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? "dark" : "default",
          securityLevel: "loose",
          fontFamily: "inherit",
          flowchart: { htmlLabels: true, useMaxWidth: true },
        });

        container.textContent = code;
        container.removeAttribute("data-processed");

        await mermaid.run({ nodes: [container] });

        if (!cancelled) {
          setRendered(true);
          setError(false);
        }
      } catch (e) {
        console.error("Mermaid error:", e);
        if (!cancelled) {
          setError(true);
          setRendered(false);
        }
      }
    }

    run();
    return () => { cancelled = true; };
  }, [code]);

  const openFullscreen = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setFullscreen(true);
  }, []);

  const closeFullscreen = useCallback(() => {
    setFullscreen(false);
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setScale((s) => Math.min(5, Math.max(0.2, s - e.deltaY * 0.001)));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY };
    panOffset.current = { ...pan };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [pan]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning.current) return;
    setPan({
      x: panOffset.current.x + (e.clientX - panStart.current.x),
      y: panOffset.current.y + (e.clientY - panStart.current.y),
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFullscreen();
      if (e.key === "=" || e.key === "+") setScale((s) => Math.min(5, s + 0.2));
      if (e.key === "-") setScale((s) => Math.max(0.2, s - 0.2));
      if (e.key === "0") { setScale(1); setPan({ x: 0, y: 0 }); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [fullscreen, closeFullscreen]);

  if (error) {
    return (
      <div className="my-4 rounded-lg border border-danger/30 bg-danger/5 p-4">
        <p className="text-xs font-medium text-danger mb-2">Mermaid syntax error</p>
        <pre className="text-xs text-muted overflow-x-auto whitespace-pre-wrap">{code}</pre>
      </div>
    );
  }

  return (
    <>
      {/* Inline diagram */}
      <div className="relative group my-4">
        <div
          ref={containerRef}
          className={`mermaid flex justify-center overflow-x-auto rounded-lg bg-surface-hover p-4 border border-border [&_svg]:max-w-full ${
            rendered ? "" : "invisible"
          }`}
        >
          {code}
        </div>

        {rendered && (
          <button
            onClick={openFullscreen}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-surface/80 border border-border text-muted hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
            title="View fullscreen"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>
        )}
      </div>

      {/* Fullscreen overlay with pan & zoom */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface/80 backdrop-blur-sm shrink-0">
            <span className="text-sm font-medium text-foreground">Diagram Viewer</span>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setScale((s) => Math.max(0.2, s - 0.2))}
                  className="px-2.5 py-1.5 text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                  title="Zoom out (-)"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="5" y1="12" x2="19" y2="12" /></svg>
                </button>
                <button
                  onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); }}
                  className="px-3 py-1.5 text-xs font-mono text-muted hover:text-foreground hover:bg-surface-hover transition-colors min-w-[4rem] text-center"
                  title="Reset (0)"
                >
                  {Math.round(scale * 100)}%
                </button>
                <button
                  onClick={() => setScale((s) => Math.min(5, s + 0.2))}
                  className="px-2.5 py-1.5 text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                  title="Zoom in (+)"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                </button>
              </div>

              <button
                onClick={closeFullscreen}
                className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                title="Close (Esc)"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div
            className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                transformOrigin: "center center",
                transition: isPanning.current ? "none" : "transform 0.1s ease-out",
              }}
            >
              <div
                className="[&_svg]:max-w-none"
                dangerouslySetInnerHTML={{
                  __html: containerRef.current?.innerHTML || "",
                }}
              />
            </div>
          </div>

          {/* Hint */}
          <div className="px-4 py-2 text-center text-xs text-muted border-t border-border bg-surface/80 shrink-0">
            Scroll to zoom &middot; Drag to pan &middot; <kbd className="px-1 py-0.5 rounded bg-surface-hover border border-border text-[10px]">0</kbd> to reset &middot; <kbd className="px-1 py-0.5 rounded bg-surface-hover border border-border text-[10px]">Esc</kbd> to close
          </div>
        </div>
      )}
    </>
  );
}

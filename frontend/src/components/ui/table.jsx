import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }) {
  const scrollRef = useRef(null);
  const [isScrollable, setIsScrollable] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const updateMetrics = () => {
      const maxScroll = Math.max(0, element.scrollWidth - element.clientWidth);
      setIsScrollable(maxScroll > 0);
      setScrollProgress(maxScroll > 0 ? (element.scrollLeft / maxScroll) * 100 : 0);
    };

    updateMetrics();
    element.addEventListener("scroll", updateMetrics, { passive: true });

    const resizeObserver = new ResizeObserver(updateMetrics);
    resizeObserver.observe(element);
    if (element.firstElementChild) {
      resizeObserver.observe(element.firstElementChild);
    }

    window.addEventListener("resize", updateMetrics);

    return () => {
      element.removeEventListener("scroll", updateMetrics);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateMetrics);
    };
  }, []);

  return (
    <div className="relative w-full">
      {isScrollable ? (
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/5 dark:bg-white/[0.02]">
          <div className="mb-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-500">
            <span>表格内容可横向拖动</span>
            <span>{Math.round(scrollProgress)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 transition-[width] duration-150"
              style={{ width: `${Math.max(12, scrollProgress)}%` }}
            />
          </div>
        </div>
      ) : null}
      <div ref={scrollRef} className="relative w-full overflow-x-auto overflow-y-hidden">
        <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
      </div>
    </div>
  );
}

export function TableHeader({ className, ...props }) {
  return <thead className={cn("[&_tr]:border-b", className)} {...props} />;
}

export function TableBody({ className, ...props }) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableRow({ className, ...props }) {
  return (
    <tr
      className={cn(
        "border-b border-slate-100 transition-colors hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/[0.03]",
        className
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }) {
  return (
    <th
      className={cn(
        "h-11 px-4 text-left align-middle font-medium text-slate-500 dark:text-slate-400",
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }) {
  return (
    <td className={cn("px-4 py-4 align-middle", className)} {...props} />
  );
}

import type { Temporal } from "@js-temporal/polyfill";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export function Button({
  active,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "rounded-lg px-3 py-2 text-sm text-fd-muted-foreground transition-colors",
        "hover:bg-fd-muted hover:text-fd-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400",
        active && "bg-fd-primary text-fd-primary-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function Calendar({
  children,
  size = "month",
}: {
  children: ReactNode;
  size?: "month" | "day" | "wide";
}) {
  const widths = { month: "max-w-2xl", day: "max-w-md", wide: "max-w-3xl" };
  return <div className={cn("w-full min-w-0", widths[size])}>{children}</div>;
}

export function CalendarToolbar({
  title,
  onPrevious,
  onNext,
  previousLabel,
  nextLabel,
  children,
}: {
  title: string;
  onPrevious: () => void;
  onNext: () => void;
  previousLabel: string;
  nextLabel: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Button aria-label={previousLabel} onClick={onPrevious}>
          ←
        </Button>
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button aria-label={nextLabel} onClick={onNext}>
          →
        </Button>
      </div>
      {children && <div className="flex justify-center gap-1">{children}</div>}
    </div>
  );
}

export function CalendarWeekdays({ start }: { start: Temporal.PlainDate }) {
  const days = Array.from({ length: 7 }, (_, index) =>
    start.add({ days: index }).toLocaleString("en-US", { weekday: "short" }),
  );
  return (
    <div className="mb-2 grid grid-cols-7">
      {days.map((day) => (
        <div key={day} className="py-2 text-center text-xs text-fd-muted-foreground">
          {day}
        </div>
      ))}
    </div>
  );
}

export function CalendarGrid({ children }: { children: ReactNode }) {
  return <div className="space-y-1">{children}</div>;
}

export function CalendarRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-7 gap-1">{children}</div>;
}

export function CalendarCell({
  date,
  current = true,
  today = false,
  children,
}: {
  date: Temporal.PlainDate;
  current?: boolean;
  today?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "min-h-20 rounded-lg border p-2",
        current ? "border-fd-border bg-fd-card" : "border-transparent opacity-40",
      )}
    >
      <span
        className={cn(
          "inline-grid size-6 place-items-center rounded-full text-sm",
          today && "bg-sky-500 font-medium text-white",
        )}
      >
        {date.day}
      </span>
      {children && <div className="mt-1 space-y-1">{children}</div>}
    </div>
  );
}

export function CalendarEvent({ children }: { children: ReactNode }) {
  return (
    <div className="truncate rounded bg-sky-500 px-1.5 py-0.5 text-xs text-white">
      {children}
    </div>
  );
}

export function CalendarTimeline({ children }: { children: ReactNode }) {
  return (
    <div className="max-h-96 overflow-y-auto rounded-lg border border-fd-border">
      {children}
    </div>
  );
}

export function CalendarTimeRow({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div className="grid min-h-12 grid-cols-[4.5rem_1fr] border-b border-fd-border last:border-b-0">
      <div className="border-r border-fd-border p-2 text-xs text-fd-muted-foreground">
        {label}
      </div>
      <div className="min-w-0 p-2">{children}</div>
    </div>
  );
}

type WeekHeaderDay = {
  id: string;
  date: Temporal.PlainDate;
  isToday: boolean;
};

export function CalendarWeekHeader({ days }: { days: readonly WeekHeaderDay[] }) {
  return (
    <div className="grid grid-cols-[3.75rem_repeat(7,minmax(0,1fr))] border-b border-fd-border bg-fd-muted/20">
      <div />
      {days.map((day) => (
        <div key={day.id} className="border-l border-fd-border p-2 text-center">
          <div className="text-xs text-fd-muted-foreground">
            {day.date.toLocaleString("en", { weekday: "short" })}
          </div>
          <div
            className={cn(
              "mx-auto mt-1 grid size-8 place-items-center rounded-full",
              day.isToday && "bg-sky-500 text-white",
            )}
          >
            {day.date.day}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CalendarTimeGrid({
  header,
  children,
}: {
  header: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-fd-border">
      {header}
      <div className="max-h-96 overflow-y-auto">{children}</div>
    </div>
  );
}

export function CalendarTimeGridRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[3.75rem_repeat(7,minmax(0,1fr))] border-b border-fd-border last:border-b-0">
      <div className="border-r border-fd-border bg-fd-muted/10 p-2 text-xs text-fd-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

export function CalendarTimeCell({ children }: { children?: ReactNode }) {
  return <div className="min-h-12 min-w-0 border-l border-fd-border p-1">{children}</div>;
}

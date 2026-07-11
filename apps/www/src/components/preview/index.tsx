"use client";

import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { Check, ChevronDown, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { copyText } from "@/lib/copy-text";
import {
  calendarExamples,
  type CalendarExample,
  type CalendarExampleName,
} from "@/components/examples/registry";

type CalendarPreviewProps = {
  name: CalendarExampleName;
  className?: string;
  previewClassName?: string;
  hideSource?: boolean;
};

export function CalendarPreview({
  name,
  className,
  previewClassName,
  hideSource = false,
}: CalendarPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const example: CalendarExample = calendarExamples[name];
  const Component = example.component;
  const source = example.source.trim();

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2_000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function copySource() {
    setCopied(await copyText(source));
  }

  return (
    <figure
      data-example={name}
      className={cn(
        "not-prose my-8 overflow-hidden rounded-2xl border border-fd-border bg-fd-card",
        className,
      )}
    >
      <figcaption className="flex flex-col gap-1 border-b border-fd-border px-5 py-4">
        <span className="font-medium text-fd-foreground">{example.title}</span>
        <span className="text-sm text-fd-muted-foreground">{example.description}</span>
      </figcaption>

      <div
        data-slot="calendar-preview"
        className={cn(
          "flex min-h-72 w-full items-center justify-center overflow-x-auto p-5 sm:p-8",
          example.previewClassName,
          previewClassName,
        )}
      >
        <Component />
      </div>

      {!hideSource && (
        <div className="min-w-0 border-t border-fd-border bg-fd-secondary/20">
          {expanded ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-fd-border px-4 py-2">
                <span className="text-xs text-fd-muted-foreground">{example.title}.tsx</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copySource}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-fd-border bg-fd-background px-2.5 text-xs font-medium text-fd-muted-foreground transition-colors hover:text-fd-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    {copied ? (
                      <Check aria-hidden="true" className="size-3.5" />
                    ) : (
                      <Copy aria-hidden="true" className="size-3.5" />
                    )}
                    <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
                  </button>
                  <button
                    type="button"
                    aria-expanded="true"
                    onClick={() => setExpanded(false)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-fd-border bg-fd-background px-2.5 text-xs font-medium text-fd-muted-foreground transition-colors hover:text-fd-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    Collapse
                  </button>
                </div>
              </div>
              <div className="max-h-[32rem] min-w-0 overflow-auto [&_figure]:my-0! [&_figure]:rounded-none! [&_figure]:border-0!">
                <DynamicCodeBlock
                  code={source}
                  lang="tsx"
                  codeblock={{ allowCopy: false }}
                />
              </div>
            </>
          ) : (
            <button
              type="button"
              aria-expanded="false"
              onClick={() => setExpanded(true)}
              className="flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              View code
              <ChevronDown aria-hidden="true" className="size-4" />
            </button>
          )}
        </div>
      )}
    </figure>
  );
}

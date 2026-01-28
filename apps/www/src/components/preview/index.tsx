"use client";

import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { type ReactNode } from "react";

type PreviewProps = {
  /** The live component to render */
  children: ReactNode;
  /** The source code as a string */
  code: string;
  /** Language for syntax highlighting */
  lang?: string;
  /** Optional className for the preview container */
  className?: string;
};

export function Preview({ children, code, lang = "tsx", className }: PreviewProps) {
  return (
    <div className={`not-prose my-6 **:[[role=tabpanel]]:p-0! ${className ?? ""}`}>
      <Tabs items={["Preview", "Code"]} defaultIndex={0}>
        <Tab value="Preview">
          <PreviewContent>{children}</PreviewContent>
        </Tab>
        <Tab value="Code">
          <PreviewCode code={code} lang={lang} />
        </Tab>
      </Tabs>
    </div>
  );
}

function PreviewContent({ children }: { children: ReactNode }) {
  return <div className="flex min-h-[200px] items-center justify-center p-4">{children}</div>;
}

function PreviewCode({ code, lang }: { code: string; lang: string }) {
  return (
    <div className="max-h-[400px] overflow-auto [&_figure]:my-0! [&_figure]:rounded-none! [&_figure]:border-0!">
      <DynamicCodeBlock code={code.trim()} lang={lang} />
    </div>
  );
}

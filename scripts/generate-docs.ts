/**
 * Documentation Generator
 *
 * Single source of truth: MDX files in apps/www/content/docs/
 * Generates:
 * 1. llms.txt (apps/www/public/llms.txt)
 * 2. SKILL.md (skills/calendar/SKILL.md)
 *
 * Usage: pnpm generate:docs
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const DOCS_DIR = "apps/www/content/docs";
const LLMS_TXT_PATH = "apps/www/public/llms.txt";
const SKILL_MD_PATH = "skills/calendar/SKILL.md";
const BASE_URL = "https://eng.gobrand.app/calendar/docs";

// Global skill directory (synced alongside repo skills)
const GLOBAL_SKILL_DIR = path.join(os.homedir(), ".claude/skills/calendar");
const GLOBAL_SKILL_MD_PATH = path.join(GLOBAL_SKILL_DIR, "SKILL.md");

interface DocFile {
  slug: string;
  category: string;
  subcategory?: string;
  title: string;
  description: string;
  urlPath: string;
}

interface MetaJson {
  root?: boolean;
  title?: string;
  description?: string;
  icon?: string;
  pages: string[];
}

/**
 * Parse MDX frontmatter
 */
function parseMdxFrontmatter(content: string): Record<string, string> {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return {};
  }

  const frontmatter: Record<string, string> = {};
  const frontmatterLines = frontmatterMatch[1].split("\n");
  for (const line of frontmatterLines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      frontmatter[key] = value;
    }
  }

  return frontmatter;
}

/**
 * Load pages from a meta.json, handling spread syntax and separators
 */
function loadPagesFromMeta(metaPath: string): string[] {
  if (!fs.existsSync(metaPath)) return [];

  const meta: MetaJson = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
  const pages: string[] = [];

  for (const page of meta.pages) {
    // Skip section separators like "---Getting Started---"
    if (page.startsWith("---") && page.endsWith("---")) continue;

    // Handle spread syntax like "...api"
    if (page.startsWith("...")) {
      const subdir = page.slice(3);
      const subdirMetaPath = path.join(path.dirname(metaPath), subdir, "meta.json");
      const subPages = loadPagesFromMeta(subdirMetaPath);
      pages.push(...subPages.map(p => `${subdir}/${p}`));
    } else {
      pages.push(page);
    }
  }

  return pages;
}

/**
 * Recursively load all MDX doc files
 */
function loadDocFiles(): DocFile[] {
  const docs: DocFile[] = [];

  // Load root meta.json to get top-level categories
  const rootMetaPath = path.join(DOCS_DIR, "meta.json");
  if (!fs.existsSync(rootMetaPath)) {
    console.error("Root meta.json not found");
    return docs;
  }

  const rootMeta: MetaJson = JSON.parse(fs.readFileSync(rootMetaPath, "utf-8"));

  for (const category of rootMeta.pages) {
    // Handle route groups like (react)
    const categoryDir = path.join(DOCS_DIR, category);
    if (!fs.existsSync(categoryDir)) continue;

    const categoryMetaPath = path.join(categoryDir, "meta.json");
    if (!fs.existsSync(categoryMetaPath)) continue;

    const categoryMeta: MetaJson = JSON.parse(fs.readFileSync(categoryMetaPath, "utf-8"));
    const categoryTitle = categoryMeta.title || category;

    // Get all pages for this category (handles nested meta.json and spread syntax)
    const pages = loadPagesFromMeta(categoryMetaPath);

    for (const pagePath of pages) {
      // Skip index pages for llms.txt
      if (pagePath === "index" || pagePath.endsWith("/index")) continue;

      const mdxPath = path.join(categoryDir, `${pagePath}.mdx`);
      if (!fs.existsSync(mdxPath)) {
        console.warn(`Warning: ${mdxPath} not found`);
        continue;
      }

      const content = fs.readFileSync(mdxPath, "utf-8");
      const frontmatter = parseMdxFrontmatter(content);

      // Determine URL path
      // (react) -> react in URL, category stays as-is for display
      const urlCategory = category.replace(/^\(|\)$/g, "");
      const urlPath = `${urlCategory}/${pagePath}`;

      // Determine subcategory from path (e.g., "api/use-calendar" -> "api")
      const subcategory = pagePath.includes("/") ? pagePath.split("/")[0] : undefined;

      docs.push({
        slug: pagePath.split("/").pop() || pagePath,
        category: categoryTitle,
        subcategory,
        title: frontmatter.title || pagePath,
        description: frontmatter.description || "",
        urlPath,
      });
    }
  }

  return docs;
}

/**
 * Generate llms.txt
 */
function generateLlmsTxt(docs: DocFile[]): void {
  console.log("Generating llms.txt...");

  const lines: string[] = [
    "# temporal-calendar",
    "",
    "> A lightweight utility library for building calendar UIs with the Temporal API.",
    "",
    "temporal-calendar provides type-safe calendar building blocks using the modern Temporal API. It supports month, week, and day views with timezone awareness, DST-safe operations, and a flexible accessor pattern for any data structure.",
    "",
    "## Docs",
    "",
    `- [Introduction](${BASE_URL}): Overview of temporal-calendar and key features`,
    `- [Core Installation](${BASE_URL}/core/installation): Getting started with @gobrand/calendar-core`,
    `- [React Installation](${BASE_URL}/react/installation): Getting started with @gobrand/react-calendar`,
    "",
  ];

  // Group docs by category and subcategory
  const byCategory = new Map<string, Map<string | undefined, DocFile[]>>();

  for (const doc of docs) {
    if (!byCategory.has(doc.category)) {
      byCategory.set(doc.category, new Map());
    }
    const categoryMap = byCategory.get(doc.category)!;
    if (!categoryMap.has(doc.subcategory)) {
      categoryMap.set(doc.subcategory, []);
    }
    categoryMap.get(doc.subcategory)!.push(doc);
  }

  // Generate sections
  for (const [category, subcategoryMap] of byCategory) {
    lines.push(`## ${category}`);
    lines.push("");

    for (const [subcategory, categoryDocs] of subcategoryMap) {
      if (subcategory) {
        lines.push(`### ${subcategory.charAt(0).toUpperCase() + subcategory.slice(1)}`);
        lines.push("");
      }

      for (const doc of categoryDocs) {
        const url = `${BASE_URL}/${doc.urlPath}`;
        lines.push(`- [${doc.title}](${url}): ${doc.description}`);
      }

      lines.push("");
    }
  }

  fs.writeFileSync(LLMS_TXT_PATH, lines.join("\n"));
  console.log(`  ✓ ${LLMS_TXT_PATH}`);
}

/**
 * Generate SKILL.md
 */
function generateSkillMd(docs: DocFile[]): void {
  console.log("Generating SKILL.md...");

  const lines: string[] = [
    "---",
    "name: calendar",
    "description: Use when building calendar UIs with the Temporal API. Provides month, week, and day views with timezone awareness, DST-safe operations, and React hooks for state management.",
    "---",
    "",
    "# temporal-calendar - Calendar Building Blocks",
    "",
    "Lightweight utility library for building calendar UIs with the Temporal API.",
    "",
    "```bash",
    "# Core (framework-agnostic)",
    "npm install @gobrand/calendar-core",
    "",
    "# React",
    "npm install @gobrand/react-calendar",
    "```",
    "",
    "## Quick Start",
    "",
    "```tsx",
    "import { useCreateCalendar, CalendarProvider, useView } from '@gobrand/react-calendar';",
    "",
    "const calendar = useCreateCalendar({",
    "  views: {",
    "    month: { accessor: { getDate: (e) => e.date } },",
    "  },",
    "});",
    "",
    "const view = useView({ data: events });",
    "// view.data.weeks contains the month grid",
    "```",
    "",
    "---",
    "",
  ];

  // Group by category
  const byCategory = new Map<string, DocFile[]>();
  for (const doc of docs) {
    const existing = byCategory.get(doc.category) || [];
    existing.push(doc);
    byCategory.set(doc.category, existing);
  }

  // Generate tables
  for (const [category, categoryDocs] of byCategory) {
    lines.push(`## ${category}`);
    lines.push("");
    lines.push("| Function | Description |");
    lines.push("|----------|-------------|");

    for (const doc of categoryDocs) {
      const displayName = doc.title.includes("use") || doc.title.includes("create")
        ? `\`${doc.title}()\``
        : `\`${doc.title}\``;
      lines.push(`| ${displayName} | ${doc.description} |`);
    }

    lines.push("");
  }

  // Add key types section
  lines.push("## Key Types");
  lines.push("");
  lines.push("```ts");
  lines.push("type CalendarMonth<T> = { weeks: CalendarDay<T>[][]; month: PlainYearMonth };");
  lines.push("type CalendarDay<T> = { date: PlainDate; isCurrentMonth: boolean; isToday: boolean; items: T[] };");
  lines.push("type CalendarAccessor<T> = { getDate: (item: T) => PlainDate; getStart?: ...; getEnd?: ... };");
  lines.push("type DateRange = { start: ZonedDateTime; end: ZonedDateTime };");
  lines.push("```");
  lines.push("");

  const content = lines.join("\n");

  // Write to repo
  const skillDir = path.dirname(SKILL_MD_PATH);
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(SKILL_MD_PATH, content);
  console.log(`  ✓ ${SKILL_MD_PATH}`);

  // Write to global skill directory
  fs.mkdirSync(GLOBAL_SKILL_DIR, { recursive: true });
  fs.writeFileSync(GLOBAL_SKILL_MD_PATH, content);
  console.log(`  ✓ ${GLOBAL_SKILL_MD_PATH}`);
}

/**
 * Main
 */
function main(): void {
  console.log("📚 Documentation Generator\n");
  console.log("Source: MDX files in apps/www/content/docs/");
  console.log("─".repeat(50));

  const docs = loadDocFiles();
  console.log(`\nFound ${docs.length} doc files\n`);

  generateLlmsTxt(docs);
  console.log("");

  generateSkillMd(docs);
  console.log("");

  console.log("─".repeat(50));
  console.log("✅ Done!");
}

main();

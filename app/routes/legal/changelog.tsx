import { SITE_URL } from "@/constants/site";

import { useLoaderData } from "react-router";

import { Badge } from "#/components/ui/badge";

import type { Route } from "./+types/changelog";
import changelogStyles from "./changelog.style.scss?url";

// ──────────────────────────────────────────────────────────────

export const links: Route.LinksFunction = () => [
  {
    rel: "preload",
    href: changelogStyles,
    as: "style",
  },
  {
    rel: "stylesheet",
    href: changelogStyles,
    precedence: "high",
  },
];

// ──────────────────────────────────────────────────────────────

interface ChangelogMeta {
  version: string;
  date: string;
  image?: string;
  file: string;
}

interface ChangelogSection {
  title?: string;
  items: string[];
}

interface ChangelogEntry extends Omit<ChangelogMeta, "file"> {
  title: string;
  description: string;
  sections: ChangelogSection[];
}

interface ChangelogLoaderData {
  entries: ChangelogEntry[];
}

// ──────────────────────────────────────────────────────────────

/** Parse markdown content into structured sections with items */
function parseMarkdownSections(markdown: string): ChangelogSection[] {
  const sections: ChangelogSection[] = [];
  let currentSection: ChangelogSection = { items: [] };

  for (const line of markdown.split("\n")) {
    const trimmed = line.trim();

    if (trimmed.startsWith("## ")) {
      if (currentSection.items.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { title: trimmed.slice(3).trim(), items: [] };
    } else if (trimmed.startsWith("- ")) {
      currentSection.items.push(trimmed.slice(2).trim());
    }
  }

  if (currentSection.items.length > 0) {
    sections.push(currentSection);
  }

  return sections;
}

/** Extract title from first h1 and description from first paragraph */
function extractTitleAndDescription(markdown: string): {
  title: string;
  description: string;
  image?: string;
} {
  const lines = markdown.split("\n").map((l) => l.trim());

  let title = "";
  let description = "";
  let image: string | undefined;

  // Find title from first h1
  const titleIndex = lines.findIndex((line) => line.startsWith("# "));
  if (titleIndex !== -1) {
    title = lines[titleIndex].slice(2).trim();
  }

  // Find description from first non-empty paragraph after title
  // Also extract image from [image]: URL syntax
  const startIdx = titleIndex !== -1 ? titleIndex + 1 : 0;
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];

    // Parse image: [image]: {{SITE_URL}}/path/to/image.png
    if (line.startsWith("[image]:")) {
      const rawUrl = line.slice(8).trim();
      image = rawUrl.replace("{{SITE_URL}}", SITE_URL);
      continue;
    }

    if (
      line &&
      !line.startsWith("#") &&
      !line.startsWith("-") &&
      !line.startsWith("##") &&
      !line.startsWith("[image]:")
    ) {
      description = line;
      break;
    }
  }

  return { title, description, image };
}

// Uses Cloudflare ASSETS binding to fetch static files without circular requests
export async function loader({ request, context }: Route.LoaderArgs): Promise<ChangelogLoaderData> {
  const assets = context.cloudflare.ASSETS;
  const basePath = "/data/changelogs";

  const indexRes = await assets.fetch(new URL(`${basePath}/index.json`, request.url));
  if (!indexRes.ok) {
    throw new Error("Failed to fetch changelog index");
  }
  const manifest: ChangelogMeta[] = await indexRes.json();

  const entries: ChangelogEntry[] = await Promise.all(
    manifest.map(async ({ file, ...meta }) => {
      const mdRes = await assets.fetch(new URL(`${basePath}/${file}`, request.url));
      if (!mdRes.ok) {
        throw new Error(`Failed to fetch changelog file: ${file}`);
      }
      const markdown = await mdRes.text();
      const sections = parseMarkdownSections(markdown);
      const { title, description, image: mdImage } = extractTitleAndDescription(markdown);

      // Image from markdown takes precedence, then from index.json meta
      const image = mdImage ?? meta.image;

      return { ...meta, title, description, image, sections };
    }),
  );

  return { entries };
}

// ──────────────────────────────────────────────────────────────

export default function Changelog() {
  const { entries } = useLoaderData<ChangelogLoaderData>();

  return (
    <main className="changelog">
      <div className="changelog__container">
        <div className="changelog__header">
          <h1 className="changelog__title">Changelog</h1>
          <p className="changelog__subtitle">
            All the latest updates, improvements, and fixes to Crosspad.
          </p>
        </div>

        <div className="changelog__list">
          {entries.map((entry) => (
            <ChangelogEntryCard key={entry.version} entry={entry} />
          ))}
        </div>
      </div>
    </main>
  );
}

const ChangelogEntryCard = ({ entry }: { entry: ChangelogEntry }) => {
  return (
    <article className="changelog-entry">
      <div className="changelog-entry__meta">
        <Badge variant="primary" size="sm">
          {entry.version}
        </Badge>
        <time className="changelog-entry__date">{entry.date}</time>
      </div>

      <div className="changelog-entry__body">
        {entry.image && (
          <div className="changelog-entry__image">
            <img src={entry.image} alt={entry.title} />
          </div>
        )}

        <h2 className="changelog-entry__title">{entry.title}</h2>
        <p className="changelog-entry__description">{entry.description}</p>

        {entry.sections.map((section, i) => (
          <div key={i} className="changelog-entry__section">
            {section.title && <h3 className="changelog-entry__section-title">{section.title}</h3>}
            <ul className="changelog-entry__items">
              {section.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </article>
  );
};

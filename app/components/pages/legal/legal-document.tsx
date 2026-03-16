import { LEGAL_CONSTANTS } from "@/constants/legal";

import "./legal-document.style.scss";

import * as React from "react";

import { Link, useLoaderData } from "react-router";

import { useCookieConsent } from "#/components/custom/cookie-consent";
import { Button } from "#/components/ui/button";

// ──────────────────────────────────────────────────────────────

interface LegalSection {
  title?: string;
  paragraphs: string[];
  items: string[];
  subsections: LegalSubsection[];
}

interface LegalSubsection {
  title: string;
  paragraphs: string[];
  items: string[];
}

interface LegalDocumentData {
  title: string;
  lastUpdated: string;
  intro: string[];
  sections: LegalSection[];
}

// ──────────────────────────────────────────────────────────────

/** Parse markdown into structured legal document sections */
function parseMarkdown(markdown: string): LegalDocumentData {
  const lines = markdown.split("\n");

  let title = "";
  let lastUpdated = "";
  const intro: string[] = [];
  const sections: LegalSection[] = [];

  let currentSection: LegalSection | null = null;
  let currentSubsection: LegalSubsection | null = null;
  let pastIntro = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("# ") && !trimmed.startsWith("## ")) {
      title = trimmed.slice(2).trim();
      continue;
    }

    if (trimmed.toLowerCase().startsWith("last updated:")) {
      lastUpdated = trimmed.slice("last updated:".length).trim();
      continue;
    }

    if (trimmed.startsWith("## ")) {
      pastIntro = true;

      if (currentSubsection && currentSection) {
        currentSection.subsections.push(currentSubsection);
        currentSubsection = null;
      }
      if (currentSection) {
        sections.push(currentSection);
      }

      currentSection = {
        title: trimmed.slice(3).trim(),
        paragraphs: [],
        items: [],
        subsections: [],
      };
      continue;
    }

    if (trimmed.startsWith("### ") && currentSection) {
      if (currentSubsection) {
        currentSection.subsections.push(currentSubsection);
      }

      currentSubsection = {
        title: trimmed.slice(4).trim(),
        paragraphs: [],
        items: [],
      };
      continue;
    }

    if (trimmed.startsWith("- ")) {
      const item = trimmed.slice(2).trim();
      if (currentSubsection) {
        currentSubsection.items.push(item);
      } else if (currentSection) {
        currentSection.items.push(item);
      }
      continue;
    }

    if (trimmed) {
      if (!pastIntro && !currentSection) {
        intro.push(trimmed);
      } else if (currentSubsection) {
        currentSubsection.paragraphs.push(trimmed);
      } else if (currentSection) {
        currentSection.paragraphs.push(trimmed);
      }
    }
  }

  if (currentSubsection && currentSection) {
    currentSection.subsections.push(currentSubsection);
  }
  if (currentSection) {
    sections.push(currentSection);
  }

  return { title, lastUpdated, intro, sections };
}

// ──────────────────────────────────────────────────────────────

/** Generate URL-friendly ID from text */
function generateId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/** Replace constants in text before rendering */
function replaceLegalConstants(text: string): string {
  let replaced = text;
  for (const [key, value] of Object.entries(LEGAL_CONSTANTS)) {
    const placeholder = `{{${key}}}`;
    replaced = replaced.split(placeholder).join(value as string);
  }
  return replaced;
}

/** Render inline formatting including bold text and markdown links */
function renderInlineFormatting(text: string) {
  // Replace constants first
  const processedText = replaceLegalConstants(text);

  // Enhanced regex to properly capture links and bold text
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const boldRegex = /\*\*([^*]+)\*\*/g;

  const result = processedText;
  const elements: React.ReactNode[] = [];
  const lastIndex = 0;
  let elementKey = 0;

  // Process links first
  const linkMatches = [...processedText.matchAll(linkRegex)];
  let currentIndex = 0;

  for (const match of linkMatches) {
    const [fullMatch, linkText, linkUrl] = match;
    const matchStart = match.index!;

    // Add text before the link
    if (currentIndex < matchStart) {
      const beforeText = processedText.slice(currentIndex, matchStart);
      elements.push(<span key={elementKey++}>{renderBoldText(beforeText)}</span>);
    }

    // Add the link
    const isInternal = linkUrl.startsWith("/") || !linkUrl.match(/^https?:\/\//);

    if (isInternal) {
      elements.push(
        <Link key={elementKey++} to={linkUrl} className="legal-doc__link">
          {linkText}
        </Link>,
      );
    } else {
      elements.push(
        <a
          key={elementKey++}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="legal-doc__link"
        >
          {linkText}
        </a>,
      );
    }

    currentIndex = matchStart + fullMatch.length;
  }

  // Add remaining text
  if (currentIndex < processedText.length) {
    const remainingText = processedText.slice(currentIndex);
    elements.push(<span key={elementKey++}>{renderBoldText(remainingText)}</span>);
  }

  // If no links found, just render the text with bold formatting
  if (elements.length === 0) {
    return <span>{renderBoldText(processedText)}</span>;
  }

  return <>{elements}</>;
}

/** Render bold text within a string */
function renderBoldText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

/** Render cookie button marker as actual button component */
const CookieButton = () => {
  const { openPreferences } = useCookieConsent();

  return (
    <div className="legal-doc__cookie-button-wrapper">
      <Button variant="primary" onClick={openPreferences} className="legal-doc__manage-cookies-btn">
        Manage Cookie Preferences
      </Button>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────

const LegalDocument = () => {
  const { document } = useLoaderData<{ document: LegalDocumentData }>();

  return (
    <main className="legal-doc">
      <div className="legal-doc__container">
        <div className="legal-doc__header">
          <h1 className="legal-doc__title">{document.title}</h1>
          {document.lastUpdated && (
            <time className="legal-doc__date">Last updated: {document.lastUpdated}</time>
          )}
        </div>

        {document.intro.length > 0 && (
          <div className="legal-doc__intro">
            {document.intro.map((paragraph, i) =>
              paragraph === "{{COOKIE_BUTTON}}" ? (
                <CookieButton key={i} />
              ) : (
                <p key={i}>{renderInlineFormatting(paragraph)}</p>
              ),
            )}
          </div>
        )}

        <div className="legal-doc__body">
          {document.sections.map((section, i) => (
            <LegalDocSection key={i} section={section} />
          ))}
        </div>
      </div>
    </main>
  );
};

// ──────────────────────────────────────────────────────────────

const LegalDocSection = ({ section }: { section: LegalSection }) => {
  const sectionId = section.title ? generateId(section.title) : undefined;

  return (
    <section className="legal-doc__section" id={sectionId}>
      {section.title && <h2 className="legal-doc__section-title">{section.title}</h2>}

      {section.paragraphs.map((p, i) =>
        p === "{{COOKIE_BUTTON}}" ? (
          <CookieButton key={i} />
        ) : (
          <p key={i} className="legal-doc__paragraph">
            {renderInlineFormatting(p)}
          </p>
        ),
      )}

      {section.items.length > 0 && (
        <ul className="legal-doc__list">
          {section.items.map((item, j) => (
            <li key={j}>{renderInlineFormatting(item)}</li>
          ))}
        </ul>
      )}

      {section.subsections.map((sub, k) => {
        const subsectionId = generateId(sub.title);
        return (
          <div key={k} className="legal-doc__subsection" id={subsectionId}>
            <h3 className="legal-doc__subsection-title">{sub.title}</h3>

            {sub.paragraphs.map((p, i) =>
              p === "{{COOKIE_BUTTON}}" ? (
                <CookieButton key={i} />
              ) : (
                <p key={i} className="legal-doc__paragraph">
                  {renderInlineFormatting(p)}
                </p>
              ),
            )}

            {sub.items.length > 0 && (
              <ul className="legal-doc__list">
                {sub.items.map((item, j) => (
                  <li key={j}>{renderInlineFormatting(item)}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
};

// ──────────────────────────────────────────────────────────────

export { LegalDocument, parseMarkdown };
export type { LegalDocumentData };

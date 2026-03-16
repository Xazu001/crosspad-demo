import { LegalDocument, parseMarkdown } from "#/components/pages/legal/legal-document";

import type { Route } from "./+types/terms";

// ──────────────────────────────────────────────────────────────

export async function loader({ request, context }: Route.LoaderArgs) {
  const assets = context.cloudflare.ASSETS;

  const res = await assets.fetch(new URL("/data/legal/terms.md", request.url));
  if (!res.ok) {
    throw new Error("Failed to fetch terms of service");
  }

  const markdown = await res.text();
  const document = parseMarkdown(markdown);

  return { document };
}

// ──────────────────────────────────────────────────────────────

export default function Terms() {
  return <LegalDocument />;
}

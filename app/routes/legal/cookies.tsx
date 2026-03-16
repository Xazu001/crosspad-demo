import { LegalDocument, parseMarkdown } from "#/components/pages/legal/legal-document";

import type { Route } from "./+types/cookies";

// ──────────────────────────────────────────────────────────────

export async function loader({ request, context }: Route.LoaderArgs) {
  const assets = context.cloudflare.ASSETS;

  const res = await assets.fetch(new URL("/data/legal/cookies.md", request.url));
  if (!res.ok) {
    throw new Error("Failed to fetch cookie policy");
  }

  const markdown = await res.text();
  const document = parseMarkdown(markdown);

  return { document };
}

// ──────────────────────────────────────────────────────────────

export default function Cookies() {
  return <LegalDocument />;
}

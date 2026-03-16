import { LegalDocument, parseMarkdown } from "#/components/pages/legal/legal-document";

import type { Route } from "./+types/account-rules";

// ──────────────────────────────────────────────────────────────

export async function loader({ request, context }: Route.LoaderArgs) {
  const assets = context.cloudflare.ASSETS;

  const res = await assets.fetch(new URL("/data/legal/account-rules.md", request.url));
  if (!res.ok) {
    throw new Error("Failed to fetch account rules");
  }

  const markdown = await res.text();
  const document = parseMarkdown(markdown);

  return { document };
}

// ──────────────────────────────────────────────────────────────

export default function AccountRules() {
  return <LegalDocument />;
}

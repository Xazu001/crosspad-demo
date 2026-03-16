import { markLandingVisited } from "@/preferences";

import { data } from "react-router";

import { About } from "#/routes/legal/index.about";
import aboutStyles from "#/routes/legal/index.about.style.scss?url";
import { FAQ } from "#/routes/legal/index.faq";
import faqStyles from "#/routes/legal/index.faq.style.scss?url";
import { Hero } from "#/routes/legal/index.hero";
import heroStyles from "#/routes/legal/index.hero.style.scss?url";
import { Newsletter } from "#/routes/legal/index.newsletter";
import newsletterStyles from "#/routes/legal/index.newsletter.style.scss?url";
import { Stats } from "#/routes/legal/index.stats";
import statsStyles from "#/routes/legal/index.stats.style.scss?url";

import type { Route } from "./+types/index";

// ──────────────────────────────────────────────────────────────

export const links: Route.LinksFunction = () => [
  { rel: "preload", href: aboutStyles, as: "style" },
  { rel: "stylesheet", href: aboutStyles, precedence: "high" },
  { rel: "preload", href: faqStyles, as: "style" },
  { rel: "stylesheet", href: faqStyles, precedence: "high" },
  { rel: "preload", href: heroStyles, as: "style" },
  { rel: "stylesheet", href: heroStyles, precedence: "high" },
  { rel: "preload", href: newsletterStyles, as: "style" },
  { rel: "stylesheet", href: newsletterStyles, precedence: "high" },
  { rel: "preload", href: statsStyles, as: "style" },
  { rel: "stylesheet", href: statsStyles, precedence: "high" },
];

/** Set landing visited cookie */
export async function loader({ request }: Route.LoaderArgs) {
  const cookie = await markLandingVisited(request);

  return data(
    { success: true },
    {
      headers: {
        "Set-Cookie": cookie,
      },
    },
  );
}

export default function Index() {
  return (
    <main
      style={{
        background: "#000",
      }}
      className="landing-main nopt"
    >
      <Hero />
      <About />
      <Stats />
      <FAQ />
      <Newsletter />
    </main>
  );
}

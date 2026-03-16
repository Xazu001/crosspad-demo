import { Link, useLoaderData } from "react-router";

import { KitContainer, KitItem } from "#/components/custom/kit";
import { Badge } from "#/components/ui/badge";

import { loader } from "./home.server";

// Re-export for React Router route discovery
export { loader };

export default function Index() {
  const { kits } = useLoaderData<typeof loader>();

  return (
    <>
      <main>
        <section className="kits">
          <div className="" style={{ display: "flex" }}>
            <Badge variant="primary" size="md">
              All
            </Badge>
          </div>
          <KitContainer>
            {Array.isArray(kits) &&
              kits.map((kit: any) => (
                <Link key={`kit-${kit.kit_id}`} to={`/kit/play/${kit.kit_id}`}>
                  <KitItem {...kit} />
                </Link>
              ))}
          </KitContainer>
        </section>
      </main>
      <footer className="main-footer">
        <Link to="/landing" className="main-footer__link">
          <img src="/assets/logo-full.png" alt="Crosspad logo" />
          <p>Go to Landing</p>
        </Link>
        <p>© {new Date().getFullYear()} Crosspad</p>
        <div className=""></div>
      </footer>
    </>
  );
}

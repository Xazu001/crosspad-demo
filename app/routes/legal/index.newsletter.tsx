import { flow } from "#/components/custom/animations/flow";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";

export function Newsletter() {
  return (
    <section id="newsletter" className="newsletter">
      <flow.div className="newsletter__container">
        <flow.h2 delay={0.1}>Join our newsletter!</flow.h2>
        <flow.p delay={0.2}>Get the latest news and updates from our awesome artists!</flow.p>
        <flow.div className="newsletter__form" delay={0.3}>
          <Input name="email" placeholder="Input your email" size="lg" variant="ghost" />
          <Button type="submit" size="lg" variant="ghost" disabled>
            Subscribe
          </Button>
        </flow.div>
      </flow.div>
    </section>
  );
}

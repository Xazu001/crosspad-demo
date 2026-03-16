import { Link, useFetcher } from "react-router";

import { CircleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { useSubmitForm } from "#/lib/router";

import { AuthLayout, authSizes } from "./layout";

// Re-export for React Router route discovery
export { action } from "./login.server";

// ──────────────────────────────────────────────────────────────

type Inputs = {
  email: string;
  password: string;
  remember: string;
};

// ──────────────────────────────────────────────────────────────

/** Login page component */
export default function Index() {
  const fetcher = useFetcher();

  // Use the unified form submission hook with proper typing and external fetcher
  const { submit, isSubmitting, errors, success } = useSubmitForm<Inputs>({
    fetcher,
    navigateTo: "/",
    resetOnSuccess: true,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    submit(formData, {
      method: "POST",
      action: "/login",
    });
  };

  return (
    <AuthLayout
      title="Login"
      subtitle="Welcome back on our waves!"
      fetcher={fetcher}
      onSubmit={handleSubmit}
    >
      <div className="auth__item">
        <Label
          additionalSize="sm"
          additionalText={errors?.email}
          additionalVariant="destructive"
          additionalIcon={errors?.email ? <CircleAlert /> : null}
          {...authSizes}
        >
          Email
        </Label>
        <Input
          type="text"
          variant="glass"
          placeholder="john@example.com"
          name="email"
          {...authSizes}
        />
      </div>
      <div className="auth__item">
        <Label
          additionalSize="sm"
          additionalText={errors?.password}
          additionalVariant="destructive"
          additionalIcon={errors?.password ? <CircleAlert /> : null}
          {...authSizes}
        >
          Password
        </Label>
        <Input
          type="password"
          variant="glass"
          placeholder="••••••••"
          name="password"
          showPasswordToggle
          {...authSizes}
        />
      </div>
      <div
        className="auth__item"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          paddingBlock: "1rem",
        }}
      >
        <Checkbox id="remember" name="remember" variant="glass" {...authSizes} />
        <Label
          htmlFor="remember"
          modifiers={{
            noPaddingBottom: true,
          }}
          style={{
            lineHeight: "1",
          }}
          {...authSizes}
        >
          Remember me
        </Label>
      </div>
      <div className="auth__alert-wrapper">
        {errors?.general && (
          <div>
            <Alert variant="glassDestructive">
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>{errors?.general}</AlertDescription>
            </Alert>
          </div>
        )}
        {success && (
          <div>
            <Alert variant="glassSuccess">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>You have been logged in successfully!</AlertDescription>
            </Alert>
          </div>
        )}
      </div>
      <div className="auth__ctas">
        <Button
          variant="primary"
          type="submit"
          style={{ width: "100%", justifyContent: "center" }}
          state={isSubmitting ? "loading" : "default"}
          disabled={isSubmitting}
          {...authSizes}
        >
          Login
        </Button>
        <p style={{ textAlign: "center" }}>
          Don't have an account?{" "}
          <Link to="/register" className="link-decorated">
            Register
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

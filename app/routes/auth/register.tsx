import { Link, useFetcher } from "react-router";

import { CircleAlert } from "lucide-react";

import { toast } from "react-toastify";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { useSubmitForm } from "#/lib/router";

import { AuthLayout, authSizes } from "./layout";

// Re-export for React Router route discovery
export { action } from "./register.server";

// ──────────────────────────────────────────────────────────────

type Inputs = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: string;
};

// ──────────────────────────────────────────────────────────────

/** Register page component */
export default function Index() {
  const fetcher = useFetcher();

  // Use the unified form submission hook with proper typing and external fetcher
  const { submit, isSubmitting, errors, success } = useSubmitForm<Inputs>({
    fetcher,
    onSuccess: () => {
      toast.success("Registration successful! Please check your email to verify your account.");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    submit(formData, {
      method: "POST",
      action: "/register",
    });
  };

  return (
    <AuthLayout
      title="Register"
      subtitle="Join our waves and start your journey!"
      fetcher={fetcher}
      onSubmit={handleSubmit}
    >
      <div className="auth__item">
        <Label
          additionalSize="sm"
          additionalText={errors?.username}
          additionalVariant="destructive"
          additionalIcon={errors?.username ? <CircleAlert /> : null}
          {...authSizes}
        >
          Username
        </Label>
        <Input type="text" name="username" variant="glass" placeholder="John_Doe" {...authSizes} />
      </div>
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
          name="email"
          variant="glass"
          placeholder="john@example.com"
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
          name="password"
          variant="glass"
          placeholder="••••••••"
          showPasswordToggle
          {...authSizes}
        />
      </div>
      <div className="auth__item">
        <Label
          additionalSize="sm"
          additionalText={errors?.confirmPassword}
          additionalVariant="destructive"
          additionalIcon={errors?.confirmPassword ? <CircleAlert /> : null}
          {...authSizes}
        >
          Confirm Password
        </Label>
        <Input
          type="password"
          name="confirmPassword"
          variant="glass"
          placeholder="••••••••"
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
        <Checkbox id="terms" name="terms" variant="glass" {...authSizes} />
        <Label
          htmlFor="terms"
          modifiers={{
            noPaddingBottom: true,
          }}
          style={{
            lineHeight: "1",
          }}
          {...authSizes}
        >
          I agree to the{" "}
          <Link to="/legal/terms" className="link-decorated">
            Terms and Conditions
          </Link>
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
              <AlertDescription>Your account has been created successfully!</AlertDescription>
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
          Register
        </Button>
        <p style={{ textAlign: "center" }}>
          Already have an account?{" "}
          <Link to="/login" className="link-decorated">
            Login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

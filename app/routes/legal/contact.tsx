import * as React from "react";

import { useFetcher } from "react-router";

import { CircleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import { useSubmitForm } from "#/lib/router";

import type { Route } from "./+types/contact";
import contactStyles from "./contact.style.scss?url";

// Re-export for React Router route discovery
export { action } from "./contact.server";

// ──────────────────────────────────────────────────────────────

export const links: Route.LinksFunction = () => [
  { rel: "preload", href: contactStyles, as: "style" },
  { rel: "stylesheet", href: contactStyles, precedence: "high" },
];

// ──────────────────────────────────────────────────────────────

const CONTACT_TYPES = [
  "general",
  "bug_report",
  "feature_request",
  "account_deletion",
  "other",
] as const;

type ContactType = (typeof CONTACT_TYPES)[number];

const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  general: "General Inquiry",
  bug_report: "Bug Report",
  feature_request: "Feature Request",
  account_deletion: "Account Deletion Request",
  other: "Other",
};

type Inputs = {
  type: ContactType;
  email: string;
  subject: string;
  message: string;
  // Account deletion specific fields
  accountIdentifier?: string;
  deletionReason?: string;
  deletionConfirmation?: string;
  // Email retention consent
  emailConsent?: string;
};

// ──────────────────────────────────────────────────────────────

export default function Contact() {
  const fetcher = useFetcher();
  const [selectedType, setSelectedType] = React.useState<ContactType>("general");

  const { submit, isSubmitting, errors, success } = useSubmitForm<Inputs>({
    fetcher,
    resetOnSuccess: true,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    submit(formData, {
      method: "POST",
      action: "/contact",
    });
  };

  const isAccountDeletion = selectedType === "account_deletion";

  return (
    <main className="contact">
      <div className="contact__container">
        <header className="contact__header">
          <h1 className="contact__title">Contact Us</h1>
          <p className="contact__subtitle">Have a question or need help? We're here for you.</p>
        </header>

        <fetcher.Form className="contact__form" onSubmit={handleSubmit} method="POST">
          <div className="contact__item">
            <Label size="lg">Inquiry Type</Label>
            <input type="hidden" name="type" value={selectedType} />
            <Select
              value={selectedType}
              onValueChange={(v) => setSelectedType(v as ContactType)}
              labels={CONTACT_TYPE_LABELS}
            >
              <SelectTrigger size="lg" variant="outline-card">
                <SelectValue placeholder="Select inquiry type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Inquiry</SelectItem>
                <SelectItem value="bug_report">Bug Report</SelectItem>
                <SelectItem value="feature_request">Feature Request</SelectItem>
                <SelectItem value="account_deletion">Account Deletion Request</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isAccountDeletion && (
            <div className="contact__deletion-notice">
              <Alert variant="glassDestructive">
                <AlertTitle>Account Deletion Request</AlertTitle>
                <AlertDescription>
                  This is a formal request for complete data removal per our{" "}
                  <a href="/legal/privacy#9-data-retention-and-deletion">
                    Privacy Policy Section 9
                  </a>
                  . Full deletion may take up to 30 days. Some data may be anonymized rather than
                  deleted where required by law.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="contact__item">
            <Label
              additionalSize="sm"
              additionalText={errors?.email}
              additionalVariant="destructive"
              additionalIcon={errors?.email ? <CircleAlert /> : null}
              size="lg"
            >
              Email
            </Label>
            <Input
              type="email"
              name="email"
              variant="outline-card"
              placeholder="your@email.com"
              size="lg"
            />
          </div>

          {isAccountDeletion && (
            <div className="contact__item">
              <Label
                additionalSize="sm"
                additionalText={errors?.accountIdentifier}
                additionalVariant="destructive"
                additionalIcon={errors?.accountIdentifier ? <CircleAlert /> : null}
                size="lg"
              >
                Deletion Code
              </Label>
              <Input
                type="text"
                name="accountIdentifier"
                variant="outline-card"
                placeholder="Enter your deletion code"
                size="lg"
              />
              <p className="contact__hint">
                To delete your account, first request deletion from your profile settings. You will
                receive a deletion code via email. Enter it here to confirm the deletion.
              </p>
            </div>
          )}

          <div className="contact__item">
            <Label
              additionalSize="sm"
              additionalText={errors?.subject}
              additionalVariant="destructive"
              additionalIcon={errors?.subject ? <CircleAlert /> : null}
              size="lg"
            >
              Subject
            </Label>
            <Input
              type="text"
              name="subject"
              variant="outline-card"
              placeholder="Brief summary of your inquiry"
              size="lg"
            />
          </div>

          <div className="contact__item">
            <Label
              additionalSize="sm"
              additionalText={errors?.message}
              additionalVariant="destructive"
              additionalIcon={errors?.message ? <CircleAlert /> : null}
              size="lg"
            >
              {isAccountDeletion ? "Reason for Deletion (Optional)" : "Message"}
            </Label>
            <Textarea
              name={isAccountDeletion ? "deletionReason" : "message"}
              variant="outline-card"
              placeholder={
                isAccountDeletion
                  ? "Tell us why you're leaving (optional)"
                  : "Describe your inquiry in detail"
              }
              size="lg"
              rows={5}
            />
          </div>

          {isAccountDeletion && (
            <div className="contact__item contact__item--checkbox">
              <Checkbox
                id="deletionConfirmation"
                name="deletionConfirmation"
                variant="card"
                size="lg"
              />
              <Label htmlFor="deletionConfirmation" size="md">
                I understand this is a formal deletion request and complete data removal may take up
                to 30 days. I have read <a href="/legal/terms#9-termination">Terms Section 9</a> and{" "}
                <a href="/legal/privacy#9-data-retention-and-deletion">
                  Privacy Policy Section 9.1
                </a>
                .
              </Label>
            </div>
          )}

          <div className="contact__item contact__item--checkbox">
            <Checkbox id="emailConsent" name="emailConsent" variant="card" size="lg" />
            <Label
              htmlFor="emailConsent"
              size="md"
              additionalSize="sm"
              additionalText={errors?.emailConsent}
              additionalVariant="destructive"
              additionalIcon={errors?.emailConsent ? <CircleAlert /> : null}
            >
              I agree that my email address will be stored for 12 months to facilitate follow-up
              communication regarding this inquiry, as described in our{" "}
              <a href="/legal/privacy#10-contact-form-data-retention">Privacy Policy Section 10</a>.
            </Label>
          </div>

          <div className="contact__alert-wrapper">
            {errors?.general && (
              <Alert variant="glassDestructive">
                <AlertTitle>Something went wrong</AlertTitle>
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert variant="glassSuccess">
                <AlertTitle>Message Sent</AlertTitle>
                <AlertDescription>
                  {isAccountDeletion
                    ? "Your deletion request has been received. You will receive a confirmation email shortly."
                    : "Thank you for contacting us! We'll get back to you as soon as possible."}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="contact__actions">
            <Button
              variant="primary"
              type="submit"
              size="lg"
              state={isSubmitting ? "loading" : "default"}
              disabled={isSubmitting}
            >
              {isAccountDeletion ? "Submit Deletion Request" : "Send Message"}
            </Button>
          </div>
        </fetcher.Form>
      </div>
    </main>
  );
}

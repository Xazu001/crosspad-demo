/** @jsxImportSource react */
import type * as React from "react";

import { AccountDeletionRequested } from "./account-deletion-requested";
import { AnonymizationRequested } from "./anonymization-requested";
import { AnonymizationUndone } from "./anonymization-undone";
import { ConfirmRegistration } from "./confirm-registration";
import { ContactInquiry } from "./contact-inquiry";

// Mail types that have templates (excludes MainLayout which is just a wrapper)
export type MailTemplateType =
  | "ConfirmRegistration"
  | "AnonymizationRequested"
  | "AnonymizationUndone"
  | "ContactInquiry"
  | "AccountDeletionRequested";

// ──────────────────────────────────────────────────────────────
// Template Registry - Maps mail types to components and preview data
// ──────────────────────────────────────────────────────────────

export interface MailTemplateConfig<T extends Record<string, unknown>> {
  /** Template name for display */
  name: string;
  /** Human-readable description */
  description: string;
  /** React component */
  component: (props: T) => React.ReactElement;
  /** Preview props for mail preview page */
  previewProps: T;
}

// Type-safe registry of all mail templates
export const mailTemplateRegistry = {
  ConfirmRegistration: {
    name: "Confirm Registration",
    description: "Email sent after user registration to verify email address",
    component: ConfirmRegistration,
    previewProps: {
      userName: "Jan Kowalski",
      verificationCode: "abc123-def456-ghi789",
    },
  },
  AnonymizationRequested: {
    name: "Anonymization Requested",
    description: "Email sent when user requests account anonymization (24-day grace period)",
    component: AnonymizationRequested,
    previewProps: {
      userName: "Jan Kowalski",
      undoCode: "undo-code-12345",
    },
  },
  AnonymizationUndone: {
    name: "Anonymization Undone",
    description: "Email sent when user cancels their anonymization request",
    component: AnonymizationUndone,
    previewProps: {
      userName: "Jan Kowalski",
    },
  },
  ContactInquiry: {
    name: "Contact Inquiry",
    description: "Email sent to support team when user submits contact form",
    component: ContactInquiry,
    previewProps: {
      email: "user@example.com",
      subject: "Question about my account",
      message:
        "Hello, I have a question about my account settings. How can I change my email address?",
      inquiryType: "General Inquiry",
    },
  },
  AccountDeletionRequested: {
    name: "Account Deletion Requested",
    description: "Email sent when user requests full account deletion (30-day grace period)",
    component: AccountDeletionRequested,
    previewProps: {
      userName: "Jan Kowalski",
      undoCode: "deletion-code-xyz789",
    },
  },
} as const satisfies Record<MailTemplateType, MailTemplateConfig<any>>;

// Export type for template keys
export type MailTemplateKey = keyof typeof mailTemplateRegistry;

// Get all template keys
export const mailTemplateKeys = Object.keys(mailTemplateRegistry) as MailTemplateKey[];

// Get template config by key
export function getMailTemplate<T extends MailTemplateKey>(
  key: T,
): (typeof mailTemplateRegistry)[T] {
  return mailTemplateRegistry[key];
}

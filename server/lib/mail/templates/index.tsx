/** @jsxImportSource react */
export { MainLayout, vars } from "./layout";
export { ConfirmRegistration } from "./confirm-registration";
export { AnonymizationRequested } from "./anonymization-requested";
export { AnonymizationUndone } from "./anonymization-undone";
export { ContactInquiry } from "./contact-inquiry";
export { AccountDeletionRequested } from "./account-deletion-requested";
export { styles } from "./styles";
export {
  getMailTemplate,
  mailTemplateKeys,
  mailTemplateRegistry,
  type MailTemplateConfig,
  type MailTemplateKey,
  type MailTemplateType,
} from "./registry";

export type MailType =
  | "ConfirmRegistration"
  | "MainLayout"
  | "AnonymizationRequested"
  | "AnonymizationUndone"
  | "ContactInquiry"
  | "AccountDeletionRequested";

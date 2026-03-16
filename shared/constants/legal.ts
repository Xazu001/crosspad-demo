export const LEGAL_CONSTANTS = {
  SERVICE_OWNER: "Crosspad Team",
  SERVICE_OWNER_KRS: "0000123456", // Placeholder KRS number
  SERVICE_ADMIN_FULL_NAME: "XXXXXX",
  SERVICE_ADMIN_ADDRESS: "XXXXXX",
  SERVICE_ADMIN_EMAIL: "XXXXXX",
} as const;

export type LegalConstantKey = keyof typeof LEGAL_CONSTANTS;

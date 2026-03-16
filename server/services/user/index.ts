// ──────────────────────────────────────────────────────────────
// Imports
// ──────────────────────────────────────────────────────────────
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";
import { NobleCryptoPlugin } from "@otplib/plugin-crypto-noble";
import { TOTP } from "otplib";

import { dataMethod, formMethod } from "$/lib/decorators";
import { MailProvider } from "$/lib/mail";
import { getMessage } from "$/lib/response";
import { Validator, z } from "@/validators";

import { BaseService } from "../base";

import type { Database } from "$/core";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

// Cloudflare-compatible TOTP instance using noble crypto
const totp = new TOTP({
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin(),
});

// ──────────────────────────────────────────────────────────────
// User Service
// ──────────────────────────────────────────────────────────────

/**
 * Handles user authentication and registration workflows.
 *
 * Provides TOTP, anonymization, and contact form functionality.
 */
export class UserService extends BaseService {
  private mailerApiKey: string;

  constructor(db: Database, mailerApiKey: string) {
    super(db);
    this.mailerApiKey = mailerApiKey;
  }

  @formMethod({ general: getMessage("SOMETHING_WRONG") })
  public async requestAnonymization(request: Request) {
    const user = await this.auth.getUserFromRequest(request);

    if (!user) {
      this.throw({ general: "You must be logged in" });
    }

    // Check if already pending
    if (user.user_status === "anonimization_pending") {
      this.throw({
        general:
          "Anonymization already requested. Check your email for undo link.",
      });
    }

    // Check if already anonymized
    if (user.user_status === "anonimized") {
      this.throw({ general: "Account is already anonymized" });
    }

    const undoCode = crypto.randomUUID();
    const now = Date.now();

    // Update user status and store undo code
    await this.exDbOperation(() =>
      this.db.op
        .updateTable("users")
        .set({
          user_status: "anonimization_pending",
          anonymization_requested_at: now,
          anonymization_undo_code: undoCode,
        })
        .where("user_id", "=", user.user_id)
        .execute()
    );

    // Get user email for notification
    const login = await this.exDbOperation(() =>
      this.db.op
        .selectFrom("logins")
        .where("user_id", "=", user.user_id)
        .select("login_email")
        .executeTakeFirst()
    );

    if (login?.login_email) {
      const mailProvider = new MailProvider(this.mailerApiKey);
      try {
        await mailProvider.generateAndSend(
          {
            template: "AnonymizationRequested",
            props: { userName: user.user_name, undoCode },
          },
          login.login_email,
          "Account Deletion Request Received"
        );
      } catch (emailError) {
        console.error("Failed to send anonymization email:", emailError);
        // Continue - user can still undo via API if email fails
      }
    }

    return this.formSuccess(true);
  }

  @dataMethod()
  public async undoAnonymization(undoCode: string): Promise<{
    success: boolean;
    userName?: string;
    error?: string;
  }> {
    try {
      // Find user by undo code
      const user = await this.exDbOperation(() =>
        this.db.op
          .selectFrom("users")
          .where("anonymization_undo_code", "=", undoCode)
          .select([
            "user_id",
            "user_name",
            "user_status",
            "anonymization_requested_at",
          ])
          .executeTakeFirst()
      );

      if (!user) {
        return { success: false, error: "Invalid undo code" };
      }

      if (user.user_status !== "anonimization_pending") {
        return { success: false, error: "Account is not pending deletion" };
      }

      // Check 24-day grace period (24 * 24 * 60 * 60 * 1000 = 2073600000 ms)
      const gracePeriodMs = 24 * 24 * 60 * 60 * 1000;
      const requestedAt = user.anonymization_requested_at || 0;
      const now = Date.now();

      if (now - requestedAt > gracePeriodMs) {
        return { success: false, error: "Grace period has expired" };
      }

      // Restore active status
      await this.exDbOperation(() =>
        this.db.op
          .updateTable("users")
          .set({
            user_status: "active",
            anonymization_requested_at: null,
            anonymization_undo_code: null,
          })
          .where("user_id", "=", user.user_id)
          .execute()
      );

      // Get user email for confirmation
      const login = await this.exDbOperation(() =>
        this.db.op
          .selectFrom("logins")
          .where("user_id", "=", user.user_id)
          .select("login_email")
          .executeTakeFirst()
      );

      if (login?.login_email) {
        const mailProvider = new MailProvider(this.mailerApiKey);
        try {
          await mailProvider.generateAndSend(
            {
              template: "AnonymizationUndone",
              props: { userName: user.user_name },
            },
            login.login_email,
            "Account Deletion Cancelled"
          );
        } catch (emailError) {
          console.error("Failed to send undo confirmation email:", emailError);
        }
      }

      return { success: true, userName: user.user_name };
    } catch (err) {
      console.error("Error undoing anonymization:", err);
      return { success: false, error: getMessage("SOMETHING_WRONG") };
    }
  }

  // ──────────────────────────────────────────────────────────────
  // TOTP (Two-Factor Authentication)
  // ──────────────────────────────────────────────────────────────

  @formMethod({ general: "Verification failed" })
  public async verifyTotpCode(userId: string, code: string) {
    // Get encrypted secret from KV
    const encryptedSecret = await this._totp.getSecret(userId);

    if (!encryptedSecret) {
      this.throw({
        general: "2FA is not enabled for this account",
      });
    }

    // Decrypt the secret
    const secret = atob(encryptedSecret);

    // Verify the TOTP code
    const result = await totp.verify(code, { secret });

    if (result.valid) {
      return this.formSuccess({ verified: true });
    }

    // If TOTP code failed, try backup codes
    const backupUsed = await this._totp.consumeBackupCode(userId, code);

    if (backupUsed) {
      return this.formSuccess({ verified: true });
    }

    this.throw({ general: "Invalid verification code" });
  }

  @dataMethod()
  public async hasTotpEnabled(userId: string): Promise<boolean> {
    try {
      const settings = await this.exDbOperation(() =>
        this.db.op
          .selectFrom("user_settings")
          .select("user_totp_enabled")
          .where("user_id", "=", userId)
          .executeTakeFirst()
      );
      // SQLite stores booleans as integers (0/1)
      return settings?.user_totp_enabled === 1;
    } catch (error) {
      console.error("[UserService] Failed to check TOTP status:", error);
      return false;
    }
  }

  public generateTotpSecret(): { secret: string; otpauthUrl: string } {
    // Generate random Base32-encoded secret
    const secret = totp.generateSecret();
    return {
      secret,
      otpauthUrl: secret, // Caller will create full URL with user info
    };
  }

  @dataMethod()
  public async setTotpSecret(userId: string, secret: string): Promise<void> {
    // Encrypt the secret using base64 encoding (simple encryption for demo)
    // In production, use proper encryption from crypto.ts
    const encryptedSecret = btoa(secret);
    await this._totp.setSecret(userId, encryptedSecret);
  }

  public generateBackupCodes(count: number = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric codes
      const code = Array.from({ length: 8 }, () =>
        Math.random().toString(36).toUpperCase().charAt(2)
      ).join("");
      codes.push(code);
    }
    return codes;
  }

  @formMethod({ general: "Failed to enable 2FA" })
  public async enableTotp(userId: string) {
    // Update user_settings table
    await this.exDbOperation(() =>
      this.db.op
        .insertInto("user_settings")
        .values({ user_id: userId, user_totp_enabled: true })
        .onConflict((oc) =>
          oc.column("user_id").doUpdateSet({ user_totp_enabled: true })
        )
        .execute()
    );
    return this.formSuccess({ enabled: true });
  }

  @formMethod({ general: "Failed to disable 2FA" })
  public async disableTotp(userId: string) {
    await this._totp.deleteAll(userId);
    // Update user_settings table
    await this.exDbOperation(() =>
      this.db.op
        .updateTable("user_settings")
        .set({ user_totp_enabled: false })
        .where("user_id", "=", userId)
        .execute()
    );
    return this.formSuccess({ disabled: true });
  }

  @formMethod({ general: getMessage("SOMETHING_WRONG") })
  public async submitContactForm(request: Request) {
    console.log("[ContactForm] submitContactForm called");
    const contactSchema = z.object({
      type: z.enum([
        "general",
        "bug_report",
        "feature_request",
        "account_deletion",
        "other",
      ]),
      email: z.string().email().min(1).max(256),
      subject: z.string().min(1).max(256),
      message: z.string().max(10000).optional(),
      accountIdentifier: z.string().max(256).optional(),
      deletionReason: z.string().max(5000).optional(),
      deletionConfirmation: z.string().optional(),
      emailConsent: z.string().optional(),
    });

    const validationResult = await Validator.validateForm(
      request,
      contactSchema
    );

    if (!Validator.isSuccess(validationResult)) {
      this.throw(Validator.getErrors(validationResult));
    }

    const {
      type,
      email,
      subject,
      message,
      accountIdentifier,
      deletionReason,
      deletionConfirmation,
      emailConsent,
    } = validationResult.data;

    // Validate email consent
    if (!emailConsent) {
      this.throw({
        emailConsent:
          "You must agree to the email retention policy to submit this form",
      });
    }

    const mailProvider = new MailProvider(this.mailerApiKey);

    // Handle account deletion request
    if (type === "account_deletion") {
      if (!deletionConfirmation) {
        this.throw({
          deletionConfirmation:
            "You must confirm the deletion request to proceed",
        });
      }

      if (!accountIdentifier) {
        this.throw({
          accountIdentifier:
            "Account email or deletion code is required for deletion requests",
        });
      }

      // Try to find user by email or deletion code
      const user = await this.exDbOperation(() =>
        this.db.op
          .selectFrom("users")
          .leftJoin("logins", "logins.user_id", "users.user_id")
          .where((eb) =>
            eb.or([
              eb("logins.login_email", "=", accountIdentifier.toLowerCase()),
              eb("users.anonymization_undo_code", "=", accountIdentifier),
            ])
          )
          .select([
            "users.user_id",
            "users.user_name",
            "users.user_status",
            "users.anonymization_undo_code",
          ])
          .executeTakeFirst()
      );

      if (!user) {
        this.throw({
          accountIdentifier:
            "No account found with this email or deletion code",
        });
      }

      // Generate undo code if not exists
      const undoCode = user.anonymization_undo_code ?? crypto.randomUUID();

      // Update user status to full_deletion_pending
      await this.exDbOperation(() =>
        this.db.op
          .updateTable("users")
          .set({
            user_status: "full_deletion_pending",
            anonymization_requested_at: Date.now(),
            anonymization_undo_code: undoCode,
          })
          .where("user_id", "=", user.user_id)
          .execute()
      );

      // Send confirmation email to user
      try {
        await mailProvider.generateAndSend(
          {
            template: "AccountDeletionRequested",
            props: {
              userName: user.user_name ?? "User",
              undoCode,
            },
          },
          email,
          "Account Deletion Request Received"
        );
      } catch (error) {
        console.error(
          "[ContactForm] Failed to send deletion confirmation email:",
          error
        );
        this.throw({
          general: "Failed to send confirmation email. Please try again.",
        });
      }

      // Also notify support team
      try {
        await mailProvider.generateAndSend(
          {
            template: "ContactInquiry",
            props: {
              email,
              subject: `[Account Deletion] ${subject}`,
              message: deletionReason ?? "No reason provided",
              inquiryType: "Account Deletion Request",
            },
          },
          this.env.CONTACT_EMAIL,
          `[Account Deletion] ${subject}`
        );
      } catch {
        // Don't fail if support notification fails
        console.error("Failed to notify support about deletion request");
      }

      return this.formSuccess({ submitted: true });
    }

    // Handle other contact types
    const inquiryTypeLabels: Record<string, string> = {
      general: "General Inquiry",
      bug_report: "Bug Report",
      feature_request: "Feature Request",
      other: "Other",
    };

    console.log("[ContactForm] Sending email to:", this.env.CONTACT_EMAIL);
    console.log("[ContactForm] Inquiry type:", type, "Subject:", subject);

    try {
      await mailProvider.generateAndSend(
        {
          template: "ContactInquiry",
          props: {
            email,
            subject,
            message: message ?? "No message provided",
            inquiryType: inquiryTypeLabels[type] ?? type,
          },
        },
        this.env.CONTACT_EMAIL!,
        `[${inquiryTypeLabels[type]}] ${subject}`
      );
      console.log("[ContactForm] Email sent successfully");
    } catch (error) {
      console.error("[ContactForm] Failed to send contact email:", error);
      console.error(
        "[ContactForm] CONTACT_EMAIL:",
        this.env.CONTACT_EMAIL ?? "NOT SET"
      );
      console.error(
        "[ContactForm] mailerApiKey defined:",
        !!this.mailerApiKey
      );
      this.throw({
        general: "Failed to send your message. Please try again.",
      });
    }

    return this.formSuccess({ submitted: true });
  }

  // ──────────────────────────────────────────────────────────────
  // Queue/Cron Methods (no decorators — used in background jobs)
  // ──────────────────────────────────────────────────────────────

  /**
   * Delete all user data from DB (except kits — handled separately).
   *
   * Deletion order respects foreign key constraints:
   * logins → user_rights → user_settings → users
   */
  public async deleteUserData(userId: string): Promise<void> {
    await this.exDbOperation(() =>
      this.db.op.deleteFrom("logins").where("user_id", "=", userId).execute()
    );

    await this.exDbOperation(() =>
      this.db.op
        .deleteFrom("user_rights")
        .where("user_id", "=", userId)
        .execute()
    );

    await this.exDbOperation(() =>
      this.db.op
        .deleteFrom("user_settings")
        .where("user_id", "=", userId)
        .execute()
    );

    await this.exDbOperation(() =>
      this.db.op.deleteFrom("users").where("user_id", "=", userId).execute()
    );
  }
}

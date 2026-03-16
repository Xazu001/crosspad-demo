import { data } from "react-router";

import { hashPassword } from "$/lib/crypto";
import { createRouteService, formMethod } from "$/lib/decorators";
import { MailProvider } from "$/lib/mail";
import { getMessage } from "$/lib/response";
import { BaseService } from "$/services/base";
import { Validator, z } from "@/validators";

import type { Route } from "./+types/register";

// ──────────────────────────────────────────────────────────────
// Route Service
// ──────────────────────────────────────────────────────────────

class RouteService extends BaseService {
  @formMethod({ general: getMessage("SOMETHING_WRONG") })
  public async registerUser(request: Request) {
    await this.rateLimit(request);

    const registerSchema = z
      .object({
        username: z
          .string()
          .min(3, "Must be at least # characters long")
          .max(32, "Must be at most # characters long")
          .regex(/^[a-zA-Z0-9_-]+$/, "Can't contain special characters"),
        email: z
          .string()
          .email("Invalid email format")
          .min(1, "Must be at least # characters long")
          .max(256, "Must be at most # characters long"),
        password: z
          .string()
          .min(6, "Must be at least # characters long")
          .max(256, "Must be at most # characters long"),
        confirmPassword: z
          .string()
          .min(6, "Must be at least # characters long")
          .max(256, "Must be at most # characters long"),

        terms: z.string().optional(),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      })
      .refine((data) => data?.terms === "on", {
        message: "You must accept the terms and conditions",
        path: ["general"],
      });

    const validationResult = await Validator.validateForm(
      request,
      registerSchema
    );

    if (!Validator.isSuccess(validationResult)) {
      this.throw(Validator.getErrors(validationResult));
    }

    const { email, password, username, terms } = validationResult.data;

    if (terms !== "on") {
      this.throw({
        general: "You must accept the terms and conditions",
      });
    }

    const existingEmail = await this.exDbOperation(() =>
      this.db.op
        .selectFrom("logins")
        .where("login_email", "=", email)
        .select("login_id")
        .executeTakeFirst()
    );

    if (existingEmail) {
      this.throw({ email: "Email already in use" });
    }

    const existingUsername = await this.exDbOperation(() =>
      this.db.op
        .selectFrom("users")
        .where("user_name", "=", username)
        .select("user_id")
        .executeTakeFirst()
    );

    if (existingUsername) {
      this.throw({ username: "Username already taken" });
    }

    const existingUsernamespace = await this.exDbOperation(() =>
      this.db.op
        .selectFrom("users")
        .where("user_namespace", "=", username.toLowerCase().trim())
        .select("user_id")
        .executeTakeFirst()
    );

    if (existingUsernamespace) {
      this.throw({ username: "Username already taken" });
    }

    const hashedPassword = await hashPassword(password);
    const userId = crypto.randomUUID();

    const mailProvider = new MailProvider(this.env.MAILER_API_KEY);

    const verificationCode = crypto.randomUUID();

    try {
      await mailProvider.generateAndSend(
        {
          template: "ConfirmRegistration",
          props: { userName: username, verificationCode },
        },
        email,
        "Confirm your registration"
      );
    } catch {
      this.throw({
        general: "Error occurred while sending verification email.",
      });
    }

    await this.exDbBatchOperation([
      this.db.op
        .insertInto("users")
        .values({
          user_id: userId,
          user_name: username.trim(),
          user_namespace: username.toLowerCase().trim(),
          user_verified: false,
        })
        .returningAll(),

      this.db.op
        .insertInto("logins")
        .values({
          user_id: userId,
          login_email: email.trim().toLowerCase(),
          login_password: hashedPassword,
          login_verification_code: verificationCode,
          login_created_on: Date.now(),
        })
        .returningAll(),

      this.db.op
        .insertInto("user_settings")
        .values({
          user_id: userId,
        })
        .returningAll(),

      this.db.op
        .insertInto("user_rights")
        .values({
          user_id: userId,
        })
        .returningAll(),
    ]);

    return this.formSuccess(true);
  }
}

// ──────────────────────────────────────────────────────────────

/** Handle user registration */
export const action = async ({ context, request }: Route.ActionArgs) => {
  const route = createRouteService(RouteService, context);
  const res = await route.registerUser(request);
  return data(res);
};

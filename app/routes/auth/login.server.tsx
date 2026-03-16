import { data } from "react-router";

import { getCookieDomainForRequest, sessionCookie } from "$/lib/cookies";
import { verifyPassword } from "$/lib/crypto";
import { createRouteService, formMethod } from "$/lib/decorators";
import { getMessage } from "$/lib/response";
import { BaseService } from "$/services/base";
import { Validator, z } from "@/validators";


import type { Route } from "./+types/login";

// ──────────────────────────────────────────────────────────────
// Route Service
// ──────────────────────────────────────────────────────────────

class RouteService extends BaseService {
  @formMethod({ general: getMessage("SOMETHING_WRONG") })
  public async loginUser(request: Request) {
    await this.rateLimit(request);

    const loginSchema = z.object({
      email: z
        .string()
        .email()
        .min(1, "Must be at least # characters long")
        .max(256, "Must be at most # characters long"),
      password: z
        .string()
        .min(6, "Must be at least # characters long")
        .max(256, "Must be at most # characters long"),
      remember: z.string().optional(),
    });

    const validationResult = await Validator.validateForm(
      request,
      loginSchema
    );

    if (!Validator.isSuccess(validationResult)) {
      this.throw(Validator.getErrors(validationResult));
    }

    const { email, password, remember } = validationResult.data as z.infer<
      typeof loginSchema
    >;

    const login = await this.exDbOperation(() =>
      this.db.op
        .selectFrom("logins")
        .innerJoin("users", "users.user_id", "logins.user_id")
        .where("login_email", "=", email.trim().toLowerCase())
        .select(["login_password", "users.user_id", "user_verified"])
        .executeTakeFirst()
    );

    if (!login) {
      this.throw({ general: "User not found" });
    }

    if (!login.user_verified) {
      this.throw({
        general: "Please verify your email before logging in",
      });
    }

    const passwordMatch = await verifyPassword(
      password,
      login.login_password || ""
    );

    if (!passwordMatch) {
      this.throw({ general: "Invalid password" });
    }

    const token = await this.auth.createToken(login.user_id || "");

    if (!token) {
      this.throw({ general: "Invalid token" });
    }

    const noExpire = remember === "on";
    const maxAge = noExpire ? 60 * 60 * 24 * 365 * 5 : 60 * 60 * 4;
    const expires = new Date();
    expires.setTime(expires.getTime() + maxAge * 1000);

    const cookie = await sessionCookie.serialize(
      {
        token: token,
      },
      {
        maxAge: maxAge,
        expires: expires,
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        domain: getCookieDomainForRequest(request),
      }
    );

    return this.formSuccess(cookie);
  }
}

// ──────────────────────────────────────────────────────────────

/** Handle user login */
export const action = async ({ context, request }: Route.ActionArgs) => {
  const route = createRouteService(RouteService, context);

  const res = await route.loginUser(request);

  if (res.success) {
    const headers = new Headers();

    // Clear any existing session cookies first
    const clearCookie = await context.services.auth.clearSessionCookie(request);
    headers.append("Set-Cookie", clearCookie);

    // Set the new session cookie
    headers.append("Set-Cookie", res.result);

    return data(res, {
      headers: headers,
    });
  }

  return data(res);
};

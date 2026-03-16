import { data, redirect } from "react-router";

import { createRouteService, dataMethod, formMethod } from "$/lib/decorators";
import { BaseService } from "$/services/base";
import { parseTypedSubmit } from "@/utils/typed-submit";

import type { Route } from "./+types/settings";

// ──────────────────────────────────────────────────────────────
// Route Service
// ──────────────────────────────────────────────────────────────

class RouteService extends BaseService {
  @dataMethod()
  async getSettingsData(request: Request) {
    const user = await this.auth.getUserFromRequest(request);
    if (!user) throw redirect("/login");

    const totpEnabled = await this.user.hasTotpEnabled(user.user_id);
    return this.ok({ user, totpEnabled });
  }

  @dataMethod()
  async getLoginEmail(userId: string) {
    const login = await this.exDbOperation(() =>
      this.db.op
        .selectFrom("logins")
        .select("logins.login_email")
        .where("user_id", "=", userId)
        .executeTakeFirst()
    );
    return this.ok(login);
  }

  @formMethod({ general: "Failed to set up 2FA" })
  async prepareTotpSetup(request: Request, userId: string, email: string) {
    await this.rateLimit(request);

    const { secret } = this.user.generateTotpSecret();
    const backupCodes = this.user.generateBackupCodes();

    await this.user.setTotpSecret(userId, secret);
    await this.user.totp.setBackupCodes(userId, backupCodes);

    return this.formSuccess({
      secret,
      backupCodes,
      otpauthUrl: `otpauth://totp/Crosspad:${email}?secret=${secret}&issuer=Crosspad`,
    });
  }

  @formMethod({ general: "Failed to verify 2FA" })
  async confirmEnableTotp(userId: string, code: string) {
    const verifyResult = await this.user.verifyTotpCode(userId, code);
    if (!verifyResult.success) return verifyResult;

    await this.user.enableTotp(userId);
    return this.formSuccess({ enabled: true });
  }

  @formMethod({ general: "Failed to disable 2FA" })
  async disableTotp(userId: string, totpCode: string) {
    const verifyResult = await this.user.verifyTotpCode(userId, totpCode);
    if (!verifyResult.success) return verifyResult;

    return await this.user.disableTotp(userId);
  }

  @formMethod({ general: "Failed to request account deletion" })
  async requestAnonymization(request: Request, totpCode?: string) {
    const user = await this.auth.getUserFromRequest(request);
    if (!user) this.throw({ general: "Not authenticated" });

    const userHasTotp = await this.user.hasTotpEnabled(user.user_id);
    if (userHasTotp) {
      if (!totpCode) {
        this.throw({ totp: "2FA code is required" });
      }

      const verifyResult = await this.user.verifyTotpCode(user.user_id, totpCode);
      if (!verifyResult.success) return verifyResult;
    }

    await this.rateLimit(request);
    return await this.user.requestAnonymization(request);
  }

  @formMethod({ general: "Failed to accept kit transfer" })
  async acceptKitTransfer(request: Request, code: string) {
    await this.rateLimit(request);
    return await this.kitTransfer.acceptTransfer(request, code);
  }

  @formMethod({ general: "Failed to cancel transfer code" })
  async cancelTransferCode(request: Request, code: string) {
    await this.rateLimit(request);
    return await this.kitTransfer.cancelTransferCode(request, code);
  }
}

// ──────────────────────────────────────────────────────────────
// Loader
// ──────────────────────────────────────────────────────────────

/** Load user data for settings page */
export async function loader({ context, request }: Route.LoaderArgs) {
  const route = createRouteService(RouteService, context);
  const result = await route.getSettingsData(request);
  return data(result);
}

// ──────────────────────────────────────────────────────────────
// Action
// ──────────────────────────────────────────────────────────────

/** Handle settings actions */
export async function action({ context, request }: Route.ActionArgs) {
  const route = createRouteService(RouteService, context);
  const result = await parseTypedSubmit(request);

  if (!result) {
    return data(route.formError({ general: "Invalid action" }));
  }

  const settingsResult = await route.getSettingsData(request);
  const user = settingsResult.user;
  if (!user) {
    return data(route.formError({ general: "Not authenticated" }));
  }

  const login = await route.getLoginEmail(user.user_id);
  if (!login?.login_email) {
    return data(route.formError({ general: "No login email found" }));
  }

  switch (result.type) {
    case "request-anonymization": {
      const { totpCode } = result.data as { totpCode?: string };
      const res = await route.requestAnonymization(request, totpCode);
      return data(res);
    }

    case "prepare-totp": {
      const res = await route.prepareTotpSetup(request, user.user_id, login.login_email);
      return data(res);
    }

    case "confirm-enable-totp": {
      const { code } = result.data;
      const res = await route.confirmEnableTotp(user.user_id, code as string);
      return data(res);
    }

    case "disable-totp": {
      const { totpCode } = result.data;
      const res = await route.disableTotp(user.user_id, totpCode as string);
      return data(res);
    }

    case "accept-kit-transfer": {
      const { code } = result.data as { code: string };
      const res = await route.acceptKitTransfer(request, code);
      return data(res);
    }

    case "cancel-transfer-code": {
      const { code } = result.data as { code: string };
      const res = await route.cancelTransferCode(request, code);
      return data(res);
    }

    default:
      return data(route.formError({ general: "Unknown action" }));
  }
}

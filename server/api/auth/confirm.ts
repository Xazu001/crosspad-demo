import { SITE_URL } from "@/constants";

import type { Context } from "hono";

const confirmHandler = async (c: Context) => {
  const services = c.get("services");
  const { verificationCode } = c.req.param();

  try {
    const login = await services.user.exDbOperation(() =>
      services.user.db.op
        .selectFrom("logins")
        .innerJoin("users", "users.user_id", "logins.user_id")
        .where("logins.login_verification_code", "=", verificationCode)
        .select(["users.user_id", "users.user_verified"])
        .executeTakeFirst(),
    );

    if (!login) {
      return c.json({ success: false, errors: { general: "Invalid verification code" } }, 400);
    }

    if (login.user_verified) {
      return c.json({ success: false, errors: { general: "Email already verified" } }, 400);
    }

    await services.user.exDbOperation(() =>
      services.user.db.op
        .updateTable("users")
        .set({ user_verified: true })
        .where("users.user_id", "=", login.user_id)
        .execute(),
    );

    await services.user.exDbOperation(() =>
      services.user.db.op
        .updateTable("logins")
        .set({ login_verification_code: null })
        .where("logins.user_id", "=", login.user_id)
        .execute(),
    );

    return c.redirect(`${SITE_URL}/login`);
  } catch (error) {
    console.error("Email verification error:", error);
    return c.json({ success: false, errors: { general: "Verification failed" } }, 500);
  }
};

export { confirmHandler };

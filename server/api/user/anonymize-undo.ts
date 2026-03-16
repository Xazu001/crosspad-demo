import { SITE_URL } from "@/constants";

import type { Context } from "hono";

export const anonymizeUndoHandler = async (c: Context) => {
  const services = c.get("services");
  const { undoCode } = c.req.param();

  try {
    const result = await services.user.undoAnonymization(undoCode);

    if (!result.success) {
      return c.json({ success: false, errors: { general: result.error } }, 400);
    }

    // Redirect to login with success message
    return c.redirect(`${SITE_URL}/login?message=account-restored`);
  } catch (error) {
    console.error("Anonymization undo error:", error);
    return c.json({ success: false, errors: { general: "Failed to undo anonymization" } }, 500);
  }
};

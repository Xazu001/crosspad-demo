import { data } from "react-router";
import type { ActionFunctionArgs } from "react-router";

// ──────────────────────────────────────────────────────────────

export async function action({ context, request }: ActionFunctionArgs) {
  try {
    // Clear session cookie
    const clearCookie = await context.services.auth.clearSessionCookie(request);

    return data(
      {
        success: true,
        message: "Logged out successfully",
      },
      {
        headers: {
          "Set-Cookie": clearCookie,
        },
      },
    );
  } catch (error) {
    console.error("Logout error:", error);
    return data({ error: "Failed to logout" }, { status: 500 });
  }
}

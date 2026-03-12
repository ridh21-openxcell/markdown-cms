import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/api";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return jsonError("Unauthorized", 401);
  }
  return jsonSuccess({ userId: user.userId, email: user.email });
}

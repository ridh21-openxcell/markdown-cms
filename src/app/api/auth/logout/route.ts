import { removeAuthCookie } from "@/lib/auth";
import { jsonSuccess } from "@/lib/api";

export async function POST() {
  await removeAuthCookie();
  return jsonSuccess({ success: true });
}

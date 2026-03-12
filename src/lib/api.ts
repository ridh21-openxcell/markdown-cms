import { NextResponse } from "next/server";
import { verifyToken, type JWTPayload } from "./auth";

export function jsonError(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

export async function authenticateRequest(
  request: Request
): Promise<JWTPayload | NextResponse> {
  const cookieHeader = request.headers.get("cookie") || "";
  const tokenMatch = cookieHeader.match(/markdown-cms-token=([^;]+)/);
  const token = tokenMatch?.[1];

  if (!token) {
    return jsonError("Unauthorized", 401);
  }

  const user = await verifyToken(token);
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  return user;
}

export function isErrorResponse(
  result: JWTPayload | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}

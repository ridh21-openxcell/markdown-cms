import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken, setAuthCookie } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return jsonError("Email and password are required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return jsonError("Invalid credentials", 401);
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return jsonError("Invalid credentials", 401);
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
    });

    await setAuthCookie(token);

    return jsonSuccess({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return jsonError("Internal server error", 500);
  }
}

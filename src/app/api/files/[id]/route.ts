import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest, isErrorResponse, jsonError, jsonSuccess } from "@/lib/api";
import { generateUniqueSlug } from "@/lib/slug";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await context.params;

    const file = await prisma.markdownFile.findFirst({
      where: { id, userId: auth.userId },
    });

    if (!file) {
      return jsonError("File not found", 404);
    }

    return jsonSuccess(file);
  } catch (error) {
    console.error("Get file error:", error);
    return jsonError("Internal server error", 500);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = await authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { title, content } = body;

    const existing = await prisma.markdownFile.findFirst({
      where: { id, userId: auth.userId },
    });

    if (!existing) {
      return jsonError("File not found", 404);
    }

    const updateData: Record<string, string> = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0) {
        return jsonError("Title cannot be empty", 400);
      }
      if (title.trim().length > 255) {
        return jsonError("Title must be 255 characters or less", 400);
      }
      updateData.title = title.trim();
      if (title.trim() !== existing.title) {
        updateData.slug = await generateUniqueSlug(title.trim());
      }
    }

    if (content !== undefined) {
      updateData.content = content;
    }

    const file = await prisma.markdownFile.update({
      where: { id },
      data: updateData,
    });

    return jsonSuccess(file);
  } catch (error) {
    console.error("Update file error:", error);
    return jsonError("Internal server error", 500);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await context.params;

    const existing = await prisma.markdownFile.findFirst({
      where: { id, userId: auth.userId },
    });

    if (!existing) {
      return jsonError("File not found", 404);
    }

    await prisma.markdownFile.delete({ where: { id } });

    return jsonSuccess({ success: true });
  } catch (error) {
    console.error("Delete file error:", error);
    return jsonError("Internal server error", 500);
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest, isErrorResponse, jsonError, jsonSuccess } from "@/lib/api";
import { generateUniqueSlug } from "@/lib/slug";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "updated_at";
    const order = searchParams.get("order") || "desc";

    const orderBy: Record<string, string> = {};
    if (sort === "title") orderBy.title = order;
    else if (sort === "created_at") orderBy.createdAt = order;
    else orderBy.updatedAt = order;

    const files = await prisma.markdownFile.findMany({
      where: {
        userId: auth.userId,
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { content: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy,
    });

    return jsonSuccess(files);
  } catch (error) {
    console.error("List files error:", error);
    return jsonError("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const { title, content } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return jsonError("Title is required", 400);
    }

    if (title.trim().length > 255) {
      return jsonError("Title must be 255 characters or less", 400);
    }

    const slug = await generateUniqueSlug(title.trim());

    const file = await prisma.markdownFile.create({
      data: {
        title: title.trim(),
        slug,
        content: content || "",
        userId: auth.userId,
      },
    });

    return jsonSuccess(file, 201);
  } catch (error) {
    console.error("Create file error:", error);
    return jsonError("Internal server error", 500);
  }
}

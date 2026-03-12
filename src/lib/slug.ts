import slugify from "slugify";
import { prisma } from "./db";

export function generateSlug(title: string): string {
  return slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  });
}

export async function generateUniqueSlug(title: string): Promise<string> {
  let slug = generateSlug(title);
  let counter = 0;

  while (true) {
    const candidate = counter === 0 ? slug : `${slug}-${counter}`;
    const existing = await prisma.markdownFile.findUnique({
      where: { slug: candidate },
    });

    if (!existing) {
      return candidate;
    }
    counter++;
  }
}

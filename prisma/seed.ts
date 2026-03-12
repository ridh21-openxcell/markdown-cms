import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_EMAIL;
  const password = process.env.SEED_PASSWORD;

  if (!email || !password) {
    throw new Error("SEED_EMAIL and SEED_PASSWORD must be set");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      passwordHash,
    },
  });

  console.log(`User seeded: ${user.email} (id: ${user.id})`);

  const existingFiles = await prisma.markdownFile.count({
    where: { userId: user.id },
  });

  if (existingFiles === 0) {
    await prisma.markdownFile.createMany({
      data: [
        {
          title: "Welcome to Markdown CMS",
          slug: "welcome-to-markdown-cms",
          content: `# Welcome to Markdown CMS

Your private markdown file manager is ready to use.

## Features

- **Create** new markdown documents
- **Edit** with a live preview
- **Organize** your files in one place
- **Search** through all your documents

## Markdown Syntax

Here's a quick refresher:

### Text Formatting

- **Bold text** with \`**double asterisks**\`
- *Italic text* with \`*single asterisks*\`
- ~~Strikethrough~~ with \`~~tildes~~\`
- \`Inline code\` with backticks

### Lists

1. First ordered item
2. Second ordered item
3. Third ordered item

- Unordered item
- Another item
  - Nested item

### Code Blocks

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

### Tables

| Feature | Status |
|---------|--------|
| CRUD    | Done   |
| Preview | Done   |
| Search  | Done   |

### Blockquotes

> "The best way to predict the future is to invent it."
> — Alan Kay

---

Happy writing!
`,
          userId: user.id,
        },
        {
          title: "Getting Started Guide",
          slug: "getting-started-guide",
          content: `# Getting Started

## Quick Tips

1. Use **Ctrl+S** (or **Cmd+S**) to save your document
2. Toggle between Editor, Split, and Preview modes using the toolbar
3. Use the search bar to find documents quickly
4. Dark mode is available via the sun/moon icon

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd + S | Save document |

## Need Help?

This is a private instance. Contact your administrator for access issues.
`,
          userId: user.id,
        },
      ],
    });

    console.log("Sample documents created.");
  }

  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

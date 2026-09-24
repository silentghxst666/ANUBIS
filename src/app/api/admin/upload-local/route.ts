import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-session";

// Local development only: saves an uploaded photo to public/uploads so the admin can be tried
// without a Vercel Blob store. Disabled in production (the filesystem there is read-only).

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") return new NextResponse("Not available", { status: 404 });
  if (!(await isAdmin())) return new NextResponse("Нужно войти в админку", { status: 401 });

  const file = (await request.formData()).get("file");
  if (!(file instanceof File) || !TYPES[file.type]) return new NextResponse("Нужен JPG, PNG, WebP или AVIF", { status: 400 });
  if (file.size > 15 * 1024 * 1024) return new NextResponse("Файл больше 15 МБ", { status: 400 });

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${TYPES[file.type]}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${name}` });
}

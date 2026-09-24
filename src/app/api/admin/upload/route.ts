import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-session";

// Issues short-lived tokens so the admin's browser can upload product photos straight to
// Vercel Blob. Only a signed-in admin gets a token.
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        if (!(await isAdmin())) throw new Error("Нужно войти в админку");
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
          maximumSizeInBytes: 15 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      // The form saves the URL itself; nothing to do when the upload finishes.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 400 });
  }
}

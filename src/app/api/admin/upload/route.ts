import { issueSignedToken } from "@vercel/blob";
import {
  handleUpload,
  handleUploadPresigned,
  type HandleUploadBody,
  type HandleUploadPresignedBody,
} from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-session";
import { blobAuth, UPLOAD_MAX_BYTES, UPLOAD_TYPES } from "@/lib/blob";

// Lets a signed-in admin's browser upload product photos straight to Vercel Blob.
// Token stores: issue a client token. OIDC stores: issue a short-lived signed token and a
// presigned upload URL. Either way nobody without an admin session gets upload rights.
export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  try {
    if (!(await isAdmin())) throw new Error("Нужно войти в админку");

    if (blobAuth() === "token") {
      const result = await handleUpload({
        body: body as HandleUploadBody,
        request,
        onBeforeGenerateToken: async () => ({
          allowedContentTypes: UPLOAD_TYPES,
          maximumSizeInBytes: UPLOAD_MAX_BYTES,
          addRandomSuffix: true,
        }),
        // The form saves the URL itself; nothing to do when the upload finishes.
        onUploadCompleted: async () => {},
      });
      return NextResponse.json(result);
    }

    if (blobAuth() === "oidc") {
      const result = await handleUploadPresigned({
        body: body as HandleUploadPresignedBody,
        request,
        getSignedToken: async (pathname) => ({
          token: await issueSignedToken({
            pathname,
            operations: ["put"],
            allowedContentTypes: UPLOAD_TYPES,
            maximumSizeInBytes: UPLOAD_MAX_BYTES,
            validUntil: Date.now() + 10 * 60 * 1000,
          }),
          urlOptions: {
            addRandomSuffix: true,
            allowedContentTypes: UPLOAD_TYPES,
            maximumSizeInBytes: UPLOAD_MAX_BYTES,
          },
        }),
      });
      return NextResponse.json(result);
    }

    throw new Error("Хранилище фото (Vercel Blob) не подключено");
  } catch (error) {
    // Visible in Vercel → Logs; the browser only learns that the upload was refused.
    console.error("[admin upload]", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 400 });
  }
}

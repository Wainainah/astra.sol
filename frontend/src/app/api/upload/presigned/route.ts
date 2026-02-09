/**
 * Cloudflare R2 Presigned URL Generation
 * 
 * Generates presigned URLs for direct browser-to-R2 uploads.
 * This keeps R2 credentials server-side while allowing clients to upload directly.
 */

import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

// R2 Client Setup
// R2 is S3-compatible so we use the AWS SDK
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "astra-images";
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

// Validate env vars
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.warn("R2 credentials not configured. Uploads will fail.");
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : "",
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || "",
    secretAccessKey: R2_SECRET_ACCESS_KEY || "",
  },
});

interface PresignedRequest {
  filename: string;
  contentType: string;
  folder?: "tokens" | "avatars" | "metadata";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check if R2 is configured
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: "R2 not configured" },
        { status: 503 }
      );
    }

    const body: PresignedRequest = await request.json();
    const { filename, contentType, folder = "tokens" } = body;

    // Validate inputs
    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "filename and contentType are required" },
        { status: 400 }
      );
    }

    // Validate content type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/json",
    ];
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    // Generate unique key
    const ext = filename.split(".").pop() || "bin";
    const key = `${folder}/${randomUUID()}.${ext}`;

    // Create presigned URL (valid for 5 minutes)
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300, // 5 minutes
    });

    // Construct public URL
    const publicUrl = R2_PUBLIC_URL
      ? `${R2_PUBLIC_URL}/${key}`
      : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

    return NextResponse.json({
      presignedUrl,
      publicUrl,
      key,
    });
  } catch (error) {
    console.error("Presigned URL generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET(): Promise<NextResponse> {
  const configured = !!(
    R2_ACCOUNT_ID &&
    R2_ACCESS_KEY_ID &&
    R2_SECRET_ACCESS_KEY &&
    R2_PUBLIC_URL
  );

  return NextResponse.json({
    configured,
    bucket: R2_BUCKET_NAME,
    publicUrl: R2_PUBLIC_URL,
  });
}

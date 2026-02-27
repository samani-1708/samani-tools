import { NextRequest, NextResponse } from "next/server";
import { addImageToRoom } from "@/lib/scan-pdf/store";
import { getValidatedRoomId } from "../_shared";

const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

export async function POST(req: NextRequest) {
  const roomId = getValidatedRoomId(req);
  if (!roomId) {
    return NextResponse.json({ error: "invalid room id" }, { status: 400 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image uploads are allowed" }, { status: 415 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.byteLength > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "Image too large. Keep each capture under 6 MB." },
        { status: 413 },
      );
    }
    const id = makeId();

    const createdAt = Date.now();
    addImageToRoom(roomId, {
      id,
      name: file.name || `scan-${createdAt}.jpg`,
      mime: file.type || "image/jpeg",
      size: bytes.byteLength,
      createdAt,
      bytes,
    });

    return NextResponse.json({
      ok: true,
      image: {
        id,
        name: file.name || `scan-${createdAt}.jpg`,
        mime: file.type || "image/jpeg",
        size: bytes.byteLength,
        createdAt,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}

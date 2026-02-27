import { NextRequest, NextResponse } from "next/server";
import { getRoomImages } from "@/lib/scan-pdf/store";

export async function GET(req: NextRequest) {
  const roomId = req.nextUrl.searchParams.get("room")?.trim();
  if (!roomId) {
    return NextResponse.json({ error: "room is required" }, { status: 400 });
  }

  const since = Number(req.nextUrl.searchParams.get("since") || "0");
  const images = getRoomImages(roomId)
    .filter((img) => img.createdAt > since)
    .map((img) => ({
      id: img.id,
      name: img.name,
      mime: img.mime,
      size: img.size,
      createdAt: img.createdAt,
    }));

  return NextResponse.json({
    ok: true,
    images,
    serverTime: Date.now(),
  });
}

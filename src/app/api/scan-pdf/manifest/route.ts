import { NextRequest, NextResponse } from "next/server";
import { getRoomImages } from "@/lib/scan-pdf/store";
import { getValidatedRoomId, isValidSince } from "../_shared";

export async function GET(req: NextRequest) {
  const roomId = getValidatedRoomId(req);
  if (!roomId) {
    return NextResponse.json({ error: "invalid room id" }, { status: 400 });
  }

  const sinceParam = req.nextUrl.searchParams.get("since");
  if (!isValidSince(sinceParam)) {
    return NextResponse.json({ error: "invalid since value" }, { status: 400 });
  }

  const since = Number(sinceParam || "0");
  const records = getRoomImages(roomId);
  if (!records) {
    return NextResponse.json({ error: "room not found" }, { status: 404 });
  }

  const images = records
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

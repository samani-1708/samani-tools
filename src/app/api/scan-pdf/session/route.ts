import { NextRequest, NextResponse } from "next/server";
import { clearRoom, ensureRoom } from "@/lib/scan-pdf/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const roomId = String(body?.roomId || "").trim();
    if (!roomId) {
      return NextResponse.json({ error: "roomId is required" }, { status: 400 });
    }

    ensureRoom(roomId);
    return NextResponse.json({ ok: true, roomId });
  } catch {
    return NextResponse.json({ error: "Failed to initialize room" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const roomId = req.nextUrl.searchParams.get("room")?.trim();
  if (!roomId) {
    return NextResponse.json({ error: "room is required" }, { status: 400 });
  }
  clearRoom(roomId);
  return NextResponse.json({ ok: true });
}

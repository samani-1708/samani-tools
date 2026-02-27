import { NextRequest, NextResponse } from "next/server";
import { clearRoom, ensureRoom } from "@/lib/scan-pdf/store";
import { getValidatedRoomId } from "../_shared";

const ROOM_ID_RE = /^[a-z0-9-]{6,80}$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const roomId = String(body?.roomId || "").trim().toLowerCase();
    if (!ROOM_ID_RE.test(roomId)) {
      return NextResponse.json({ error: "invalid roomId" }, { status: 400 });
    }

    ensureRoom(roomId);
    return NextResponse.json({ ok: true, roomId });
  } catch {
    return NextResponse.json({ error: "Failed to initialize room" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const roomId = getValidatedRoomId(req);
  if (!roomId) {
    return NextResponse.json({ error: "invalid room id" }, { status: 400 });
  }
  clearRoom(roomId);
  return NextResponse.json({ ok: true });
}

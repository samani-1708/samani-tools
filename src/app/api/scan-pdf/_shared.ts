import { NextRequest } from "next/server";

const ROOM_ID_RE = /^[a-z0-9-]{6,80}$/;

export function getValidatedRoomId(req: NextRequest): string | null {
  const roomId = req.nextUrl.searchParams.get("room")?.trim().toLowerCase() || "";
  if (!ROOM_ID_RE.test(roomId)) {
    return null;
  }
  return roomId;
}

export function isValidSince(value: string | null): boolean {
  if (!value) return true;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0;
}

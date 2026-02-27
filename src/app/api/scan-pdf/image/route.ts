import { NextRequest, NextResponse } from "next/server";
import { getRoomImage, takeRoomImage } from "@/lib/scan-pdf/store";
import { getValidatedRoomId } from "../_shared";

export async function GET(req: NextRequest) {
  const roomId = getValidatedRoomId(req);
  const imageId = req.nextUrl.searchParams.get("id")?.trim();
  const consume = req.nextUrl.searchParams.get("consume") === "1";

  if (!roomId || !imageId) {
    return NextResponse.json({ error: "invalid room or image id" }, { status: 400 });
  }

  const image = consume ? takeRoomImage(roomId, imageId) : getRoomImage(roomId, imageId);
  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  return new NextResponse(Buffer.from(image.bytes), {
    headers: {
      "Content-Type": image.mime,
      "Cache-Control": "no-store",
      "Content-Length": String(image.size),
      "Content-Disposition": `inline; filename=\"${image.name.replaceAll('"', "")}\"`,
    },
  });
}

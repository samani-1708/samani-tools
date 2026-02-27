export type ScanImageRecord = {
  id: string;
  name: string;
  mime: string;
  size: number;
  createdAt: number;
  bytes: Uint8Array;
};

type ScanRoom = {
  id: string;
  createdAt: number;
  touchedAt: number;
  images: Map<string, ScanImageRecord>;
};

type ScanStore = {
  rooms: Map<string, ScanRoom>;
};

const ROOM_TTL_MS = 1000 * 60 * 30;
const IMAGE_TTL_MS = 1000 * 60 * 5;

function now() {
  return Date.now();
}

function getStore(): ScanStore {
  const globalRef = globalThis as unknown as { __scanPdfStore?: ScanStore };
  if (!globalRef.__scanPdfStore) {
    globalRef.__scanPdfStore = { rooms: new Map() };
  }
  return globalRef.__scanPdfStore;
}

export function cleanupScanRooms() {
  const nowMs = now();
  const roomCutoff = nowMs - ROOM_TTL_MS;
  const imageCutoff = nowMs - IMAGE_TTL_MS;
  const store = getStore();
  for (const [roomId, room] of store.rooms.entries()) {
    for (const [imageId, image] of room.images.entries()) {
      if (image.createdAt < imageCutoff) {
        room.images.delete(imageId);
      }
    }

    if (room.touchedAt < roomCutoff) {
      store.rooms.delete(roomId);
    }
  }
}

export function ensureRoom(roomId: string): ScanRoom {
  cleanupScanRooms();
  const store = getStore();
  const existing = store.rooms.get(roomId);
  if (existing) {
    existing.touchedAt = now();
    return existing;
  }

  const created: ScanRoom = {
    id: roomId,
    createdAt: now(),
    touchedAt: now(),
    images: new Map(),
  };
  store.rooms.set(roomId, created);
  return created;
}

export function addImageToRoom(roomId: string, image: ScanImageRecord) {
  const room = ensureRoom(roomId);
  room.images.set(image.id, image);
  room.touchedAt = now();
}

export function getRoomImages(roomId: string) {
  const room = ensureRoom(roomId);
  return Array.from(room.images.values()).sort((a, b) => a.createdAt - b.createdAt);
}

export function getRoomImage(roomId: string, imageId: string) {
  const room = ensureRoom(roomId);
  return room.images.get(imageId) || null;
}

export function takeRoomImage(roomId: string, imageId: string) {
  const room = ensureRoom(roomId);
  const image = room.images.get(imageId) || null;
  if (image) {
    room.images.delete(imageId);
    room.touchedAt = now();
  }
  return image;
}

export function clearRoom(roomId: string) {
  const room = ensureRoom(roomId);
  room.images.clear();
  room.touchedAt = now();
}

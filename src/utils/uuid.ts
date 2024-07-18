import { randomBytes } from "crypto";

export function generateUUID() {
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4 UUID
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10xx for UUID

  const uuid = `${bytes.toString("hex", 0, 4)}-${bytes.toString(
    "hex",
    4,
    6,
  )}-${bytes.toString("hex", 6, 8)}-${bytes.toString(
    "hex",
    8,
    10,
  )}-${bytes.toString("hex", 10, 16)}`;
  return uuid;
}

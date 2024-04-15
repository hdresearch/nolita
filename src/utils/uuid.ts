import { randomBytes } from "crypto";

export function generateUUID() {
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4 UUID
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10xx for UUID

  const uuid = `${bytes.toString("hex", 0, 4)}-${bytes.toString(
    "hex",
    4,
    6
  )}-${bytes.toString("hex", 6, 8)}-${bytes.toString(
    "hex",
    8,
    10
  )}-${bytes.toString("hex", 10, 16)}`;
  return uuid;
}
function sortUUIDv4ByTime(uuids: string[]): string[] {
  return uuids.sort((a, b) => {
    // Extract the timestamp component from the UUIDv4 strings
    const timestampA = parseInt(a.slice(14, 18), 16);
    const timestampB = parseInt(b.slice(14, 18), 16);

    // Compare the timestamps and return the appropriate value
    if (timestampA < timestampB) {
      return -1;
    }
    if (timestampA > timestampB) {
      return 1;
    }
    return 0;
  });
}

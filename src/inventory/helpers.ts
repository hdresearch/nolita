const CHARACTERS =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateRandomCharacter() {
  return CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
}

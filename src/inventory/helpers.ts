const CHARACTERS =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateRandomCharacter() {
  return CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
}

export function maskString(value: string) {
  return value
    .split("")
    .map(() => generateRandomCharacter())
    .join("");
}

export function maskNumber(inputNumber: number): number {
  // Convert the input number to a string to easily count digits
  const inputAsString = Math.abs(inputNumber).toString();
  const numberOfDigits = inputAsString.length;

  // Calculate the minimum and maximum range for the random number
  const min = Math.pow(10, numberOfDigits - 1);
  const max = Math.pow(10, numberOfDigits) - 1;

  // Generate and return a random number within the range
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

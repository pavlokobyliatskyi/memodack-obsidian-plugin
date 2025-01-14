export const getRandomNumbers = (
  maxNumber: number,
  ignoreNumber: number,
  count: number
): number[] => {
  if (maxNumber < 1 || count < 1) {
    throw new Error(
      "maxNumber must be greater than or equal to 1 and count must be greater than or equal to 1"
    );
  }

  const numbers: Set<number> = new Set();

  while (numbers.size < count) {
    const num = Math.floor(Math.random() * maxNumber);
    if (num !== ignoreNumber && num !== maxNumber) {
      numbers.add(num);
    }
  }

  return Array.from(numbers);
};

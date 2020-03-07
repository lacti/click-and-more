const candidates = [
  "#CD6155",
  "#AF7AC5",
  "#5499C7",
  "#48C9B0",
  "#45B39D",
  "#52BE80",
  "#F4D03F",
  "#E67E22",
  "#DC7633",
  "#A6ACAF"
];

export const getRandomColors = (count: number) => {
  const colors: string[] = [];
  while (colors.length < count) {
    const candidate = candidates[Math.floor(Math.random() * candidates.length)];
    if (
      colors.some(color => color.substring(0, 2) === candidate.substring(0, 2))
    ) {
      continue;
    }
    colors.push(candidate);
  }
  return colors;
};

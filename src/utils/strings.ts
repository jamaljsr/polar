export const ellipseInner = (text: string, charsToKeep = 6): string => {
  if (!text) return text;
  if (text.length <= charsToKeep * 2) return text;
  const firstChars = text.substring(0, charsToKeep);
  const lastChars = text.substring(text.length - charsToKeep);
  return `${firstChars}...${lastChars}`;
};

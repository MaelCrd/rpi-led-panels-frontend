export const hexToNumeric = (hexColor) => {
  // Remove # if present and convert to number
  const hex = hexColor.replace("#", "");
  return parseInt(hex, 16);
};

export const numericToHex = (numericValue) => {
  if (numericValue === undefined || numericValue === null) return "#000000";
  // Convert number to hex and pad with zeros, add #
  const hex = Math.floor(numericValue).toString(16).padStart(6, "0");
  return `#${hex.toUpperCase()}`;
};


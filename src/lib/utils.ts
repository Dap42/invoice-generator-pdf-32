import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertNumberToIndianWords(num: number): string {
  const s = num.toFixed(2).split(".");
  let [rupees, cents] = [s[0], s[1]];

  const words = [];

  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const convertChunk = (n: number): string => {
    let chunkWords = [];
    if (n >= 100) {
      chunkWords.push(units[Math.floor(n / 100)], "Hundred");
      n %= 100;
    }
    if (n >= 20) {
      chunkWords.push(tens[Math.floor(n / 10)]);
      n %= 10;
    }
    if (n >= 10) {
      chunkWords.push(teens[n - 10]);
      n = 0;
    }
    if (n > 0) {
      chunkWords.push(units[n]);
    }
    return chunkWords.join(" ");
  };

  // Convert rupees part
  let n = parseInt(rupees, 10);
  if (n === 0) {
    words.push("Zero");
  } else {
    if (n >= 10000000) {
      // Crores
      words.push(convertChunk(Math.floor(n / 10000000)), "Crore");
      n %= 10000000;
    }
    if (n >= 100000) {
      // Lakhs
      words.push(convertChunk(Math.floor(n / 100000)), "Lakh");
      n %= 100000;
    }
    if (n >= 1000) {
      // Thousands
      words.push(convertChunk(Math.floor(n / 1000)), "Thousand");
      n %= 1000;
    }
    if (n > 0) {
      words.push(convertChunk(n));
    }
  }

  let finalWords = words.filter(Boolean).join(" "); // Filter out empty strings from conversion
  finalWords = finalWords.trim();

  if (finalWords) {
    finalWords += " Rupees";
  }

  // Convert cents part
  const centsInt = parseInt(cents, 10);
  if (centsInt > 0) {
    if (finalWords) {
      finalWords += " and ";
    }
    finalWords += convertChunk(centsInt) + " Paisa";
  }

  return finalWords.trim() + " Only.";
}

// Define regional UP variations for mapping
export const regionalUpVariations = [
  "East UP",
  "West UP",
  "North UP",
  "South UP",
  "Central UP",
];
// Define other main states
export const otherMainStates = [
  "Madhya Pradesh",
  "Rajasthan",
  "Bihar",
  "Maharashtra",
  "Gujarat",
  "Chhattisgarh",
  "Uttarakhand",
  "Punjab",
  "Haryana",
];

// Helper to extract state from address by searching for known state names
export const extractStateFromAddress = (address: string) => {
  const addressLower = address.toLowerCase();

  // First, check for regional UP variations and map them to "Uttar Pradesh"
  for (const regionalUp of regionalUpVariations) {
    if (addressLower.includes(regionalUp.toLowerCase())) {
      return "Uttar Pradesh";
    }
  }

  // Then, check for other main states
  for (const state of otherMainStates) {
    if (addressLower.includes(state.toLowerCase())) {
      return state;
    }
  }

  return "Uttar Pradesh"; // Default if no specific state or regional UP is found
};

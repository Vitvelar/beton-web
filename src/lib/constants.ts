export const COMPANY = {
  name: "Beton ehf.",
  location: "Hafnarfjörður, Ísland",
  kennitala: "490925-2950",
  email: "beton@beton.is",
  founder: "Bragi Michaelsson",
} as const;

export const NAV_LINKS = [
  { href: "/umokkur", label: "Um okkur" },
  { href: "/verdskra", label: "Verðskrá" },
  { href: "/samband", label: "Hafa samband" },
  { href: "/skilmalar", label: "Skilmálar" },
] as const;

export const PRICING = {
  residential: [
    { size: "0–100 m²", price: "129.900 kr." },
    { size: "101–200 m²", price: "159.900 kr." },
    { size: "201–300 m²", price: "189.900 kr." },
    { size: "301–400 m²", price: "219.900 kr." },
    { size: "Yfir 400 m²", price: "Tilboð" },
  ],
  commercial: "Tilboð",
  housingAssociations: "Tilboð",
} as const;

export const ASSET_TYPES = [
  "Real Estate",
  "Stocks",
  "Bonds",
  "Mutual Funds",
  "ETFs",
  "Private Equity",
  "Hedge Funds",
  "Commodities",
  "Cryptocurrency",
  "Art & Collectibles",
  "Business Interest",
  "Cash & Cash Equivalents",
  "Other",
] as const;

export type AssetType = (typeof ASSET_TYPES)[number];

export const CURRENCIES = [
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "EUR", label: "EUR (€)", symbol: "€" },
  { value: "GBP", label: "GBP (£)", symbol: "£" },
  { value: "ZAR", label: "ZAR (R)", symbol: "R" },
  { value: "CHF", label: "CHF (CHF)", symbol: "CHF" },
  { value: "JPY", label: "JPY (¥)", symbol: "¥" },
  { value: "AUD", label: "AUD (A$)", symbol: "A$" },
  { value: "CAD", label: "CAD (C$)", symbol: "C$" },
] as const;

export type Currency = (typeof CURRENCIES)[number]["value"];

export const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo (DRC)",
  "Congo (Republic)",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kosovo",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
] as const;

export type Country = (typeof COUNTRIES)[number];

export interface Owner {
  id: string;
  name: string;
  type: "trust" | "individual" | "company";
  location?: string;
}

export const OWNERS: Owner[] = [
  { id: "1", name: "Jones Family Trust", type: "trust", location: "London, UK" },
  { id: "2", name: "John Smith", type: "individual", location: "New York, US" },
  { id: "3", name: "Smith Holdings LLC", type: "company", location: "Delaware, US" },
  { id: "4", name: "Mary Johnson", type: "individual", location: "Sydney, AU" },
  { id: "5", name: "Johnson Family Trust", type: "trust", location: "Toronto, CA" },
  { id: "6", name: "Global Ventures Inc", type: "company", location: "Singapore, SG" },
];

export interface Identity {
  id: string;
  name: string;
  type: "trust" | "individual" | "company";
  location: string;
}

export const IDENTITIES: Identity[] = [
  { id: "1", name: "Jones Family Trust", type: "trust", location: "London, UK" },
  { id: "2", name: "John Smith", type: "individual", location: "New York, US" },
  { id: "3", name: "Smith Holdings LLC", type: "company", location: "Delaware, US" },
  { id: "4", name: "Mary Johnson", type: "individual", location: "Sydney, AU" },
  { id: "5", name: "Johnson Family Trust", type: "trust", location: "Toronto, CA" },
  { id: "6", name: "Global Ventures Inc", type: "company", location: "Singapore, SG" },
  { id: "7", name: "Estate of Robert Brown", type: "trust", location: "Miami, US" },
  { id: "8", name: "Chen Enterprises", type: "company", location: "Hong Kong, HK" },
];

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  owner: Owner;
  stateProvince: string;
  country: Country;
  currency: Currency;
  purchaseValue: number;
  purchaseDate: Date;
  latestValuation: number;
  latestValuationDate: Date;
}

export function getAssetTypeColor(type: AssetType): string {
  const colors: Record<AssetType, string> = {
    "Real Estate": "bg-emerald-500 text-white",
    "Stocks": "bg-blue-500 text-white",
    "Bonds": "bg-purple-500 text-white",
    "Mutual Funds": "bg-indigo-500 text-white",
    "ETFs": "bg-cyan-500 text-white",
    "Private Equity": "bg-amber-500 text-white",
    "Hedge Funds": "bg-orange-500 text-white",
    "Commodities": "bg-yellow-500 text-foreground",
    "Cryptocurrency": "bg-pink-500 text-white",
    "Art & Collectibles": "bg-rose-500 text-white",
    "Business Interest": "bg-teal-500 text-white",
    "Cash & Cash Equivalents": "bg-slate-500 text-white",
    "Other": "bg-gray-500 text-white",
  };
  return colors[type] || "bg-gray-500 text-white";
}

export function formatCurrency(value: number, currency: Currency): string {
  const currencyInfo = CURRENCIES.find(c => c.value === currency);
  const symbol = currencyInfo?.symbol || "$";
  return `${symbol}${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function calculatePerformance(purchaseValue: number, latestValuation: number): { percentage: number; change: number } {
  const change = latestValuation - purchaseValue;
  const percentage = purchaseValue > 0 ? ((latestValuation - purchaseValue) / purchaseValue) * 100 : 0;
  return { percentage, change };
}

export interface SavedReport {
  id: string;
  assetId: string;
  generatedAt: Date;
  identities: { name: string; type: string }[];
  jurisdictions: { name: string; code: string }[];
  summary: string;
  estimatedSavings: number;
}

// Sample saved reports for demo
export const SAVED_REPORTS: SavedReport[] = [
  {
    id: "r1",
    assetId: "1",
    generatedAt: new Date("2026-05-08T10:30:00"),
    identities: [
      { name: "Jones Family Trust", type: "trust" },
      { name: "John Smith", type: "individual" },
    ],
    jurisdictions: [
      { name: "British Virgin Islands", code: "BVI" },
      { name: "Cayman Islands", code: "KY" },
    ],
    summary: "Analysis recommended restructuring through BVI holding company with potential annual savings of $45,000.",
    estimatedSavings: 45000,
  },
  {
    id: "r2",
    assetId: "1",
    generatedAt: new Date("2026-05-01T14:15:00"),
    identities: [
      { name: "Jones Family Trust", type: "trust" },
    ],
    jurisdictions: [
      { name: "Luxembourg", code: "LU" },
    ],
    summary: "Luxembourg SOPARFI structure analyzed for EU treaty benefits and dividend exemptions.",
    estimatedSavings: 32000,
  },
  {
    id: "r3",
    assetId: "1",
    generatedAt: new Date("2026-04-20T09:00:00"),
    identities: [
      { name: "Jones Family Trust", type: "trust" },
      { name: "Smith Holdings LLC", type: "company" },
      { name: "Mary Johnson", type: "individual" },
    ],
    jurisdictions: [
      { name: "Singapore", code: "SG" },
      { name: "Hong Kong", code: "HK" },
    ],
    summary: "Multi-identity comparison with Asia-Pacific jurisdictions showed Singapore as optimal for this asset class.",
    estimatedSavings: 58000,
  },
];

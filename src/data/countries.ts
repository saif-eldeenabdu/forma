export interface Country {
  name: string;
  short: string;
  code: string; // ISO-ish 3 letter tag for terminal display
  currencyCode: string;
  currencyName: string;
  role: string;
  gdp: string;
  gold: string;
  usdDependency: string;
  exports: string[];
  stance: string;
  prompts: string[];
}

export const COUNTRIES: Country[] = [
  {
    name: 'Brazil',
    short: 'Brazil',
    code: 'BRA',
    currencyCode: 'BRL',
    currencyName: 'Real',
    role: 'Original Founding Member (Hosted the 2025 Summit in Rio de Janeiro).',
    gdp: '~$2.3 Trillion',
    gold: '~130 Tons',
    usdDependency: 'Moderate-High',
    exports: ['Soybeans', 'Iron Ore', 'Crude Petroleum', 'Agricultural Goods'],
    stance:
      "Supports reducing reliance on the US dollar for regional and intra-BRICS trade (President Lula has vocally advocated for trade settlement alternatives), and champions connecting Brazil's ultra-successful Pix instant payment system and Drex (CBDC) to BRICS Pay. However, Brazil does not want to abolish the Brazilian Real or enter an aggressive economic war with the United States.",
    prompts: [
      'How can Brazil connect its domestic "Pix" payment system to BRICS Pay?',
      'Why did Brazil push for trade settlement in Chinese Yuan for commodity exports while staying neutral between Washington and Beijing?',
    ],
  },
  {
    name: 'Russian Federation',
    short: 'Russia',
    code: 'RUS',
    currencyCode: 'RUB',
    currencyName: 'Ruble',
    role: 'Original Founding Member (Hosted the historic 2024 Kazan Summit).',
    gdp: '~$2.1 Trillion',
    gold: '~2,335 Tons (Massive)',
    usdDependency: 'Near Zero (Sanctioned)',
    exports: ['Crude Oil', 'Natural Gas', 'Gold', 'Wheat', 'Fertilizers', 'Defense Tech'],
    stance:
      'The single most aggressive proponent of total de-dollarization. Cut off from Western SWIFT banks and holding frozen Western reserves, Russia actively pushes for the BRICS Bridge digital platform, Decentralized Cross-Border Messaging System (DCMS), and a commodity/gold-backed settlement unit so Western sanctions can never paralyze its trade again.',
    prompts: [
      'How has Russia managed the "Rupee Trap" (accumulating billions of Indian Rupees from oil sales that are hard to spend)?',
      'How can Russia convince non-sanctioned BRICS members to adopt its anti-SWIFT architecture?',
    ],
  },
  {
    name: 'India',
    short: 'India',
    code: 'IND',
    currencyCode: 'INR',
    currencyName: 'Rupee',
    role: 'Original Founding Member & 2026 BRICS Chair (Hosting the 18th Summit in New Delhi).',
    gdp: '~$4.1 Trillion',
    gold: '~855 Tons',
    usdDependency: 'Moderate',
    exports: ['Refined Petroleum', 'IT & Software Services', 'Pharmaceuticals', 'Gems & Jewelry'],
    stance:
      "Crucial nuance: India is strictly against a single Euro-style BRICS currency that would replace the Rupee or allow China's Yuan (CNY) to dominate Asia. Instead, India champions local currency settlement, Bilateral Special Rupee Vostro Accounts (SRVAs), and linking India's UPI and e-Rupee (CBDC) with other BRICS payment networks.",
    prompts: [
      'Why did India\'s External Affairs Minister state "there is no proposal for a single BRICS currency," while the Reserve Bank of India (RBI) simultaneously proposed the "BRICS CBDC Bridge" for 2026?',
      'How do you prevent China from turning BRICS into a Yuan-dominated bloc?',
    ],
  },
  {
    name: 'China',
    short: 'China',
    code: 'CHN',
    currencyCode: 'CNY',
    currencyName: 'Yuan / Renminbi',
    role: 'Original Founding Member & Largest Economic Powerhouse of the Bloc.',
    gdp: '~$18.8 Trillion',
    gold: '~2,264 Tons',
    usdDependency: 'Moderate (Large US Treasury holder, steadily reducing)',
    exports: ['Electronics', 'EVs & Batteries', 'Machinery', 'Solar Panels', 'Rare Earth Processing'],
    stance:
      "Pragmatic architectural leader. Rather than creating a risky brand-new currency from scratch, Beijing wants to internationalize the Chinese Yuan (RMB), expand its CIPS banking system (China's alternative to SWIFT), and scale mBridge (where the digital Yuan/e-CNY accounts for the vast majority of cross-border CBDC volume).",
    prompts: [
      'How can China persuade oil exporters (Saudi Arabia, UAE, Iran, Russia) to accept payment in Yuan ("Petroyuan")?',
      "How do you reassure India and Brazil that China isn't just replacing US dollar dominance with Chinese Yuan dominance?",
    ],
  },
  {
    name: 'South Africa',
    short: 'S. Africa',
    code: 'ZAF',
    currencyCode: 'ZAR',
    currencyName: 'Rand',
    role: 'Joined in 2010 (Hosted the 2023 Johannesburg Expansion Summit).',
    gdp: '~$400 Billion',
    gold: '~125 Tons',
    usdDependency: 'High (heavily integrated into Western banking)',
    exports: ['Platinum Group Metals', 'Gold', 'Iron Ore', 'Coal', 'Manganese', 'Vehicles'],
    stance:
      'Cautious and balanced. South Africa is the financial gateway to Africa and hosts deep Western capital markets. Its central bank warns that replacing the Rand or hastily disconnecting from SWIFT would crash its economy. Instead, South Africa advocates for New Development Bank (NDB) loans in local African currencies and gold/platinum-backed trade credit facilities.',
    prompts: [
      'How can South Africa use its massive Platinum and Gold mining sector to anchor a BRICS commodity basket without triggering Western secondary sanctions or losing access to US trade agreements?',
    ],
  },
  {
    name: 'Saudi Arabia',
    short: 'Saudi Arabia',
    code: 'SAU',
    currencyCode: 'SAR',
    currencyName: 'Riyal',
    role: 'Full Expansion Member (2026 Framework) & Global Energy Kingpin.',
    gdp: '~$1.1 Trillion',
    gold: '~323 Tons',
    usdDependency: 'Extremely High (the Saudi Riyal has been pegged to the US Dollar at 3.75 since 1986)',
    exports: ['Crude Petroleum', 'Refined Oil', 'Petrochemicals'],
    stance:
      'The ultimate swing vote. For 50 years, the "Petrodollar" system meant Saudi oil was priced exclusively in USD. While Saudi Arabia is now open to settling select oil trades in non-USD currencies (like CNY or AED) to fund Vision 2030 mega-projects, abandoning its USD peg suddenly would devalue its massive sovereign wealth assets in the West.',
    prompts: [
      'What leverage does Saudi Arabia hold over the entire committee as the world\'s swing oil producer?',
      'Under what exact conditions would Riyadh agree to price a percentage of its oil in a BRICS settlement unit?',
    ],
  },
  {
    name: 'United Arab Emirates',
    short: 'UAE',
    code: 'ARE',
    currencyCode: 'AED',
    currencyName: 'Dirham',
    role: 'Full Expansion Member & Global Financial/Crypto/Gold Hub.',
    gdp: '~$540 Billion',
    gold: '~75 Tons (plus massive physical gold trading hub in Dubai)',
    usdDependency: 'High (AED is pegged to the USD at 3.6725)',
    exports: ['Crude Oil', 'Refined Oil', 'Gold & Diamonds (re-export hub)', 'Aluminum'],
    stance:
      'High-tech pioneer. Like Saudi Arabia, the UAE keeps its currency pegged to the dollar for stability, but it is the most aggressive tester of mBridge and Digital Dirham (CBDC) cross-border transfers — having already executed direct digital Dirham-to-Yuan and Dirham-to-Rupee energy trades.',
    prompts: [
      'How can the UAE position Dubai and Abu Dhabi as the central clearinghouse and physical gold vault for a new BRICS digital settlement system while maintaining friendly ties with Western banks?',
    ],
  },
  {
    name: 'Iran',
    short: 'Iran',
    code: 'IRN',
    currencyCode: 'IRR',
    currencyName: 'Rial',
    role: 'Full Expansion Member.',
    gdp: '~$400 Billion',
    gold: 'Significant (Classified/Estimated >300 Tons)',
    usdDependency: 'Zero (Heavily Sanctioned)',
    exports: ['Crude Oil', 'Petrochemicals', 'Natural Gas', 'Metals', 'Agricultural Goods (Saffron/Pistachios)'],
    stance:
      "Side-by-side with Russia in demanding immediate, total de-dollarization. Iran has already linked its domestic Shetab banking network with Russia's Mir system and strongly backs a gold- or energy-backed BRICS currency to bypass unilateral US sanctions permanently.",
    prompts: [
      'How can Iran partner with Russia to form a "Sanctions-Proof Bloc" inside the committee and push cautious members (like India, Brazil, and UAE) to adopt mandatory non-SWIFT settlement rails?',
    ],
  },
  {
    name: 'Egypt',
    short: 'Egypt',
    code: 'EGY',
    currencyCode: 'EGP',
    currencyName: 'Pound',
    role: 'Full Expansion Member & Controller of the Suez Canal Trade Bottleneck.',
    gdp: '~$380 Billion',
    gold: '~126 Tons',
    usdDependency: 'Critically High (faces severe USD shortages and IMF debt servicing)',
    exports: ['Natural Gas (LNG)', 'Fertilizers', 'Refined Petroleum', 'Textiles', 'Citrus', 'Suez Canal Transit Revenues'],
    stance:
      'Desperately needs relief from "Dollar Scarcity." Because Egypt imports massive amounts of wheat, fuel, and manufactured goods from Russia, China, and India, being able to pay for those imports in local currencies or via NDB credit lines — and potentially charging Suez Canal tolls in a BRICS settlement unit — could rescue its economy.',
    prompts: [
      'What happens to global dollar demand if Egypt announces that ships from BRICS countries can pay Suez Canal transit fees in BRICS Pay or local currencies instead of US Dollars?',
    ],
  },
  {
    name: 'Ethiopia',
    short: 'Ethiopia',
    code: 'ETH',
    currencyCode: 'ETB',
    currencyName: 'Birr',
    role: 'Full Expansion Member & Host of the African Union Headquarters.',
    gdp: '~$160 Billion',
    gold: 'Growing (~15+ Tons)',
    usdDependency: 'High (suffers from acute foreign exchange shortages)',
    exports: ['Coffee', 'Gold', 'Oilseeds', 'Cut Flowers', 'Hydropower Electricity (GERD Dam)'],
    stance:
      'Represents the voice of fast-growing East Africa and developing nations crushed by high US interest rates. Ethiopia wants the New Development Bank (NDB) to offer low-interest infrastructure loans in local currencies and supports commodity-barter or local-currency mechanisms so it can import fuel and fertilizers without needing scarce US dollars.',
    prompts: [
      'How can Ethiopia rally the Global South members of the committee to demand that any new BRICS currency system includes debt-relief and infrastructure financing through the NDB?',
    ],
  },
  {
    name: 'Indonesia',
    short: 'Indonesia',
    code: 'IDN',
    currencyCode: 'IDR',
    currencyName: 'Rupiah',
    role: "Newest Full Member (Joined January 2025) & Southeast Asia's Largest Economy.",
    gdp: '~$1.45 Trillion',
    gold: '~80 Tons',
    usdDependency: 'Moderate (actively implementing Local Currency Transactions [LCT] across ASEAN)',
    exports: ["Nickel (world's #1 producer, vital for EV batteries)", 'Palm Oil', 'Coal', 'Copper', 'Natural Gas'],
    stance:
      '"Active Non-Alignment." Indonesia is a resource superpower (controlling the world\'s EV battery nickel supply) and a champion of QRIS (cross-border QR payments). Jakarta supports local currency settlement and commodity pricing leverage, but rejects turning BRICS into an anti-Western military/economic confrontation.',
    prompts: [
      'How can Indonesia leverage its near-monopoly on battery-grade Nickel to demand a seat on the governing board of the BRICS central clearinghouse?',
    ],
  },
];

export const COUNTRY_NAMES = COUNTRIES.map((c) => c.name);
export const byName = (n: string): Country | undefined => COUNTRIES.find((c) => c.name === n);
export const byCurrency = (code: string): Country | undefined => COUNTRIES.find((c) => c.currencyCode === code);

export type DelegationTier = 'FULL BRICS MEMBER' | 'BRICS PARTNER';

export interface Country {
  name: string;
  short: string;
  code: string; // ISO-ish 3 letter tag for terminal display
  currencyCode: string;
  currencyName: string;
  tier: DelegationTier;
  role: string;
  gdp: string;
  gold: string;
  usdDependency: string;
  exports: string[];
  stance: string;
  strategy: string;
  prompts: string[];
}

export const COUNTRIES: Country[] = [
  /* -------------------------------------------------------------------------- */
  /* TIER A: FULL BRICS MEMBERS (11 DELEGATIONS)                                */
  /* -------------------------------------------------------------------------- */
  {
    name: 'Brazil',
    short: 'Brazil',
    code: 'BRA',
    currencyCode: 'BRL',
    currencyName: 'Brazilian Real',
    tier: 'FULL BRICS MEMBER',
    role: 'Original Founding Member & Agricultural Superpower (Hosted the 2025 Summit in Rio de Janeiro).',
    gdp: '~$2.3 Trillion',
    gold: '~130 Tons',
    usdDependency: 'Moderate-High',
    exports: ['Soybeans', 'Iron Ore', 'Crude Petroleum', 'Agricultural Goods'],
    stance:
      'Original founding member and agricultural superpower (soybeans, iron ore, oil) that supports local-currency trade and linking its domestic "Pix" and "Drex" payment systems to BRICS Pay, without starting an aggressive economic war with the United States.',
    strategy:
      'Leverage your massive soybean stockpile on the BRICS Grain Exchange. Push for connecting domestic instant payment networks (like Pix and Drex) to the BRICS CBDC Bridge while blocking extreme proposals that would trigger US trade tariffs.',
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
    currencyName: 'Russian Ruble',
    tier: 'FULL BRICS MEMBER',
    role: 'Original Founding Member & Energy/Commodity Titan (Hosted the historic 2024 Kazan Summit).',
    gdp: '~$2.1 Trillion',
    gold: '~2,335 Tons (Massive)',
    usdDependency: 'Near Zero (Sanctioned)',
    exports: ['Crude Oil', 'Natural Gas', 'Gold', 'Wheat', 'Fertilizers', 'Defense Tech'],
    stance:
      'Original founding member cut off from Western SWIFT banks that aggressively champions total de-dollarization, a gold-backed BRICS currency, the BRICS Bridge platform, and the BRICS Grain Exchange.',
    strategy:
      'Use your wheat monopoly on the BRICS Grain Exchange and energy exports to force importing countries to settle trades in local currencies or BRICS Pay. Lead the bloc demanding the immediate launch of the "BRICS Clear" depository to counter Western asset freezes.',
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
    currencyName: 'Indian Rupee',
    tier: 'FULL BRICS MEMBER',
    role: 'Original Founding Member & 2026 BRICS Chair (Hosting the 18th Summit in New Delhi).',
    gdp: '~$4.1 Trillion',
    gold: '~855 Tons',
    usdDependency: 'Moderate',
    exports: ['Refined Petroleum', 'IT & Software Services', 'Pharmaceuticals', 'Gems & Jewelry', 'Rice'],
    stance:
      'Original founding member and 2026 BRICS Chair that strongly opposes a single Euro-style BRICS currency dominated by China, advocating instead for local currency settlement (Rupee accounts) and the BRICS CBDC Bridge.',
    strategy:
      "Protect the sovereignty of the Indian Rupee and prevent China from turning the bloc into a Yuan-dominated system. Use your rice stockpiles on the Grain Exchange and champion the Reserve Bank of India's \"BRICS CBDC Bridge\" for cross-border digital payments.",
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
    currencyName: 'Chinese Yuan / Renminbi',
    tier: 'FULL BRICS MEMBER',
    role: 'Original Founding Member & Largest Economic Powerhouse of the Bloc.',
    gdp: '~$18.8 Trillion',
    gold: '~2,264 Tons',
    usdDependency: 'Moderate (Large US Treasury holder, steadily reducing)',
    exports: ['Electronics', 'EVs & Batteries', 'Machinery', 'Solar Panels', 'Rare Earth Processing'],
    stance:
      "The bloc's largest economic powerhouse ($18.8T GDP) seeking to internationalize the Chinese Yuan (RMB), expand its CIPS banking network, and scale cross-border digital currency trade.",
    strategy:
      'Offer manufacturing goods, EVs, semiconductors, and New Development Bank (NDB) credit lines in exchange for nations settling oil and commodity trades in Chinese Yuan and routing transactions through CIPS and mBridge.',
    prompts: [
      'How can China persuade oil exporters (Saudi Arabia, UAE, Russia) to accept payment in Yuan ("Petroyuan")?',
      "How do you reassure India and Brazil that China isn't just replacing US dollar dominance with Chinese Yuan dominance?",
    ],
  },
  {
    name: 'South Africa',
    short: 'S. Africa',
    code: 'ZAF',
    currencyCode: 'ZAR',
    currencyName: 'South African Rand',
    tier: 'FULL BRICS MEMBER',
    role: 'Original 2010 Member & Mineral Capital of Africa (Hosted the 2023 Johannesburg Summit).',
    gdp: '~$400 Billion',
    gold: '~125 Tons',
    usdDependency: 'High (heavily integrated into Western banking)',
    exports: ['Platinum Group Metals', 'Gold', 'Iron Ore', 'Coal', 'Manganese', 'Vehicles'],
    stance:
      'Original 2010 member and major gold and platinum producer that favors New Development Bank (NDB) local-currency loans while remaining cautious about disconnecting from Western banking systems.',
    strategy:
      'Use your gold and platinum reserves as leverage in negotiations over the 40% gold-backed "BRICS Unit," while protecting African economies from reckless financial measures that could trigger Western secondary sanctions.',
    prompts: [
      'How can South Africa use its massive Platinum and Gold mining sector to anchor a BRICS commodity basket without triggering Western secondary sanctions or losing access to US trade agreements?',
    ],
  },
  {
    name: 'Egypt',
    short: 'Egypt',
    code: 'EGY',
    currencyCode: 'EGP',
    currencyName: 'Egyptian Pound',
    tier: 'FULL BRICS MEMBER',
    role: 'Full Expansion Member & Controller of the Suez Canal Maritime Bottleneck.',
    gdp: '~$380 Billion',
    gold: '~126 Tons',
    usdDependency: 'Critically High (faces severe USD shortages and debt servicing)',
    exports: ['Natural Gas (LNG)', 'Fertilizers', 'Refined Petroleum', 'Textiles', 'Citrus', 'Suez Canal Transit Revenues'],
    stance:
      'Full expansion member controlling the Suez Canal maritime bottleneck that urgently seeks local-currency trade and NDB credit lines to escape severe US dollar scarcity.',
    strategy:
      'Use your exclusive sovereign power over Suez Canal transit tolls (Presidential Decree 144) as ultimate leverage. Demand discounted wheat from Russia and development credit from China/UAE in exchange for switching Suez Canal tolls from US Dollars to BRICS Pay.',
    prompts: [
      'What happens to global dollar demand if Egypt announces that ships from BRICS countries can pay Suez Canal transit fees in BRICS Pay or local currencies instead of US Dollars?',
    ],
  },
  {
    name: 'Ethiopia',
    short: 'Ethiopia',
    code: 'ETH',
    currencyCode: 'ETB',
    currencyName: 'Ethiopian Birr',
    tier: 'FULL BRICS MEMBER',
    role: 'Full Expansion Member & Host of the African Union Headquarters.',
    gdp: '~$160 Billion',
    gold: 'Growing (~15+ Tons)',
    usdDependency: 'High (suffers from acute foreign exchange shortages)',
    exports: ['Coffee', 'Gold', 'Oilseeds', 'Cut Flowers', 'Hydropower Electricity'],
    stance:
      'Full expansion member and host of the African Union headquarters that advocates for Global South debt relief, commodity barter, and low-interest NDB infrastructure loans in local currencies.',
    strategy:
      'Rally developing nations and BRICS Partners to demand low-interest New Development Bank (NDB) infrastructure financing and zero-fee grain and fertilizer swaps that bypass scarce US Dollars.',
    prompts: [
      'How can Ethiopia rally the Global South members of the committee to demand that any new BRICS currency system includes debt-relief and infrastructure financing through the NDB?',
    ],
  },
  {
    name: 'Indonesia',
    short: 'Indonesia',
    code: 'IDN',
    currencyCode: 'IDR',
    currencyName: 'Indonesian Rupiah',
    tier: 'FULL BRICS MEMBER',
    role: "Full Member (Joined January 2025) & World's #1 Battery-Grade Nickel Producer.",
    gdp: '~$1.45 Trillion',
    gold: '~80 Tons',
    usdDependency: 'Moderate (actively implementing Local Currency Transactions across ASEAN)',
    exports: ["Nickel (world's #1 producer, vital for EV batteries)", 'Palm Oil', 'Coal', 'Copper', 'Natural Gas'],
    stance:
      'Full member (joined January 2025) and the world\'s top producer of battery-grade nickel, practicing "active non-alignment" by supporting local currency transactions without joining an anti-Western confrontation.',
    strategy:
      'Leverage your near-monopoly on battery-grade nickel (essential for EVs) to secure favorable bilateral local-currency deals while keeping the committee focused on practical trade rather than economic warfare.',
    prompts: [
      'How can Indonesia leverage its near-monopoly on battery-grade Nickel to demand a seat on the governing board of the BRICS central clearinghouse?',
    ],
  },
  {
    name: 'Algeria',
    short: 'Algeria',
    code: 'DZA',
    currencyCode: 'DZD',
    currencyName: 'Algerian Dinar',
    tier: 'FULL BRICS MEMBER',
    role: 'Full BRICS Member & Major North African Energy Exporter.',
    gdp: '~$245 Billion',
    gold: '~174 Tons',
    usdDependency: 'Moderate (Heavy energy export reliance)',
    exports: ['Natural Gas (LNG)', 'Crude Oil', 'Petrochemicals', 'Fertilizers'],
    stance:
      'Full BRICS member in this committee representing a major North African energy exporter interested in diversifying trade partnerships and reducing reliance on Western financial conditions.',
    strategy:
      'Use your natural gas and oil exports to negotiate non-dollar energy settlement agreements and partner with fellow African nations (Egypt, Ethiopia, South Africa, Nigeria, Uganda) to expand NDB local-currency financing.',
    prompts: [
      'How can Algeria leverage its natural gas pipeline connections to Europe and Africa to price energy in non-dollar mechanisms?',
      'How can Algeria work with Egypt and Nigeria to build a unified African payment settlement framework within BRICS Pay?',
    ],
  },
  {
    name: 'Saudi Arabia',
    short: 'Saudi Arabia',
    code: 'SAU',
    currencyCode: 'SAR',
    currencyName: 'Saudi Riyal',
    tier: 'FULL BRICS MEMBER',
    role: 'Full Expansion Member (2026 Framework) & Global Energy Kingpin.',
    gdp: '~$1.1 Trillion',
    gold: '~323 Tons',
    usdDependency: 'Extremely High (the Saudi Riyal has been pegged to the US Dollar at 3.75 since 1986)',
    exports: ['Crude Petroleum', 'Refined Oil', 'Petrochemicals'],
    stance:
      'Full expansion member and global oil kingpin whose currency (the Riyal) has been pegged to the US dollar since 1986, making it a crucial swing vote between preserving the Petrodollar and pricing select energy trades in BRICS currencies.',
    strategy:
      'You hold the ultimate swing vote in the room. Refuse reckless proposals that would crash your USD-pegged currency or Western investments, and extract major security and technology concessions before agreeing to price any oil sales in BRICS currencies.',
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
    currencyName: 'UAE Dirham',
    tier: 'FULL BRICS MEMBER',
    role: 'Full Expansion Member & Global Financial/Crypto/Gold Hub.',
    gdp: '~$540 Billion',
    gold: '~75 Tons (plus massive physical gold trading hub in Dubai)',
    usdDependency: 'High (AED is pegged to the USD at 3.6725)',
    exports: ['Crude Oil', 'Refined Oil', 'Gold & Diamonds (re-export hub)', 'Aluminum'],
    stance:
      'Full expansion member and global gold and financial hub that keeps the Dirham pegged to the US dollar for stability while actively pioneering mBridge and Digital Dirham cross-border energy trades.',
    strategy:
      'Position Dubai and Abu Dhabi as the physical gold vault and digital clearinghouse (via mBridge and the Digital Dirham) for BRICS trade, while safeguarding your currency stability and global banking ties.',
    prompts: [
      'How can the UAE position Dubai and Abu Dhabi as the central clearinghouse and physical gold vault for a new BRICS digital settlement system while maintaining friendly ties with Western banks?',
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* TIER B: BRICS PARTNERS (11 DELEGATIONS)                                    */
  /* -------------------------------------------------------------------------- */
  {
    name: 'Uzbekistan',
    short: 'Uzbekistan',
    code: 'UZB',
    currencyCode: 'UZS',
    currencyName: 'Uzbekistani Som',
    tier: 'BRICS PARTNER',
    role: 'Central Asian BRICS Partner & Historic Silk Road Transit Hub.',
    gdp: '~$90 Billion',
    gold: '~380 Tons',
    usdDependency: 'Moderate',
    exports: ['Gold', 'Cotton & Textiles', 'Natural Gas', 'Uranium', 'Copper'],
    stance:
      'Central Asian BRICS Partner seeking to expand regional trade connectivity and utilize local-currency settlement rails with major BRICS economies.',
    strategy:
      'Negotiate bilateral currency swaps with China, Russia, and India to finance overland trade corridors and export gold, cotton, and natural resources without needing US dollar intermediaries.',
    prompts: [
      'How can Uzbekistan utilize its massive gold reserves to participate in the BRICS Unit basket?',
      'How can overland transit routes through Central Asia connect China and Russia without dollar-denominated shipping insurance?',
    ],
  },
  {
    name: 'Belarus',
    short: 'Belarus',
    code: 'BLR',
    currencyCode: 'BYN',
    currencyName: 'Belarusian Ruble',
    tier: 'BRICS PARTNER',
    role: 'Eastern European BRICS Partner & Potash/Machinery Exporter.',
    gdp: '~$75 Billion',
    gold: '~54 Tons',
    usdDependency: 'Zero (Heavily Sanctioned)',
    exports: ['Potash Fertilizers', 'Heavy Machinery & Trucks', 'Refined Petroleum', 'Dairy & Agriculture'],
    stance:
      'Close ally of Russia and BRICS Partner heavily affected by Western financial restrictions, strongly supporting non-SWIFT payment systems and de-dollarization.',
    strategy:
      'Back Russia\'s most aggressive de-dollarization directives, demand immediate access to the Decentralized Cross-Border Messaging System (DCMS) and BRICS Clear, and trade fertilizers and agricultural machinery via local-currency swaps.',
    prompts: [
      'How can Belarus trade potash fertilizers on the BRICS Grain & Commodity Exchange without Western maritime restrictions?',
    ],
  },
  {
    name: 'Bolivia',
    short: 'Bolivia',
    code: 'BOL',
    currencyCode: 'BOB',
    currencyName: 'Boliviano',
    tier: 'BRICS PARTNER',
    role: 'South American BRICS Partner & Global Lithium Capital.',
    gdp: '~$47 Billion',
    gold: '~35 Tons',
    usdDependency: 'Critically High (Severe domestic dollar liquidity shortage)',
    exports: ['Lithium Carbonate & Minerals', 'Natural Gas', 'Zinc & Silver', 'Soybeans'],
    stance:
      'South American BRICS Partner looking to overcome US dollar shortages by settling resource and commodity trades in non-dollar currencies.',
    strategy:
      'Leverage your massive lithium reserves and natural gas to negotiate direct Yuan, Real, and Ruble trade agreements, escaping domestic US dollar scarcity.',
    prompts: [
      'How can Bolivia exchange lithium extraction rights for direct NDB development credit in Chinese Yuan or Brazilian Reais?',
    ],
  },
  {
    name: 'Cuba',
    short: 'Cuba',
    code: 'CUB',
    currencyCode: 'CUP',
    currencyName: 'Cuban Peso',
    tier: 'BRICS PARTNER',
    role: 'Caribbean BRICS Partner & Embargoed Anti-Sanctions Pioneer.',
    gdp: '~$107 Billion',
    gold: 'Confidential / Modest',
    usdDependency: 'Zero (Decades-long US Embargo)',
    exports: ['Nickel', 'Cigars & Tobacco', 'Biopharmaceuticals', 'Sugar', 'Medical Services'],
    stance:
      'Long-sanctioned Caribbean nation and BRICS Partner that strongly advocates for an independent financial architecture completely insulated from US dollar blockades.',
    strategy:
      'Form an anti-sanctions coalition with Russia and Belarus. Push for mandatory non-SWIFT settlement rails (BRICS Pay) and execute commodity barter deals for fuel, grain, and medical supplies.',
    prompts: [
      'How can Cuba use medical services and biotechnology exports in bilateral barter arrangements to secure oil and grain?',
    ],
  },
  {
    name: 'Kazakhstan',
    short: 'Kazakhstan',
    code: 'KAZ',
    currencyCode: 'KZT',
    currencyName: 'Kazakhstani Tenge',
    tier: 'BRICS PARTNER',
    role: "Central Asian BRICS Partner & World's #1 Uranium Producer.",
    gdp: '~$260 Billion',
    gold: '~310 Tons',
    usdDependency: 'Moderate',
    exports: ['Crude Oil', 'Uranium (#1 global producer)', 'Wheat & Grain', 'Copper & Ferroalloys'],
    stance:
      'Resource-rich Central Asian BRICS Partner balancing trade corridors between Russia, China, and global markets through multi-currency settlement options.',
    strategy:
      'Use your major oil, uranium, and grain exports to broker balanced multi-currency trade agreements that connect Central Asia to BRICS Pay without triggering secondary sanctions.',
    prompts: [
      'How does Kazakhstan maintain multi-vector diplomacy while integrating its financial messaging with both CIPS and Mir?',
    ],
  },
  {
    name: 'Malaysia',
    short: 'Malaysia',
    code: 'MYS',
    currencyCode: 'MYR',
    currencyName: 'Malaysian Ringgit',
    tier: 'BRICS PARTNER',
    role: 'Southeast Asian BRICS Partner & Semiconductor/Trade Hub.',
    gdp: '~$430 Billion',
    gold: '~39 Tons',
    usdDependency: 'Moderate-Low (Pioneering ASEAN Local Currency Settlement)',
    exports: ['Semiconductors & Electronics', 'Petroleum & LNG', 'Palm Oil', 'Chemical Products'],
    stance:
      'Southeast Asian BRICS Partner and trade hub championing local-currency settlement initiatives and digital payment interoperability across Asia.',
    strategy:
      'Coordinate with Indonesia, Thailand, Vietnam, India, and China to link Southeast Asian cross-border QR and digital payment networks directly into the BRICS CBDC Bridge.',
    prompts: [
      'How can Malaysia use its critical role in semiconductor packaging to demand payment settlements in local Asian currencies?',
    ],
  },
  {
    name: 'Nigeria',
    short: 'Nigeria',
    code: 'NGA',
    currencyCode: 'NGN',
    currencyName: 'Nigerian Naira',
    tier: 'BRICS PARTNER',
    role: "Major African Economic Power & Top Oil Producer Serving as BRICS Partner.",
    gdp: '~$250 Billion',
    gold: '~21 Tons',
    usdDependency: 'High (Acute FX shortages & volatility)',
    exports: ['Crude Petroleum', 'Natural Gas (LNG)', 'Fertilizers', 'Cocoa Beans'],
    stance:
      'Major African economic and energy power serving as a BRICS Partner seeking alternatives to dollar scarcity and expanded access to NDB development financing.',
    strategy:
      'Leverage your position as Africa\'s top oil producer to negotiate local-currency energy swaps and demand full access to New Development Bank (NDB) credit lines for BRICS Partner states.',
    prompts: [
      'How can Nigeria integrate its Dangote Refinery output into the BRICS energy settlement matrix to eliminate dollar import costs?',
    ],
  },
  {
    name: 'Thailand',
    short: 'Thailand',
    code: 'THA',
    currencyCode: 'THB',
    currencyName: 'Thai Baht',
    tier: 'BRICS PARTNER',
    role: 'Southeast Asian BRICS Partner & Cross-Border Digital Settlement Pioneer.',
    gdp: '~$515 Billion',
    gold: '~244 Tons',
    usdDependency: 'Moderate',
    exports: ['Automobiles & Parts', 'Computer Parts & Hard Drives', 'Rice & Agriculture', 'Rubber'],
    stance:
      'Southeast Asian BRICS Partner focused on linking cross-border digital payment systems and reducing currency conversion costs in regional trade.',
    strategy:
      'Champion practical digital payment links (building on mBridge and local-currency settlement frameworks) to cut dollar conversion fees in tourism, agriculture, and electronics trade.',
    prompts: [
      'As an original founding participant in project mBridge, how can Thailand guide BRICS into operationalizing multi-CBDC platforms?',
    ],
  },
  {
    name: 'Vietnam',
    short: 'Vietnam',
    code: 'VNM',
    currencyCode: 'VND',
    currencyName: 'Vietnamese Dong',
    tier: 'BRICS PARTNER',
    role: 'Fast-Growing Manufacturing Hub & Southeast Asian BRICS Partner.',
    gdp: '~$470 Billion',
    gold: 'Estimated ~10 Tons',
    usdDependency: 'High (Massive trade surplus with the US)',
    exports: ['Smartphones & Electronics', 'Textiles & Footwear', 'Coffee & Rice', 'Machinery'],
    stance:
      'Fast-growing manufacturing hub and BRICS Partner balancing strong export ties with the West alongside deeper financial and trade integration with BRICS nations.',
    strategy:
      'Support voluntary local-currency trade settlement to lower import costs for raw materials and energy from BRICS members, while opposing aggressive measures that would jeopardize your Western export markets.',
    prompts: [
      'How can Vietnam balance its massive US export surplus with its reliance on raw materials from China and energy from Russia?',
    ],
  },
  {
    name: 'Uganda',
    short: 'Uganda',
    code: 'UGA',
    currencyCode: 'UGX',
    currencyName: 'Ugandan Shilling',
    tier: 'BRICS PARTNER',
    role: 'East African BRICS Partner & Voice for Fair Global South Infrastructure Financing.',
    gdp: '~$52 Billion',
    gold: 'Growing (~30+ Tons)',
    usdDependency: 'High (Debt servicing burden)',
    exports: ['Gold', 'Coffee', 'Petroleum (Emerging Lake Albert)', 'Tea', 'Fish'],
    stance:
      'East African BRICS Partner advocating for fair infrastructure financing, commodity-backed trade mechanisms, and relief from high dollar borrowing costs.',
    strategy:
      'Ally with Ethiopia, Egypt, South Africa, and Nigeria to demand that the New Development Bank (NDB) and BRICS Clear extend low-interest local-currency loans and agricultural trade credits to African Partner nations.',
    prompts: [
      'How can Uganda use its leadership of the Non-Aligned Movement (NAM) to bridge African partner nations into the New Development Bank?',
    ],
  },
  {
    name: 'Türkiye',
    short: 'Türkiye',
    code: 'TUR',
    currencyCode: 'TRY',
    currencyName: 'Turkish Lira',
    tier: 'BRICS PARTNER',
    role: 'Strategic Eurasian BRICS Partner Bridging East and West.',
    gdp: '~$1.1 Trillion',
    gold: '~540 Tons',
    usdDependency: 'High (NATO member, high domestic inflation & external debt)',
    exports: ['Automotive & Machinery', 'Steel & Metals', 'Textiles', 'Agricultural Goods', 'Defense Systems'],
    stance:
      'Strategic Eurasian BRICS Partner bridging East and West, seeking to expand local-currency trade with BRICS members while managing its own currency stability.',
    strategy:
      'Leverage your strategic geographic position between Europe, the Black Sea, and the Middle East to broker grain, energy, and manufacturing swaps settled in local currencies and BRICS Pay.',
    prompts: [
      'How can Türkiye leverage its massive gold reserves and Eurasian transit position without violating its Western customs union agreements?',
    ],
  },
];

export const FULL_MEMBERS = COUNTRIES.filter((c) => c.tier === 'FULL BRICS MEMBER');
export const PARTNERS = COUNTRIES.filter((c) => c.tier === 'BRICS PARTNER');
export const COUNTRY_NAMES = COUNTRIES.map((c) => c.name);
export const byName = (n: string): Country | undefined => COUNTRIES.find((c) => c.name === n);
export const byCurrency = (code: string): Country | undefined => COUNTRIES.find((c) => c.currencyCode === code);

export const DEFAULT_DELEGATION_PINS: Record<string, string> = {
  // Full BRICS Members (11)
  'Brazil': '1042',
  'Russian Federation': '2084',
  'Russia': '2084',
  'India': '3019',
  'China': '4055',
  'South Africa': '5071',
  'Saudi Arabia': '6023',
  'United Arab Emirates': '7088',
  'UAE': '7088',
  'Algeria': '8014',
  'Iran': '8014',
  'Egypt': '9036',
  'Ethiopia': '1152',
  'Indonesia': '2267',
  // BRICS Partners (11)
  'Uzbekistan': '3312',
  'Belarus': '5541',
  'Bolivia': '7729',
  'Cuba': '6618',
  'Kazakhstan': '4483',
  'Malaysia': '9921',
  'Nigeria': '8834',
  'Thailand': '2249',
  'Vietnam': '1193',
  'Uganda': '5582',
  'Türkiye': '6670',
  'Turkey': '6670',
};



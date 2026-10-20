export interface BriefingModule {
  id: string;
  tab: string;
  title: string;
  intro?: string;
  blocks: { heading?: string; label?: string; body: string }[];
}

export const BRIEFING: BriefingModule[] = [
  {
    id: 'king',
    tab: '01 // Dollar',
    title: 'Why is the US Dollar King Right Now?',
    blocks: [
      {
        heading: 'The default middleman',
        body: 'Since World War II (Bretton Woods) and the 1970s "Petrodollar" agreement (where oil was priced strictly in USD), the US Dollar became the world\'s default middleman. If Brazil wants to buy microchips from China or oil from the UAE, they usually convert their local money into US Dollars first.',
      },
      {
        heading: 'The Catch',
        label: 'WEAPONIZED DOLLAR',
        body: 'Because nearly every international dollar transaction clears through US banks or uses SWIFT (a Western-controlled financial messaging system based in Belgium), the US government can weaponize the dollar. If the US sanctions a country, that country is locked out of global trade overnight. Furthermore, when the US Federal Reserve raises interest rates to fight American inflation, the dollar gets more expensive, accidentally crashing the economies of developing nations who owe debt in dollars.',
      },
    ],
  },
  {
    id: 'options',
    tab: '02 // Options',
    title: 'What is "De-Dollarization"? The 3 Real Options on the Table',
    blocks: [
      {
        label: 'OPTION 1',
        heading: 'Local Currency Settlement & BRICS Pay (The Realistic Fast Track)',
        body: 'Instead of creating a brand-new paper banknote, countries simply trade using their own money (Rupees, Yuan, Reais, Rubles). To do this without SWIFT, BRICS is building BRICS Pay and DCMS (Decentralized Cross-Border Messaging System), alongside the BRICS CBDC Bridge (proposed for the 2026 India Summit) to connect national digital currencies like China\'s e-CNY, India\'s e-Rupee, and Brazil\'s Drex.',
      },
      {
        label: 'OPTION 2',
        heading: '"The Unit" — A Gold & Commodity-Backed Trade Currency (The Middle Ground)',
        body: 'A digital settlement unit used only by central banks and large corporations for cross-border trade (ordinary citizens still use their normal currency at the grocery store). A widely discussed blueprint anchors 40% of its value to physical gold stored in national vaults and 60% to a basket of BRICS national currencies.',
      },
      {
        label: 'OPTION 3',
        heading: 'A Single Unified BRICS Currency like the Euro (The Radical Option)',
        body: 'Scrapping national currencies for a single shared currency with one BRICS Central Bank. Why is this hard? Because for the Euro to work, countries had to give up control over their own budgets and interest rates — and giant rivals like China and India will never hand control of their money printer to each other.',
      },
    ],
  },
  {
    id: 'roadblocks',
    tab: '03 // Roadblocks',
    title: 'The 3 Biggest Roadblocks Your Committee Must Solve',
    blocks: [
      {
        label: 'ROADBLOCK 1',
        heading: 'The Trade Imbalance Trap ("The Rupee Trap")',
        body: 'Russia sells massive amounts of oil to India, and India pays in Indian Rupees. Sounds great — until Russia realizes it now sits on $40 billion worth of Indian Rupees in Indian banks because Russia doesn\'t buy an equal amount of Indian goods! How do you make local currencies convertible when trade isn\'t balanced 50/50?',
      },
      {
        label: 'ROADBLOCK 2',
        heading: 'China vs. India Rivalry',
        body: "China's economy is larger than all other BRICS members combined. India, Brazil, and Indonesia want to reduce US Dollar dominance, not replace it with Chinese Yuan dominance.",
      },
      {
        label: 'ROADBLOCK 3',
        heading: 'Sanctioned Hawks vs. USD-Pegged Moderates',
        body: 'Russia and sanctioned partners (like Belarus and Cuba) want to burn the SWIFT system to the ground tomorrow. Meanwhile, Saudi Arabia and the UAE peg their currencies to the US Dollar and hold trillions in Western investments. How do you write a resolution that both sides will sign?',
      },
    ],
  },
];

export interface RopEntry {
  id: string;
  term: string;
  category: string;
  summary: string;
  detail: string[];
}

export const ROP: RopEntry[] = [
  {
    id: 'roll',
    term: 'Roll Call',
    category: 'Opening',
    summary: 'Respond "Present" or "Present and Voting".',
    detail: [
      '"Present": you may abstain during final voting on resolutions.',
      '"Present and Voting": you MUST vote For or Against; you cannot abstain.',
    ],
  },
  {
    id: 'gsl',
    term: 'General Speakers List (GSL)',
    category: 'Debate',
    summary: 'The default state of the committee. Speak on the general topic for a set time (e.g. 90 seconds).',
    detail: [
      'If you have time left over, you must Yield it:',
      'Yield to the Chair: your remaining time disappears.',
      'Yield to another Delegate: another country gets your remaining seconds to speak.',
      'Yield to Questions/Comments: other delegates can ask you brief questions.',
    ],
  },
  {
    id: 'mod',
    term: 'Moderated Caucus ("Mod")',
    category: 'Debate',
    summary: 'A fast-paced debate on a specific sub-topic. No yields are allowed.',
    detail: [
      'Example motion: "A 10-minute Moderated Caucus with 45-second speaking time on Gold-Backed Settlement Mechanisms".',
      'Total time and individual speaker time are both tracked on the BRICS-NET timer.',
    ],
  },
  {
    id: 'unmod',
    term: 'Unmoderated Caucus ("Unmod")',
    category: 'Debate',
    summary: 'Leave your seat for 10–20 minutes to form blocs, trade resources, and write Working Papers.',
    detail: [
      'Delegates walk around, form alliances (blocs), trade resources on the BRICS-Net terminal, and write Working Papers.',
    ],
  },
  {
    id: 'privilege',
    term: 'Point of Personal Privilege',
    category: 'Points',
    summary: "You can't hear the speaker, the room is freezing, or the projector is blocked.",
    detail: ['Can be raised anytime — it is the only point that may interrupt a speaker (for audibility/comfort).'],
  },
  {
    id: 'order',
    term: 'Point of Order',
    category: 'Points',
    summary: 'The Chair or another delegate made a mistake in the Rules of Procedure.',
    detail: ['Can be raised anytime.'],
  },
  {
    id: 'inquiry',
    term: 'Point of Parliamentary Inquiry',
    category: 'Points',
    summary: 'Ask the Chair a question about how the rules work.',
    detail: ['Can be raised anytime.'],
  },
  {
    id: 'wp',
    term: 'Working Paper',
    category: 'Documents',
    summary: 'Brainstormed ideas written by a bloc; does not need strict formatting yet.',
    detail: ['Step 1 of 2 on the road to a resolution.'],
  },
  {
    id: 'dr',
    term: 'Draft Resolution',
    category: 'Documents',
    summary: 'Approved by the Chair to be presented to the room. Written as one long sentence.',
    detail: [
      'Preambulatory Clauses: italicized headers explaining why we are here and past history, ending in commas.',
      'Operative Clauses: numbered action steps explaining what the committee is actively building, ending in semicolons.',
    ],
  },
];

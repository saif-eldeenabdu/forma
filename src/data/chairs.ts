import type { ChairProfile } from '../lib/types';

export const CHAIR_PROFILES: Record<string, ChairProfile> = {
  judy: {
    name: 'Judy Kam Nakch',
    title: 'CHAIR // NDB SUPREME GOVERNOR',
    photoUrl: '/judy.png',
    bio: 'Welcome to the committee. I am Judy, and I will be serving as your Chair for this conference. I look forward to ensuring this is a memorable and highly productive session. If you require any procedural assistance or guidance, please do not hesitate to ask.',
    passiveName: 'The NDB Sovereign Yield',
    passiveDesc: 'Quiet authority to reward exceptional diplomacy with institutional gold grants.',
    powerUp1Name: 'Gold-Backed Liquidity Facility',
    powerUp1Desc: "Injects $2,500,000 into a delegation's Sovereign Reserves and spikes the global GOLD index by +12%.",
    powerUp2Name: 'Hegemonic Fiat Penalty',
    powerUp2Desc: 'Deducts $1,000,000 from a delegation for systemic over-reliance on the US Dollar.',
  },
  saif: {
    name: 'Saif-Eldeen Abdulaty',
    title: 'CHAIR // DIRECTOR OF BRICS CLEAR & MARKET OPERATIONS',
    photoUrl: '/saif.png',
    bio: 'Welcome everyone, I am Saif, and I am highly anticipating chairing this session. A tremendous amount of preparation has gone into building this simulation, and I expect an exceptional standard of debate from all delegations.',
    passiveName: 'Clearinghouse Authority',
    passiveDesc: 'Absolute control over market volatility and clearing access on the NDB Sovereign Exchange.',
    powerUp1Name: 'Systemic Margin Call & Rebalancing',
    powerUp1Desc: 'Seizes 20% of liquid reserves from the wealthiest delegation to prevent bankrupt delegations from defaulting.',
    powerUp2Name: 'Cross-Border Settlement Shock',
    powerUp2Desc: 'Market override that crashes US Treasury bonds (UST) by -15% and artificially surges BRICS Pay adoption.',
  },
};

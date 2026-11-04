import { memo, useState, useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HelpCircle, X } from 'lucide-react';

export type TabKey = 'terminal' | 'floor' | 'exchange' | 'trade' | 'comms' | 'dossiers' | 'dais' | 'gossip';

interface HelpSection {
  title: string;
  body: ReactNode;
}

interface TabHelpData {
  title: string;
  kicker: string;
  sections: HelpSection[];
}

export const TAB_HELP_CONTENT: Record<TabKey, TabHelpData> = {
  terminal: {
    kicker: 'TERMINAL // DASHBOARD GUIDE',
    title: 'How the Live Dashboard Works',
    sections: [
      {
        title: 'What is this page?',
        body: (
          <p>
            Think of this screen as the live scoreboard for our committee. Everything you do in debate changes these numbers.
          </p>
        ),
      },
      {
        title: 'Top Scoreboard',
        body: (
          <p>
            Our main goal is to lower <strong className="text-gold">US Dollar Dominance</strong> (starts at 58.4%) and raise <strong className="text-emerald">BRICS Confidence</strong> and <strong className="text-emerald">BRICS Pay</strong>. When the committee cooperates and passes good directives, the US Dollar drops and BRICS numbers turn green.
          </p>
        ),
      },
      {
        title: 'Currency Table (Left)',
        body: (
          <p>
            Shows how strong each country's money is. Great speeches and smart deals make your currency go up; sanctions make it drop.
          </p>
        ),
      },
      {
        title: 'Timer & Speakers List (Right)',
        body: (
          <p>
            Shows who is currently speaking, how much time is left, and who is next in line.
          </p>
        ),
      },
    ],
  },
  floor: {
    kicker: 'FLOOR // PROCEDURE GUIDE',
    title: 'How the Floor & Speaking Bids Work',
    sections: [
      {
        title: 'Log In First',
        body: (
          <p>
            Click the top-right Delegation button and enter your <strong className="text-gold">4-digit Country PIN</strong> from the Chairs to unlock your buttons.
          </p>
        ),
      },
      {
        title: 'Bidding to Speak (GSL Auction)',
        body: (
          <p>
            Instead of raising your placard for free to join the General Speakers' List, you bid cash from your $10,000,000 reserves. Higher bids move you to the top of the speaking line!
          </p>
        ),
      },
      {
        title: 'Proposing Motions',
        body: (
          <p>
            Use the form here to propose a Moderated Caucus (seated debate on a sub-topic) or an Unmoderated Caucus (getting up to talk, trade, and write directives).
          </p>
        ),
      },
      {
        title: 'Personal Directives',
        body: (
          <p>
            Send secret actions to the Chairs to use your country's real-world power behind the scenes (like Egypt banning US Dollars in the Suez Canal).
          </p>
        ),
      },
    ],
  },
  exchange: {
    kicker: 'EXCHANGE // MARKET GUIDE',
    title: 'How the Stock Market Works',
    sections: [
      {
        title: 'Your Money',
        body: (
          <p>
            Every country starts with <strong className="text-gold">$10,000,000</strong> in cash reserves. You use this tab during Unmoderated Caucuses (when the market is <strong className="text-emerald">OPEN</strong>) to grow your money.
          </p>
        ),
      },
      {
        title: 'The 5 Items You Can Trade',
        body: (
          <ul className="space-y-1.5 text-xs text-ivory/85">
            <li><strong className="text-gold">GOLD:</strong> Goes up when there is a crisis or when the US Dollar drops.</li>
            <li><strong className="text-crimson">UST (US Bonds):</strong> The US Dollar's health bar. Crashes when the committee passes anti-dollar plans.</li>
            <li><strong className="text-emerald">URALS (Oil):</strong> Moves when oil countries make deals or get sanctioned.</li>
            <li><strong className="text-gold">AGRI (Food/Grain):</strong> Moves when wheat, soy, and rice are traded.</li>
            <li><strong className="text-emerald">TECH (Battery Metals):</strong> Goes up when tech treaties or digital payment apps are built.</li>
          </ul>
        ),
      },
      {
        title: 'Which Button Do I Click?',
        body: (
          <ul className="space-y-1.5 text-xs text-ivory/85">
            <li><strong className="text-emerald font-mono">[BUY]:</strong> Click this if you think the item's price will go <strong className="text-emerald">UP</strong>.</li>
            <li><strong className="text-gold font-mono">[SELL]:</strong> Click this to sell items you own and turn them back into cash.</li>
            <li><strong className="text-crimson font-mono">[SHORT]:</strong> Click this to bet that an item will <strong className="text-crimson">CRASH</strong>. <em>(Tip: Short UST right before your bloc announces a plan to ditch the US Dollar to make easy millions!)</em></li>
          </ul>
        ),
      },
    ],
  },
  trade: {
    kicker: 'TRADE // SETTLEMENT GUIDE',
    title: 'How Country-to-Country Trading Works',
    sections: [
      {
        title: 'Why Trade?',
        body: (
          <p>
            Trading resources with other countries without using the US Dollar helps your bloc win and lowers US Dollar dominance on the main board.
          </p>
        ),
      },
      {
        title: '2-Step Approval (No Fake Trades)',
        body: (
          <ol className="list-decimal list-inside space-y-1 text-xs text-ivory/85">
            <li>You send a trade offer to another country.</li>
            <li>That country must click <strong className="text-emerald">Accept</strong> in their "Incoming Trade Requests" inbox at the top of this page.</li>
            <li>Once both of you agree, the Chairs approve it and put it on the big screen.</li>
          </ol>
        ),
      },
      {
        title: 'Grain Exchange',
        body: (
          <p>
            Russia (Wheat), Brazil (Soybeans), and India (Rice) control the food supply. Buy grain using <strong className="text-emerald">BRICS Pay</strong> for a 0% fee (using US Dollars costs an extra 8% penalty!).
          </p>
        ),
      },
      {
        title: 'Wire Emergency Bailout',
        body: (
          <p>
            Send cash to an ally who went bankrupt (<strong className="text-crimson">$0 / GGs</strong>) to bring them back into the game.
          </p>
        ),
      },
    ],
  },
  comms: {
    kicker: 'COMMS // DIPLOMATIC WIRE GUIDE',
    title: 'How Secret Chats & Leaks Work',
    sections: [
      {
        title: 'Private Messaging',
        body: (
          <p>
            Message any country in the room privately or talk to everyone in the Global Wire instead of passing paper notes.
          </p>
        ),
      },
      {
        title: 'Leak to Press (Betrayal Button)',
        body: (
          <p>
            See the red <strong className="text-crimson font-mono">[LEAK TO PRESS]</strong> button on messages people send you? Clicking it anonymously exposes their message on the big projector screen!
          </p>
        ),
      },
      {
        title: 'Watch Out for Cyber Attacks',
        body: (
          <p>
            Be careful what you type—if a Cyber Attack crisis hits, recent private messages might get exposed to the whole room.
          </p>
        ),
      },
    ],
  },
  dossiers: {
    kicker: 'DOSSIERS // COUNTRY PROFILES GUIDE',
    title: 'How to Use Country Profiles',
    sections: [
      {
        title: 'Your Cheat Sheet',
        body: (
          <p>
            Click your country to see your economy size, what resources you sell, how much you rely on the US Dollar, and tips on what you should argue for in speeches.
          </p>
        ),
      },
      {
        title: 'Spy on Others',
        body: (
          <p>
            You can also view other countries' cards to see who has the resources you need for a trade or alliance.
          </p>
        ),
      },
    ],
  },
  dais: {
    kicker: 'THE DAIS // EXECUTIVE LEADERSHIP GUIDE',
    title: 'Meet Your Chairs & Their Powers',
    sections: [
      {
        title: 'Chair Power-Ups',
        body: (
          <p>
            Your Chairs (Judy and Saif-Eldeen) have special abilities that directly affect your money and the stock market.
          </p>
        ),
      },
      {
        title: "Judy's Powers",
        body: (
          <p>
            Can reward great speeches with a <strong className="text-gold">+$2,500,000 Gold Grant</strong>, or fine delegates <strong className="text-crimson">-$1,000,000</strong> for giving lazy speeches or defending the US Dollar too much.
          </p>
        ),
      },
      {
        title: "Saif's Powers",
        body: (
          <p>
            Controls the stock market prices and can trigger a <strong className="text-crimson">20% Wealth Tax</strong> on the richest country to bail out bankrupt countries.
          </p>
        ),
      },
    ],
  },
  gossip: {
    kicker: 'GOSSIP BOX // ANONYMOUS WIRE GUIDE',
    title: 'How the Gossip Box Works',
    sections: [
      {
        title: '100% Anonymous',
        body: (
          <p>
            Anyone (delegates or visiting volunteers) can submit funny committee moments or gossip here without logging in.
          </p>
        ),
      },
      {
        title: 'Chairs Only',
        body: (
          <p>
            Nobody else on the website can read submitted gossips—they go straight into a locked vault that only Judy and Saif can see.
          </p>
        ),
      },
    ],
  },
};

export const TabHelpButton = memo(function TabHelpButton({ tabKey }: { tabKey: TabKey }) {
  const [open, setOpen] = useState(false);
  const data = TAB_HELP_CONTENT[tabKey];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!data) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 border border-gold/60 bg-gold/10 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-gold hover:bg-gold hover:text-obsidian transition-colors shrink-0"
        title="Open Guide for this Tab"
      >
        <HelpCircle size={12} className="text-gold group-hover:text-obsidian" />
        <span>[ ? HELP ]</span>
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-obsidian/85 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={data.title}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="relative w-full max-w-xl max-h-[85vh] flex flex-col border border-gold/50 bg-[#0A0D0C] shadow-[0_0_50px_rgba(212,175,55,0.12)] text-ivory z-10"
            >
              {/* Corner crosshairs */}
              <span className="xh -left-[4px] -top-[7px]">+</span>
              <span className="xh -right-[4px] -top-[7px]">+</span>
              <span className="xh -bottom-[7px] -left-[4px]">+</span>
              <span className="xh -bottom-[7px] -right-[4px]">+</span>

              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-hairline bg-[#161C19] px-4 py-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-gold">{data.kicker}</p>
                  <h3 className="font-serif text-lg font-bold text-ivory leading-tight mt-0.5">{data.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1 text-sage hover:text-ivory hover:border-gold border border-transparent transition-colors"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto p-4 sm:p-5 space-y-3 font-sans text-xs">
                {data.sections.map((sec, idx) => (
                  <div key={idx} className="border border-hairline bg-[#111614] p-3.5 space-y-1">
                    <h4 className="font-mono text-[11px] uppercase tracking-wider text-gold font-bold">
                      • {sec.title}
                    </h4>
                    <div className="text-ivory/85 leading-relaxed text-xs">
                      {sec.body}
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between border-t border-hairline bg-[#161C19] px-4 py-2.5">
                <span className="font-mono text-[10px] uppercase text-sage">
                  MUN 2026 // DELEGATE INTELLIGENCE
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn btn-gold !py-1 !px-3 font-mono text-xs uppercase tracking-wider font-bold"
                >
                  [ ✕ GOT IT ]
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
});

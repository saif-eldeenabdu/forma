import { useState, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PageHeader, Panel } from '../components/ui';
import { BookOpen, DollarSign, TrendingUp, FileText, Gavel, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

type SubTabId = 'topic' | 'basics' | 'trading' | 'directives' | 'rules';

interface SubTab {
  id: SubTabId;
  label: string;
  icon: typeof BookOpen;
}

const SUB_TABS: SubTab[] = [
  { id: 'topic', label: '1. The Topic (Plain English)', icon: BookOpen },
  { id: 'basics', label: '2. Website & Money Basics', icon: DollarSign },
  { id: 'trading', label: '3. Stock Market & Trading', icon: TrendingUp },
  { id: 'directives', label: '4. Directives (No Resolutions!)', icon: FileText },
  { id: 'rules', label: '5. MUN Rules for Beginners', icon: Gavel },
];

export default function Briefing() {
  const [activeTab, setActiveTab] = useState<SubTabId>('topic');

  return (
    <div className="space-y-4">
      <PageHeader kicker="Delegate Manual // Operational Playbook" title="Guide // How to Play">
        <span className="font-mono text-xs uppercase text-gold tracking-wider border border-gold/40 bg-gold/10 px-3 py-1">
          Beginner-Friendly Field Guide
        </span>
      </PageHeader>

      {/* Sub-tab Navigation Bar */}
      <div role="tablist" className="flex flex-wrap gap-px border border-hairline bg-hairline">
        {SUB_TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] transition-all relative ${
                isActive
                  ? 'bg-gold text-obsidian font-bold shadow-[0_0_20px_rgba(212,175,55,0.25)]'
                  : 'bg-charcoal text-sage hover:text-ivory hover:bg-charcoal/80'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-obsidian' : 'text-gold'} />
              <span>{t.label}</span>
              {isActive && (
                <motion.span
                  layoutId="guide-active-tab"
                  className="absolute bottom-0 inset-x-0 h-0.5 bg-obsidian"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="space-y-4"
        >
          {activeTab === 'topic' && <TopicTab />}
          {activeTab === 'basics' && <BasicsTab />}
          {activeTab === 'trading' && <TradingTab />}
          {activeTab === 'directives' && <DirectivesTab />}
          {activeTab === 'rules' && <RulesTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ----------------- SUB-TAB 1: 1. THE TOPIC (PLAIN ENGLISH) ----------------- */
const TopicTab = memo(function TopicTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card 1 */}
      <Panel title="Card 1 // What is the Problem with the US Dollar?" tone="crimson" bodyClass="p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-crimson">
          <AlertTriangle size={16} />
          <span className="font-mono text-xs font-bold uppercase tracking-wider">The Weaponized Dollar</span>
        </div>
        <ul className="space-y-2.5 text-xs text-ivory/85 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-crimson font-bold mt-0.5">•</span>
            <span>
              Right now, the US Dollar is the default money of the world. Even when Brazil buys oil from the UAE, they usually convert their money into US Dollars and use Western banks (called <strong className="text-ivory">SWIFT</strong>) to pay.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-crimson font-bold mt-0.5">•</span>
            <span>
              Because everyone uses the dollar, the United States has massive power. If the US gets mad at a country, it can block them from using dollars or freeze their bank accounts overnight.
            </span>
          </li>
        </ul>
      </Panel>

      {/* Card 2 */}
      <Panel title="Card 2 // What is Our Goal in BRICS?" tone="gold" bodyClass="p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-gold">
          <CheckCircle2 size={16} />
          <span className="font-mono text-xs font-bold uppercase tracking-wider">De-Dollarization Mission</span>
        </div>
        <ul className="space-y-2.5 text-xs text-ivory/85 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-gold font-bold mt-0.5">•</span>
            <span>
              <strong className="text-ivory">BRICS</strong> is a group of emerging countries (like Brazil, Russia, India, China, South Africa, Saudi Arabia, Egypt, and partners) that want to stop relying on the US Dollar. This is called <strong className="text-gold">De-Dollarization</strong>.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold font-bold mt-0.5">•</span>
            <span>
              Your job is to debate and pass plans (<strong className="text-ivory">Directives</strong>) to build a new payment system so the West can never freeze your money again.
            </span>
          </li>
        </ul>
      </Panel>

      {/* Card 3 */}
      <Panel title="Card 3 // The 3 Solutions You Can Argue For" bodyClass="p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-emerald">
          <ShieldAlert size={16} />
          <span className="font-mono text-xs font-bold uppercase tracking-wider">Key Strategic Solutions</span>
        </div>
        <ul className="space-y-2.5 text-xs text-ivory/85 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-emerald font-bold mt-0.5">1.</span>
            <span>
              <strong className="text-emerald">BRICS Pay (Digital CashApp for Countries):</strong> Instead of using US Dollars or SWIFT, countries pay each other in their own local money (like Rupees or Yuan) using a new digital app called <strong className="text-ivory">BRICS Pay</strong>.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold font-bold mt-0.5">2.</span>
            <span>
              <strong className="text-gold">A Gold-Backed BRICS Currency ("The Unit"):</strong> Creating a new shared trade currency backed 40% by real physical gold and 60% by BRICS local currencies so everyone trusts it.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ivory font-bold mt-0.5">3.</span>
            <span>
              <strong className="text-ivory">BRICS Clear (Our Own Bank Vault):</strong> Building an independent BRICS bank vault so the US and Europe can never freeze a member country's savings.
            </span>
          </li>
        </ul>
      </Panel>
    </div>
  );
});

/* ----------------- SUB-TAB 2: 2. WEBSITE & MONEY BASICS ----------------- */
const BasicsTab = memo(function BasicsTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card 1 */}
      <Panel title="Card 1 // Your 4-Digit PIN & $10,000,000 Reserves" tone="gold" bodyClass="p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-gold">
          <DollarSign size={16} />
          <span className="font-mono text-xs font-bold uppercase tracking-wider">Authentication & Capital</span>
        </div>
        <ul className="space-y-2.5 text-xs text-ivory/85 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-gold font-bold mt-0.5">•</span>
            <span>
              At Roll Call, the Chairs will give you a <strong className="text-gold">4-digit PIN</strong> for your country. Click the top-right Delegation button to log in.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold font-bold mt-0.5">•</span>
            <span>
              You start with <strong className="text-gold font-mono">$10,000,000</strong> in cash reserves (shown at the top of your screen).
            </span>
          </li>
        </ul>
      </Panel>

      {/* Card 2 */}
      <Panel title='Card 2 // Going Bankrupt ("GGs" Rule)' tone="crimson" bodyClass="p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-crimson">
          <AlertTriangle size={16} />
          <span className="font-mono text-xs font-bold uppercase tracking-wider">Default Risk (GGs)</span>
        </div>
        <ul className="space-y-2.5 text-xs text-ivory/85 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-crimson font-bold mt-0.5">•</span>
            <span>
              You spend your cash reserves when you bid for speaking time, invest in the stock market, or get hit by sanctions/fines.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-crimson font-bold mt-0.5">•</span>
            <span>
              <strong className="text-crimson">Warning:</strong> If your cash hits <strong className="text-crimson">$0</strong>, your country goes bankrupt (<strong className="text-crimson">SOVEREIGN DEFAULT // GGs</strong>). Your trading and speaking buttons will lock until you convince a richer country to send you money using the <strong className="text-gold">Wire Emergency Bailout</strong> box on the Trade tab!
            </span>
          </li>
        </ul>
      </Panel>

      {/* Card 3 */}
      <Panel title="Card 3 // How to Win the Simulation" bodyClass="p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-emerald">
          <CheckCircle2 size={16} />
          <span className="font-mono text-xs font-bold uppercase tracking-wider">Victory Conditions</span>
        </div>
        <ul className="space-y-2.5 text-xs text-ivory/85 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-emerald font-bold mt-0.5">•</span>
            <span>
              Work with your allies to push the <strong className="text-gold">Global USD Reserve Share</strong> down on the main projector while growing your country's wealth on the Exchange and passing strong Directives.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald font-bold mt-0.5">•</span>
            <span>
              Keep your liquid reserves healthy, trade smart on bilateral desks, and defend against Western secondary sanctions.
            </span>
          </li>
        </ul>
      </Panel>
    </div>
  );
});

/* ----------------- SUB-TAB 3: 3. STOCK MARKET & TRADING ----------------- */
const TradingTab = memo(function TradingTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Card 1 */}
      <Panel title="Card 1 // The Stock Market (EXCHANGE Tab)" tone="gold" bodyClass="p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-hairline pb-2">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-gold">NDB Sovereign Exchange</span>
          <span className="font-mono text-[10px] text-emerald bg-emerald/10 border border-emerald/30 px-2 py-0.5">UNMOD ACTIVE</span>
        </div>
        <p className="text-xs text-ivory/85 leading-relaxed">
          When the Chairs open the market during Unmoderated Caucuses, you can make millions for your country by trading 5 items: <strong className="text-gold">GOLD</strong>, <strong className="text-crimson">UST</strong> (US Bonds), <strong className="text-emerald">URALS</strong> (Oil), <strong className="text-gold">AGRI</strong> (Food), and <strong className="text-emerald">TECH</strong> (Metals).
        </p>
        <div className="space-y-2 pt-1">
          <p className="font-mono text-[11px] font-bold uppercase text-gold">How to Make Money:</p>
          <ul className="space-y-2 text-xs text-ivory/85 leading-relaxed pl-1">
            <li className="flex items-start gap-2">
              <span className="font-mono text-emerald font-bold shrink-0">[BUY]</span>
              <span>Click <strong className="text-emerald">BUY</strong> before good news hits that item (e.g., buy <strong className="text-gold">GOLD</strong> or <strong className="text-emerald">TECH</strong> before passing a BRICS tech deal).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-gold font-bold shrink-0">[SELL]</span>
              <span>Click <strong className="text-gold">SELL</strong> when the price goes up to take your cash profit.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-crimson font-bold shrink-0">[SHORT]</span>
              <span>Click <strong className="text-crimson">SHORT</strong> to bet <em>against</em> an item. If you short <strong className="text-crimson">UST</strong> (US Bonds) and the committee passes an anti-dollar directive that crashes the US Dollar, you make huge profits!</span>
            </li>
          </ul>
        </div>
      </Panel>

      {/* Card 2 */}
      <Panel title="Card 2 // Country-to-Country Deals (TRADE Tab)" bodyClass="p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-hairline pb-2">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-ivory">Bilateral Settlement & Grain</span>
          <span className="font-mono text-[10px] text-gold bg-gold/10 border border-gold/30 px-2 py-0.5">0% FEE PROTOCOL</span>
        </div>
        <ul className="space-y-2.5 text-xs text-ivory/85 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-gold font-bold mt-0.5">•</span>
            <span>
              Propose direct resource or currency trades with other delegates, or buy Wheat, Soybeans, and Rice on the <strong className="text-gold">Grain Exchange</strong>.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald font-bold mt-0.5">•</span>
            <span>
              <strong className="text-emerald">Remember:</strong> After you send a trade to another delegate, tell them to open their <strong className="text-ivory">Trade Tab</strong> and click <strong className="text-emerald">Accept</strong> so it goes to the Chairs!
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-crimson font-bold mt-0.5">•</span>
            <span>
              <strong className="text-crimson">Barter Crisis Mode:</strong> If a crisis crashes global banks, money freezes! You will have to trade physical items (like oil, gold, cattle, or grapevines) to survive.
            </span>
          </li>
        </ul>
      </Panel>
    </div>
  );
});

/* ----------------- SUB-TAB 4: 4. DIRECTIVES (NO RESOLUTIONS!) ----------------- */
const DirectivesTab = memo(function DirectivesTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Card 1 */}
      <Panel title="Card 1 // Committee Directives (Public Bloc Plans)" tone="gold" bodyClass="p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-gold">
          <FileText size={16} />
          <span className="font-mono text-xs font-bold uppercase tracking-wider">Fast Action-Oriented Directives</span>
        </div>
        <ul className="space-y-2 text-xs text-ivory/85 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-gold font-bold mt-0.5">•</span>
            <span>
              We do <strong className="text-crimson">NOT</strong> write long UN resolutions or preambulatory clauses in this committee. Instead, blocs write short, fast <strong className="text-gold">Committee Directives</strong> to take action together.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold font-bold mt-0.5">•</span>
            <span>
              <strong className="text-ivory">What to include:</strong> A title, Sponsors (writers), Signatories (supporters), and a numbered list of exact actions (Who is doing it? How much does it cost from your reserves? How does it replace the US Dollar?).
            </span>
          </li>
        </ul>
        <div className="border border-gold/30 bg-gold/5 p-3 rounded text-xs font-mono">
          <span className="text-gold font-bold block mb-1">Example:</span>
          <p className="text-ivory/90 italic">
            "1. Pools $5,000,000 from participating nations to launch the BRICS Clear vault in Dubai; 2. Mandates that all BRICS oil trades use BRICS Pay instead of US Dollars."
          </p>
        </div>
      </Panel>

      {/* Card 2 */}
      <Panel title="Card 2 // Personal Financial Directives (Secret Moves)" bodyClass="p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-ivory">
          <Gavel size={16} />
          <span className="font-mono text-xs font-bold uppercase tracking-wider">Covert Sovereign Directives</span>
        </div>
        <ul className="space-y-2 text-xs text-ivory/85 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-emerald font-bold mt-0.5">•</span>
            <span>
              Want to make a sneaky move by yourself? Submit a <strong className="text-gold">Personal Directive</strong> on the <strong className="text-ivory">FLOOR</strong> tab directly to the Chairs.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald font-bold mt-0.5">•</span>
            <span>
              Be specific about what resource or power your country is using (e.g., <em className="text-sage">"Saudi Arabia begins accepting Chinese Yuan for 30% of oil exports"</em> or <em className="text-sage">"Egypt switches Suez Canal tolls from US Dollars to BRICS Pay"</em>).
            </span>
          </li>
        </ul>
        <div className="border border-hairline bg-charcoal/50 p-3 rounded text-xs font-mono text-sage">
          <span className="text-emerald font-bold block mb-1">Confidentiality:</span>
          Chair Eyes Only. Approved covert moves trigger immediate live economic impacts and breaking wires.
        </div>
      </Panel>
    </div>
  );
});

/* ----------------- SUB-TAB 5: 5. MUN RULES FOR BEGINNERS ----------------- */
const RulesTab = memo(function RulesTab() {
  return (
    <div className="space-y-4">
      <Panel title="5. MUN Rules & Procedure // Quick Cheat Sheet" bodyClass="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Roll Call & GSL */}
          <div className="border border-hairline bg-[#111614] p-4 space-y-2">
            <h4 className="font-mono text-xs font-bold uppercase text-gold tracking-wider">• Roll Call</h4>
            <p className="text-xs text-ivory/85 leading-relaxed">
              Say <strong className="text-ivory">"Present"</strong> (you can abstain on votes) or <strong className="text-gold">"Present and Voting"</strong> (you must vote Yes or No; no abstaining).
            </p>
          </div>

          <div className="border border-hairline bg-[#111614] p-4 space-y-2">
            <h4 className="font-mono text-xs font-bold uppercase text-gold tracking-wider">• General Speakers List (GSL)</h4>
            <p className="text-xs text-ivory/85 leading-relaxed">
              General speeches (usually 60–90 seconds). Bid cash on the <strong className="text-gold">FLOOR</strong> tab to move up the speaking line.
            </p>
          </div>

          {/* Moderated Caucus */}
          <div className="border border-hairline bg-[#111614] p-4 space-y-2">
            <h4 className="font-mono text-xs font-bold uppercase text-gold tracking-wider">• Moderated Caucus ("Mod")</h4>
            <p className="text-xs text-ivory/85 leading-relaxed">
              Everyone stays in their seats and raises placards to give short speeches (30–45 seconds) on one specific topic.
            </p>
            <div className="border-l-2 border-gold bg-charcoal/60 p-2 font-mono text-[11px] text-gold italic">
              How to say it: "The delegation of [Country] motions for a 10-minute Moderated Caucus, 45-second speaking time, on [Topic]."
            </div>
          </div>

          {/* Unmoderated Caucus */}
          <div className="border border-hairline bg-[#111614] p-4 space-y-2">
            <h4 className="font-mono text-xs font-bold uppercase text-gold tracking-wider">• Unmoderated Caucus ("Unmod")</h4>
            <p className="text-xs text-ivory/85 leading-relaxed">
              You get out of your seat for 10–15 minutes to talk freely, form alliances, trade on your phone, and write Directives.
            </p>
            <div className="border-l-2 border-emerald bg-charcoal/60 p-2 font-mono text-[11px] text-emerald italic">
              How to say it: "The delegation of [Country] motions for a 15-minute Unmoderated Caucus to form blocs and write directives."
            </div>
          </div>
        </div>

        {/* 4 Points */}
        <div className="border border-hairline bg-[#111614] p-4 space-y-3">
          <h4 className="font-mono text-xs font-bold uppercase text-gold tracking-wider">• 4 Points You Can Raise Anytime</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="border border-hairline/60 bg-charcoal/40 p-2.5">
              <span className="font-mono font-bold text-ivory block mb-1">Point of Personal Privilege</span>
              <p className="text-sage text-[11px]">You can't hear, the room is too cold, or you need the restroom.</p>
            </div>
            <div className="border border-hairline/60 bg-charcoal/40 p-2.5">
              <span className="font-mono font-bold text-ivory block mb-1">Point of Parliamentary Inquiry</span>
              <p className="text-sage text-[11px]">Ask the Chairs a question about the rules or how the website works.</p>
            </div>
            <div className="border border-hairline/60 bg-charcoal/40 p-2.5">
              <span className="font-mono font-bold text-ivory block mb-1">Point of Order</span>
              <p className="text-sage text-[11px]">Someone made a mistake with the rules or procedure.</p>
            </div>
            <div className="border border-hairline/60 bg-charcoal/40 p-2.5">
              <span className="font-mono font-bold text-ivory block mb-1">Point of Information</span>
              <p className="text-sage text-[11px]">Ask a speaker a question about their speech during yields.</p>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
});

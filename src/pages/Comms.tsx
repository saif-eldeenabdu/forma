import { useState, useMemo, type FormEvent } from 'react';
import { MessageSquare, Radio, Send, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useStore } from '../lib/store';
import { COUNTRIES, byName } from '../data/countries';
import { PageHeader, Panel } from '../components/ui';
import FreezeBanner from '../components/FreezeBanner';
import { TabHelpButton } from '../components/TabHelpButton';

const QUICK_PROMPTS = [
  'Propose mutual gold-backed currency swap',
  'Vote NO on US Dollar settlement motion',
  'Form emergency commodity pricing cartel',
  'Request immediate sovereign liquidity bailout',
  'Support transition to BRICS Pay tolls',
];

export default function Comms() {
  const { state, me, actions, bankrupt } = useStore();
  const [activeTarget, setActiveTarget] = useState<string>('GLOBAL');
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const cs = state.committeeState;
  const isBreached = !!cs.cyberAttackActive;

  // Filter messages for active conversation
  const messages = useMemo(() => {
    const all = state.backchannelMessages || [];
    if (activeTarget === 'GLOBAL') {
      return all.filter((m) => m.to === 'GLOBAL');
    }
    if (!me) return [];
    return all.filter(
      (m) =>
        (m.from === me && m.to === activeTarget) ||
        (m.from === activeTarget && m.to === me)
    );
  }, [state.backchannelMessages, activeTarget, me]);

  // Delegations list excluding self
  const counterparties = useMemo(() => {
    return COUNTRIES.filter(
      (c) =>
        c.name !== me &&
        (c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [me, searchTerm]);

  // Calculate unread count per country (only for me)
  const incomingMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (!me) return map;
    for (const m of state.backchannelMessages || []) {
      if (m.to === me) {
        map[m.from] = (map[m.from] || 0) + 1;
      }
    }
    return map;
  }, [state.backchannelMessages, me]);

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!me || bankrupt || !inputText.trim()) return;
    actions.sendBackchannelMessage({
      from: me,
      to: activeTarget,
      text: inputText.trim(),
    });
    setInputText('');
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputText(prompt);
  };

  const targetCountry = activeTarget === 'GLOBAL' ? null : byName(activeTarget);

  return (
    <div className="space-y-3 font-mono">
      <FreezeBanner />

      {isBreached && (
        <div className="flash-border border-2 border-crimson bg-crimson/20 p-3 text-center">
          <div className="flex items-center justify-center gap-2 text-crimson font-bold text-sm">
            <AlertTriangle size={16} className="animate-ping" />
            <span>CRITICAL ALERT: NSA / BRICS CYBER BREACH ACTIVE — ALL PRIVATE FREQUENCIES LEAKING TO TERMINAL</span>
            <AlertTriangle size={16} className="animate-ping" />
          </div>
        </div>
      )}

      <PageHeader
        kicker="Encrypted Channel // Diplomatic Comms"
        title="Diplomatic Back-Channels & Global Wire"
      >
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 border border-emerald/60 bg-emerald/10 px-2 py-0.5 text-[10px] uppercase text-emerald">
            <Radio size={11} className="animate-pulse" />
            End-To-End Encrypted
          </span>
          <span className="label">
            {activeTarget === 'GLOBAL' ? 'Global diplomatic wire' : `P2P // ${activeTarget}`}
          </span>
          <TabHelpButton tabKey="comms" />
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        {/* Left Sidebar: Counterparties & Global Channel */}
        <div className="space-y-3 lg:col-span-4 xl:col-span-3">
          <Panel title="Diplomatic Frequencies" bodyClass="p-0">
            {/* Global Wire Button */}
            <div className="p-2 border-b border-hairline">
              <button
                type="button"
                onClick={() => setActiveTarget('GLOBAL')}
                className={`w-full flex items-center justify-between p-2.5 text-xs transition-colors rounded ${
                  activeTarget === 'GLOBAL'
                    ? 'bg-gold text-obsidian font-bold shadow'
                    : 'bg-charcoal text-ivory hover:bg-charcoal/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Radio size={14} className={activeTarget === 'GLOBAL' ? 'text-obsidian' : 'text-gold'} />
                  <span>GLOBAL WIRE</span>
                </div>
                <span className={`text-[10px] uppercase tracking-wider ${activeTarget === 'GLOBAL' ? 'text-obsidian' : 'text-sage'}`}>
                  Public
                </span>
              </button>
            </div>

            {/* Counterparty Search */}
            <div className="p-2 border-b border-hairline">
              <input
                type="text"
                placeholder="Search delegations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="field !py-1 text-xs"
              />
            </div>

            {/* Counterparty Channels */}
            <div className="max-h-[500px] overflow-y-auto divide-y divide-hairline">
              {counterparties.map((c) => {
                const isSelected = activeTarget === c.name;
                const unread = incomingMap[c.name] || 0;
                const isFull = c.tier === 'FULL BRICS MEMBER';

                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setActiveTarget(c.name)}
                    className={`w-full flex items-center justify-between p-2.5 text-left transition-colors ${
                      isSelected
                        ? 'bg-gold/15 border-l-2 border-gold text-ivory'
                        : 'hover:bg-charcoal/60 text-sage hover:text-ivory'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold ${isSelected ? 'text-gold' : 'text-ivory'}`}>
                          {c.name}
                        </span>
                        <span className="tabular text-[10px] text-sage">[{c.code}]</span>
                      </div>
                      <span
                        className={`inline-block mt-0.5 text-[8px] uppercase tracking-wider ${
                          isFull ? 'text-gold/80' : 'text-emerald/80'
                        }`}
                      >
                        {isFull ? 'Full Member' : 'Partner'}
                      </span>
                    </div>

                    {unread > 0 && (
                      <span className="border border-gold bg-gold/20 px-1.5 py-0.2 text-[10px] font-bold text-gold rounded">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* Right Main Chat Area */}
        <div className="space-y-3 lg:col-span-8 xl:col-span-9">
          <Panel
            title={
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-gold" />
                <span>
                  {activeTarget === 'GLOBAL'
                    ? 'GLOBAL DIPLOMATIC WIRE // BROADCAST'
                    : `CABLE WITH ${activeTarget.toUpperCase()} [${targetCountry?.code || ''}]`}
                </span>
              </div>
            }
            right={
              me ? (
                <span className="text-[11px] text-gold">Authenticated: {me}</span>
              ) : (
                <span className="text-[11px] text-crimson">Unauthenticated Viewer</span>
              )
            }
            bodyClass="p-0 flex flex-col h-[600px]"
          >
            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-obsidian/40">
              {messages.length === 0 ? (
                <div className="grid h-full place-items-center text-center p-6 text-sage text-xs">
                  <div>
                    <Radio size={32} className="mx-auto mb-2 opacity-30 text-gold" />
                    <p className="font-bold uppercase tracking-wider text-ivory">Frequency Idle</p>
                    <p className="mt-1 max-w-sm">
                      {activeTarget === 'GLOBAL'
                        ? 'No messages broadcast on the Global Diplomatic Wire. Send an encrypted cable to begin.'
                        : `No direct communications recorded between your delegation and ${activeTarget}. Transmit a dispatch below.`}
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((m) => {
                  const mine = m.from === me;
                  const canLeak = !mine && activeTarget !== 'GLOBAL' && !m.leaked;

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded border p-3 ${
                          mine
                            ? 'border-gold/40 bg-gold/10 text-ivory'
                            : 'border-hairline bg-charcoal text-ivory'
                        }`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-3 text-[10px] text-sage">
                          <span className="font-bold text-gold">
                            {mine ? 'YOU' : m.from} {activeTarget === 'GLOBAL' && `→ ${m.to}`}
                          </span>
                          <span className="tabular">{new Date(m.createdAt).toLocaleTimeString()}</span>
                        </div>

                        <p className="text-xs leading-relaxed font-sans">{m.text}</p>

                        {m.leaked && (
                          <div className="mt-2 border border-crimson bg-crimson/20 px-2 py-0.5 text-[9px] uppercase font-bold text-crimson flex items-center gap-1.5">
                            <ShieldAlert size={11} />
                            LEAKED TO PRESS WIRE
                          </div>
                        )}

                        {canLeak && (
                          <div className="mt-2 border-t border-hairline/60 pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => actions.leakBackchannelMessage(m.id)}
                              className="border border-crimson/80 bg-crimson/15 px-2 py-1 text-[10px] uppercase font-bold text-crimson hover:bg-crimson hover:text-ivory transition-colors flex items-center gap-1.5"
                            >
                              <span>📢 LEAK TO PRESS</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Dispatch Prompts */}
            {me && !bankrupt && (
              <div className="border-t border-hairline bg-charcoal/40 p-2 overflow-x-auto flex gap-2">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickPrompt(prompt)}
                    className="shrink-0 border border-hairline bg-charcoal px-2 py-1 text-[10px] text-sage hover:text-ivory hover:border-gold/50 transition-colors"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <div className="border-t border-hairline p-3 bg-charcoal">
              {bankrupt ? (
                <div className="border border-crimson bg-crimson/20 p-3 text-center text-xs text-crimson font-bold">
                  💀 SOVEREIGN DEFAULT (GGs) // Diplomatic communications locked until treasury is bailed out.
                </div>
              ) : !me ? (
                <div className="border border-gold/40 bg-gold/10 p-3 text-center text-xs text-gold">
                  Authenticate your delegation PIN to transmit classified cables.
                </div>
              ) : (
                <form onSubmit={handleSend} className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Transmit cable to ${activeTarget === 'GLOBAL' ? 'Global Wire' : activeTarget}...`}
                    className="field flex-1 text-xs font-sans"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="btn btn-gold shrink-0 px-4 flex items-center gap-1.5 text-xs font-bold"
                  >
                    <Send size={12} />
                    <span>SEND</span>
                  </button>
                </form>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

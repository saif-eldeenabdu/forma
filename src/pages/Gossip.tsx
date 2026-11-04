import { useState, type FormEvent } from 'react';
import { Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useStore } from '../lib/store';
import { PageHeader, Panel } from '../components/ui';
import { TabHelpButton } from '../components/TabHelpButton';

export default function Gossip() {
  const { actions } = useStore();
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;
    actions.submitGossip(text);
    setMessage('');
    setSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader kicker="Anonymous Wire // Strict Discretion" title="Gossip Box">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-gold">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-ping" />
            CHAIR EYES ONLY // ZERO-LOGGING
          </span>
          <TabHelpButton tabKey="gossip" />
        </div>
      </PageHeader>

      <Panel title="Submit Anonymous Wire" tone="gold" bodyClass="p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between border-b border-hairline pb-3 text-xs text-sage">
            <span className="font-mono text-[11px] uppercase tracking-wider text-sage">
              Transmission Security: Encrypted • No Identity Tracked
            </span>
            <span className="font-mono text-[10px] text-ivory/50">
              {message.length} chars
            </span>
          </div>

          <div>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (submitted) setSubmitted(false);
              }}
              placeholder="Write your gossip here..."
              className="field w-full font-mono text-sm leading-relaxed text-ivory placeholder:text-sage/40 resize-y min-h-[140px]"
              autoFocus
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <div className="min-h-[24px]">
              {submitted && (
                <div className="flex items-center gap-2 font-mono text-xs text-emerald">
                  <CheckCircle2 size={15} className="text-emerald" />
                  <span className="font-bold">✓ Sent to the Chairs.</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!message.trim()}
              className="btn btn-gold flex items-center justify-center gap-2 px-6 py-2.5 font-mono text-xs uppercase tracking-widest disabled:opacity-40"
            >
              <Send size={13} />
              <span>SUBMIT GOSSIP</span>
            </button>
          </div>
        </form>
      </Panel>

      <div className="flex items-center gap-3 border border-hairline/60 bg-charcoal/40 p-3 text-[11px] text-sage">
        <ShieldAlert size={14} className="shrink-0 text-gold/80" />
        <p className="font-mono">
          Strictly anonymous. No delegate credentials or IP addresses are linked to this dispatch. Only the Executive Board (Chairs) can access submitted dispatches.
        </p>
      </div>
    </div>
  );
}

import { memo, useState } from 'react';
import { PageHeader } from '../components/ui';
import { TabHelpButton } from '../components/TabHelpButton';
import { useStore } from '../lib/store';
import { CHAIR_PROFILES } from '../data/chairs';
import type { ChairProfile } from '../lib/types';

const ACCENT: Record<string, { hex: string; label: string }> = {
  judy: { hex: '#D4AF37', label: 'NDB GOVERNOR OVERSIGHT' },
  saif: { hex: '#10B981', label: 'MARKET OPERATIONS' },
};

function Portrait({ src, name, color }: { src: string; name: string; color: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="h-48 w-40 shrink-0 border bg-[#161C19]" style={{ borderColor: color }}>
      {failed ? (
        <div className="grid h-full w-full place-items-center bg-slate-800 font-mono text-[10px] uppercase tracking-widest text-sage">
          No Image
        </div>
      ) : (
        <img src={src} alt={name} className="h-full w-full object-cover" onError={() => setFailed(true)} />
      )}
    </div>
  );
}

const Ability = ({ kind, name, desc, color }: { kind: string; name: string; desc: string; color: string }) => (
  <div className="border p-3" style={{ borderColor: color }}>
    <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em]">
      <span style={{ color }}>{kind}</span>
    </div>
    <p className="mt-1 font-mono text-sm font-bold text-ivory">{name}</p>
    <p className="mt-1 text-xs leading-relaxed text-sage">{desc}</p>
  </div>
);

const Dossier = memo(function Dossier({ id, p }: { id: string; p: ChairProfile }) {
  const color = ACCENT[id]?.hex ?? '#D4AF37';
  return (
    <section className="border border-hairline bg-[#0A0D0C]">
      <header className="flex items-center justify-between border-b border-hairline bg-[#161C19] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em]">
        <span style={{ color }}>Executive Dossier // {ACCENT[id]?.label}</span>
        <span className="text-sage">Ref {id.toUpperCase()}-01</span>
      </header>
      <div className="space-y-4 p-4">
        <div className="flex gap-4">
          <Portrait src={p.photoUrl} name={p.name} color={color} />
          <div className="min-w-0 space-y-2">
            <span className="inline-block border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider" style={{ borderColor: color, color }}>
              {p.title}
            </span>
            <h2 className="font-serif text-2xl leading-tight text-ivory">{p.name}</h2>
            <p className="font-mono text-[11px] uppercase tracking-wider text-sage">
              System Status: <span style={{ color }}>ARMED</span>
            </p>
          </div>
        </div>

        <div>
          <p className="label mb-1">Personal Memo</p>
          <blockquote className="border-l-2 bg-[#161C19] p-3 text-sm leading-relaxed text-sage" style={{ borderColor: color }}>
            {p.bio}
          </blockquote>
        </div>

        <div>
          <p className="label mb-1">Sovereign Authority Loadout</p>
          <div className="grid gap-2">
            <Ability kind="Passive" name={p.passiveName} desc={p.passiveDesc} color={color} />
            <Ability kind="Active 01" name={p.powerUp1Name} desc={p.powerUp1Desc} color={color} />
            <Ability kind="Active 02" name={p.powerUp2Name} desc={p.powerUp2Desc} color={color} />
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-crimson">
            WARNING: EXECUTABLE AT CHAIR DISCRETION VIA SECURE TERMINAL
          </p>
        </div>
      </div>
    </section>
  );
});

export default function Dais() {
  const { state } = useStore();
  const chairs = state.committeeState.chairs ?? CHAIR_PROFILES;
  return (
    <div>
      <PageHeader kicker="Committee Leadership" title="Executive Dossiers // The Dais">
        <TabHelpButton tabKey="dais" />
      </PageHeader>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <Dossier id="judy" p={chairs.judy ?? CHAIR_PROFILES.judy} />
        <Dossier id="saif" p={chairs.saif ?? CHAIR_PROFILES.saif} />
      </div>
    </div>
  );
}

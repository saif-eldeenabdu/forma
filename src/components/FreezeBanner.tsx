import { BRICS_CLEAR_QUORUM, useStore } from '../lib/store';

export default function FreezeBanner() {
  const { state, me, isChair, actions } = useStore();
  const cs = state.committeeState;
  const f = cs.assetFreeze;
  if (cs.currentMode !== 'ASSET_FREEZE' || !f) return null;
  const count = f.signers.length;
  const signed = !!me && f.signers.includes(me);
  return (
    <div className="flash-border border border-crimson bg-crimson/10 p-3" role="alert">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="tabular text-xs font-bold uppercase tracking-wider text-crimson">
            Western asset freeze // {f.country} // ${f.amountB}B blocked
          </p>
          <p className="mt-1 text-xs text-sage">
            Euroclear/DTCC clearing suspended. Co-sponsor the BRICS Clear depository:{' '}
            <span className="tabular text-ivory">
              {count}/{BRICS_CLEAR_QUORUM}
            </span>{' '}
            signatories required.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn btn-gold"
            disabled={!me || signed}
            onClick={() => actions.cosignBricsClear(me)}
            title={!me ? 'Select your delegation in the header first' : undefined}
          >
            {signed ? 'Signed' : 'Ratify BRICS Clear Multilateral Depository'}
          </button>
          {isChair && (
            <button className="btn btn-emerald" onClick={() => actions.ratifyBricsClear()}>
              Chair: ratify now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

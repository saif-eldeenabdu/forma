import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  AlertCircle,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { DEFAULT_TICKERS, TICKER_SYMBOLS, calculatePortfolioValue, STARTING_CASH } from '../data/exchange';
import type { TickerSymbol } from '../lib/types';
import { byName } from '../data/countries';
import { PageHeader, Panel } from '../components/ui';

export default function Exchange() {
  const { state, actions, me } = useStore();
  const { exchangeState } = state;
  const { marketStatus, tickers, portfolios } = exchangeState;

  const [selectedTicker, setSelectedTicker] = useState<TickerSymbol>('GOLD');
  const [orderAction, setOrderAction] = useState<'BUY' | 'SELL' | 'SHORT'>('BUY');
  const [quantity, setQuantity] = useState<number>(100);

  const activeTicker = tickers[selectedTicker] ?? DEFAULT_TICKERS[selectedTicker];
  const userPortfolio = me && portfolios[me] ? portfolios[me] : null;

  const totalPortfolioValue = useMemo(() => {
    if (!userPortfolio) return STARTING_CASH;
    return calculatePortfolioValue(userPortfolio, tickers);
  }, [userPortfolio, tickers]);

  const cash = userPortfolio?.cash ?? STARTING_CASH;
  const currentHoldings = userPortfolio?.holdings?.[selectedTicker] ?? 0;
  const shortPrice = userPortfolio?.shortAvgPrice?.[selectedTicker] ?? 0;

  const pnlTotal = totalPortfolioValue - STARTING_CASH;
  const pnlPct = ((pnlTotal / STARTING_CASH) * 100).toFixed(2);

  // Chart data format
  const chartData = useMemo(() => {
    const hist = activeTicker.history || [activeTicker.currentPrice];
    return hist.map((price, idx) => ({
      step: idx === hist.length - 1 ? 'LIVE' : `T-${hist.length - 1 - idx}`,
      price,
    }));
  }, [activeTicker]);

  // Order Calculations
  const orderPrice = activeTicker.currentPrice;
  const orderTotal = Math.max(0, quantity) * orderPrice;

  // Validation
  let canExecute = true;
  let validationMessage = '';

  if (marketStatus !== 'OPEN') {
    canExecute = false;
    validationMessage = 'MARKET CLOSED: Trading floor is halted by Chair';
  } else if (!me) {
    canExecute = false;
    validationMessage = 'VIEWER MODE: Authenticate country PIN to execute orders';
  } else if (quantity <= 0) {
    canExecute = false;
    validationMessage = 'Quantity must be at least 1';
  } else if (orderAction === 'BUY') {
    if (currentHoldings < 0) {
      // Covering short
      const shortQty = Math.abs(currentHoldings);
      const shortAvg = shortPrice > 0 ? shortPrice : orderPrice;
      const coverQty = Math.min(quantity, shortQty);
      const excess = quantity - coverQty;
      const cashDiff = coverQty * (shortAvg - orderPrice) - excess * orderPrice;
      if (cash + cashDiff < 0) {
        canExecute = false;
        validationMessage = `Insufficient cash ($${Math.abs(Math.round(cashDiff)).toLocaleString()} needed)`;
      }
    } else {
      if (cash < orderTotal) {
        canExecute = false;
        validationMessage = `Insufficient cash ($${Math.round(orderTotal).toLocaleString()} needed)`;
      }
    }
  } else if (orderAction === 'SELL') {
    if (currentHoldings <= 0) {
      canExecute = false;
      validationMessage = 'No long holdings to sell. Use SHORT to borrow.';
    } else if (quantity > currentHoldings) {
      canExecute = false;
      validationMessage = `Cannot sell more than held (${currentHoldings} ${selectedTicker})`;
    }
  } else if (orderAction === 'SHORT') {
    if (cash < orderTotal) {
      canExecute = false;
      validationMessage = `Insufficient cash margin ($${Math.round(orderTotal).toLocaleString()} needed)`;
    }
  }

  const handleOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canExecute || !me) return;
    actions.executeExchangeOrder({
      ticker: selectedTicker,
      action: orderAction,
      quantity,
      country: me,
    });
  };

  const handleQuickQty = (add: number) => {
    setQuantity((prev) => Math.max(1, (prev || 0) + add));
  };

  const handleMaxQty = () => {
    if (orderAction === 'SELL') {
      setQuantity(Math.max(1, currentHoldings));
    } else {
      const maxAfford = Math.floor(cash / orderPrice);
      setQuantity(Math.max(1, maxAfford));
    }
  };

  const countryInfo = me ? byName(me) : null;

  return (
    <div className="space-y-4">
      <PageHeader
        kicker="BRICS Financial Architecture // Sovereign Asset Trading"
        title="NDB Sovereign Exchange"
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 border px-3 py-1 font-mono text-xs uppercase tracking-wider ${
              marketStatus === 'OPEN'
                ? 'border-emerald/40 bg-emerald/10 text-emerald'
                : 'border-crimson/40 bg-crimson/10 text-crimson'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                marketStatus === 'OPEN' ? 'bg-emerald animate-pulse' : 'bg-crimson'
              }`}
            />
            FLOOR STATUS: {marketStatus}
          </div>
        </div>
      </PageHeader>

      {/* Main Grid: Left Panel (Terminal Chart) & Right Column (Portfolio + Trading Desk) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left Panel: Chart & Asset Overview (7 Cols) */}
        <div className="space-y-4 lg:col-span-7">
          {/* Asset Switcher Bar */}
          <div className="grid grid-cols-5 gap-px border border-hairline bg-hairline">
            {TICKER_SYMBOLS.map((sym) => {
              const t = tickers[sym] ?? DEFAULT_TICKERS[sym];
              const isSelected = selectedTicker === sym;
              const isPos = t.change24h >= 0;
              return (
                <button
                  key={sym}
                  onClick={() => setSelectedTicker(sym)}
                  className={`flex flex-col items-start p-2.5 transition-colors ${
                    isSelected ? 'bg-gold/15 border-b-2 border-gold text-ivory' : 'bg-charcoal text-sage hover:bg-charcoal/80 hover:text-ivory'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-mono text-xs font-bold tracking-wider">{sym}</span>
                    <span
                      className={`font-mono text-[10px] ${
                        isPos ? 'text-emerald' : 'text-crimson'
                      }`}
                    >
                      {isPos ? '+' : ''}
                      {t.change24h}%
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-sm font-semibold tabular text-ivory">
                    ${t.currentPrice.toLocaleString()}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Terminal Chart Panel */}
          <div className="panel p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-hairline pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="label !text-gold">{activeTicker.symbol}</span>
                  <span className="text-xs text-sage">// {activeTicker.name}</span>
                </div>
                <div className="mt-1 flex items-baseline gap-3">
                  <span className="font-mono text-3xl font-bold tracking-tight text-ivory">
                    ${activeTicker.currentPrice.toLocaleString()}
                  </span>
                  <span
                    className={`flex items-center font-mono text-sm font-bold ${
                      activeTicker.change24h >= 0 ? 'text-emerald' : 'text-crimson'
                    }`}
                  >
                    {activeTicker.change24h >= 0 ? (
                      <ArrowUpRight size={16} />
                    ) : (
                      <ArrowDownRight size={16} />
                    )}
                    {activeTicker.change24h >= 0 ? '+' : ''}
                    {activeTicker.change24h}%
                  </span>
                  <span className="font-mono text-xs text-sage">({activeTicker.unit})</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-sage">
                  TERMINAL TICK:
                </span>
                <span className="rounded border border-hairline bg-obsidian px-2 py-0.5 font-mono text-xs text-gold">
                  LIVE
                </span>
              </div>
            </div>

            {/* Recharts Dark Graph */}
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`grad-${selectedTicker}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={activeTicker.color} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={activeTicker.color} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="step"
                    stroke="#525252"
                    fontSize={11}
                    fontFamily="monospace"
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#525252"
                    fontSize={11}
                    fontFamily="monospace"
                    domain={['auto', 'auto']}
                    tickFormatter={(val) => `$${val}`}
                    tickLine={false}
                    orientation="right"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a0a0a',
                      borderColor: '#333333',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                    }}
                    itemStyle={{ color: activeTicker.color }}
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, activeTicker.symbol]}
                    labelStyle={{ color: '#888888' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={activeTicker.color}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill={`url(#grad-${selectedTicker})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Terminal Info Bar */}
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-hairline pt-3 font-mono text-[11px]">
              <div>
                <span className="text-sage">24H HIGH: </span>
                <span className="font-semibold text-ivory">
                  ${Math.max(...(activeTicker.history || [activeTicker.currentPrice])).toLocaleString()}
                </span>
              </div>
              <div className="text-center">
                <span className="text-sage">24H LOW: </span>
                <span className="font-semibold text-ivory">
                  ${Math.min(...(activeTicker.history || [activeTicker.currentPrice])).toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sage">SETTLEMENT: </span>
                <span className="font-semibold text-gold">INSTANT RTDB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Portfolio Dashboard + Trading Desk (5 Cols) */}
        <div className="space-y-4 lg:col-span-5">
          {/* Portfolio Dashboard */}
          <Panel title="Delegation Sovereign Portfolio">
            {!me ? (
              <div className="border border-gold/40 bg-gold/5 p-4 text-center">
                <ShieldAlert size={24} className="mx-auto mb-2 text-gold" />
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-gold">
                  VIEWER / UNCLAIMED MODE
                </p>
                <p className="mt-1 text-xs text-sage">
                  Authenticate your country delegation via the header PIN login to view dedicated
                  holdings and execute trades.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header Profile */}
                <div className="flex items-center justify-between border-b border-hairline pb-3">
                  <div className="flex items-center gap-2">
                    {countryInfo && (
                      <span className="font-mono text-xs text-gold font-bold px-1.5 py-0.5 border border-gold/30 bg-gold/10">
                        {countryInfo.code}
                      </span>
                    )}
                    <div>
                      <p className="font-mono text-sm font-bold uppercase tracking-wider text-ivory">
                        {me}
                      </p>
                      <p className="text-[10px] text-sage">
                        {countryInfo?.tier === 'FULL BRICS MEMBER' ? 'FULL BRICS MEMBER' : 'BRICS PARTNER'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="label">Available Cash</p>
                    <p className="font-mono text-base font-bold tabular text-emerald">
                      ${Math.round(cash).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Total Value & PnL */}
                <div className="rounded border border-hairline bg-obsidian p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="label">Total Portfolio Net Worth</p>
                      <p className="mt-0.5 font-mono text-2xl font-bold tabular text-ivory">
                        ${Math.round(totalPortfolioValue).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="label">Total P&L</p>
                      <p
                        className={`font-mono text-sm font-bold tabular ${
                          pnlTotal >= 0 ? 'text-emerald' : 'text-crimson'
                        }`}
                      >
                        {pnlTotal >= 0 ? '+' : ''}${Math.round(pnlTotal).toLocaleString()} ({pnlTotal >= 0 ? '+' : ''}{pnlPct}%)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Positions Breakdown */}
                <div>
                  <p className="label mb-2 flex items-center justify-between">
                    <span>Active Positions</span>
                    <span className="text-[10px] lowercase text-sage">5 sovereign tickers</span>
                  </p>
                  <div className="space-y-1.5">
                    {TICKER_SYMBOLS.map((sym) => {
                      const t = tickers[sym] ?? DEFAULT_TICKERS[sym];
                      const pos = userPortfolio?.holdings?.[sym] ?? 0;
                      const isShort = pos < 0;
                      const isLong = pos > 0;
                      const sAvg = userPortfolio?.shortAvgPrice?.[sym] ?? 0;

                      return (
                        <div
                          key={sym}
                          onClick={() => setSelectedTicker(sym)}
                          className={`flex cursor-pointer items-center justify-between rounded border p-2 transition-colors ${
                            selectedTicker === sym
                              ? 'border-gold bg-gold/10'
                              : 'border-hairline bg-charcoal hover:border-gold/40'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-ivory">{sym}</span>
                            <span className="text-[10px] text-sage">@ ${t.currentPrice}</span>
                          </div>
                          <div className="text-right">
                            <span
                              className={`font-mono text-xs font-bold ${
                                isLong
                                  ? 'text-emerald'
                                  : isShort
                                  ? 'text-crimson'
                                  : 'text-sage'
                              }`}
                            >
                              {isLong ? `+${pos}` : isShort ? `${pos} SHORT` : '0 FLAT'}
                            </span>
                            {isShort && sAvg > 0 && (
                              <p className="text-[9px] text-crimson/80">entry ${sAvg}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </Panel>

          {/* Trading Desk */}
          <Panel title="Instant Trading Desk">
            <form onSubmit={handleOrder} className="space-y-4">
              {/* Buy / Sell / Short Selector */}
              <div className="grid grid-cols-3 gap-px border border-hairline bg-hairline">
                <button
                  type="button"
                  onClick={() => setOrderAction('BUY')}
                  className={`py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                    orderAction === 'BUY'
                      ? 'bg-emerald text-obsidian'
                      : 'bg-charcoal text-sage hover:text-ivory'
                  }`}
                >
                  [BUY] Long
                </button>
                <button
                  type="button"
                  onClick={() => setOrderAction('SELL')}
                  className={`py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                    orderAction === 'SELL'
                      ? 'bg-gold text-obsidian'
                      : 'bg-charcoal text-sage hover:text-ivory'
                  }`}
                >
                  [SELL] Close
                </button>
                <button
                  type="button"
                  onClick={() => setOrderAction('SHORT')}
                  className={`py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                    orderAction === 'SHORT'
                      ? 'bg-crimson text-ivory'
                      : 'bg-charcoal text-sage hover:text-ivory'
                  }`}
                >
                  [SHORT] Borrow
                </button>
              </div>

              {/* Ticker & Price Info */}
              <div className="flex items-center justify-between border-b border-hairline pb-2 font-mono text-xs">
                <span className="text-sage">Selected Asset:</span>
                <span className="font-bold text-ivory">
                  {selectedTicker} (${orderPrice.toLocaleString()})
                </span>
              </div>

              {/* Quantity Input with Multipliers */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="label">Order Quantity ({activeTicker.unit})</label>
                  <span className="font-mono text-[10px] text-sage">
                    Held: {currentHoldings} {selectedTicker}
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity || ''}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                  className="field tabular w-full text-base font-bold"
                  placeholder="Quantity..."
                  disabled={marketStatus !== 'OPEN' || !me}
                />
                <div className="mt-2 flex gap-1.5">
                  {[10, 50, 100, 500, 1000].map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => handleQuickQty(step)}
                      disabled={marketStatus !== 'OPEN' || !me}
                      className="btn !px-2 !py-0.5 !text-[10px] text-sage hover:text-ivory"
                    >
                      +{step}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleMaxQty}
                    disabled={marketStatus !== 'OPEN' || !me}
                    className="btn !px-2 !py-0.5 !text-[10px] text-gold hover:text-gold/80"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Order Calculations */}
              <div className="space-y-1.5 rounded border border-hairline bg-obsidian p-3 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-sage">Order Value:</span>
                  <span className="font-bold text-ivory">${orderTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sage">
                    {orderAction === 'SHORT' ? 'Cash Margin Required:' : 'Cash Impact:'}
                  </span>
                  <span
                    className={
                      orderAction === 'SELL' ? 'font-bold text-emerald' : 'font-bold text-ivory'
                    }
                  >
                    {orderAction === 'SELL' ? `+$${orderTotal.toLocaleString()}` : `-$${orderTotal.toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between border-t border-hairline pt-1 text-[11px]">
                  <span className="text-sage">Est. Free Cash After:</span>
                  <span className="text-sage">
                    ${Math.max(
                      0,
                      orderAction === 'SELL'
                        ? cash + orderTotal
                        : cash - orderTotal
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Error / Status Notice */}
              {validationMessage && (
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-crimson">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{validationMessage}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!canExecute}
                className={`w-full py-3 font-mono text-xs font-bold uppercase tracking-[0.14em] transition-opacity ${
                  !canExecute
                    ? 'cursor-not-allowed bg-charcoal text-sage opacity-50'
                    : orderAction === 'BUY'
                    ? 'btn-emerald'
                    : orderAction === 'SELL'
                    ? 'btn-gold'
                    : 'bg-crimson text-ivory hover:bg-crimson/90'
                }`}
              >
                {marketStatus !== 'OPEN'
                  ? 'MARKET CLOSED'
                  : !me
                  ? 'CLAIM DELEGATION TO TRADE'
                  : `${orderAction} ${quantity} ${selectedTicker} // $${orderTotal.toLocaleString()}`}
              </button>
            </form>
          </Panel>
        </div>
      </div>
    </div>
  );
}

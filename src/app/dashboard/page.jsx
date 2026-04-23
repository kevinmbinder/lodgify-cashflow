"use client";
import { useState, useEffect } from "react";
import { useSettings } from "../../hooks/useSettings";
import { useBookings } from "../../hooks/useBookings";
import { fmtDate, fmtMoney, daysFromNow } from "../../lib/formatters";
import { DEFAULT_SETTINGS } from "../../lib/platformRules";

function SyncBadge({ syncedAt }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    function update() {
      if (!syncedAt) { setLabel(""); return; }
      const mins = Math.floor((Date.now() - new Date(syncedAt)) / 60000);
      setLabel(mins < 1 ? "Updated just now" : `Updated ${mins}m ago`);
    }
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, [syncedAt]);
  if (!label) return null;
  return <span className="sync-badge">{label}</span>;
}

function paymentLabel(ev) {
  if (ev.paymentType === "full") return "Full Payout";
  if (ev.policySource === "actual") {
    return ev.paymentType === "deposit"
      ? `Deposit (${fmtMoney(ev.gross)})`
      : `Balance (${fmtMoney(ev.gross)})`;
  }
  const pct = ev.rule?.depositPercent ?? 0.5;
  const split = ev.paymentType === "deposit"
    ? `${Math.round(pct * 100)}%`
    : `${Math.round((1 - pct) * 100)}%`;
  return ev.paymentType === "deposit" ? `Deposit (${split})` : `Balance (${split})`;
}

const PLATFORM_BG = {
  airbnb:  "#FFF1F0",
  vrbo:    "#F0F6FF",
  direct:  "#F0FFF4",
  default: "#F5F5F5",
};

function PlatformPill({ rule, platformKey }) {
  const bg = PLATFORM_BG[platformKey] || PLATFORM_BG.default;
  return (
    <span className="ppill" style={{ background: bg, color: rule.color }}>
      <span className="pdot" style={{ background: rule.color }} />
      {rule.label}
    </span>
  );
}

function CountdownBadge({ date }) {
  const cd = daysFromNow(date);
  if (cd === null) return null;
  const cls = cd < 0 ? "past" : cd === 0 ? "today" : cd <= 7 ? "soon" : "fut";
  const label = cd < 0 ? `${Math.abs(cd)}d ago` : cd === 0 ? "Today" : `in ${cd}d`;
  return <span className={`cbadge ${cls}`}>{label}</span>;
}

export default function DashboardPage() {
  const { settings } = useSettings();
  const { events, loading, error, syncedAt } = useBookings(settings);

  const now = new Date();
  const totalNet   = events.filter((e) => e.receiptDate >= now).reduce((s, e) => s + e.net, 0);
  const totalGross = events.filter((e) => e.receiptDate >= now).reduce((s, e) => s + e.gross, 0);
  const next30     = events.filter((e) => { const d = daysFromNow(e.receiptDate); return d !== null && d >= 0 && d <= 30; }).reduce((s, e) => s + e.net, 0);
  const pending    = events.filter((e) => e.receiptDate >= now).length;

  const grouped = events.reduce((acc, e) => {
    const k = e.receiptDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    (acc[k] = acc[k] || []).push(e);
    return acc;
  }, {});

  const maxMNet = Math.max(...Object.values(grouped).map((evs) => evs.reduce((s, e) => s + e.net, 0)), 1);

  const platformKeys = ["airbnb", "vrbo", "direct"];

  return (
    <div className="app">
      <div className="page">

        {/* Hero */}
        <div className="hero">
          <div>
            <h1 className="hero-title">When does the <span>money</span> land?</h1>
            <p className="hero-sub">Your complete payout timeline, sorted by receipt date.</p>
          </div>
          <div className="api-row">
            <SyncBadge syncedAt={syncedAt} />
          </div>
        </div>

        {error && <div className="errbar">⚠ {error}</div>}

        {loading && (
          <div className="empty">
            <div className="empty-icon">⏳</div>
            <div className="empty-title">Loading bookings…</div>
          </div>
        )}

        {!loading && events.length > 0 && (
          <>
            {/* Stats */}
            <div className="stats">
              <div className="stat blue">
                <div className="stat-label">Total Pipeline</div>
                <div className="stat-value">{fmtMoney(totalNet)}</div>
                <div className="stat-sub">{events.length} payment events</div>
              </div>
              <div className="stat">
                <div className="stat-label">Next 30 Days</div>
                <div className="stat-value">{fmtMoney(next30)}</div>
                <div className="stat-sub">arriving soon</div>
              </div>
              <div className="stat">
                <div className="stat-label">Pending Payouts</div>
                <div className="stat-value">{pending}</div>
                <div className="stat-sub">payments still to land</div>
              </div>
              <div className="stat">
                <div className="stat-label">Future Bookings</div>
                <div className="stat-value">{fmtMoney(totalGross)}</div>
                <div className="stat-sub">gross before platform fees</div>
              </div>
            </div>

            {/* Legend */}
            <div className="legend">
              <span className="legend-lbl">Platforms</span>
              {platformKeys.map((k) => {
                const r = settings[k] || DEFAULT_SETTINGS[k];
                return (
                  <span key={k} className="legend-item">
                    <span className="ldot" style={{ background: r.color }} />
                    {r.label} · {r.fee === 0 ? "no fee" : `${(r.fee * 100).toFixed(0)}% fee`}
                    {r.paymentType === "split"
                      ? ` · split ${(r.depositPercent * 100).toFixed(0)}/${(100 - r.depositPercent * 100).toFixed(0)}`
                      : ` · single +${r.payoutDelayDays}d`}
                  </span>
                );
              })}
            </div>

            {/* Payout Timeline */}
            <div className="sec-hdr">
              <span className="sec-title">Payout Timeline</span>
              <span className="sec-sub">sorted by expected receipt date</span>
            </div>
            <div className="card">
              <div className="thead">
                <div className="th">Guest</div>
                <div className="th">Platform</div>
                <div className="th">Type</div>
                <div className="th">Due Date</div>
                <div className="th">Receipt Date</div>
                <div className="th">Gross</div>
                <div className="th r">Net</div>
              </div>

              {Object.entries(grouped).map(([month, evs]) => {
                const mnet = evs.reduce((s, e) => s + e.net, 0);
                return (
                  <div key={month}>
                    <div className="mrow">
                      <span className="mname">{month}</span>
                      <span className="mnet">{fmtMoney(mnet)} net</span>
                    </div>
                    {evs.map((ev) => {
                      const cd = daysFromNow(ev.receiptDate);
                      const isPast = cd !== null && cd < 0;
                      return (
                        <div key={ev.eventId} className={`erow${isPast ? " past" : ""}`}>
                          <div className="cell">
                            <div className="gname">{ev.guest}</div>
                            <div className="gsub">{ev.nights > 0 ? `${ev.nights}n` : ""}{ev.nights > 0 && ev.checkIn ? " · " : ""}{ev.checkIn ? fmtDate(ev.checkIn) : ""}</div>
                          </div>
                          <div className="cell"><PlatformPill rule={ev.rule} platformKey={ev.platformKey} /></div>
                          <div className="cell"><span className="tpill">{paymentLabel(ev)}</span></div>
                          <div className="cell" style={{ fontSize: 14 }}>{fmtDate(ev.paymentDueDate)}</div>
                          <div className="cell">
                            <div className="rdate">{fmtDate(ev.receiptDate)}</div>
                            <div><CountdownBadge date={ev.receiptDate} /></div>
                          </div>
                          <div className="cell">
                            <div className="agross">{fmtMoney(ev.gross)}</div>
                            {ev.taxesWithheld > 0 && <div className="afee" style={{ color: "var(--orange)" }}>−{fmtMoney(ev.taxesWithheld)} tax</div>}
                            {ev.platformFee > 0 && <div className="afee">−{fmtMoney(ev.platformFee)} platform</div>}
                            {ev.processingFee > 0 && <div className="afee">−{fmtMoney(ev.processingFee)} processing</div>}
                            {ev.otherFee > 0 && <div className="afee">−{fmtMoney(ev.otherFee)} other</div>}
                          </div>
                          <div className="cell"><div className="anet">{fmtMoney(ev.net)}</div></div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Payments by Month */}
            <div className="sec-hdr">
              <span className="sec-title">Payments by Month</span>
              <span className="sec-sub">net expected receipts per calendar month</span>
            </div>
            <div className="card">
              <div className="fhead">
                <div className="th">Month</div>
                <div className="th r">Payments</div>
                <div className="th r">Gross</div>
                <div className="th r">Net</div>
              </div>
              {Object.entries(grouped).map(([month, evs]) => {
                const mg = evs.reduce((s, e) => s + e.gross, 0);
                const mn = evs.reduce((s, e) => s + e.net, 0);
                return (
                  <div key={month} className="frow">
                    <div>
                      <div className="fmonth">{month}</div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${(mn / maxMNet) * 100}%` }} />
                      </div>
                    </div>
                    <div className="fcnt">{evs.length} payment{evs.length !== 1 ? "s" : ""}</div>
                    <div className="fval">{fmtMoney(mg)}</div>
                    <div className="fval g">{fmtMoney(mn)}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

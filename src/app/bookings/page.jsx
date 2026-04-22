"use client";
import { useState, useEffect } from "react";
import { useSettings } from "../../hooks/useSettings";
import { useBookings } from "../../hooks/useBookings";
import { fmtDate, fmtMoney, daysFromNow } from "../../lib/formatters";

function paymentLabel(e) {
  if (e.paymentType === "full") return "Full Payout";
  if (e.policySource === "actual") {
    return e.paymentType === "deposit"
      ? `Deposit (${fmtMoney(e.gross)})`
      : `Balance (${fmtMoney(e.gross)})`;
  }
  const pct = e.rule?.depositPercent ?? 0.5;
  const split = e.paymentType === "deposit"
    ? `${Math.round(pct * 100)}%`
    : `${Math.round((1 - pct) * 100)}%`;
  return e.paymentType === "deposit" ? `Deposit (${split})` : `Balance (${split})`;
}

const PLATFORM_BG = {
  airbnb: "#FFF1F0", vrbo: "#F0F6FF", direct: "#F0FFF4", default: "#F5F5F5",
};

function PlatformPill({ rule, platformKey }) {
  return (
    <span className="ppill" style={{ background: PLATFORM_BG[platformKey] || PLATFORM_BG.default, color: rule.color }}>
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

export default function BookingsPage() {
  const { settings } = useSettings();
  const { bookingGroups, loading, error, syncedAt } = useBookings(settings);

  return (
    <div className="app">
      <div className="page">

        <div className="hero">
          <div>
            <h1 className="hero-title">Upcoming <span>bookings</span></h1>
            <p className="hero-sub">Full payment schedule expanded per booking.</p>
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

        {!loading && bookingGroups.length > 0 && (
          <>
            <div className="sec-hdr">
              <span className="sec-title">All Bookings</span>
              <span className="sec-sub">
                {bookingGroups.length} booking{bookingGroups.length !== 1 ? "s" : ""} · payment schedule expanded
              </span>
            </div>

            {bookingGroups.map((booking) => {
              const totalNet = booking.events.reduce((s, e) => s + e.net, 0);
              return (
                <div key={booking.id} className="bcard">
                  <div className="bcard-hdr">
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className="bcard-guest">{booking.guest}</span>
                        <PlatformPill rule={booking.rule} platformKey={booking.platformKey} />
                      </div>
                      <div className="bcard-meta">
                        {fmtDate(booking.checkIn)} → {fmtDate(booking.checkOut)}
                        {booking.nights > 0 ? ` · ${booking.nights} nights` : ""}
                        {booking.property ? ` · ${booking.property}` : ""}
                      </div>
                    </div>
                    <div>
                      <div className="bcard-total">{fmtMoney(booking.totalGross)}</div>
                      <div className="bcard-total-sub">{fmtMoney(totalNet)} net after fees</div>
                    </div>
                  </div>

                  <div className="evhead">
                    <div className="th">Type</div>
                    <div className="th">Due Date</div>
                    <div className="th">Receipt Date</div>
                    <div className="th">Countdown</div>
                    <div className="th r">Gross</div>
                    <div className="th r">Fee</div>
                    <div className="th r">Net</div>
                  </div>

                  {booking.events.map((e) => (
                    <div key={e.eventId} className="evrow">
                      <div><span className="tpill">{paymentLabel(e)}</span></div>
                      <div>{fmtDate(e.paymentDueDate)}</div>
                      <div style={{ fontWeight: 600, color: "var(--text1)" }}>{fmtDate(e.receiptDate)}</div>
                      <div><CountdownBadge date={e.receiptDate} /></div>
                      <div style={{ textAlign: "right" }}>{fmtMoney(e.gross)}</div>
                      <div style={{ textAlign: "right", color: "var(--text3)" }}>
                        {e.taxesWithheld > 0 && <div style={{ color: "var(--orange)" }}>−{fmtMoney(e.taxesWithheld)} tax</div>}
                        {e.platformFee > 0 && <div>−{fmtMoney(e.platformFee)} platform</div>}
                        {e.processingFee > 0 && <div>−{fmtMoney(e.processingFee)} processing</div>}
                        {e.otherFee > 0 && <div>−{fmtMoney(e.otherFee)} other</div>}
                        {!e.taxesWithheld && !e.platformFee && !e.processingFee && !e.otherFee && "—"}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span className="anet" style={{ fontSize: 15 }}>{fmtMoney(e.net)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

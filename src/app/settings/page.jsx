"use client";
import { useState, useEffect } from "react";
import { useSettings } from "../../hooks/useSettings";
import { DEFAULT_SETTINGS } from "../../lib/platformRules";

// ── Field primitives ───────────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div className="sfield">
      <label>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function NumInput({ value, onChange, min = 0, max, step = 1, prefix, suffix }) {
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      {prefix && (
        <span style={{
          position: "absolute", left: 14, fontSize: 15, color: "var(--text3)",
          pointerEvents: "none", zIndex: 1,
        }}>{prefix}</span>
      )}
      <input
        className="sfield-input"
        type="number"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        style={{ paddingLeft: prefix ? 26 : 14, paddingRight: suffix ? 36 : 14 }}
      />
      {suffix && (
        <span style={{
          position: "absolute", right: 14, fontSize: 13, color: "var(--text3)",
          pointerEvents: "none",
        }}>{suffix}</span>
      )}
    </div>
  );
}

// ── Section divider ────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
      color: "var(--text3)", paddingBottom: 12, borderBottom: "1px solid var(--border)",
      marginBottom: 14,
    }}>
      {children}
    </div>
  );
}

// ── Platform card ──────────────────────────────────────────────────────────────
function PlatformCard({ platformKey, rule, onChange }) {
  const isSplit = rule.paymentType === "split";
  const isDirectBooking = platformKey === "direct";
  const set = (field, value) => onChange({ ...rule, [field]: value });

  return (
    <div className="scard">
      {/* Header */}
      <div className="scard-hdr">
        <span className="spdot" style={{ background: rule.color }} />
        <span className="spname">{rule.label}</span>
        <span style={{
          fontSize: 11, fontWeight: 600, letterSpacing: "0.05em",
          color: "var(--text3)", textTransform: "uppercase", marginLeft: 4,
        }}>
          {isSplit ? "split payment" : "single payout"}
        </span>
      </div>

      <div className="sbody">

        {/* ── Fees ── */}
        <div>
          <SectionLabel>Platform Fees</SectionLabel>
          <div className="srow">
            <Field
              label="Platform Fee (%)"
              hint={`${(rule.fee * 100).toFixed(2)}% of gross deducted per payment`}
            >
              <NumInput
                value={+(rule.fee * 100).toFixed(4)}
                onChange={(v) => set("fee", v / 100)}
                min={0} max={100} step={0.1}
                suffix="%"
              />
            </Field>
            <Field
              label="Platform Fixed Fee ($)"
              hint="Flat amount deducted per booking"
            >
              <NumInput
                value={rule.fixedFee ?? 0}
                onChange={(v) => set("fixedFee", v)}
                min={0} step={0.01}
                prefix="$"
              />
            </Field>
          </div>

          <SectionLabel>Payment Processing Fees</SectionLabel>
          <div className="srow">
            <Field
              label="Processing Fee (%)"
              hint="% of gross charged by payment processor"
            >
              <NumInput
                value={+((rule.processingFeePercent ?? 0) * 100).toFixed(4)}
                onChange={(v) => set("processingFeePercent", v / 100)}
                min={0} max={100} step={0.1}
                suffix="%"
              />
            </Field>
            <Field
              label="Processing Fixed Fee ($)"
              hint="Flat per-booking payment processing charge"
            >
              <NumInput
                value={rule.processingFeeFixed ?? 0}
                onChange={(v) => set("processingFeeFixed", v)}
                min={0} step={0.01}
                prefix="$"
              />
            </Field>
          </div>

          <SectionLabel>Other Fees</SectionLabel>
          <div className="srow">
            <Field
              label="Other Fee (%)"
              hint="Any additional % fee (management, etc.)"
            >
              <NumInput
                value={+((rule.otherFeePercent ?? 0) * 100).toFixed(4)}
                onChange={(v) => set("otherFeePercent", v / 100)}
                min={0} max={100} step={0.1}
                suffix="%"
              />
            </Field>
            <Field
              label="Other Fixed Fee ($)"
              hint="Any additional flat fee per booking"
            >
              <NumInput
                value={rule.otherFeeFixed ?? 0}
                onChange={(v) => set("otherFeeFixed", v)}
                min={0} step={0.01}
                prefix="$"
              />
            </Field>
          </div>

          {/* Tax withholding toggle */}
          <div style={{
            marginTop: 12, padding: "14px 16px",
            background: rule.withholdsTax ? "#FFF8F0" : "var(--surface2)",
            borderRadius: 10,
            border: `1px solid ${rule.withholdsTax ? "#FFD580" : "var(--border)"}`,
            display: "flex", alignItems: "flex-start", gap: 14,
          }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flex: 1 }}>
              <div
                onClick={() => set("withholdsTax", !rule.withholdsTax)}
                style={{
                  width: 40, height: 22, borderRadius: 11, flexShrink: 0,
                  background: rule.withholdsTax ? "var(--orange)" : "var(--border)",
                  position: "relative", cursor: "pointer", transition: "background 0.2s",
                }}
              >
                <div style={{
                  position: "absolute", top: 3, left: rule.withholdsTax ? 21 : 3,
                  width: 16, height: 16, borderRadius: "50%", background: "#fff",
                  transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text1)" }}>
                  Platform collects &amp; remits taxes
                </div>
                <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
                  {rule.withholdsTax
                    ? "Tax portion of each booking is deducted from expected payout — you never receive it"
                    : "You are responsible for collecting and remitting sales tax"}
                </div>
              </div>
            </label>
          </div>

          {(rule.fee > 0 || rule.fixedFee > 0 || rule.processingFeePercent > 0 || rule.processingFeeFixed > 0 || rule.otherFeePercent > 0 || rule.otherFeeFixed > 0 || rule.withholdsTax) && (() => {
            const exGross = rule.withholdsTax ? 1000 : 1086;
            const pf = exGross * (rule.fee ?? 0) + (rule.fixedFee ?? 0);
            const cf = exGross * (rule.processingFeePercent ?? 0) + (rule.processingFeeFixed ?? 0);
            const of = exGross * (rule.otherFeePercent ?? 0) + (rule.otherFeeFixed ?? 0);
            const net = exGross - pf - cf - of;
            return (
              <div style={{
                marginTop: 10, padding: "10px 14px", background: "var(--surface2)",
                borderRadius: 8, fontSize: 13, color: "var(--text2)",
                border: "1px solid var(--border)",
              }}>
                <span style={{ color: "var(--text3)" }}>Example — $1,000 rent + $86 tax booking: </span>
                {rule.withholdsTax && (
                  <><strong style={{ color: "var(--orange)" }}>−$86 tax withheld</strong>
                  <span style={{ color: "var(--text3)" }}> → </span></>
                )}
                {pf > 0 && <><strong style={{ color: "var(--text1)" }}>−${pf.toFixed(2)} platform</strong><span style={{ color: "var(--text3)" }}> </span></>}
                {cf > 0 && <><strong style={{ color: "var(--text1)" }}>−${cf.toFixed(2)} processing</strong><span style={{ color: "var(--text3)" }}> </span></>}
                {of > 0 && <><strong style={{ color: "var(--text1)" }}>−${of.toFixed(2)} other</strong><span style={{ color: "var(--text3)" }}> </span></>}
                <span style={{ color: "var(--text3)" }}>→ </span>
                <strong style={{ color: "#34C759" }}>${net.toFixed(2)} net</strong>
              </div>
            );
          })()}
        </div>

        {/* ── Payout schedule ── */}
        {!isDirectBooking && <div>
          <SectionLabel>Payout Schedule</SectionLabel>

          {!isSplit ? (
            <div className="srow">
              <Field
                label="Payout Delay (days after checkout)"
                hint="How many days after guest checks out before you receive payment"
              >
                <NumInput
                  value={rule.payoutDelayDays ?? 1}
                  onChange={(v) => set("payoutDelayDays", Math.round(v))}
                  min={0} max={30} step={1}
                  suffix="days"
                />
              </Field>
              <div /> {/* spacer */}
            </div>
          ) : (
            <>
              {/* Deposit row */}
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
                textTransform: "uppercase", color: "var(--accent)",
                marginBottom: 10,
              }}>
                Deposit
              </div>
              <div className="srow" style={{ marginBottom: 16 }}>
                <Field
                  label="Deposit Size (%)"
                  hint={`${(rule.depositPercent * 100).toFixed(0)}% collected at time of booking`}
                >
                  <NumInput
                    value={+((rule.depositPercent ?? 0.5) * 100).toFixed(0)}
                    onChange={(v) => set("depositPercent", v / 100)}
                    min={10} max={90} step={5}
                    suffix="%"
                  />
                </Field>
                <Field
                  label="Deposit Release (days after booking)"
                  hint="Days before deposit is released to you"
                >
                  <NumInput
                    value={rule.depositPayoutDelayDays ?? 0}
                    onChange={(v) => set("depositPayoutDelayDays", Math.round(v))}
                    min={0} max={30} step={1}
                    suffix="days"
                  />
                </Field>
              </div>

              {/* Balance row */}
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
                textTransform: "uppercase", color: "var(--accent)",
                marginBottom: 10,
              }}>
                Balance
              </div>
              <div className="srow">
                <Field
                  label="Balance Due (days before arrival)"
                  hint="When the remaining balance is charged to the guest"
                >
                  <NumInput
                    value={rule.balanceDueDaysBeforeArrival ?? 14}
                    onChange={(v) => set("balanceDueDaysBeforeArrival", Math.round(v))}
                    min={0} max={90} step={1}
                    suffix="days"
                  />
                </Field>
                <Field
                  label="Balance Release (days after collection)"
                  hint="Days after balance collection before it's released to you"
                >
                  <NumInput
                    value={rule.balancePayoutDelayDays ?? 0}
                    onChange={(v) => set("balancePayoutDelayDays", Math.round(v))}
                    min={0} max={30} step={1}
                    suffix="days"
                  />
                </Field>
              </div>
            </>
          )}
        </div>}

        {/* ── Cancellation policy ── */}
        <div>
          <SectionLabel>Cancellation Policy</SectionLabel>
          <div className="sfield">
            <label>Policy Description</label>
            <textarea
              value={rule.cancellationPolicy ?? ""}
              onChange={(e) => set("cancellationPolicy", e.target.value)}
              rows={3}
              placeholder="Describe your cancellation policy…"
              style={{
                width: "100%", padding: "11px 14px",
                border: "1px solid var(--border)", borderRadius: "var(--rs)",
                fontFamily: "'Outfit', sans-serif", fontSize: 14,
                color: "var(--text1)", background: "var(--surface2)",
                outline: "none", resize: "vertical", lineHeight: 1.6,
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { settings, save, reset } = useSettings();
  const [draft, setDraft] = useState(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setDraft(settings); }, [settings]);

  const updatePlatform = (key, rule) => setDraft((d) => ({ ...d, [key]: rule }));

  const handleSave = () => {
    save(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setDraft(DEFAULT_SETTINGS);
    reset();
    setSaved(false);
  };

  return (
    <div className="app">
      <div className="page">

        <div className="hero">
          <div>
            <h1 className="hero-title">Fee <span>Config</span></h1>
            <p className="hero-sub">
              Fully customise fees, payout timing, and cancellation policies per platform.
            </p>
          </div>
          <div className="api-row">
            <button className="btn btn-blue" onClick={handleSave}>Save Changes</button>
            <button className="btn btn-ghost" onClick={handleReset}>Reset to Defaults</button>
            {saved && (
              <span style={{ fontSize: 14, color: "var(--green)", fontWeight: 600 }}>✓ Saved</span>
            )}
          </div>
        </div>

        <div className="sgrid">
          {["airbnb", "vrbo", "direct"].map((key) => (
            <PlatformCard
              key={key}
              platformKey={key}
              rule={draft[key] || DEFAULT_SETTINGS[key]}
              onChange={(r) => updatePlatform(key, r)}
            />
          ))}
        </div>

        <p style={{ marginTop: 20, fontSize: 13, color: "var(--text3)" }}>
          Settings are saved to your browser&apos;s local storage and reflected immediately in Dashboard and Bookings.
          Fixed fees are distributed proportionally across deposit and balance payments.
        </p>
      </div>
    </div>
  );
}

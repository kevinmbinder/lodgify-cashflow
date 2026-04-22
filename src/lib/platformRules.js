export const DEFAULT_SETTINGS = {
  airbnb: {
    label: "Airbnb",
    color: "#FF3B30",
    paymentType: "single",
    // Platform fee
    fee: 0.03,
    fixedFee: 0,
    // Payment processing fee
    processingFeePercent: 0,
    processingFeeFixed: 0,
    // Other fees
    otherFeePercent: 0,
    otherFeeFixed: 0,
    // Payout timing
    payoutDelayDays: 1,
    // Tax
    withholdsTax: true,
    cancellationPolicy: "",
  },
  vrbo: {
    label: "VRBO",
    color: "#0071E3",
    paymentType: "split",
    // Platform fee
    fee: 0.05,
    fixedFee: 0,
    // Payment processing fee
    processingFeePercent: 0,
    processingFeeFixed: 0,
    // Other fees
    otherFeePercent: 0,
    otherFeeFixed: 0,
    // Split schedule
    depositPercent: 0.5,
    depositPayoutDelayDays: 1,
    balanceDueDaysBeforeArrival: 7,
    balancePayoutDelayDays: 1,
    // Tax
    withholdsTax: false,
    cancellationPolicy:
      "100% refundable if cancelled 14+ days before arrival\n50% refundable if cancelled 7–13 days before arrival\nNon-refundable within 7 days of arrival",
  },
  direct: {
    label: "Direct",
    color: "#34C759",
    paymentType: "split",
    // Platform fee
    fee: 0,
    fixedFee: 0,
    // Payment processing fee
    processingFeePercent: 0,
    processingFeeFixed: 0,
    // Other fees
    otherFeePercent: 0,
    otherFeeFixed: 0,
    // Split schedule
    depositPercent: 0.5,
    depositPayoutDelayDays: 0,
    balanceDueDaysBeforeArrival: 14,
    balancePayoutDelayDays: 0,
    // Tax
    withholdsTax: false,
    cancellationPolicy:
      "100% refundable if cancelled 30+ days before arrival\n50% refundable if cancelled 14–29 days before arrival\nNon-refundable within 14 days of arrival",
  },
  default: {
    label: "Other",
    color: "#8B7355",
    paymentType: "single",
    fee: 0.02,
    fixedFee: 0,
    processingFeePercent: 0,
    processingFeeFixed: 0,
    otherFeePercent: 0,
    otherFeeFixed: 0,
    payoutDelayDays: 2,
    withholdsTax: false,
    cancellationPolicy: "",
  },
};

export function detectPlatform(source = "", sourceText = "") {
  const s = source.toLowerCase();
  if (s.includes("airbnb")) return "airbnb";
  if (s.includes("vrbo") || s.includes("homeaway")) return "vrbo";
  if (s === "manual" || s.includes("direct") || s.includes("website") || s.includes("lodgify")) return "direct";
  try {
    const st = typeof sourceText === "string" && !sourceText.trim().startsWith("{")
      ? sourceText.toLowerCase() : "";
    if (st.includes("airbnb")) return "airbnb";
    if (st.includes("vrbo") || st.includes("homeaway")) return "vrbo";
    if (st.includes("website") || st.includes("direct")) return "direct";
  } catch {}
  return "default";
}

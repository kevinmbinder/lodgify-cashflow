import { detectPlatform, DEFAULT_SETTINGS } from "./platformRules";
import { addDays } from "./formatters";

function extractBookingMeta(b) {
  // Lodgify API uses `source` (e.g. "AirbnbIntegration", "Manual") and `source_text`
  const source = b.source || b.channel || b.origin || "Manual";
  const sourceText = b.source_text || "";

  // guest.name is the Lodgify v2 field
  const guest =
    b.guest?.name ||
    b.guest_name ||
    (b.guest ? `${b.guest.first_name || ""} ${b.guest.last_name || ""}`.trim() : null) ||
    "Guest";

  // Lodgify v2 uses `arrival` / `departure` (not arrival_date / departure_date)
  const arrivalStr = b.arrival || b.arrival_date;
  const departureStr = b.departure || b.departure_date;

  const checkIn = arrivalStr ? new Date(arrivalStr) : null;
  const checkOut = departureStr ? new Date(departureStr) : null;
  const nights =
    checkIn && checkOut
      ? Math.round((checkOut - checkIn) / 86400000)
      : b.nights || 0;

  const bookingDate = b.created_at
    ? new Date(b.created_at)
    : b.created_date
    ? new Date(b.created_date)
    : null;

  return {
    id: b.id || b.booking_id,
    guest,
    checkIn,
    checkOut,
    nights,
    source,
    sourceText,
    status: b.status || "",
    property: b.property_name || (b.property_id ? `Property ${b.property_id}` : "Property"),
    totalGross: b.total_amount || b.total_price || b.price || 0,
    // Lodgify v2 exposes the tax component in subtotals.taxes
    taxAmount: b.subtotals?.taxes || 0,
    bookingDate,
    // Actual payment amounts from Lodgify quote
    amountPaid: b.amount_paid ?? 0,
    amountDue: b.amount_due ?? 0,
    // Policy text, e.g. "USD 600.00 ... paid 14 day(s) before arrival."
    policyPayments: b.quote?.policy?.payments || "",
    policyName: b.quote?.policy?.name || "",
  };
}

// Parse "paid N day(s) before arrival" from Lodgify policy text
function parseBalanceDaysFromPolicy(policyText) {
  const m = policyText.match(/paid\s+(\d+)\s+day/i);
  return m ? parseInt(m[1], 10) : null;
}

export function generatePaymentEvents(b, settings = DEFAULT_SETTINGS) {
  const meta = extractBookingMeta(b);
  const platformKey = detectPlatform(meta.source, meta.sourceText);
  const rule = settings[platformKey] || settings.default || DEFAULT_SETTINGS.default;
  const base = { ...meta, platformKey, rule };

  const feePct  = rule.fee      ?? 0;
  const feeFlat = rule.fixedFee ?? 0;
  const procPct  = rule.processingFeePercent ?? 0;
  const procFlat = rule.processingFeeFixed   ?? 0;
  const otherPct  = rule.otherFeePercent ?? 0;
  const otherFlat = rule.otherFeeFixed   ?? 0;

  // If the platform collects & remits taxes, deduct them — we never receive that money
  const taxesWithheld = rule.withholdsTax ? (meta.taxAmount ?? 0) : 0;
  const gross = meta.totalGross - taxesWithheld;

  if (rule.paymentType === "single") {
    if (!meta.checkOut) return [];
    const receiptDate = addDays(meta.checkOut, rule.payoutDelayDays ?? 1);
    const platformFee   = gross * feePct   + feeFlat;
    const processingFee = gross * procPct  + procFlat;
    const otherFee      = gross * otherPct + otherFlat;
    const fee = platformFee + processingFee + otherFee;
    return [
      {
        ...base,
        eventId: `${meta.id}-full`,
        paymentType: "full",
        paymentDueDate: meta.checkOut,
        receiptDate,
        gross,
        platformFee,
        processingFee,
        otherFee,
        fee,
        net: gross - fee,
        taxesWithheld,
        policySource: "configured",
      },
    ];
  }

  // Split payment — use actual amounts from Lodgify when available (confirmed bookings),
  // otherwise fall back to the configured % split
  const hasActualAmounts = meta.amountPaid > 0 || meta.amountDue > 0;

  const depositGross = hasActualAmounts ? meta.amountPaid : gross * (rule.depositPercent ?? 0.5);
  const balanceGross = hasActualAmounts ? meta.amountDue  : gross - depositGross;

  // Proportion used to split fixed fees between deposit and balance
  const depositPct = gross > 0 ? depositGross / gross : (rule.depositPercent ?? 0.5);

  const depositPlatformFee   = depositGross * feePct   + feeFlat   * depositPct;
  const depositProcessingFee = depositGross * procPct  + procFlat  * depositPct;
  const depositOtherFee      = depositGross * otherPct + otherFlat * depositPct;
  const depositFee = depositPlatformFee + depositProcessingFee + depositOtherFee;

  const balancePlatformFee   = balanceGross * feePct   + feeFlat   * (1 - depositPct);
  const balanceProcessingFee = balanceGross * procPct  + procFlat  * (1 - depositPct);
  const balanceOtherFee      = balanceGross * otherPct + otherFlat * (1 - depositPct);
  const balanceFee = balancePlatformFee + balanceProcessingFee + balanceOtherFee;

  const bookingDate = meta.bookingDate || new Date();
  const depositReceiptDate = addDays(bookingDate, rule.depositPayoutDelayDays ?? 0);

  // Use balance days from the booking's policy text first, then fall back to settings
  const policyBalanceDays = parseBalanceDaysFromPolicy(meta.policyPayments);
  const balanceDaysBeforeArrival = policyBalanceDays ?? (rule.balanceDueDaysBeforeArrival ?? 14);
  const balanceDueDate = meta.checkIn ? addDays(meta.checkIn, -balanceDaysBeforeArrival) : null;
  const balanceReceiptDate = balanceDueDate
    ? addDays(balanceDueDate, rule.balancePayoutDelayDays ?? 0)
    : null;

  const policySource = hasActualAmounts ? "actual" : "configured";

  const events = [
    {
      ...base,
      eventId: `${meta.id}-deposit`,
      paymentType: "deposit",
      paymentDueDate: new Date(bookingDate),
      receiptDate: depositReceiptDate,
      gross: depositGross,
      platformFee: depositPlatformFee,
      processingFee: depositProcessingFee,
      otherFee: depositOtherFee,
      fee: depositFee,
      net: depositGross - depositFee,
      taxesWithheld: taxesWithheld * depositPct,
      policySource,
    },
  ];

  if (balanceDueDate && balanceReceiptDate) {
    events.push({
      ...base,
      eventId: `${meta.id}-balance`,
      paymentType: "balance",
      paymentDueDate: balanceDueDate,
      receiptDate: balanceReceiptDate,
      gross: balanceGross,
      platformFee: balancePlatformFee,
      processingFee: balanceProcessingFee,
      otherFee: balanceOtherFee,
      fee: balanceFee,
      net: balanceGross - balanceFee,
      taxesWithheld: taxesWithheld * (1 - depositPct),
      policySource,
    });
  }

  return events;
}

export function processBookings(rawBookings, settings = DEFAULT_SETTINGS) {
  const events = rawBookings.flatMap((b) => generatePaymentEvents(b, settings));
  events.sort((a, b) => a.receiptDate - b.receiptDate);
  return events;
}

export function groupEventsByBooking(rawBookings, settings = DEFAULT_SETTINGS) {
  return rawBookings.map((b) => {
    const meta = extractBookingMeta(b);
    const platformKey = detectPlatform(meta.source, meta.sourceText);
    const rule = settings[platformKey] || settings.default || DEFAULT_SETTINGS.default;
    const events = generatePaymentEvents(b, settings);
    return { ...meta, platformKey, rule, events };
  });
}

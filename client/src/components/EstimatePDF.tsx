import { Document, Page, Text, View, StyleSheet, Svg, Line } from "@react-pdf/renderer";
import type { Estimate, EstimateLineItem } from "@shared/schema";

const C = {
  primary:   "#1e40af",
  primaryLt: "#dbeafe",
  gray50:    "#f9fafb",
  gray100:   "#f3f4f6",
  gray200:   "#e5e7eb",
  gray300:   "#d1d5db",
  gray400:   "#9ca3af",
  gray500:   "#6b7280",
  gray700:   "#374151",
  gray900:   "#111827",
  white:     "#ffffff",
  green:     "#16a34a",
  greenLt:   "#dcfce7",
  red:       "#dc2626",
  amber:     "#d97706",
  amberLt:   "#fef3c7",
  blue:      "#2563eb",
  blueLt:    "#eff6ff",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft:    { bg: C.gray100,  text: C.gray700 },
  sent:     { bg: C.blueLt,   text: C.blue },
  approved: { bg: C.greenLt,  text: C.green },
  rejected: { bg: "#fee2e2",  text: C.red },
  expired:  { bg: C.amberLt,  text: C.amber },
};

const s = StyleSheet.create({
  page: {
    fontSize: 9,
    color: C.gray900,
    backgroundColor: C.white,
    paddingBottom: 52,
  },

  // ── Letterhead ───────────────────────────────────────────────────
  letterhead: {
    backgroundColor: C.primary,
    paddingTop: 22,
    paddingBottom: 18,
    paddingHorizontal: 36,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  lhLeft: { flex: 1 },
  lhCompany: { fontSize: 20, fontWeight: 700, color: C.white, letterSpacing: 0.3 },
  lhTagline: { fontSize: 8.5, color: "#93c5fd", marginTop: 3 },
  lhRight: { alignItems: "flex-end" },
  lhFormTitle: { fontSize: 14, fontWeight: 700, color: C.white, letterSpacing: 1 },
  lhDocNum: { fontSize: 8, color: "#93c5fd", marginTop: 4 },

  // ── Meta banner ──────────────────────────────────────────────────
  metaBanner: {
    backgroundColor: C.primaryLt,
    paddingHorizontal: 36,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: C.gray200,
  },
  metaLeft: { flexDirection: "row", gap: 20 },
  metaItem: { fontSize: 8, color: C.gray700 },
  metaLabel: { fontWeight: 700 },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    fontSize: 7.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ── Body ─────────────────────────────────────────────────────────
  body: { paddingHorizontal: 36, paddingTop: 18 },

  // ── Section ──────────────────────────────────────────────────────
  section: { marginBottom: 16 },
  sectionHeader: {
    backgroundColor: C.gray100,
    borderWidth: 1,
    borderColor: C.gray300,
    borderBottomWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sectionTitle: {
    fontSize: 7.5,
    fontWeight: 700,
    color: C.gray700,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  formBorder: { borderWidth: 1, borderColor: C.gray300 },
  formRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.gray200,
  },
  formRowLast: { flexDirection: "row" },
  formCell: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRightWidth: 1,
    borderRightColor: C.gray200,
  },
  formCellLast: { flex: 1, paddingHorizontal: 8, paddingVertical: 6 },
  fieldLabel: {
    fontSize: 7,
    fontWeight: 700,
    color: C.gray500,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fieldValue: { fontSize: 9.5, color: C.gray900 },
  fieldValueBold: { fontSize: 9.5, fontWeight: 700, color: C.gray900 },

  // ── Line items table ─────────────────────────────────────────────
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.gray100,
    borderWidth: 1,
    borderColor: C.gray300,
    borderBottomWidth: 0,
  },
  tableBody: { borderWidth: 1, borderColor: C.gray300 },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.gray200,
  },
  tableRowLast: { flexDirection: "row" },
  tableRowAlt: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.gray200,
    backgroundColor: C.gray50,
  },
  th: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 7.5,
    fontWeight: 700,
    color: C.gray700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    borderRightWidth: 1,
    borderRightColor: C.gray200,
  },
  thLast: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 7.5,
    fontWeight: 700,
    color: C.gray700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "right",
  },
  td: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    fontSize: 9,
    color: C.gray900,
    borderRightWidth: 1,
    borderRightColor: C.gray200,
  },
  tdLast: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    fontSize: 9,
    color: C.gray900,
    textAlign: "right",
    fontWeight: 700,
  },

  // col widths
  colDesc:  { flex: 4 },
  colQty:   { flex: 1, textAlign: "center" },
  colUnit:  { flex: 1.2, textAlign: "center" },
  colPrice: { flex: 1.5, textAlign: "right" },
  colTotal: { flex: 1.5 },

  // ── Totals box ───────────────────────────────────────────────────
  totalsBox: {
    alignSelf: "flex-end",
    width: 240,
    borderWidth: 1,
    borderColor: C.gray300,
    marginTop: 8,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: C.gray200,
  },
  totalsRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: C.primary,
  },
  totalsLabel: { fontSize: 8.5, color: C.gray700 },
  totalsValue: { fontSize: 8.5, color: C.gray900 },
  totalsLabelFinal: { fontSize: 10, fontWeight: 700, color: C.white },
  totalsValueFinal: { fontSize: 10, fontWeight: 700, color: C.white },

  // ── Notes box ────────────────────────────────────────────────────
  notesBox: {
    borderWidth: 1,
    borderColor: C.gray300,
    minHeight: 50,
    padding: 10,
  },
  notesText: { fontSize: 9, color: C.gray700, lineHeight: 1.6 },

  // ── Footer ───────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 44,
    borderTopWidth: 2,
    borderTopColor: C.primary,
    backgroundColor: C.gray50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 36,
    justifyContent: "space-between",
  },
  footerBold: { fontSize: 7.5, color: C.primary, fontWeight: 600 },
  footerText: { fontSize: 7.5, color: C.gray500 },
  pageNum: { fontSize: 7.5, color: C.gray400 },
});

// ── Helpers ──────────────────────────────────────────────────────────
function n(v: string | number | null | undefined) {
  const x = parseFloat(String(v ?? "0"));
  return isNaN(x) ? 0 : x;
}
function fmt(v: number) {
  return `$${v.toFixed(2)}`;
}
function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
function estimateNum(id: string) {
  return "EST-" + id.replace(/-/g, "").slice(0, 8).toUpperCase();
}
function statusLabel(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Component ────────────────────────────────────────────────────────
interface Props {
  estimate: Estimate & { lineItems: Array<{ id?: string; description: string; quantity: string; unit: string; unitPrice: string }> };
  businessName?: string;
}

export function EstimatePDF({ estimate, businessName }: Props) {
  const lineItems = estimate.lineItems || [];
  const subtotal  = lineItems.reduce((sum, li) => sum + n(li.quantity) * n(li.unitPrice), 0);
  const discount  = n(estimate.discountAmount);
  const tax       = (subtotal - discount) * (n(estimate.taxRate) / 100);
  const total     = subtotal - discount + tax;

  const statusColors = STATUS_COLORS[estimate.status] ?? STATUS_COLORS.draft;

  const generatedAt = new Date().toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });

  return (
    <Document title={`Estimate — ${estimate.customerName}`} author={businessName}>
      <Page size="A4" style={s.page}>

        {/* ── Letterhead ── */}
        <View style={s.letterhead}>
          <View style={s.lhLeft}>
            <Text style={s.lhCompany}>{businessName || "FieldCapture"}</Text>
            <Text style={s.lhTagline}>Field Service Management · Professional Estimates</Text>
          </View>
          <View style={s.lhRight}>
            <Text style={s.lhFormTitle}>ESTIMATE</Text>
            <Text style={s.lhDocNum}>{estimateNum(estimate.id)}</Text>
          </View>
        </View>

        {/* ── Meta banner ── */}
        <View style={s.metaBanner}>
          <View style={s.metaLeft}>
            <Text style={s.metaItem}>
              <Text style={s.metaLabel}>Date: </Text>{fmtDate(estimate.createdAt?.toString())}
            </Text>
            {estimate.validUntil && (
              <Text style={s.metaItem}>
                <Text style={s.metaLabel}>Valid Until: </Text>{fmtDate(estimate.validUntil)}
              </Text>
            )}
            <Text style={s.metaItem}>
              <Text style={s.metaLabel}>Generated: </Text>{generatedAt}
            </Text>
          </View>
          <Text style={[s.statusPill, { backgroundColor: statusColors.bg, color: statusColors.text }]}>
            {statusLabel(estimate.status)}
          </Text>
        </View>

        <View style={s.body}>

          {/* ── Section 1: Customer Information ── */}
          <View style={s.section}>
            <View style={s.sectionHeader}><Text style={s.sectionTitle}>1. Customer Information</Text></View>
            <View style={s.formBorder}>
              <View style={s.formRow}>
                <View style={s.formCell}>
                  <Text style={s.fieldLabel}>Customer Name</Text>
                  <Text style={s.fieldValueBold}>{estimate.customerName}</Text>
                </View>
                <View style={s.formCellLast}>
                  <Text style={s.fieldLabel}>Estimate #</Text>
                  <Text style={s.fieldValue}>{estimateNum(estimate.id)}</Text>
                </View>
              </View>
              <View style={s.formRowLast}>
                <View style={s.formCell}>
                  <Text style={s.fieldLabel}>Email</Text>
                  <Text style={s.fieldValue}>{estimate.customerEmail || "—"}</Text>
                </View>
                <View style={s.formCellLast}>
                  <Text style={s.fieldLabel}>Phone</Text>
                  <Text style={s.fieldValue}>{estimate.customerPhone || "—"}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Section 2: Estimate Details ── */}
          <View style={s.section}>
            <View style={s.sectionHeader}><Text style={s.sectionTitle}>2. Estimate Details</Text></View>
            <View style={s.formBorder}>
              <View style={s.formRow}>
                <View style={s.formCell}>
                  <Text style={s.fieldLabel}>Title / Scope</Text>
                  <Text style={s.fieldValueBold}>{estimate.title}</Text>
                </View>
                <View style={s.formCell}>
                  <Text style={s.fieldLabel}>Status</Text>
                  <Text style={s.fieldValue}>{statusLabel(estimate.status)}</Text>
                </View>
                <View style={s.formCellLast}>
                  <Text style={s.fieldLabel}>Valid Until</Text>
                  <Text style={s.fieldValue}>{fmtDate(estimate.validUntil)}</Text>
                </View>
              </View>
              {estimate.description && (
                <View style={s.formRowLast}>
                  <View style={s.formCellLast}>
                    <Text style={s.fieldLabel}>Description</Text>
                    <Text style={s.fieldValue}>{estimate.description}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* ── Section 3: Line Items ── */}
          <View style={s.section}>
            <View style={s.sectionHeader}><Text style={s.sectionTitle}>3. Services &amp; Line Items</Text></View>

            {/* Table header */}
            <View style={s.tableHeader}>
              <Text style={[s.th, s.colDesc]}>Description</Text>
              <Text style={[s.th, s.colQty, { textAlign: "center" }]}>Qty</Text>
              <Text style={[s.th, s.colUnit, { textAlign: "center" }]}>Unit</Text>
              <Text style={[s.th, s.colPrice, { textAlign: "right" }]}>Unit Price</Text>
              <Text style={[s.thLast, s.colTotal]}>Total</Text>
            </View>

            {/* Table rows */}
            <View style={s.tableBody}>
              {lineItems.length === 0 ? (
                <View style={s.tableRowLast}>
                  <Text style={[s.td, { flex: 1, color: C.gray400, fontStyle: "italic" }]}>No line items</Text>
                </View>
              ) : lineItems.map((li, i) => {
                const lineTotal = n(li.quantity) * n(li.unitPrice);
                const isLast = i === lineItems.length - 1;
                const RowStyle = isLast ? s.tableRowLast : (i % 2 === 1 ? s.tableRowAlt : s.tableRow);
                return (
                  <View key={i} style={RowStyle}>
                    <Text style={[s.td, s.colDesc]}>{li.description}</Text>
                    <Text style={[s.td, s.colQty, { textAlign: "center" }]}>{li.quantity}</Text>
                    <Text style={[s.td, s.colUnit, { textAlign: "center" }]}>{li.unit}</Text>
                    <Text style={[s.td, s.colPrice, { textAlign: "right" }]}>{fmt(n(li.unitPrice))}</Text>
                    <Text style={[s.tdLast, s.colTotal]}>{fmt(lineTotal)}</Text>
                  </View>
                );
              })}
            </View>

            {/* Totals */}
            <View style={s.totalsBox}>
              <View style={s.totalsRow}>
                <Text style={s.totalsLabel}>Subtotal</Text>
                <Text style={s.totalsValue}>{fmt(subtotal)}</Text>
              </View>
              {discount > 0 && (
                <View style={s.totalsRow}>
                  <Text style={s.totalsLabel}>Discount</Text>
                  <Text style={[s.totalsValue, { color: C.green }]}>−{fmt(discount)}</Text>
                </View>
              )}
              {n(estimate.taxRate) > 0 && (
                <View style={s.totalsRow}>
                  <Text style={s.totalsLabel}>Tax ({estimate.taxRate}%)</Text>
                  <Text style={s.totalsValue}>{fmt(tax)}</Text>
                </View>
              )}
              <View style={s.totalsRowFinal}>
                <Text style={s.totalsLabelFinal}>TOTAL</Text>
                <Text style={s.totalsValueFinal}>{fmt(total)}</Text>
              </View>
            </View>
          </View>

          {/* ── Section 4: Notes ── */}
          {estimate.notes && (
            <View style={s.section}>
              <View style={s.sectionHeader}><Text style={s.sectionTitle}>4. Notes</Text></View>
              <View style={s.notesBox}>
                <Text style={s.notesText}>{estimate.notes}</Text>
              </View>
            </View>
          )}

        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerBold}>{businessName || "FieldCapture"}</Text>
          <Text style={s.footerText}>{estimateNum(estimate.id)}  ·  {estimate.customerName}  ·  {estimate.title}</Text>
          <Text style={s.pageNum} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>

      </Page>
    </Document>
  );
}

import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

interface LineItem {
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
}

interface Estimate {
  id: string;
  title: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  description: string | null;
  status: string;
  valid_until: string | null;
  notes: string | null;
  tax_rate: string;
  discount_amount: string;
  created_at?: string;
}

interface Business {
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  phone?: string | null;
  logo_url?: string | null;
  brand_color?: string | null;
}

interface Props {
  estimate: Estimate;
  lineItems: LineItem[];
  business: Business;
}

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

// Convert hex to RGB for lighter variants
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 45, g: 90, b: 61 }; // default forest green
}

function lightenColor(hex: string, percent: number) {
  const { r, g, b } = hexToRgb(hex);
  const lr = Math.round(r + (255 - r) * percent);
  const lg = Math.round(g + (255 - g) * percent);
  const lb = Math.round(b + (255 - b) * percent);
  return `rgb(${lr}, ${lg}, ${lb})`;
}

export function EstimatePDF({ estimate, lineItems, business }: Props) {
  // Use brand color or default forest green
  const primaryColor = business.brand_color || "#2d5a3d";
  const primaryLight = lightenColor(primaryColor, 0.85);

  const C = {
    primary: primaryColor,
    primaryLt: primaryLight,
    gray50: "#f9fafb",
    gray100: "#f3f4f6",
    gray200: "#e5e7eb",
    gray300: "#d1d5db",
    gray400: "#9ca3af",
    gray500: "#6b7280",
    gray700: "#374151",
    gray900: "#111827",
    white: "#ffffff",
    green: "#16a34a",
    greenLt: "#dcfce7",
  };

  const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    draft: { bg: C.gray100, text: C.gray700 },
    sent: { bg: C.primaryLt, text: C.primary },
    accepted: { bg: C.greenLt, text: C.green },
    approved: { bg: C.greenLt, text: C.green },
    declined: { bg: "#fee2e2", text: "#dc2626" },
    rejected: { bg: "#fee2e2", text: "#dc2626" },
  };

  const s = StyleSheet.create({
    page: {
      fontSize: 9,
      color: C.gray900,
      backgroundColor: C.white,
      paddingBottom: 60,
    },
    letterhead: {
      backgroundColor: C.primary,
      paddingTop: 24,
      paddingBottom: 20,
      paddingHorizontal: 40,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    lhLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    logo: { width: 50, height: 50, borderRadius: 6 },
    lhCompany: { fontSize: 22, fontWeight: 700, color: C.white, letterSpacing: 0.3 },
    lhTagline: { fontSize: 9, color: "rgba(255,255,255,0.7)", marginTop: 2 },
    lhRight: { alignItems: "flex-end" },
    lhFormTitle: { fontSize: 16, fontWeight: 700, color: C.white, letterSpacing: 1.5 },
    lhDocNum: { fontSize: 9, color: "rgba(255,255,255,0.7)", marginTop: 4 },
    metaBanner: {
      backgroundColor: C.primaryLt,
      paddingHorizontal: 40,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: C.gray200,
    },
    metaLeft: { flexDirection: "row", gap: 24 },
    metaItem: { fontSize: 8.5, color: C.gray700 },
    metaLabel: { fontWeight: 700 },
    statusPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      fontSize: 8,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    body: { paddingHorizontal: 40, paddingTop: 20 },
    section: { marginBottom: 18 },
    sectionHeader: {
      backgroundColor: C.gray100,
      borderWidth: 1,
      borderColor: C.gray300,
      borderBottomWidth: 0,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    sectionTitle: {
      fontSize: 8,
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
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRightWidth: 1,
      borderRightColor: C.gray200,
    },
    formCellLast: { flex: 1, paddingHorizontal: 10, paddingVertical: 8 },
    fieldLabel: {
      fontSize: 7,
      fontWeight: 700,
      color: C.gray500,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    fieldValue: { fontSize: 10, color: C.gray900 },
    fieldValueBold: { fontSize: 10, fontWeight: 700, color: C.gray900 },
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
      paddingHorizontal: 10,
      paddingVertical: 7,
      fontSize: 8,
      fontWeight: 700,
      color: C.gray700,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      borderRightWidth: 1,
      borderRightColor: C.gray200,
    },
    thLast: {
      paddingHorizontal: 10,
      paddingVertical: 7,
      fontSize: 8,
      fontWeight: 700,
      color: C.gray700,
      textTransform: "uppercase",
      textAlign: "right",
    },
    td: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 9.5,
      color: C.gray900,
      borderRightWidth: 1,
      borderRightColor: C.gray200,
    },
    tdLast: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 9.5,
      color: C.gray900,
      textAlign: "right",
      fontWeight: 700,
    },
    colDesc: { flex: 4 },
    colQty: { flex: 1, textAlign: "center" },
    colUnit: { flex: 1.2, textAlign: "center" },
    colPrice: { flex: 1.5, textAlign: "right" },
    colTotal: { flex: 1.5 },
    totalsBox: {
      alignSelf: "flex-end",
      width: 220,
      borderWidth: 1,
      borderColor: C.gray300,
      marginTop: 10,
    },
    totalsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: C.gray200,
    },
    totalsRowFinal: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: C.primary,
    },
    totalsLabel: { fontSize: 9, color: C.gray700 },
    totalsValue: { fontSize: 9, color: C.gray900 },
    totalsLabelFinal: { fontSize: 11, fontWeight: 700, color: C.white },
    totalsValueFinal: { fontSize: 11, fontWeight: 700, color: C.white },
    notesBox: {
      borderWidth: 1,
      borderColor: C.gray300,
      minHeight: 50,
      padding: 12,
    },
    notesText: { fontSize: 9.5, color: C.gray700, lineHeight: 1.6 },
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 50,
      borderTopWidth: 2,
      borderTopColor: C.primary,
      backgroundColor: C.gray50,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 40,
      justifyContent: "space-between",
    },
    footerLeft: {},
    footerBold: { fontSize: 8, color: C.primary, fontWeight: 600 },
    footerText: { fontSize: 7.5, color: C.gray500, marginTop: 2 },
    pageNum: { fontSize: 8, color: C.gray400 },
  });

  const subtotal = lineItems.reduce((sum, li) => sum + n(li.quantity) * n(li.unitPrice), 0);
  const discount = n(estimate.discount_amount);
  const tax = (subtotal - discount) * (n(estimate.tax_rate) / 100);
  const total = subtotal - discount + tax;

  const statusColors = STATUS_COLORS[estimate.status] ?? STATUS_COLORS.draft;

  const businessAddress = [business.address, business.city, business.state, business.zip_code]
    .filter(Boolean)
    .join(", ");

  return (
    <Document title={`Estimate — ${estimate.customer_name}`} author={business.name}>
      <Page size="A4" style={s.page}>
        {/* Letterhead */}
        <View style={s.letterhead}>
          <View style={s.lhLeft}>
            {business.logo_url && (
              <Image src={business.logo_url} style={s.logo} />
            )}
            <View>
              <Text style={s.lhCompany}>{business.name}</Text>
              {business.phone && <Text style={s.lhTagline}>{business.phone}</Text>}
            </View>
          </View>
          <View style={s.lhRight}>
            <Text style={s.lhFormTitle}>ESTIMATE</Text>
            <Text style={s.lhDocNum}>{estimateNum(estimate.id)}</Text>
          </View>
        </View>

        {/* Meta banner */}
        <View style={s.metaBanner}>
          <View style={s.metaLeft}>
            <Text style={s.metaItem}>
              <Text style={s.metaLabel}>Date: </Text>{fmtDate(estimate.created_at)}
            </Text>
            {estimate.valid_until && (
              <Text style={s.metaItem}>
                <Text style={s.metaLabel}>Valid Until: </Text>{fmtDate(estimate.valid_until)}
              </Text>
            )}
          </View>
          <Text style={[s.statusPill, { backgroundColor: statusColors.bg, color: statusColors.text }]}>
            {statusLabel(estimate.status)}
          </Text>
        </View>

        <View style={s.body}>
          {/* Customer Info */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Customer Information</Text>
            </View>
            <View style={s.formBorder}>
              <View style={s.formRow}>
                <View style={s.formCell}>
                  <Text style={s.fieldLabel}>Customer Name</Text>
                  <Text style={s.fieldValueBold}>{estimate.customer_name}</Text>
                </View>
                <View style={s.formCellLast}>
                  <Text style={s.fieldLabel}>Estimate #</Text>
                  <Text style={s.fieldValue}>{estimateNum(estimate.id)}</Text>
                </View>
              </View>
              <View style={s.formRowLast}>
                <View style={s.formCell}>
                  <Text style={s.fieldLabel}>Email</Text>
                  <Text style={s.fieldValue}>{estimate.customer_email || "—"}</Text>
                </View>
                <View style={s.formCellLast}>
                  <Text style={s.fieldLabel}>Phone</Text>
                  <Text style={s.fieldValue}>{estimate.customer_phone || "—"}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Estimate Details */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Estimate Details</Text>
            </View>
            <View style={s.formBorder}>
              <View style={s.formRowLast}>
                <View style={s.formCellLast}>
                  <Text style={s.fieldLabel}>Title / Scope</Text>
                  <Text style={s.fieldValueBold}>{estimate.title}</Text>
                  {estimate.description && (
                    <Text style={[s.fieldValue, { marginTop: 4 }]}>{estimate.description}</Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Line Items */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Services & Line Items</Text>
            </View>
            <View style={s.tableHeader}>
              <Text style={[s.th, s.colDesc]}>Description</Text>
              <Text style={[s.th, s.colQty, { textAlign: "center" }]}>Qty</Text>
              <Text style={[s.th, s.colUnit, { textAlign: "center" }]}>Unit</Text>
              <Text style={[s.th, s.colPrice, { textAlign: "right" }]}>Unit Price</Text>
              <Text style={[s.thLast, s.colTotal]}>Total</Text>
            </View>
            <View style={s.tableBody}>
              {lineItems.length === 0 ? (
                <View style={s.tableRowLast}>
                  <Text style={[s.td, { flex: 1, color: C.gray400 }]}>No line items</Text>
                </View>
              ) : (
                lineItems.map((li, i) => {
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
                })
              )}
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
                  <Text style={[s.totalsValue, { color: C.green }]}>-{fmt(discount)}</Text>
                </View>
              )}
              {n(estimate.tax_rate) > 0 && (
                <View style={s.totalsRow}>
                  <Text style={s.totalsLabel}>Tax ({estimate.tax_rate}%)</Text>
                  <Text style={s.totalsValue}>{fmt(tax)}</Text>
                </View>
              )}
              <View style={s.totalsRowFinal}>
                <Text style={s.totalsLabelFinal}>TOTAL</Text>
                <Text style={s.totalsValueFinal}>{fmt(total)}</Text>
              </View>
            </View>
          </View>

          {/* Notes */}
          {estimate.notes && (
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Notes & Terms</Text>
              </View>
              <View style={s.notesBox}>
                <Text style={s.notesText}>{estimate.notes}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <View style={s.footerLeft}>
            <Text style={s.footerBold}>{business.name}</Text>
            {businessAddress && <Text style={s.footerText}>{businessAddress}</Text>}
          </View>
          <Text style={s.pageNum} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

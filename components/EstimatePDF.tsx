import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

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
  return "$" + v.toFixed(2);
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#2d5a3d",
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d5a3d",
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
    backgroundColor: "#f3f4f6",
    padding: 6,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: 100,
    color: "#666",
  },
  value: {
    flex: 1,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: 8,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: "center" },
  colPrice: { flex: 1, textAlign: "right" },
  colTotal: { flex: 1, textAlign: "right" },
  totals: {
    marginTop: 20,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    width: 200,
    justifyContent: "space-between",
    marginBottom: 4,
  },
  totalLabel: {
    color: "#666",
  },
  totalValue: {
    fontWeight: "bold",
  },
  grandTotal: {
    flexDirection: "row",
    width: 200,
    justifyContent: "space-between",
    borderTopWidth: 2,
    borderTopColor: "#2d5a3d",
    paddingTop: 8,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: "bold",
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2d5a3d",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#999",
    fontSize: 9,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
});

export function EstimatePDF({ estimate, lineItems, business }: Props) {
  const subtotal = lineItems.reduce((sum, li) => sum + n(li.quantity) * n(li.unitPrice), 0);
  const discount = n(estimate.discount_amount);
  const taxRate = n(estimate.tax_rate);
  const tax = (subtotal - discount) * (taxRate / 100);
  const total = subtotal - discount + tax;

  const estNum = "EST-" + estimate.id.replace(/-/g, "").slice(0, 8).toUpperCase();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{business.name}</Text>
          <Text style={styles.subtitle}>Estimate {estNum}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{estimate.customer_name}</Text>
          </View>
          {estimate.customer_email && (
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{estimate.customer_email}</Text>
            </View>
          )}
          {estimate.customer_phone && (
            <View style={styles.row}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{estimate.customer_phone}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estimate Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Title:</Text>
            <Text style={styles.value}>{estimate.title}</Text>
          </View>
          {estimate.description && (
            <View style={styles.row}>
              <Text style={styles.label}>Description:</Text>
              <Text style={styles.value}>{estimate.description}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>{estimate.status}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Line Items</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colDesc}>Description</Text>
              <Text style={styles.colQty}>Qty</Text>
              <Text style={styles.colPrice}>Price</Text>
              <Text style={styles.colTotal}>Total</Text>
            </View>
            {lineItems.length === 0 ? (
              <View style={styles.tableRow}>
                <Text style={{ color: "#999" }}>No line items</Text>
              </View>
            ) : (
              lineItems.map((li, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={styles.colDesc}>{li.description}</Text>
                  <Text style={styles.colQty}>{li.quantity}</Text>
                  <Text style={styles.colPrice}>{fmt(n(li.unitPrice))}</Text>
                  <Text style={styles.colTotal}>{fmt(n(li.quantity) * n(li.unitPrice))}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{fmt(subtotal)}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount:</Text>
              <Text style={styles.totalValue}>-{fmt(discount)}</Text>
            </View>
          )}
          {taxRate > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({taxRate}%):</Text>
              <Text style={styles.totalValue}>{fmt(tax)}</Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Total:</Text>
            <Text style={styles.grandTotalValue}>{fmt(total)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>{business.name}</Text>
          {business.phone && <Text>{business.phone}</Text>}
        </View>
      </Page>
    </Document>
  );
}

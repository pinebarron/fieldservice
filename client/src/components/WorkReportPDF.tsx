import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Line,
  Svg,
} from "@react-pdf/renderer";
import { type WorkLog, type PhotoMeta } from "@shared/schema";

const C = {
  primary:   "#1e40af",
  primaryLt: "#dbeafe",
  amber:     "#d97706",
  amberLt:   "#fef3c7",
  blue:      "#2563eb",
  blueLt:    "#eff6ff",
  green:     "#16a34a",
  greenLt:   "#dcfce7",
  gray50:    "#f9fafb",
  gray100:   "#f3f4f6",
  gray200:   "#e5e7eb",
  gray300:   "#d1d5db",
  gray500:   "#6b7280",
  gray700:   "#374151",
  gray900:   "#111827",
  white:     "#ffffff",
  black:     "#000000",
};

const s = StyleSheet.create({
  page: {
    fontSize: 9,
    color: C.gray900,
    backgroundColor: C.white,
    paddingBottom: 56,
  },

  // ── Header / Letterhead ──────────────────────────────────────────
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
  lhFormTitle: { fontSize: 12, fontWeight: 700, color: C.white, letterSpacing: 1 },
  lhOrderNum: { fontSize: 8, color: "#93c5fd", marginTop: 3 },

  // ── Status banner ───────────────────────────────────────────────
  statusBanner: {
    backgroundColor: C.primaryLt,
    paddingHorizontal: 36,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: C.gray200,
  },
  statusLeft: { fontSize: 8, color: C.primary, fontWeight: 600 },
  statusRight: { flexDirection: "row", gap: 16 },
  statusItem: { fontSize: 8, color: C.gray700 },
  statusLabel: { fontWeight: 600 },

  // ── Body ────────────────────────────────────────────────────────
  body: { paddingHorizontal: 36, paddingTop: 18 },

  // ── Section ─────────────────────────────────────────────────────
  section: { marginBottom: 14 },
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

  // ── Form grid (bordered cells) ───────────────────────────────────
  formBorder: {
    borderWidth: 1,
    borderColor: C.gray300,
  },
  formRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.gray200,
  },
  formRowLast: {
    flexDirection: "row",
  },
  formCell: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRightWidth: 1,
    borderRightColor: C.gray200,
  },
  formCellLast: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  formCellFull: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  fieldLabel: {
    fontSize: 7,
    fontWeight: 700,
    color: C.gray500,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 9.5,
    color: C.gray900,
  },
  fieldValueBold: {
    fontSize: 9.5,
    fontWeight: 700,
    color: C.gray900,
  },

  // ── Text area (work performed / notes) ──────────────────────────
  textAreaBox: {
    borderWidth: 1,
    borderColor: C.gray300,
    minHeight: 60,
    padding: 10,
  },
  textAreaContent: { fontSize: 9.5, color: C.gray700, lineHeight: 1.6 },

  // ── Photo zones ──────────────────────────────────────────────────
  photoSection: { marginBottom: 14 },
  photoZoneBox: {
    borderWidth: 1,
    borderColor: C.gray300,
    marginBottom: 10,
    overflow: "hidden",
  },
  photoZoneHeader: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  photoZoneTitle: { fontSize: 8.5, fontWeight: 700, color: C.white },
  photoZoneCount: { marginLeft: "auto", fontSize: 7.5, color: C.white, opacity: 0.85 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, padding: 8 },
  photoItem: { alignItems: "center" },
  photoImg: { width: 140, height: 100, objectFit: "cover" },
  photoMeta: { fontSize: 6.5, color: C.gray500, marginTop: 2, textAlign: "center", width: 140 },
  photoGps:  { fontSize: 6, color: C.gray400, textAlign: "center", width: 140 },

  // ── Signature section ────────────────────────────────────────────
  sigSection: {
    borderWidth: 1,
    borderColor: C.gray300,
    marginTop: 4,
  },
  sigRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: C.gray200,
  },
  sigCell: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    borderRightWidth: 1,
    borderRightColor: C.gray200,
  },
  sigCellLast: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  sigLabel: { fontSize: 7, fontWeight: 700, color: C.gray500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 20 },
  sigLine: { borderBottomWidth: 1, borderBottomColor: C.black, marginBottom: 3 },
  sigCaption: { fontSize: 7, color: C.gray500 },
  certText: {
    fontSize: 8,
    color: C.gray700,
    lineHeight: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

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
  footerText: { fontSize: 7.5, color: C.gray500 },
  footerBold: { fontSize: 7.5, color: C.primary, fontWeight: 600 },
  pageNum: { fontSize: 7.5, color: C.gray400 },
});

// ── Helpers ──────────────────────────────────────────────────────────
function absUrl(url: string) {
  if (url.startsWith("http")) return url;
  return `${window.location.origin}${url}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function fmtTs(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function orderNum(id: string) {
  return "WO-" + id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

// ── Component ────────────────────────────────────────────────────────
interface Props {
  workLog: WorkLog;
  businessName?: string;
}

export function WorkReportPDF({ workLog, businessName }: Props) {
  const meta: PhotoMeta[] = workLog.photoMetadata || [];
  const urls = workLog.imageUrls || [];
  const photos = urls.map((url, i) => ({
    url,
    meta: meta[i] ?? { url, type: "general" as const, capturedAt: new Date().toISOString() },
  }));

  const before = photos.filter(p => p.meta.type === "before");
  const during = photos.filter(p => p.meta.type === "general");
  const after  = photos.filter(p => p.meta.type === "after");

  const techFirst = (workLog as any).technician?.firstName ?? "";
  const techLast  = (workLog as any).technician?.lastName  ?? "";
  const techName  = [techFirst, techLast].filter(Boolean).join(" ") || "—";

  const generatedAt = new Date().toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });

  const zones = [
    { list: before, label: "Before Work",    bg: C.amber, },
    { list: during, label: "During Work",    bg: C.blue,  },
    { list: after,  label: "After Complete", bg: C.green, },
  ].filter(z => z.list.length > 0);

  return (
    <Document title={`Work Order — ${workLog.customerName}`} author={businessName}>
      <Page size="A4" style={s.page}>

        {/* ── Letterhead ── */}
        <View style={s.letterhead}>
          <View style={s.lhLeft}>
            <Text style={s.lhCompany}>{businessName || "FieldCapture"}</Text>
            <Text style={s.lhTagline}>Field Service Management · Professional Work Documentation</Text>
          </View>
          <View style={s.lhRight}>
            <Text style={s.lhFormTitle}>SERVICE COMPLETION FORM</Text>
            <Text style={s.lhOrderNum}>Order #: {orderNum(workLog.id)}</Text>
          </View>
        </View>

        {/* ── Status banner ── */}
        <View style={s.statusBanner}>
          <Text style={s.statusLeft}>
            ● {workLog.status === "completed" ? "WORK COMPLETED" : workLog.status.toUpperCase()}
          </Text>
          <View style={s.statusRight}>
            <Text style={s.statusItem}><Text style={s.statusLabel}>Service Date: </Text>{fmtDate(workLog.serviceDate)}</Text>
            <Text style={s.statusItem}><Text style={s.statusLabel}>Generated: </Text>{generatedAt}</Text>
          </View>
        </View>

        <View style={s.body}>

          {/* ── Section 1: Customer & Site Information ── */}
          <View style={s.section}>
            <View style={s.sectionHeader}><Text style={s.sectionTitle}>1. Customer &amp; Site Information</Text></View>
            <View style={s.formBorder}>
              <View style={s.formRow}>
                <View style={s.formCell}>
                  <Text style={s.fieldLabel}>Customer Name</Text>
                  <Text style={s.fieldValueBold}>{workLog.customerName}</Text>
                </View>
                <View style={s.formCellLast}>
                  <Text style={s.fieldLabel}>Work Type</Text>
                  <Text style={s.fieldValue}>{workLog.workType}</Text>
                </View>
              </View>
              <View style={s.formRow}>
                <View style={s.formCell}>
                  <Text style={s.fieldLabel}>Site / Location Name</Text>
                  <Text style={s.fieldValue}>{workLog.locationName}</Text>
                </View>
                <View style={s.formCellLast}>
                  <Text style={s.fieldLabel}>Address</Text>
                  <Text style={s.fieldValue}>{workLog.city}, {workLog.state} {workLog.zipCode}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Section 2: Service Details ── */}
          <View style={s.section}>
            <View style={s.sectionHeader}><Text style={s.sectionTitle}>2. Service Details</Text></View>
            <View style={s.formBorder}>
              <View style={s.formRow}>
                <View style={s.formCell}>
                  <Text style={s.fieldLabel}>Assigned Technician</Text>
                  <Text style={s.fieldValueBold}>{techName}</Text>
                </View>
                <View style={s.formCell}>
                  <Text style={s.fieldLabel}>Service Date</Text>
                  <Text style={s.fieldValue}>{fmtDate(workLog.serviceDate)}</Text>
                </View>
                <View style={s.formCellLast}>
                  <Text style={s.fieldLabel}>Hours on Site</Text>
                  <Text style={s.fieldValue}>
                    {workLog.startTime && workLog.endTime
                      ? `${workLog.startTime} – ${workLog.endTime}`
                      : workLog.startTime || workLog.endTime || "Not recorded"}
                  </Text>
                </View>
              </View>
              <View style={s.formRowLast}>
                <View style={s.formCell}>
                  <Text style={s.fieldLabel}>Completion Status</Text>
                  <Text style={s.fieldValue}>
                    {workLog.status === "completed" ? "Work Completed Successfully" : workLog.status}
                  </Text>
                </View>
                <View style={s.formCellLast}>
                  <Text style={s.fieldLabel}>Work Order #</Text>
                  <Text style={s.fieldValue}>{orderNum(workLog.id)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Section 3: Work Performed ── */}
          <View style={s.section}>
            <View style={s.sectionHeader}><Text style={s.sectionTitle}>3. Description of Work Performed</Text></View>
            <View style={s.textAreaBox}>
              <Text style={s.textAreaContent}>{workLog.workPerformed}</Text>
            </View>
          </View>

          {/* ── Section 4: Additional Notes ── */}
          {workLog.additionalNotes && (
            <View style={s.section}>
              <View style={s.sectionHeader}><Text style={s.sectionTitle}>4. Additional Notes &amp; Observations</Text></View>
              <View style={s.textAreaBox}>
                <Text style={s.textAreaContent}>{workLog.additionalNotes}</Text>
              </View>
            </View>
          )}

          {/* ── Section 5: Photo Documentation ── */}
          {zones.length > 0 && (
            <View style={s.photoSection}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>
                  {workLog.additionalNotes ? "5" : "4"}. Photo Documentation ({photos.length} photo{photos.length !== 1 ? "s" : ""})
                </Text>
              </View>
              {zones.map(({ list, label, bg }) => (
                <View key={label} style={s.photoZoneBox}>
                  <View style={[s.photoZoneHeader, { backgroundColor: bg }]}>
                    <Text style={s.photoZoneTitle}>{label}</Text>
                    <Text style={s.photoZoneCount}>{list.length} photo{list.length !== 1 ? "s" : ""}</Text>
                  </View>
                  <View style={s.photoGrid}>
                    {list.map(({ url, meta: m }, i) => (
                      <View key={i} style={s.photoItem}>
                        <Image src={absUrl(url)} style={s.photoImg} />
                        <Text style={s.photoMeta}>
                          {new Date(m.capturedAt).toLocaleString("en-US", {
                            month: "short", day: "numeric",
                            hour: "numeric", minute: "2-digit", hour12: true,
                          })}
                          {m.technicianName ? `  ·  ${m.technicianName}` : ""}
                        </Text>
                        {m.lat !== undefined && (
                          <Text style={s.photoGps}>
                            📍 {m.address || `${m.lat.toFixed(5)}, ${m.lng?.toFixed(5)}`}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── Certification & Signatures ── */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>
                {(() => {
                  const base = zones.length > 0 ? 1 : 0;
                  const notes = workLog.additionalNotes ? 1 : 0;
                  return (4 + base + notes).toString();
                })()} . Certification &amp; Authorization
              </Text>
            </View>
            <View style={s.sigSection}>
              <Text style={s.certText}>
                By signing below, the technician certifies that all work described in this document has been completed to the best of their ability and in accordance with applicable standards. The customer signature acknowledges that the described work was performed at the site on the date indicated and that the work meets their satisfaction, unless concerns are noted below.
              </Text>

              {/* Signature row */}
              <View style={s.sigRow}>
                <View style={s.sigCell}>
                  <Text style={s.sigLabel}>Technician Signature</Text>
                  <View style={s.sigLine} />
                  <Text style={s.sigCaption}>{techName}</Text>
                </View>
                <View style={s.sigCell}>
                  <Text style={s.sigLabel}>Customer Signature</Text>
                  <View style={s.sigLine} />
                  <Text style={s.sigCaption}>Printed name &amp; signature</Text>
                </View>
                <View style={s.sigCellLast}>
                  <Text style={s.sigLabel}>Date of Acceptance</Text>
                  <View style={s.sigLine} />
                  <Text style={s.sigCaption}>MM / DD / YYYY</Text>
                </View>
              </View>

              {/* Concerns row */}
              <View style={[s.sigRow, { borderTopColor: C.gray200, borderTopWidth: 1 }]}>
                <View style={[s.sigCellLast, { minHeight: 36 }]}>
                  <Text style={s.sigLabel}>Customer Comments / Concerns (if any)</Text>
                  <View style={s.sigLine} />
                </View>
              </View>
            </View>
          </View>

        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerBold}>{businessName || "FieldCapture"}</Text>
          <Text style={s.footerText}>Work Order {orderNum(workLog.id)}  ·  {fmtDate(workLog.serviceDate)}  ·  {workLog.customerName}</Text>
          <Text style={s.pageNum} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>

      </Page>
    </Document>
  );
}

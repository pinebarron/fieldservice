import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { type WorkLog, type PhotoMeta } from "@shared/schema";

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff", fontWeight: 700 },
  ],
});

const C = {
  primary: "#2563eb",
  amber: "#d97706",
  blue: "#2563eb",
  green: "#16a34a",
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  gray700: "#374151",
  gray900: "#111827",
  white: "#ffffff",
};

const s = StyleSheet.create({
  page: { fontFamily: "Inter", fontSize: 9, color: C.gray900, backgroundColor: C.white, paddingBottom: 48 },
  header: { backgroundColor: C.primary, paddingHorizontal: 32, paddingVertical: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: 700, color: C.white, letterSpacing: 0.5 },
  headerSub: { fontSize: 9, color: "#bfdbfe", marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  headerDate: { fontSize: 9, color: "#bfdbfe" },
  headerStatus: { marginTop: 4, backgroundColor: "#1d4ed8", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  headerStatusText: { fontSize: 8, color: C.white, fontWeight: 600 },

  body: { paddingHorizontal: 32, paddingTop: 24 },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 8, fontWeight: 700, color: C.gray500, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: C.gray200, paddingBottom: 4 },

  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 0 },
  infoCell: { width: "50%", paddingRight: 16, marginBottom: 12 },
  infoLabel: { fontSize: 7.5, fontWeight: 600, color: C.gray500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: 9.5, color: C.gray900, fontWeight: 400 },

  textBox: { backgroundColor: C.gray50, borderRadius: 6, padding: 12, borderWidth: 1, borderColor: C.gray200 },
  textBoxContent: { fontSize: 9.5, color: C.gray700, lineHeight: 1.6 },

  photoZone: { marginBottom: 14 },
  photoZoneHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6 },
  photoZoneLabel: { fontSize: 9, fontWeight: 700, color: C.white, marginLeft: 4 },
  photoZoneCount: { marginLeft: "auto", fontSize: 8, color: C.white, opacity: 0.8 },
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  photoThumb: { width: 150, height: 110, borderRadius: 6, objectFit: "cover" },
  photoCaption: { fontSize: 7, color: C.gray500, marginTop: 2, textAlign: "center", width: 150 },

  gpsTag: { fontSize: 7, color: C.gray400, marginTop: 1, textAlign: "center", width: 150 },

  footer: { position: "absolute", bottom: 0, left: 0, right: 0, height: 40, backgroundColor: C.gray100, borderTopWidth: 1, borderTopColor: C.gray200, flexDirection: "row", alignItems: "center", paddingHorizontal: 32, justifyContent: "space-between" },
  footerText: { fontSize: 7.5, color: C.gray400 },

  divider: { borderBottomWidth: 1, borderBottomColor: C.gray200, marginBottom: 16 },

  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: "flex-start" },
  badgeText: { fontSize: 8.5, fontWeight: 600 },
});

function absUrl(url: string) {
  if (url.startsWith("http")) return url;
  return `${window.location.origin}${url}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatTs(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
}

interface Props {
  workLog: WorkLog;
  businessName?: string;
}

export function WorkReportPDF({ workLog, businessName }: Props) {
  const meta: PhotoMeta[] = workLog.photoMetadata || [];
  const urls = workLog.imageUrls || [];

  const photos = urls.map((url, i) => ({ url, meta: meta[i] ?? { url, type: "general" as const, capturedAt: new Date().toISOString() } }));

  const before = photos.filter(p => p.meta.type === "before");
  const during = photos.filter(p => p.meta.type === "general");
  const after  = photos.filter(p => p.meta.type === "after");

  const techName = [(workLog as any).technician?.firstName, (workLog as any).technician?.lastName].filter(Boolean).join(" ") || "—";
  const generatedAt = new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });

  const zones = [
    { list: before, label: "Before Work", bg: C.amber, icon: "⏳" },
    { list: during, label: "During Work", bg: C.blue,  icon: "📷" },
    { list: after,  label: "After Complete", bg: C.green, icon: "✅" },
  ].filter(z => z.list.length > 0);

  return (
    <Document title={`Work Report — ${workLog.customerName}`} author={businessName}>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.headerTitle}>{businessName || "FieldCapture"}</Text>
            <Text style={s.headerSub}>Work Completion Report</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerDate}>Service Date: {formatDate(workLog.serviceDate)}</Text>
            <View style={s.headerStatus}>
              <Text style={s.headerStatusText}>
                {workLog.status === "completed" ? "✓ Completed" : workLog.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={s.body}>

          {/* Job Details */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Job Information</Text>
            <View style={s.infoGrid}>
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>Customer</Text>
                <Text style={s.infoValue}>{workLog.customerName}</Text>
              </View>
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>Work Type</Text>
                <Text style={s.infoValue}>{workLog.workType}</Text>
              </View>
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>Location</Text>
                <Text style={s.infoValue}>{workLog.locationName}{"\n"}{workLog.city}, {workLog.state} {workLog.zipCode}</Text>
              </View>
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>Technician</Text>
                <Text style={s.infoValue}>{techName}</Text>
              </View>
              {(workLog.startTime || workLog.endTime) && (
                <View style={s.infoCell}>
                  <Text style={s.infoLabel}>Hours</Text>
                  <Text style={s.infoValue}>{workLog.startTime || "—"} → {workLog.endTime || "—"}</Text>
                </View>
              )}
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>Report Generated</Text>
                <Text style={s.infoValue}>{generatedAt}</Text>
              </View>
            </View>
          </View>

          {/* Work Performed */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Work Performed</Text>
            <View style={s.textBox}>
              <Text style={s.textBoxContent}>{workLog.workPerformed}</Text>
            </View>
          </View>

          {/* Additional Notes */}
          {workLog.additionalNotes && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Additional Notes</Text>
              <View style={s.textBox}>
                <Text style={s.textBoxContent}>{workLog.additionalNotes}</Text>
              </View>
            </View>
          )}

          {/* Photos */}
          {zones.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Job Photos ({photos.length} total)</Text>
              {zones.map(({ list, label, bg, icon }) => (
                <View key={label} style={s.photoZone}>
                  <View style={[s.photoZoneHeader, { backgroundColor: bg }]}>
                    <Text style={{ fontSize: 9, color: C.white }}>{icon}</Text>
                    <Text style={s.photoZoneLabel}>{label}</Text>
                    <Text style={s.photoZoneCount}>{list.length} photo{list.length !== 1 ? "s" : ""}</Text>
                  </View>
                  <View style={s.photoRow}>
                    {list.map(({ url, meta: m }, i) => (
                      <View key={i}>
                        <Image src={absUrl(url)} style={s.photoThumb} />
                        <Text style={s.photoCaption}>
                          {new Date(m.capturedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true })}
                        </Text>
                        {m.lat !== undefined && (
                          <Text style={s.gpsTag}>📍 {m.lat.toFixed(4)}, {m.lng?.toFixed(4)}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{businessName || "FieldCapture"} · Confidential Work Report</Text>
          <Text style={s.footerText}>Generated {generatedAt}</Text>
        </View>

      </Page>
    </Document>
  );
}

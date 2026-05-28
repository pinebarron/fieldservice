'use client';

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

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
  gray400:   "#9ca3af",
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
  body: { paddingHorizontal: 36, paddingTop: 18 },
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
  textAreaBox: {
    borderWidth: 1,
    borderColor: C.gray300,
    minHeight: 60,
    padding: 10,
  },
  textAreaContent: { fontSize: 9.5, color: C.gray700, lineHeight: 1.6 },
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

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function orderNum(id: string) {
  return "WO-" + id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

// Format form field value for display in PDF
function formatFieldValue(value: unknown, field: FormField): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  // Handle checkbox
  if (field.type === 'checkbox') {
    return value === true || value === 'true' ? 'Yes' : 'No';
  }

  // Handle select/radio - show option label instead of value
  if ((field.type === 'select' || field.type === 'radio') && field.options) {
    const option = field.options.find(opt => opt.value === value);
    return option?.label || String(value);
  }

  // Handle multiselect - show comma-separated labels
  if (field.type === 'multiselect' && Array.isArray(value) && field.options) {
    return value
      .map(v => field.options!.find(opt => opt.value === v)?.label || v)
      .join(', ') || '—';
  }

  // Handle date
  if (field.type === 'date' && typeof value === 'string') {
    return fmtDate(value);
  }

  // Handle photo - just show count
  if (field.type === 'photo' && Array.isArray(value)) {
    return `${value.length} photo${value.length !== 1 ? 's' : ''} attached`;
  }

  // Handle GPS
  if (field.type === 'gps' && typeof value === 'object' && value !== null) {
    const gps = value as { lat?: number; lng?: number };
    if (gps.lat && gps.lng) {
      return `${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)}`;
    }
  }

  // Default - convert to string
  return String(value);
}

interface PhotoMeta {
  url: string;
  type: 'before' | 'after' | 'general';
  fieldLabel?: string;
  capturedAt: string;
}

interface FormField {
  id: string;
  label: string;
  type: string;
  options?: { label: string; value: string }[];
  sectionId?: string;
}

interface FormSubmission {
  id: string;
  template_id: string;
  responses: Record<string, unknown>;
  submitted_at: string;
  form_templates?: {
    name: string;
    schema: { fields: FormField[]; sections?: { id: string; title: string }[] };
  };
}

interface WorkLog {
  id: string;
  customer_name: string;
  work_type: string;
  location_name: string;
  city: string;
  state: string;
  zip_code: string;
  service_date: string;
  start_time: string | null;
  end_time: string | null;
  status: string;
  work_performed: string;
  additional_notes: string | null;
  photo_metadata: PhotoMeta[] | null;
  form_submissions?: FormSubmission[];
}

interface BusinessInfo {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  logoUrl?: string;
}

interface Props {
  workLog: WorkLog;
  business?: BusinessInfo;
}

function WorkReportDocument({ workLog, business }: Props) {
  const businessName = business?.name || 'FieldService';
  const photos = workLog.photo_metadata || [];

  // Group photos by fieldLabel (or fallback to type-based labels for legacy photos)
  const photosByLabel = photos.reduce((acc, photo) => {
    const label = photo.fieldLabel || (photo.type === 'before' ? 'Before Photos' : photo.type === 'after' ? 'After Photos' : 'Other Photos');
    if (!acc[label]) {
      acc[label] = { list: [], type: photo.type };
    }
    acc[label].list.push(photo);
    return acc;
  }, {} as Record<string, { list: PhotoMeta[]; type: string }>);

  const generatedAt = new Date().toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });

  // Create zones from grouped photos with appropriate colors
  const zones = Object.entries(photosByLabel).map(([label, { list, type }]) => ({
    list,
    label,
    bg: type === 'before' ? C.amber : type === 'after' ? C.green : C.blue,
  }));

  // Calculate section numbers dynamically
  // 1. Customer & Site Information
  // 2. Service Details
  // 3. Work Performed
  // 4. Additional Notes (if present)
  // 5+. Form Submissions (one section each)
  // Photo Documentation
  // Certification
  const formSubmissionCount = workLog.form_submissions?.length || 0;
  let nextSectionNum = 4; // Start after "Work Performed"
  if (workLog.additional_notes) nextSectionNum++;
  const formSectionStart = nextSectionNum;
  nextSectionNum += formSubmissionCount;
  const photoSectionNum = zones.length > 0 ? nextSectionNum++ : 0;
  const certSectionNum = nextSectionNum;

  return (
    <Document title={`Work Order — ${workLog.customer_name}`} author={businessName}>
      <Page size="A4" style={s.page}>
        {/* Letterhead */}
        <View style={s.letterhead}>
          <View style={s.lhLeft}>
            <Text style={s.lhCompany}>{businessName}</Text>
            {business?.address && (
              <Text style={s.lhTagline}>{business.address}</Text>
            )}
            {(business?.city || business?.state || business?.zipCode) && (
              <Text style={s.lhTagline}>
                {[business.city, business.state].filter(Boolean).join(', ')}{business.zipCode ? ` ${business.zipCode}` : ''}
              </Text>
            )}
            {business?.phone && (
              <Text style={s.lhTagline}>{business.phone}</Text>
            )}
          </View>
          <View style={s.lhRight}>
            <Text style={s.lhFormTitle}>SERVICE COMPLETION FORM</Text>
            <Text style={s.lhOrderNum}>Order #: {orderNum(workLog.id)}</Text>
          </View>
        </View>

        {/* Status banner */}
        <View style={s.statusBanner}>
          <Text style={s.statusLeft}>
            {workLog.status === "completed" ? "WORK COMPLETED" : workLog.status.toUpperCase()}
          </Text>
          <View style={s.statusRight}>
            <Text style={s.statusItem}><Text style={s.statusLabel}>Service Date: </Text>{fmtDate(workLog.service_date)}</Text>
            <Text style={s.statusItem}><Text style={s.statusLabel}>Generated: </Text>{generatedAt}</Text>
          </View>
        </View>

        <View style={s.body}>
          {/* Section 1: Customer & Site Information */}
          <View style={s.section}>
            <View style={s.sectionHeader}><Text style={s.sectionTitle}>1. Customer &amp; Site Information</Text></View>
            <View style={s.formBorder}>
              <View style={s.formRow}>
                <View style={s.formCell}>
                  <Text style={s.fieldLabel}>Customer Name</Text>
                  <Text style={s.fieldValueBold}>{workLog.customer_name}</Text>
                </View>
                <View style={s.formCellLast}>
                  <Text style={s.fieldLabel}>Work Type</Text>
                  <Text style={s.fieldValue}>{workLog.work_type}</Text>
                </View>
              </View>
              <View style={s.formRowLast}>
                <View style={s.formCell}>
                  <Text style={s.fieldLabel}>Site / Location Name</Text>
                  <Text style={s.fieldValue}>{workLog.location_name}</Text>
                </View>
                <View style={s.formCellLast}>
                  <Text style={s.fieldLabel}>Address</Text>
                  <Text style={s.fieldValue}>{workLog.city}, {workLog.state} {workLog.zip_code}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Section 2: Service Details */}
          <View style={s.section}>
            <View style={s.sectionHeader}><Text style={s.sectionTitle}>2. Service Details</Text></View>
            <View style={s.formBorder}>
              <View style={s.formRow}>
                <View style={s.formCell}>
                  <Text style={s.fieldLabel}>Service Date</Text>
                  <Text style={s.fieldValue}>{fmtDate(workLog.service_date)}</Text>
                </View>
                <View style={s.formCell}>
                  <Text style={s.fieldLabel}>Hours on Site</Text>
                  <Text style={s.fieldValue}>
                    {workLog.start_time && workLog.end_time
                      ? `${workLog.start_time} – ${workLog.end_time}`
                      : workLog.start_time || workLog.end_time || "Not recorded"}
                  </Text>
                </View>
                <View style={s.formCellLast}>
                  <Text style={s.fieldLabel}>Work Order #</Text>
                  <Text style={s.fieldValue}>{orderNum(workLog.id)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Section 3: Work Performed */}
          <View style={s.section}>
            <View style={s.sectionHeader}><Text style={s.sectionTitle}>3. Description of Work Performed</Text></View>
            <View style={s.textAreaBox}>
              <Text style={s.textAreaContent}>{workLog.work_performed}</Text>
            </View>
          </View>

          {/* Section 4: Additional Notes */}
          {workLog.additional_notes && (
            <View style={s.section}>
              <View style={s.sectionHeader}><Text style={s.sectionTitle}>4. Additional Notes</Text></View>
              <View style={s.textAreaBox}>
                <Text style={s.textAreaContent}>{workLog.additional_notes}</Text>
              </View>
            </View>
          )}

          {/* Form Submission Data */}
          {workLog.form_submissions && workLog.form_submissions.length > 0 && workLog.form_submissions.map((submission, subIdx) => {
            const template = submission.form_templates;
            if (!template) return null;

            const fields = template.schema.fields || [];
            const sections = template.schema.sections || [];
            const sectionNum = formSectionStart + subIdx;

            // Filter out photo fields (they're shown in photo section)
            const displayFields = fields.filter(f => f.type !== 'photo' && f.type !== 'signature');

            // Group fields by section
            const fieldsBySection: Record<string, FormField[]> = {};
            const unsectionedFields: FormField[] = [];

            displayFields.forEach(field => {
              if (field.sectionId) {
                if (!fieldsBySection[field.sectionId]) {
                  fieldsBySection[field.sectionId] = [];
                }
                fieldsBySection[field.sectionId].push(field);
              } else {
                unsectionedFields.push(field);
              }
            });

            return (
              <View key={submission.id} style={s.section}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionTitle}>{sectionNum}. {template.name}</Text>
                </View>
                <View style={s.formBorder}>
                  {/* Render sectioned fields */}
                  {sections.map((section, sIdx) => {
                    const sectionFields = fieldsBySection[section.id] || [];
                    if (sectionFields.length === 0) return null;

                    return (
                      <View key={section.id}>
                        {/* Section sub-header */}
                        <View style={[s.formRow, { backgroundColor: C.gray50 }]}>
                          <View style={s.formCellLast}>
                            <Text style={[s.fieldLabel, { fontSize: 8, color: C.gray700 }]}>{section.title}</Text>
                          </View>
                        </View>
                        {/* Section fields in pairs */}
                        {sectionFields.reduce((rows: JSX.Element[], field, i) => {
                          if (i % 2 === 0) {
                            const nextField = sectionFields[i + 1];
                            const isLastRow = i >= sectionFields.length - 2;
                            rows.push(
                              <View key={field.id} style={isLastRow && sIdx === sections.length - 1 && unsectionedFields.length === 0 ? s.formRowLast : s.formRow}>
                                <View style={s.formCell}>
                                  <Text style={s.fieldLabel}>{field.label}</Text>
                                  <Text style={s.fieldValue}>{formatFieldValue(submission.responses[field.id], field)}</Text>
                                </View>
                                {nextField ? (
                                  <View style={s.formCellLast}>
                                    <Text style={s.fieldLabel}>{nextField.label}</Text>
                                    <Text style={s.fieldValue}>{formatFieldValue(submission.responses[nextField.id], nextField)}</Text>
                                  </View>
                                ) : (
                                  <View style={s.formCellLast} />
                                )}
                              </View>
                            );
                          }
                          return rows;
                        }, [])}
                      </View>
                    );
                  })}

                  {/* Render unsectioned fields */}
                  {unsectionedFields.length > 0 && (
                    <>
                      {unsectionedFields.reduce((rows: JSX.Element[], field, i) => {
                        if (i % 2 === 0) {
                          const nextField = unsectionedFields[i + 1];
                          const isLastRow = i >= unsectionedFields.length - 2;
                          rows.push(
                            <View key={field.id} style={isLastRow ? s.formRowLast : s.formRow}>
                              <View style={s.formCell}>
                                <Text style={s.fieldLabel}>{field.label}</Text>
                                <Text style={s.fieldValue}>{formatFieldValue(submission.responses[field.id], field)}</Text>
                              </View>
                              {nextField ? (
                                <View style={s.formCellLast}>
                                  <Text style={s.fieldLabel}>{nextField.label}</Text>
                                  <Text style={s.fieldValue}>{formatFieldValue(submission.responses[nextField.id], nextField)}</Text>
                                </View>
                              ) : (
                                <View style={s.formCellLast} />
                              )}
                            </View>
                          );
                        }
                        return rows;
                      }, [])}
                    </>
                  )}
                </View>
              </View>
            );
          })}

          {/* Photo Documentation */}
          {zones.length > 0 && (
            <View style={s.photoSection}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>
                  {photoSectionNum}. Photo Documentation ({photos.length} photo{photos.length !== 1 ? "s" : ""})
                </Text>
              </View>
              {zones.map(({ list, label, bg }) => (
                <View key={label} style={s.photoZoneBox}>
                  <View style={[s.photoZoneHeader, { backgroundColor: bg }]}>
                    <Text style={s.photoZoneTitle}>{label}</Text>
                    <Text style={s.photoZoneCount}>{list.length} photo{list.length !== 1 ? "s" : ""}</Text>
                  </View>
                  <View style={s.photoGrid}>
                    {list.map((photo, i) => (
                      <View key={i} style={s.photoItem}>
                        <Image src={photo.url} style={s.photoImg} />
                        <Text style={s.photoMeta}>
                          {new Date(photo.capturedAt).toLocaleString("en-US", {
                            month: "short", day: "numeric",
                            hour: "numeric", minute: "2-digit", hour12: true,
                          })}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Certification & Signatures */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>
                {certSectionNum}. Certification &amp; Authorization
              </Text>
            </View>
            <View style={s.sigSection}>
              <Text style={s.certText}>
                By signing below, the technician certifies that all work described in this document has been completed. The customer signature acknowledges that the work was performed and meets their satisfaction.
              </Text>
              <View style={s.sigRow}>
                <View style={s.sigCell}>
                  <Text style={s.sigLabel}>Technician Signature</Text>
                  {(() => {
                    // Look for technician signature in form submissions
                    const techSig = workLog.form_submissions?.flatMap(sub =>
                      sub.form_templates?.schema.fields
                        .filter(f => f.type === 'signature' && f.label.toLowerCase().includes('tech'))
                        .map(f => sub.responses[f.id] as string | undefined)
                    ).find(sig => sig);
                    return techSig ? (
                      <Image src={techSig} style={{ width: '100%', height: 40, objectFit: 'contain' }} />
                    ) : (
                      <View style={s.sigLine} />
                    );
                  })()}
                  <Text style={s.sigCaption}>Name &amp; Date</Text>
                </View>
                <View style={s.sigCell}>
                  <Text style={s.sigLabel}>Customer Signature</Text>
                  {(() => {
                    // Look for customer signature in form submissions
                    const custSig = workLog.form_submissions?.flatMap(sub =>
                      sub.form_templates?.schema.fields
                        .filter(f => f.type === 'signature' && f.label.toLowerCase().includes('customer'))
                        .map(f => sub.responses[f.id] as string | undefined)
                    ).find(sig => sig);
                    return custSig ? (
                      <Image src={custSig} style={{ width: '100%', height: 40, objectFit: 'contain' }} />
                    ) : (
                      <View style={s.sigLine} />
                    );
                  })()}
                  <Text style={s.sigCaption}>Name &amp; Date</Text>
                </View>
                <View style={s.sigCellLast}>
                  <Text style={s.sigLabel}>Date</Text>
                  <View style={s.sigLine} />
                  <Text style={s.sigCaption}>{workLog.service_date ? fmtDate(workLog.service_date) : 'MM / DD / YYYY'}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerBold}>{businessName || "FieldService"}</Text>
          <Text style={s.footerText}>Work Order {orderNum(workLog.id)} · {fmtDate(workLog.service_date)} · {workLog.customer_name}</Text>
          <Text style={s.pageNum} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function generateWorkReportPDF(workLog: WorkLog, business?: BusinessInfo): Promise<Blob> {
  const doc = <WorkReportDocument workLog={workLog} business={business} />;
  const blob = await pdf(doc).toBlob();
  return blob;
}

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

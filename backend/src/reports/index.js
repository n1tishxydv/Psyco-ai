/**
 * Psyco AI - Clinical Report Generator Interface
 * Authoritative report content is strictly stored as structured JSON/text in Firebase RTDB.
 * PDF rendering will occur ephemerally in memory without permanent cloud storage.
 */

export const reportGenerator = {
  getFormatPolicy: () => ({
    authoritativeStorage: 'STRUCTURED_JSON_IN_FIREBASE_RTDB',
    renderingMode: 'EPHEMERAL_STREAM_ON_DEMAND',
    permanentPdfStorageAllowed: false,
  }),

  generateReportPayload: (patientData, sessionNotes, treatmentPlan) => {
    return {
      reportId: `rep_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      format: 'STRUCTURED_CLINICAL_SUMMARY_V1',
      summary: 'Report text payload scaffolded for clinical review.',
    };
  },
};

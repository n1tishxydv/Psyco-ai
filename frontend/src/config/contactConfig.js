/**
 * Psyco AI — Centralized Platform Contact & Legal Metadata Configuration
 * 
 * IMPORTANT COMPLIANCE GUIDANCE:
 * - Do not describe the contact person as a licensed psychologist, registered medical practitioner,
 *   lawyer, Data Protection Officer (DPO), statutory Grievance Officer, or corporate legal representative
 *   unless independently confirmed by formal legal appointment.
 * - Do not invent company registration details (CIN/GSTIN), registered office addresses, or entity names.
 * - Designation is strictly "Psyco AI Platform Contact".
 */

export const contactConfig = {
  platformName: 'Psyco AI',
  platformTagline: 'Mental Health Practice Management Platform',
  designation: 'Psyco AI Platform Contact',
  contactPerson: 'Nitish Yadav',
  phone: '+91 9996844107',
  phoneHref: 'tel:+919996844107',
  email: 'n1tishxydv@gmail.com',
  emailHref: 'mailto:n1tishxydv@gmail.com',
  website: 'https://psyco-ai-staging.web.app',
  stagingBackend: 'https://psyco-ai.onrender.com',
  
  // Operational timezone & region
  operationalRegion: 'Asia/Kolkata (IST Standard Time)',
  
  // Categories for Support & Contact Inquiries
  inquiryCategories: [
    { value: 'general', label: 'General Enquiries' },
    { value: 'patient_support', label: 'Patient Support' },
    { value: 'psychologist_support', label: 'Psychologist Support' },
    { value: 'privacy_request', label: 'Privacy & Data Rights Requests' },
    { value: 'technical', label: 'Technical Issues' },
    { value: 'security_report', label: 'Security Reports' },
    { value: 'feedback', label: 'Feedback & Complaints' },
  ],

  // Emergency Disclaimer
  emergencyNotice: {
    title: 'Emergency Medical & Crisis Disclaimer',
    text: 'Psyco AI is a practice-management technology platform, not an emergency medical service or acute suicide prevention hotline. If you, a loved one, or a client are in immediate physical danger, severe distress, or experiencing thoughts of self-harm, please contact local emergency medical services or national helplines immediately.',
    indianHelplines: [
      { name: 'KIRAN (Mental Health Helpline by Govt. of India)', number: '1800-599-0019', tel: 'tel:18005990019' },
      { name: 'Tele-MANAS (Govt. of India Tele Mental Health)', number: '14416 / 1800-891-4416', tel: 'tel:14416' },
      { name: 'Emergency Services (India)', number: '112', tel: 'tel:112' },
    ],
  },
  
  // Documentation version and status
  legalStatus: {
    version: '1.0.0-staging',
    statusLabel: 'DRAFT — PENDING FORMAL LEGAL COUNSEL REVIEW',
    lastUpdated: 'October 31, 2026',
    reviewNotice: 'This document reflects the actual verified technical architecture of Psyco AI. Prior to commercial public launch, all legal policies require independent review and approval by qualified legal counsel.',
  },
};

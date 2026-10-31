import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/cards/Card';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { contactConfig } from '../../config/contactConfig';
import {
  FileText,
  Shield,
  Lock,
  Cpu,
  AlertTriangle,
  Search,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Printer,
  HelpCircle,
  Stethoscope,
  UserCheck,
  Building,
  Scale,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';

export const DOCUMENTATION_REGISTRY = [
  // 1. Legal Documents
  {
    id: 'privacy-policy',
    title: 'Privacy Policy',
    route: '/privacy-policy',
    category: 'Legal Documents',
    badgeVariant: 'teal',
    version: '1.0.0-staging',
    lastUpdated: 'October 31, 2026',
    status: 'Ready for Legal Review',
    description: 'Comprehensive disclosure of personal information collected, processed, and stored across patient, psychologist, and administrative roles, adhering to the zero-binary-media invariant.',
    icon: Shield,
    tags: ['privacy', 'data', 'dpdp', 'hipaa', 'collection', 'cookies'],
  },
  {
    id: 'terms-of-service',
    title: 'Terms of Service',
    route: '/terms',
    category: 'Legal Documents',
    badgeVariant: 'teal',
    version: '1.0.0-staging',
    lastUpdated: 'October 31, 2026',
    status: 'Ready for Legal Review',
    description: 'Platform terms governing account eligibility, clinician credentials, independent & clinic practice setups, appointment cancellations, intellectual property, and limitations of liability.',
    icon: Scale,
    tags: ['terms', 'legal', 'conditions', 'cancellation', 'liability', 'clinician'],
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable Use Policy',
    route: '/acceptable-use',
    category: 'Legal Documents',
    badgeVariant: 'teal',
    version: '1.0.0-staging',
    lastUpdated: 'October 31, 2026',
    status: 'Ready for Legal Review',
    description: 'Standards of ethical platform conduct prohibiting unauthorized clinical record access, data extraction, security probing, credential sharing, and abusive activities.',
    icon: Lock,
    tags: ['acceptable use', 'conduct', 'security', 'abuse', 'prohibited'],
  },
  {
    id: 'medical-disclaimer',
    title: 'Medical & Clinical Disclaimer',
    route: '/medical-disclaimer',
    category: 'Legal Documents',
    badgeVariant: 'amber',
    version: '1.0.0-staging',
    lastUpdated: 'October 31, 2026',
    status: 'Ready for Legal Review',
    description: 'Clear statement that Psyco AI is a practice-management technology platform, not an emergency medical service, acute suicide hotline, or autonomous medical diagnostic tool.',
    icon: AlertTriangle,
    tags: ['medical', 'emergency', 'disclaimer', 'crisis', 'helpline', 'diagnosis'],
  },

  // 2. Privacy and Data Protection
  {
    id: 'data-privacy-architecture',
    title: 'Data Privacy Architecture',
    route: '/data-privacy',
    category: 'Privacy and Data Protection',
    badgeVariant: 'green',
    version: '1.0.0-staging',
    lastUpdated: 'October 31, 2026',
    status: 'Implemented Architecture',
    description: 'Technical deep dive into the text/JSON storage invariant, administrative clinical lockout, Relationship-Based Access Control (ReBAC), and transient speech-to-text pipeline.',
    icon: Lock,
    tags: ['architecture', 'privacy', 'rtdb', 'lockout', 'rebac', 'text-only', 'encryption'],
  },
  {
    id: 'cookie-policy',
    title: 'Cookie and Tracking Policy',
    route: '/cookie-policy',
    category: 'Privacy and Data Protection',
    badgeVariant: 'green',
    version: '1.0.0-staging',
    lastUpdated: 'October 31, 2026',
    status: 'Ready for Legal Review',
    description: 'Detailed inventory of browser localStorage items, session security tokens, functional preferences, and verification of zero third-party tracking scripts.',
    icon: RefreshCw,
    tags: ['cookies', 'tracking', 'localstorage', 'session', 'tokens', 'analytics'],
  },
  {
    id: 'data-retention',
    title: 'Data Retention and Deletion Policy',
    route: '/data-retention',
    category: 'Privacy and Data Protection',
    badgeVariant: 'green',
    version: '1.0.0-staging',
    lastUpdated: 'October 31, 2026',
    status: 'Ready for Legal Review',
    description: 'Lifecycle schedules for account records, consultation metadata, audit trails, and the verified operational process for data correction and account deletion.',
    icon: RefreshCw,
    tags: ['retention', 'deletion', 'erasure', 'lifecycle', 'storage', 'audit'],
  },
  {
    id: 'privacy-requests',
    title: 'Data Rights and Privacy Requests',
    route: '/privacy-requests',
    category: 'Privacy and Data Protection',
    badgeVariant: 'green',
    version: '1.0.0-staging',
    lastUpdated: 'October 31, 2026',
    status: 'Ready for Legal Review',
    description: 'Step-by-step procedural guide for users to request access, correction, summary export, consent withdrawal, or erasure under applicable data protection frameworks.',
    icon: FileText,
    tags: ['rights', 'access', 'correction', 'erasure', 'grievance', 'request'],
  },

  // 3. Clinical Safety and AI Transparency
  {
    id: 'ai-transparency',
    title: 'AI Transparency and Clinical Safety',
    route: '/ai-transparency',
    category: 'Clinical Safety and AI Transparency',
    badgeVariant: 'teal',
    version: '1.0.0-staging',
    lastUpdated: 'October 31, 2026',
    status: 'Implemented Architecture',
    description: 'Detailed explanation of how Gemini AI drafts SOAP clinical notes under a strict Human-in-the-Loop (HITL) model where clinicians retain exclusive signing and editing authority.',
    icon: Cpu,
    tags: ['ai', 'transparency', 'gemini', 'copilot', 'soap', 'hitl', 'safety', 'prescribing'],
  },

  // 4. Security and Technical Architecture
  {
    id: 'accessibility',
    title: 'Accessibility Statement',
    route: '/accessibility',
    category: 'Security and Technical Architecture',
    badgeVariant: 'slate',
    version: '1.0.0-staging',
    lastUpdated: 'October 31, 2026',
    status: 'Implemented Architecture',
    description: 'Documentation of implemented keyboard navigation, focus management, screen-reader semantic hierarchies, and high-contrast dark mode accessibility features.',
    icon: HelpCircle,
    tags: ['accessibility', 'a11y', 'wcag', 'keyboard', 'screenreader', 'contrast'],
  },

  // 5. User Guides and Support
  {
    id: 'patient-guide',
    title: 'Patient Portal Experience & Guide',
    route: '/for-patients',
    category: 'User Guides and Support',
    badgeVariant: 'teal',
    version: '1.0.0-staging',
    lastUpdated: 'October 31, 2026',
    status: 'Implemented Feature',
    description: 'User manual guiding patients through clinician search, confidential intake completion, appointment booking, and accessing shared care plan goals.',
    icon: UserCheck,
    tags: ['guide', 'patient', 'booking', 'intake', 'portal'],
  },
  {
    id: 'psychologist-guide',
    title: 'Psychologist Portal & Practice Setup Guide',
    route: '/for-psychologists',
    category: 'User Guides and Support',
    badgeVariant: 'teal',
    version: '1.0.0-staging',
    lastUpdated: 'October 31, 2026',
    status: 'Implemented Feature',
    description: 'Practice setup manual covering independent practice configuration, clinic affiliations, availability scheduling, session documentation, and AI copilot usage.',
    icon: Stethoscope,
    tags: ['guide', 'psychologist', 'practice', 'clinic', 'calendar', 'notes'],
  },
  {
    id: 'admin-guide',
    title: 'Platform Administration & Governance Guide',
    route: '/admin-guide',
    category: 'User Guides and Support',
    badgeVariant: 'slate',
    version: '1.0.0-staging',
    lastUpdated: 'October 31, 2026',
    status: 'Implemented Feature',
    description: 'Governance guide detailing clinician verification, user account suspension, system audit log inspection, and the technical clinical lockout mechanism.',
    icon: Building,
    tags: ['guide', 'admin', 'governance', 'verification', 'audit', 'lockout'],
  },
];

export function DocumentationCentrePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = [
    'All',
    'Legal Documents',
    'Privacy and Data Protection',
    'Clinical Safety and AI Transparency',
    'Security and Technical Architecture',
    'User Guides and Support',
  ];

  const filteredDocs = useMemo(() => {
    return DOCUMENTATION_REGISTRY.filter((doc) => {
      const matchesCategory =
        selectedCategory === 'All' || doc.category === selectedCategory;
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        doc.title.toLowerCase().includes(term) ||
        doc.description.toLowerCase().includes(term) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(term));
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-2">
          <Badge variant="teal">Governance & Architecture</Badge>
          <Badge variant="outline" className="text-slate-400 font-mono text-[11px]">
            Ver. {contactConfig.legalStatus.version}
          </Badge>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-primaryText">
          Legal, Privacy & Documentation Centre
        </h1>
        <p className="text-sm sm:text-base text-secondaryText leading-relaxed">
          Explore complete architectural specifications, clinical safety protocols, data privacy policies,
          and operational documentation for Psyco AI.
        </p>
      </div>

      {/* Operational Disclaimer Banner */}
      <div className="p-4 rounded-2xl border border-mutedAmber/30 bg-mutedAmber/10 text-xs text-secondaryText flex items-start gap-3 max-w-4xl mx-auto">
        <AlertTriangle className="w-5 h-5 text-mutedAmber shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-primaryText text-xs sm:text-sm">
            Operational Documentation & Controlled Staging Status
          </p>
          <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
            All documents published here accurately document the verified features, data flow invariants,
            and security boundaries implemented in the Psyco AI staging codebase (Commit <code>4e9ff08</code>).
            Legal and statutory policies are operational drafts and must be reviewed by qualified legal counsel
            prior to unrestricted public commercial release.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents by title, keyword, or topic (e.g., ReBAC, Gemini, deletion, audit, cookies)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-primaryText placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-softTeal focus:border-transparent transition-all shadow-inner"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-softTeal text-slate-950 font-semibold shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-secondaryText hover:text-primaryText hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocs.map((doc) => {
          const Icon = doc.icon;
          return (
            <Card
              key={doc.id}
              className="bg-deepBlueGray/70 border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group"
            >
              <CardHeader className="space-y-3 pb-3">
                <div className="flex items-center justify-between w-full">
                  <div className="p-2 rounded-xl bg-slate-800/80 text-softTeal group-hover:bg-softTeal/20 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant={doc.badgeVariant} size="sm" className="text-[10px]">
                    {doc.category.split(' ')[0]}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <CardTitle className="text-base text-primaryText group-hover:text-softTeal transition-colors">
                    <Link to={doc.route} className="focus:outline-none">
                      {doc.title}
                    </Link>
                  </CardTitle>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Ver. {doc.version} • {doc.lastUpdated}
                  </p>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-0 flex-1 flex flex-col justify-between">
                <p className="text-xs text-secondaryText leading-relaxed line-clamp-3">
                  {doc.description}
                </p>

                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Document Status:</span>
                    <span className="font-semibold text-slate-300">{doc.status}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Link to={doc.route} className="w-full">
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full flex items-center justify-center gap-1.5 text-xs"
                      >
                        <span>Open Document</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredDocs.length === 0 && (
        <div className="py-12 text-center space-y-3 bg-slate-900/60 rounded-2xl border border-slate-800 max-w-md mx-auto">
          <FolderOpen className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-semibold text-primaryText">No Matching Documents</h3>
          <p className="text-xs text-secondaryText">
            No document matches "{searchTerm}". Try clearing your search query or selecting "All" categories.
          </p>
          <Button variant="outline" size="sm" onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}>
            Reset Search
          </Button>
        </div>
      )}

      {/* Contact and Legal Escalation Footer Banner */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-midnightNavy/90 flex flex-col sm:flex-row items-center justify-between gap-6 max-w-5xl mx-auto">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-sm font-bold text-primaryText flex items-center gap-2 justify-center sm:justify-start">
            <Lock className="w-4 h-4 text-softTeal" />
            Statutory Enquiries & Privacy Requests
          </h3>
          <p className="text-xs text-secondaryText max-w-xl leading-relaxed">
            For questions regarding our legal framework, to submit a data erasure request, or to report a security observation,
            contact <strong>{contactConfig.contactPerson}</strong> ({contactConfig.designation}).
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/privacy-requests">
            <Button variant="outline" size="sm" className="text-xs">
              Privacy Requests
            </Button>
          </Link>
          <Link to="/contact">
            <Button variant="primary" size="sm" className="text-xs">
              Contact Us
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

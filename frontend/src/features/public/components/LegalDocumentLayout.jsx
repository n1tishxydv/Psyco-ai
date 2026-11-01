import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../../components/cards/Card';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { contactConfig } from '../../../config/contactConfig';
import {
  ShieldAlert,
  Printer,
  Copy,
  Check,
  ChevronRight,
  ArrowLeft,
  Mail,
  Phone,
  FileText,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

export function LegalDocumentLayout({
  title,
  subtitle,
  category = 'Legal & Governance',
  lastUpdated = contactConfig.legalStatus.lastUpdated,
  version = contactConfig.legalStatus.version,
  toc = [],
  children,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8 print:p-0 print:m-0 print:max-w-none">
      {/* Top Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="print:hidden">
        <ol className="flex items-center gap-2 text-xs text-psyco-coolGrey">
          <li>
            <Link to="/" className="hover:text-psyco-softGrey transition-colors">Home</Link>
          </li>
          <li><ChevronRight className="w-3.5 h-3.5 text-psyco-steel" /></li>
          <li>
            <Link to="/legal" className="hover:text-psyco-softGrey transition-colors">Documentation Centre</Link>
          </li>
          <li><ChevronRight className="w-3.5 h-3.5 text-psyco-steel" /></li>
          <li className="text-psyco-softGrey font-medium truncate max-w-[200px] sm:max-w-none">
            {title}
          </li>
        </ol>
      </nav>

      {/* Header Block */}
      <div className="space-y-4 border-b border-psyco-steel/50 pb-6 print:border-none print:pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="teal">{category}</Badge>
            <Badge variant="outline" className="border-psyco-steel text-psyco-coolGrey font-mono text-[11px]">
              Ver. {version}
            </Badge>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={copied ? Check : Copy}
              onClick={handleCopyLink}
              className="text-xs"
            >
              {copied ? 'Link Copied' : 'Share'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Printer}
              onClick={handlePrint}
              className="text-xs"
            >
              Print / Save PDF
            </Button>
          </div>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-psyco-softGrey">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm sm:text-base text-psyco-coolGrey max-w-3xl leading-relaxed">
            {subtitle}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-psyco-coolGrey pt-1">
          <span>Effective Date: <strong className="text-psyco-softGrey">{lastUpdated}</strong></span>
          <span>Status: <strong className="text-amber-400 font-semibold">{contactConfig.legalStatus.statusLabel}</strong></span>
          <span>Platform: <strong className="text-psyco-softGrey">{contactConfig.platformName}</strong></span>
        </div>
      </div>

      {/* Mandatory Regulatory Review & Staging Disclaimer */}
      <div className="p-4 rounded-xl border border-amber-700/40 bg-amber-950/20 text-xs text-psyco-coolGrey space-y-1.5 print:border-slate-400 print:bg-white print:text-black">
        <div className="flex items-center gap-2 text-amber-400 font-semibold print:text-black">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Operational & Architectural Transparency Notice</span>
        </div>
        <p className="text-[11px] sm:text-xs leading-relaxed text-psyco-softGrey print:text-black">
          This document accurately reflects the technical architecture, data processing, and security controls implemented in Psyco AI. 
          As the platform is currently operating in controlled staging, this policy constitutes an operational draft and requires formal 
          review and approval by qualified legal counsel prior to unrestricted commercial deployment. Psyco AI makes no claims of 
          third-party statutory certifications (such as DPDP, HIPAA, SOC 2, or ISO 27001) at this stage.
        </p>
      </div>

      {/* Main Grid: Table of Contents + Document Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sticky Table of Contents (Desktop) */}
        {toc && toc.length > 0 && (
          <aside className="lg:col-span-1 hidden lg:block print:hidden">
            <div className="sticky top-24 space-y-3 p-4 rounded-xl border border-psyco-steel/70 bg-psyco-darkNavy/80 backdrop-blur-sm">
              <h2 className="text-xs font-semibold text-psyco-softGrey uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-psyco-coolGrey" />
                Table of Contents
              </h2>
              <nav className="space-y-1 text-xs">
                {toc.map((item, idx) => (
                  <a
                    key={idx}
                    href={`#${item.id}`}
                    className="block py-1 px-2 rounded-lg text-psyco-coolGrey hover:text-psyco-softGrey hover:bg-psyco-slate/60 transition-colors truncate"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
              <div className="pt-3 border-t border-psyco-steel/50">
                <Link
                  to="/legal"
                  className="flex items-center gap-1.5 text-xs text-psyco-softGrey hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> All Documentation
                </Link>
              </div>
            </div>
          </aside>
        )}

        {/* Content Body */}
        <main className={`space-y-8 ${toc && toc.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          <div className="prose prose-invert max-w-none text-psyco-softGrey text-xs sm:text-sm leading-relaxed space-y-6">
            {children}
          </div>

          {/* Contact & Legal Escalation Footer Block */}
          <div className="mt-12 pt-6 border-t border-psyco-steel/50 space-y-4 print:border-t print:border-black">
            <h3 className="text-sm font-semibold text-psyco-softGrey">Questions, Data Requests or Legal Inquiries</h3>
            <p className="text-xs text-psyco-coolGrey leading-relaxed">
              If you have any questions regarding this document, wish to exercise your data privacy rights, or need platform assistance:
            </p>
            <div className="p-4 rounded-xl border border-psyco-steel/70 bg-psyco-darkNavy/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-psyco-coolGrey font-medium">Designation:</p>
                <p className="text-psyco-softGrey font-semibold">{contactConfig.designation}</p>
                <p className="text-psyco-coolGrey mt-2 font-medium">Contact Person:</p>
                <p className="text-psyco-softGrey">{contactConfig.contactPerson}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-slate-400 font-medium">Direct Channels:</p>
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-softTeal" />
                  <a href={contactConfig.emailHref} className="text-softTeal hover:underline">
                    {contactConfig.email}
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-calmGreen" />
                  <a href={contactConfig.phoneHref} className="text-calmGreen hover:underline">
                    {contactConfig.phone}
                  </a>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 print:hidden">
              <Link to="/legal">
                <Button variant="ghost" size="sm" icon={ArrowLeft} className="text-xs">
                  Return to Documentation Centre
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="primary" size="sm" className="text-xs">
                  Submit Support Ticket
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

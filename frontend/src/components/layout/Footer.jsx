import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { contactConfig } from '../../config/contactConfig';
import { Shield, Lock, FileCheck, AlertCircle, Phone, Mail, Clock, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-midnightNavy text-secondaryText text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Grid: 5 Columns (Brand/Contact 2 cols, + 4 Link Groups across remaining 3 cols on large screens, or 5-col grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-8">
          {/* Brand & Platform Contact Block (2 Cols on lg) */}
          <div className="space-y-3.5 lg:col-span-2">
            <Logo size="md" />
            <p className="font-medium text-primaryText text-xs">
              "Less time on paperwork. More time for patient care."
            </p>
            <p className="text-secondaryText text-xs leading-relaxed max-w-sm">
              The AI-powered mental health practice-management platform uniting appointments,
              confidential patient intake, structured SOAP clinical notes, and treatment plans in a calm, accessible workspace.
            </p>

            <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px]">
              <p className="text-slate-400 font-semibold">{contactConfig.designation}:</p>
              <p className="text-primaryText font-medium">{contactConfig.contactPerson}</p>
              <p className="flex items-center gap-1.5 pt-0.5">
                <Phone className="w-3.5 h-3.5 text-calmGreen shrink-0" />
                <a href={contactConfig.phoneHref} className="text-calmGreen hover:underline font-mono">
                  {contactConfig.phone}
                </a>
              </p>
              <p className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-softTeal shrink-0" />
                <a href={contactConfig.emailHref} className="text-softTeal hover:underline font-mono truncate">
                  {contactConfig.email}
                </a>
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1 text-calmGreen text-[11px]">
              <Lock className="w-3.5 h-3.5" />
              <span>Strict Text-Only Persistent Storage Invariant</span>
            </div>
          </div>

          {/* Group 1: COMPANY / PLATFORM */}
          <div className="space-y-2.5">
            <h4 className="text-primaryText font-semibold uppercase tracking-wider text-[11px]">
              Company / Platform
            </h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="hover:text-primaryText transition-colors">About Psyco AI</Link></li>
              <li><Link to="/#how-it-works" className="hover:text-primaryText transition-colors">How It Works</Link></li>
              <li><Link to="/contact" className="hover:text-primaryText transition-colors">Contact</Link></li>
              <li><Link to="/faq" className="hover:text-primaryText transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Group 2: LEGAL */}
          <div className="space-y-2.5">
            <h4 className="text-primaryText font-semibold uppercase tracking-wider text-[11px]">
              Legal
            </h4>
            <ul className="space-y-2">
              <li><Link to="/privacy-policy" className="hover:text-primaryText transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primaryText transition-colors">Terms of Service</Link></li>
              <li><Link to="/cookie-policy" className="hover:text-primaryText transition-colors">Cookie Policy</Link></li>
              <li><Link to="/acceptable-use" className="hover:text-primaryText transition-colors">Acceptable Use Policy</Link></li>
              <li><Link to="/medical-disclaimer" className="hover:text-primaryText transition-colors">Medical Disclaimer</Link></li>
            </ul>
          </div>

          {/* Group 3: PRIVACY & SAFETY */}
          <div className="space-y-2.5">
            <h4 className="text-primaryText font-semibold uppercase tracking-wider text-[11px]">
              Privacy & Safety
            </h4>
            <ul className="space-y-2">
              <li><Link to="/data-privacy" className="hover:text-primaryText transition-colors">Data Privacy Architecture</Link></li>
              <li><Link to="/ai-transparency" className="hover:text-primaryText transition-colors">AI Transparency</Link></li>
              <li><Link to="/data-retention" className="hover:text-primaryText transition-colors">Data Retention</Link></li>
              <li><Link to="/privacy-requests" className="hover:text-primaryText transition-colors">Privacy Requests</Link></li>
              <li><Link to="/accessibility" className="hover:text-primaryText transition-colors">Accessibility</Link></li>
            </ul>
          </div>

          {/* Group 4: DOCUMENTATION */}
          <div className="space-y-2.5">
            <h4 className="text-primaryText font-semibold uppercase tracking-wider text-[11px]">
              Documentation
            </h4>
            <ul className="space-y-2">
              <li><Link to="/legal" className="text-softTeal hover:underline font-medium transition-colors">Documentation Centre</Link></li>
              <li><Link to="/for-patients" className="hover:text-primaryText transition-colors">Patient Guide</Link></li>
              <li><Link to="/for-psychologists" className="hover:text-primaryText transition-colors">Psychologist Guide</Link></li>
              <li><Link to="/admin-guide" className="hover:text-primaryText transition-colors">Administrator Guide</Link></li>
              <li><Link to="/data-privacy" className="hover:text-primaryText transition-colors">Security Overview</Link></li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="my-6 p-4 rounded-xl border border-slate-800 bg-deepBlueGray/40 text-[11px] text-secondaryText leading-relaxed">
          <p className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-mutedAmber shrink-0 mt-0.5" />
            <span>
              <strong className="text-slate-300">Operational Policy Draft Notice:</strong> All legal policies, privacy architectures, and terms published across this website
              represent verified technical workflows implemented in the Psyco AI staging environment. These documents constitute operational drafts
              subject to independent review and formal approval by qualified legal counsel prior to commercial release.
              Psyco AI is a practice-management technology platform and is not an emergency crisis intervention service.
            </span>
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <p>© {new Date().getFullYear()} Psyco AI. Controlled Staging Environment. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 text-secondaryText">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-softTeal" />
              <span>Zero Binary Media Invariant</span>
            </span>
            <span className="flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5 text-softTeal" />
              <span>Firebase RTDB Powered</span>
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-calmGreen" />
              <span>Admin Clinical Lockout</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

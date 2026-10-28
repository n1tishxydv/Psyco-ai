import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { Shield, Lock, FileCheck, AlertCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-midnightNavy text-secondaryText text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
          {/* Brand Area (2 Cols) */}
          <div className="space-y-3.5 md:col-span-2">
            <Logo size="md" />
            <p className="font-medium text-primaryText text-xs">
              "Less time on paperwork. More time for patient care."
            </p>
            <p className="text-secondaryText text-xs leading-relaxed max-w-sm">
              The AI-powered mental health practice-management platform uniting appointments, patient intake, structured clinical notes, and treatment plans in a calm, accessible workspace.
            </p>
            <div className="flex items-center gap-2 pt-1 text-calmGreen text-[11px]">
              <Lock className="w-3.5 h-3.5" />
              <span>Strict Text-Only Persistent Storage Invariant</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-2.5">
            <h4 className="text-primaryText font-semibold uppercase tracking-wider text-[11px]">Platform</h4>
            <ul className="space-y-2">
              <li><Link to="/services" className="hover:text-primaryText transition-colors">Services Directory</Link></li>
              <li><Link to="/#how-it-works" className="hover:text-primaryText transition-colors">How It Works</Link></li>
              <li><Link to="/for-patients" className="hover:text-primaryText transition-colors">For Patients</Link></li>
              <li><Link to="/for-psychologists" className="hover:text-primaryText transition-colors">For Psychologists</Link></li>
              <li><Link to="/get-started" className="hover:text-softTeal transition-colors font-medium">Get Started Selection</Link></li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-2.5">
            <h4 className="text-primaryText font-semibold uppercase tracking-wider text-[11px]">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="hover:text-primaryText transition-colors">About Us</Link></li>
              <li><Link to="/#contact" className="hover:text-primaryText transition-colors">Contact Us</Link></li>
              <li><Link to="/#faq" className="hover:text-primaryText transition-colors">Frequently Asked Questions</Link></li>
              <li><a href="mailto:support@psyco-ai.internal" className="hover:text-primaryText transition-colors">Support Email</a></li>
            </ul>
          </div>

          {/* Legal & Governance */}
          <div className="space-y-2.5">
            <h4 className="text-primaryText font-semibold uppercase tracking-wider text-[11px]">Governance & Trust</h4>
            <ul className="space-y-2">
              <li><Link to="/privacy-policy" className="hover:text-primaryText transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primaryText transition-colors">Terms of Service</Link></li>
              <li><Link to="/data-privacy" className="hover:text-primaryText transition-colors">Data Privacy Architecture</Link></li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="my-6 p-4 rounded-xl border border-slate-800 bg-deepBlueGray/40 text-[11px] text-secondaryText leading-relaxed">
          <p className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-mutedAmber shrink-0 mt-0.5" />
            <span>
              <strong>Draft Legal Notice:</strong> The legal information, privacy policies, and terms provided on this website are architectural drafts subject to formal review and jurisdictional adjustment prior to commercial deployment. Psyco AI is not an emergency crisis intervention service.
            </span>
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <p>© {new Date().getFullYear()} Psyco AI. Phase 1 Public Website & Brand Identity. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 text-secondaryText">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-softTeal" />
              <span>Zero Binary Media Invariant</span>
            </span>
            <span className="flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5 text-softTeal" />
              <span>Firebase RTDB Powered</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

import React from 'react';
import { LegalDocumentLayout } from './components/LegalDocumentLayout';
import { contactConfig } from '../../config/contactConfig';
import { RefreshCw, ShieldCheck, Database, CheckCircle2, AlertCircle } from 'lucide-react';

export function CookiePolicyPage() {
  const toc = [
    { id: 'overview', label: '1. Overview & Verification' },
    { id: 'technologies-used', label: '2. Storage Technologies in Psyco AI' },
    { id: 'inventory', label: '3. Browser Storage Inventory' },
    { id: 'tracking-verification', label: '4. Zero Third-Party Advertising Trackers' },
    { id: 'managing-storage', label: '5. How to Manage Browser Storage' },
    { id: 'updates-contact', label: '6. Policy Updates & Inquiries' },
  ];

  return (
    <LegalDocumentLayout
      title="Cookie & Browser Storage Policy"
      subtitle="A transparent, code-verified inventory of local storage and session technologies used by Psyco AI."
      category="Privacy and Data Protection"
      toc={toc}
    >
      {/* 1. Overview */}
      <section id="overview" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-softTeal" />
          1. Overview & Code Verification
        </h2>
        <p>
          This Cookie and Browser Storage Policy provides a transparent accounting of all client-side storage mechanisms
          utilized by <strong>Psyco AI</strong>. Based on an exhaustive inspection of our application codebase,
          <strong> Psyco AI does not deploy advertising trackers, behavioral profiling cookies, or third-party marketing pixels</strong>.
        </p>
        <p>
          We rely strictly on essential browser storage (such as <code>localStorage</code> and IndexedDB)
          strictly necessary to authenticate your clinical session, secure API calls, and maintain interface preferences.
        </p>
      </section>

      {/* 2. Technologies Used */}
      <section id="technologies-used" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">2. Storage Technologies in Psyco AI</h2>
        <p>Our web application uses the following client-side technologies:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
            <h3 className="font-semibold text-softTeal text-xs uppercase tracking-wider">A. Browser LocalStorage</h3>
            <p className="text-xs text-slate-300">
              Key-value text stored directly in your browser. Used to persist user interface preferences (such as light/dark mode selection)
              across page refreshes without transmitting data to our servers.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
            <h3 className="font-semibold text-softTeal text-xs uppercase tracking-wider">B. IndexedDB / Session Tokens</h3>
            <p className="text-xs text-slate-300">
              Structured client-side database utilized by the Firebase Authentication SDK to persist encrypted session credentials,
              enabling secure identity token renewal and preventing unexpected logouts during active consultations.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Inventory */}
      <section id="inventory" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <Database className="w-5 h-5 text-softTeal" />
          3. Browser Storage Inventory
        </h2>
        <p className="text-xs text-slate-300">
          The table below lists all storage items identified in our staging codebase:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border border-slate-800 rounded-xl overflow-hidden text-xs">
            <thead className="bg-slate-900 text-slate-300">
              <tr>
                <th className="p-3 border-b border-slate-800">Storage Key</th>
                <th className="p-3 border-b border-slate-800">Type</th>
                <th className="p-3 border-b border-slate-800">Category</th>
                <th className="p-3 border-b border-slate-800">Duration</th>
                <th className="p-3 border-b border-slate-800">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-400">
              <tr>
                <td className="p-3 font-mono text-slate-200">psyco_theme</td>
                <td className="p-3">localStorage</td>
                <td className="p-3"><span className="text-calmGreen font-semibold">Functional</span></td>
                <td className="p-3">Persistent</td>
                <td className="p-3">Stores user preference for dark or light theme mode.</td>
              </tr>
              <tr>
                <td className="p-3 font-mono text-slate-200">firebase:authUser:[apiKey]</td>
                <td className="p-3">IndexedDB / LocalStorage</td>
                <td className="p-3"><span className="text-softTeal font-semibold">Strictly Essential</span></td>
                <td className="p-3">Session / Revocable</td>
                <td className="p-3">Stores Firebase Authentication identity token and refresh credentials.</td>
              </tr>
              <tr>
                <td className="p-3 font-mono text-slate-200">psyco_session_filter</td>
                <td className="p-3">sessionStorage</td>
                <td className="p-3"><span className="text-calmGreen font-semibold">Functional</span></td>
                <td className="p-3">Tab lifetime</td>
                <td className="p-3">Preserves psychologist directory filter choices during multi-page browsing.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Tracking Verification */}
      <section id="tracking-verification" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-calmGreen" />
          4. Zero Third-Party Advertising Trackers Verified
        </h2>
        <div className="p-4 rounded-xl border border-calmGreen/30 bg-calmGreen/10 space-y-2 text-xs text-slate-300">
          <p className="font-semibold text-primaryText flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-calmGreen" />
            Codebase Verification Confirmation
          </p>
          <p>
            An audit of <code>index.html</code>, package dependencies, and script tags confirms that:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>No Google Analytics (gtag.js / analytics.js) or Tag Manager scripts are loaded.</li>
            <li>No Meta / Facebook Pixels, TikTok pixels, or retargeting beacons are embedded.</li>
            <li>No behavioral advertising cross-site tracking cookies are set.</li>
          </ul>
        </div>
      </section>

      {/* 5. Managing Storage */}
      <section id="managing-storage" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">5. How to Manage Browser Storage</h2>
        <p>
          You have full control over browser storage. You can view, clear, or block local storage keys at any time through your browser settings:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2 text-xs text-slate-300">
          <li><strong>Google Chrome:</strong> Settings &gt; Privacy and security &gt; Site settings &gt; Cookies and site data &gt; See all site data.</li>
          <li><strong>Mozilla Firefox:</strong> Settings &gt; Privacy &amp; Security &gt; Cookies and Site Data &gt; Manage Data.</li>
          <li><strong>Apple Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data.</li>
        </ul>
        <p className="text-xs text-slate-400">
          <em>Note:</em> Clearing or disabling essential authentication storage will log you out of your Psyco AI account.
        </p>
      </section>

      {/* 6. Updates & Inquiries */}
      <section id="updates-contact" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">6. Policy Updates & Inquiries</h2>
        <p>
          Any future integration of analytics or performance telemetry will be reflected in an updated version of this policy.
          For questions regarding our browser storage practices, contact:
        </p>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 text-xs space-y-1">
          <p><strong>Contact:</strong> {contactConfig.contactPerson} ({contactConfig.designation})</p>
          <p><strong>Email:</strong> <a href={contactConfig.emailHref} className="text-softTeal hover:underline">{contactConfig.email}</a></p>
        </div>
      </section>
    </LegalDocumentLayout>
  );
}

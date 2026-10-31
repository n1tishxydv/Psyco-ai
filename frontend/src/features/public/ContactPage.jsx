import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/cards/Card';
import { Input } from '../../components/common/Input';
import { Textarea } from '../../components/common/Textarea';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { AlertBanner } from '../../components/common/AlertBanner';
import { Select } from '../../components/common/Select';
import { contactConfig } from '../../config/contactConfig';
import { publicService } from '../../services/publicService';
import { isBackendConfigured } from '../../services/apiClient';
import {
  Mail,
  Phone,
  Clock,
  MapPin,
  Send,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Lock,
} from 'lucide-react';

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'general',
    subject: '',
    message: '',
    hp_website: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (formData.name.trim().length < 2) {
      setErrorMsg('Full Name must be at least 2 characters.');
      return;
    }
    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (formData.subject.trim().length < 3) {
      setErrorMsg('Subject must be at least 3 characters.');
      return;
    }
    if (formData.message.trim().length < 10) {
      setErrorMsg('Message must be at least 10 characters.');
      return;
    }

    if (!isBackendConfigured()) {
      setErrorMsg('The backend service is currently updating. Please email our contact person directly at ' + contactConfig.email);
      return;
    }

    setLoading(true);
    try {
      // Backend expects { name, email, subject, message, hp_website }
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: `[${formData.category.toUpperCase()}] ${formData.subject.trim()}`,
        message: formData.message.trim(),
        hp_website: formData.hp_website,
      };

      const res = await publicService.submitContactForm(payload);
      setSubmissionId(res.data?.submissionId || 'CONFIRMED');
      setSubmitted(true);
    } catch (err) {
      setErrorMsg(
        err.message || 'Unable to submit your inquiry. Please try again or reach out directly via email.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <Badge variant="teal">Communications & Support</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primaryText">
          Contact & Legal Communications
        </h1>
        <p className="text-sm sm:text-base text-secondaryText max-w-2xl mx-auto leading-relaxed">
          Reach the Psyco AI team for platform support, technical questions, practice onboarding,
          or statutory data rights requests.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Official Contact Metadata */}
        <div className="space-y-6">
          <Card className="bg-deepBlueGray/80 border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-800/80">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Lock className="w-4 h-4 text-softTeal" />
                Platform Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-xs text-secondaryText">
              <div>
                <span className="block text-slate-400 font-medium">Designation</span>
                <span className="text-primaryText font-semibold text-sm">{contactConfig.designation}</span>
              </div>

              <div>
                <span className="block text-slate-400 font-medium">Contact Person</span>
                <span className="text-primaryText font-semibold">{contactConfig.contactPerson}</span>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-softTeal shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-slate-400 font-medium">Email Address</span>
                    <a
                      href={contactConfig.emailHref}
                      className="text-softTeal hover:underline font-mono text-[11px] sm:text-xs break-all"
                    >
                      {contactConfig.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-calmGreen shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-slate-400 font-medium">Telephone</span>
                    <a
                      href={contactConfig.phoneHref}
                      className="text-calmGreen hover:underline font-mono text-[11px] sm:text-xs"
                    >
                      {contactConfig.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-slate-400 font-medium">Operational Jurisdiction</span>
                    <span className="text-slate-300">{contactConfig.operationalRegion}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Crisis Disclaimer Alert Box */}
          <div className="p-4 rounded-xl border border-mutedAmber/30 bg-mutedAmber/10 text-xs text-secondaryText space-y-2">
            <div className="flex items-center gap-2 text-mutedAmber font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Not an Emergency Helpline</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              {contactConfig.emergencyNotice.text}
            </p>
            <div className="pt-2 border-t border-mutedAmber/20 space-y-1 text-[11px]">
              <p className="font-semibold text-slate-200">Verified Helplines (India):</p>
              {contactConfig.emergencyNotice.indianHelplines.map((line, idx) => (
                <div key={idx} className="flex justify-between items-center py-0.5">
                  <span className="text-slate-400 truncate pr-2">{line.name}</span>
                  <a href={line.tel} className="text-softTeal font-mono font-semibold hover:underline">
                    {line.number}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Contact & Support Ticket Form */}
        <div className="lg:col-span-2">
          <Card className="bg-deepBlueGray/80 border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-800/80">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Send a Message or Inquiry</span>
                <Badge variant="outline" className="text-[10px] text-slate-400 font-normal">
                  Encrypted Transmission (TLS)
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {submitted ? (
                <div className="space-y-4 py-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-calmGreen/20 text-calmGreen mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-primaryText">Inquiry Successfully Transmitted</h3>
                  <p className="text-xs text-secondaryText max-w-md mx-auto leading-relaxed">
                    Thank you. Your message has been logged under Reference ID:
                  </p>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-softTeal text-xs inline-block">
                    {submissionId}
                  </div>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    The platform team will review your inquiry in accordance with our operational review guidelines.
                  </p>
                  <div className="pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({
                          name: '',
                          email: '',
                          category: 'general',
                          subject: '',
                          message: '',
                          hp_website: '',
                        });
                      }}
                    >
                      Submit Another Message
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMsg && (
                    <AlertBanner
                      type="error"
                      title="Submission Error"
                      message={errorMsg}
                    />
                  )}

                  {/* Honeypot hidden input */}
                  <div className="hidden" aria-hidden="true">
                    <input
                      type="text"
                      name="hp_website"
                      tabIndex="-1"
                      autoComplete="off"
                      value={formData.hp_website}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Your Name *"
                      name="name"
                      required
                      placeholder="e.g. Dr. Jane Doe or Patient Name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <Input
                      label="Email Address *"
                      name="email"
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Enquiry Category *"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      disabled={loading}
                      options={contactConfig.inquiryCategories}
                    />
                    <Input
                      label="Subject *"
                      name="subject"
                      required
                      placeholder="Brief summary of your inquiry"
                      value={formData.subject}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>

                  <Textarea
                    label="Detailed Message *"
                    name="message"
                    required
                    rows={5}
                    placeholder="Provide relevant context regarding your request or technical inquiry. (Do not paste sensitive clinical trauma notes into this form)..."
                    value={formData.message}
                    onChange={handleChange}
                    disabled={loading}
                  />

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                      <ShieldAlert className="w-3.5 h-3.5 text-softTeal" />
                      <span>Confidentiality Notice</span>
                    </div>
                    <p>
                      Please <strong>do not submit sensitive clinical diagnoses, therapeutic details, or medical records</strong> through this public contact form. Clinical information must be shared exclusively through your authenticated patient portal or direct consultation with your licensed clinician. Inquiries are processed in accordance with our{' '}
                      <a href="/privacy-policy" className="text-softTeal underline" target="_blank" rel="noreferrer">
                        Privacy Policy
                      </a>{' '}
                      and{' '}
                      <a href="/data-retention" className="text-softTeal underline" target="_blank" rel="noreferrer">
                        Data Retention Policy
                      </a>.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-[11px] text-slate-500">
                      Response windows align with regular business hours.
                    </span>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      icon={Send}
                      disabled={loading}
                      className="w-full sm:w-auto"
                    >
                      {loading ? 'Submitting...' : 'Send Message'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

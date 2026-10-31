import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/cards/Card';
import { Input } from '../../../components/common/Input';
import { Textarea } from '../../../components/common/Textarea';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { AlertBanner } from '../../../components/common/AlertBanner';
import { publicService } from '../../../services/publicService';
import { isBackendConfigured } from '../../../services/apiClient';
import { contactConfig } from '../../../config/contactConfig';
import { Mail, Phone, Send, ShieldAlert, AlertTriangle } from 'lucide-react';

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    hp_website: '',
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Client-side quick checks
    if (formData.name.trim().length < 2) {
      setErrorMsg('Name must be at least 2 characters.');
      return;
    }
    if (!formData.email.includes('@')) {
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
      setErrorMsg('Contact inquiries are temporarily unavailable while the backend service is being updated. Please try again soon.');
      return;
    }

    setLoading(true);
    try {
      const res = await publicService.submitContactForm(formData);
      setSuccessMsg(res.data?.message || 'Your inquiry has been received.');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        hp_website: '',
      });
    } catch (err) {
      // Honest reporting of database offline status
      setErrorMsg(
        err.message || 'Unable to submit your inquiry. The backend database service may currently be offline.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="space-y-8 py-10 border-t border-slate-800/80">
      <div className="text-center space-y-3">
        <Badge variant="teal">Contact Support & Practice Onboarding</Badge>
        <h2 className="text-3xl font-bold tracking-tight text-primaryText">
          Connect with Psyco AI
        </h2>
        <p className="text-sm text-secondaryText max-w-2xl mx-auto">
          Have inquiries regarding practice onboarding, platform technical requirements, or institutional clinic deployments?
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Practice Notice Column */}
        <div className="space-y-4">
          <Card className="bg-deepBlueGray/70">
            <CardContent className="pt-5 space-y-4 text-xs text-secondaryText">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-softTeal mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-primaryText">Email Inquiries</h4>
                  <a href={contactConfig.emailHref} className="text-softTeal hover:underline font-mono text-[11px] break-all">
                    {contactConfig.email}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-calmGreen mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-primaryText">Telephone Inquiries</h4>
                  <a href={contactConfig.phoneHref} className="text-calmGreen hover:underline font-mono text-[11px]">
                    {contactConfig.phone}
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Urgent Emergency Alert Disclaimer */}
          <div className="p-4 rounded-xl border border-mutedAmber/30 bg-mutedAmber/10 text-xs text-secondaryText space-y-1">
            <div className="flex items-center gap-1.5 text-mutedAmber font-semibold">
              <AlertTriangle className="w-4 h-4" />
              <span>Not a Crisis Hotline</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Do not use this public contact form for acute psychological crises or emergency clinical needs. If you are experiencing acute distress, contact your local emergency medical service or verified national helpline immediately.
            </p>
          </div>
        </div>

        {/* Contact Form Column */}
        <div className="md:col-span-2">
          <Card className="bg-deepBlueGray/80">
            <CardHeader>
              <CardTitle className="text-base">Send an Inquiry</CardTitle>
            </CardHeader>
            <CardContent>
              {successMsg ? (
                <div className="space-y-4">
                  <AlertBanner
                    type="success"
                    title="Inquiry Transmitted"
                    message={successMsg}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSuccessMsg(null)}
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMsg && (
                    <AlertBanner
                      type="error"
                      title="Submission Unsuccessful"
                      message={errorMsg}
                    />
                  )}

                  {/* Honeypot field - hidden from genuine users */}
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
                      label="Full Name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Dr. Eleanor Vance"
                    />
                    <Input
                      label="Email Address"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="eleanor@vanceclinic.com"
                    />
                  </div>

                  <Input
                    label="Subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="e.g. Multi-clinician practice scheduling inquiry"
                  />

                  <Textarea
                    label="Message"
                    name="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Provide details regarding your practice or consultation inquiry (do not include sensitive personal health information)..."
                    helperText={`${formData.message.length}/2000 characters`}
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-secondaryText">
                      * Privacy Notice: Public inquiries are processed securely and never logged with sensitive health data.
                    </span>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      icon={Send}
                      isLoading={loading}
                    >
                      Send Message
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

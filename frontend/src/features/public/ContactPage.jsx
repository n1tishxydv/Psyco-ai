import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/cards/Card';
import { Input } from '../../components/common/Input';
import { Textarea } from '../../components/common/Textarea';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { AlertBanner } from '../../components/common/AlertBanner';
import { Mail, MapPin, Send } from 'lucide-react';

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flex-1 max-w-4xl mx-auto py-12 px-4 space-y-8">
      <div className="text-center space-y-2">
        <Badge variant="teal">Get in Touch</Badge>
        <h1 className="text-3xl font-bold tracking-tight text-primaryText">Contact the Psyco AI Team</h1>
        <p className="text-xs text-secondaryText">Have questions regarding practice onboarding or enterprise clinic deployments?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-start gap-3 text-xs">
                <Mail className="w-4 h-4 text-softTeal mt-0.5" />
                <div>
                  <h4 className="font-semibold text-primaryText">Practice Inquiries</h4>
                  <p className="text-secondaryText">support@psyco-ai.internal</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-xs">
                <MapPin className="w-4 h-4 text-calmGreen mt-0.5" />
                <div>
                  <h4 className="font-semibold text-primaryText">Operational Region</h4>
                  <p className="text-secondaryText">Asia/Kolkata (IST Standard)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Send a Message</CardTitle>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <AlertBanner
                  type="success"
                  title="Message Received"
                  message="Thank you for reaching out. The clinical solutions team will respond shortly."
                />
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Full Name" required placeholder="Dr. John Doe" />
                    <Input label="Email Address" type="email" required placeholder="clinician@example.com" />
                  </div>
                  <Input label="Practice / Clinic Name" placeholder="MindWell Psychology Clinic" />
                  <Textarea label="Message" required rows={4} placeholder="Describe your practice requirements..." />
                  <Button type="submit" variant="primary" size="md" icon={Send} className="w-full sm:w-auto">
                    Send Inquiry
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

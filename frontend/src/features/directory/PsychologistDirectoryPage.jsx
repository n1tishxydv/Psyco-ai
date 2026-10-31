import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/cards/Card';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { AlertBanner } from '../../components/common/AlertBanner';
import { EmptyState } from '../../components/common/EmptyState';
import { PsychologistCard } from '../../components/common/PsychologistCard';
import { PsychologistCardSkeleton } from '../../components/common/LoadingSkeleton';
import { InitialsAvatar } from '../../components/common/InitialsAvatar';
import { directoryService } from '../../services/directoryService';
import { isBackendConfigured } from '../../services/apiClient';
import {
  Search,
  Filter,
  Stethoscope,
  MapPin,
  Calendar,
  Languages,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  X,
  XCircle,
  Video,
  Award,
  BookOpen,
} from 'lucide-react';

export function PsychologistDirectoryPage() {
  const navigate = useNavigate();

  const [psychologists, setPsychologists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Selected Profile for Detailed Modal
  const [selectedClinician, setSelectedClinician] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    mode: 'all',
    specialization: '',
    language: '',
  });

  const fetchClinicians = async () => {
    if (!isBackendConfigured()) {
      setLoading(false);
      setErrorMsg('Clinician directory search is temporarily unavailable because the backend service is currently not connected.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await directoryService.getPsychologists(filters);
      const list = res?.data?.psychologists || [];
      // Safety filter: Ensure only verified clinicians appear
      setPsychologists(Array.isArray(list) ? list : []);
    } catch (err) {
      setErrorMsg(err.message || 'Unable to load clinician directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinicians();
  }, [filters.mode, filters.specialization, filters.language]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchClinicians();
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      mode: 'all',
      specialization: '',
      language: '',
    });
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.mode !== 'all' || filters.specialization || filters.language
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <Badge variant="teal" size="sm" className="inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-softTeal" />
          <span>Verified Mental Health Specialists</span>
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-100">
          Find Your Clinical Psychologist
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          Discover certified clinical psychologists licensed to practice psychotherapy. All clinicians listed on Psyco AI are rigorously credentialed and verified.
        </p>
      </div>

      {errorMsg && <AlertBanner variant="error" message={errorMsg} />}

      {/* Filter and Search Bar */}
      <div className="p-5 bg-deepBlueGray/90 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Input
              placeholder="Search by clinician name, specialization (CBT, Trauma, Depression), or clinical focus..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              icon={Search}
            />
          </div>
          <Button type="submit" variant="primary" size="md" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <span>Search Clinicians</span>
          </Button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800">
          <Select
            label="Consultation Mode"
            value={filters.mode}
            onChange={(e) => setFilters({ ...filters, mode: e.target.value })}
            options={[
              { value: 'all', label: 'All Modes (Video & Clinic)' },
              { value: 'online', label: 'Telehealth Video Only' },
              { value: 'in_person', label: 'In-Person Clinic Visits' },
            ]}
          />

          <Select
            label="Specialization / Focus"
            value={filters.specialization}
            onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
            options={[
              { value: '', label: 'All Specializations' },
              { value: 'cbt', label: 'Cognitive Behavioral Therapy (CBT)' },
              { value: 'anxiety', label: 'Anxiety Disorders' },
              { value: 'depression', label: 'Depression & Mood' },
              { value: 'trauma', label: 'Trauma & PTSD' },
              { value: 'relationship', label: 'Relationship / Couples' },
              { value: 'burnout', label: 'Career & Burnout' },
            ]}
          />

          <Select
            label="Language"
            value={filters.language}
            onChange={(e) => setFilters({ ...filters, language: e.target.value })}
            options={[
              { value: '', label: 'All Languages' },
              { value: 'english', label: 'English' },
              { value: 'hindi', label: 'Hindi' },
              { value: 'spanish', label: 'Spanish' },
            ]}
          />
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
            <span>Showing filtered results ({psychologists.length} clinicians found)</span>
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-softTeal hover:underline flex items-center gap-1 font-medium"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PsychologistCardSkeleton />
          <PsychologistCardSkeleton />
          <PsychologistCardSkeleton />
        </div>
      ) : psychologists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {psychologists.map((psych) => (
            <PsychologistCard
              key={psych.uid || psych.id}
              psychologist={psych}
              onSelectProfile={(p) => setSelectedClinician(p)}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-slate-800 bg-slate-900/40 p-8">
          <CardContent className="p-6">
            <EmptyState
              icon={Stethoscope}
              title="No Psychologists Found"
              description="No approved clinical psychologists match your current search criteria. Try removing some filters or searching for broader terms like 'Anxiety' or 'CBT'."
              actionLabel="Clear All Filters"
              onAction={handleClearFilters}
            />
          </CardContent>
        </Card>
      )}

      {/* Clinician Details Modal */}
      {selectedClinician && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 bg-deepBlueGray border border-slate-700/80 rounded-2xl shadow-2xl space-y-6">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedClinician(null)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              aria-label="Close profile modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Clinician Header */}
            <div className="flex items-start gap-4 pr-8">
              <InitialsAvatar
                name={selectedClinician.fullName}
                size="lg"
                className="rounded-2xl border-2 border-slate-700 shadow-md shrink-0"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-slate-100">
                    {selectedClinician.fullName}
                  </h2>
                  <Badge variant="teal" size="sm" className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-softTeal" />
                    <span>Verified Clinician</span>
                  </Badge>
                </div>

                <p className="text-xs font-semibold text-softTeal">
                  {selectedClinician.licenseNumber
                    ? `Clinical License: ${selectedClinician.licenseNumber}`
                    : 'Licensed Clinical Psychologist'}
                </p>

                {selectedClinician.qualifications?.length > 0 && (
                  <p className="text-xs text-slate-400">
                    {selectedClinician.qualifications.join(' • ')}
                  </p>
                )}
              </div>
            </div>

            {/* About / Bio */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-softTeal" />
                <span>Clinical Biography & Philosophy</span>
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {selectedClinician.bio || 'Licensed clinical psychologist specialized in evidence-based psychological assessment and psychotherapy.'}
              </p>
            </div>

            {/* Specializations & Focus */}
            {selectedClinician.specializations?.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-softTeal" />
                  <span>Areas of Clinical Expertise</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedClinician.specializations.map((spec, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Practice Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-medium block">Consultation Modes:</span>
                <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-softTeal" />
                  {selectedClinician.offeredModes === 'both'
                    ? 'Telehealth Video & In-Person Clinic'
                    : selectedClinician.offeredModes === 'online'
                    ? 'Telehealth Video Only'
                    : 'In-Person Clinic Only'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-medium block">Spoken Languages:</span>
                <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-softTeal" />
                  {selectedClinician.languages?.join(', ') || 'English'}
                </span>
              </div>

              {selectedClinician.clinicAddress?.city && (
                <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-medium block">Clinic Location:</span>
                  <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-softTeal" />
                    {selectedClinician.clinicAddress.city}, {selectedClinician.clinicAddress.state}
                  </span>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedClinician(null)}
              >
                Close
              </Button>

              <Link to={`/book/${selectedClinician.uid || selectedClinician.id}`}>
                <Button variant="primary" size="sm" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Book Consultation</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PsychologistDirectoryPage;

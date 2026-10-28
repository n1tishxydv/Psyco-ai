import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/cards/Card';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { AlertBanner } from '../../components/common/AlertBanner';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { InitialsAvatar } from '../../components/common/InitialsAvatar';
import { directoryService } from '../../services/directoryService';
import {
  Search,
  Filter,
  Stethoscope,
  MapPin,
  Calendar,
  Languages,
  ArrowRight,
  Sparkles,
  Award,
} from 'lucide-react';

export function PsychologistDirectoryPage() {
  const navigate = useNavigate();

  const [psychologists, setPsychologists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    mode: 'all',
    specialization: '',
    language: '',
  });

  const fetchClinicians = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await directoryService.getPsychologists(filters);
      setPsychologists(res?.data?.psychologists || []);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <Badge variant="teal" size="sm">Licensed Mental Health Professionals</Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-100">
          Find Your Clinical Psychologist
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          Discover verified psychologists offering personalized in-person clinic consultations and secure telehealth sessions.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Input
              placeholder="Search by clinician name, specialization (CBT, trauma), or focus..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              icon={Search}
            />
          </div>
          <Button type="submit" variant="primary" size="md" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search Clinicians
          </Button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
          <Select
            label="Consultation Mode"
            value={filters.mode}
            onChange={(e) => setFilters({ ...filters, mode: e.target.value })}
            options={[
              { label: 'All Modes (In-Person & Online)', value: 'all' },
              { label: 'In-Person Clinic Sessions', value: 'in_person' },
              { label: 'Online Telehealth Video', value: 'online' },
            ]}
          />

          <Select
            label="Specialization Focus"
            value={filters.specialization}
            onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
            options={[
              { label: 'All Specializations', value: '' },
              { label: 'Cognitive Behavioral Therapy (CBT)', value: 'CBT' },
              { label: 'Anxiety Disorders', value: 'Anxiety' },
              { label: 'Depression & Mood', value: 'Depression' },
              { label: 'Trauma & PTSD', value: 'Trauma' },
              { label: 'Burnout & Stress', value: 'Burnout' },
            ]}
          />

          <Select
            label="Language Spoken"
            value={filters.language}
            onChange={(e) => setFilters({ ...filters, language: e.target.value })}
            options={[
              { label: 'All Languages', value: '' },
              { label: 'English', value: 'English' },
              { label: 'Spanish', value: 'Spanish' },
              { label: 'Hindi', value: 'Hindi' },
            ]}
          />
        </div>
      </div>

      {errorMsg && <AlertBanner type="error" title="Error" message={errorMsg} />}

      {/* Directory Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 min-h-[40vh]">
          <LoadingSpinner size="lg" className="text-teal-400 mb-3" />
          <p className="text-sm text-slate-400">Loading verified clinician profiles...</p>
        </div>
      ) : psychologists.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <Stethoscope className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-lg font-semibold text-slate-200">No Psychologists Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            We couldn't find any approved clinicians matching your current search criteria. Try resetting filters or searching for general terms.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFilters({ search: '', mode: 'all', specialization: '', language: '' })}
            className="mt-2"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {psychologists.map((psych) => (
            <Card
              key={psych.uid}
              className="border-slate-800 bg-slate-900/90 hover:border-teal-500/40 shadow-xl transition-all flex flex-col justify-between"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-3.5">
                  <InitialsAvatar name={psych.fullName} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-bold text-slate-100 truncate">
                        {psych.fullName}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-teal-400 font-mono mt-0.5">
                      <Award className="w-3.5 h-3.5" />
                      <span>{psych.licenseNumber}</span>
                    </div>
                    {psych.clinicAddress?.city && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{psych.clinicAddress.city}, {psych.clinicAddress.state || ''}</span>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {psych.bio || 'Licensed clinical psychologist committed to evidence-based therapeutic practice.'}
                </p>

                {/* Specializations Badges */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Focus Areas
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(psych.specializations || []).slice(0, 3).map((spec, i) => (
                      <Badge key={i} variant="teal" size="sm">
                        {spec}
                      </Badge>
                    ))}
                    {(psych.specializations || []).length > 3 && (
                      <span className="text-[10px] text-slate-500 self-center">
                        +{psych.specializations.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Mode & Languages */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Languages className="w-3.5 h-3.5 text-slate-500" />
                    <span>{(psych.languages || ['English']).join(', ')}</span>
                  </div>

                  <Badge variant={psych.offeredModes === 'both' ? 'green' : 'neutral'} size="sm" className="capitalize">
                    {psych.offeredModes?.replace('_', ' ')}
                  </Badge>
                </div>

                {/* Primary Action Button */}
                <div className="pt-2">
                  <Link to={`/book/${psych.uid}`} className="block">
                    <Button variant="primary" size="sm" className="w-full flex items-center justify-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Book Consultation
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

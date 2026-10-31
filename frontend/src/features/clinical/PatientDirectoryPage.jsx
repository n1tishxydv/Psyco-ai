import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/cards/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { InitialsAvatar } from '../../components/common/InitialsAvatar';
import { EmptyState } from '../../components/common/EmptyState';
import { StatsCardSkeleton } from '../../components/common/LoadingSkeleton';
import { clinicalService } from '../../services/clinicalService';
import {
  Users,
  Search,
  Calendar,
  Clock,
  ArrowRight,
  ClipboardList,
  RefreshCw,
  FileText,
  UserCheck,
  Filter,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';

export function PatientDirectoryPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all'); // 'all' | 'active' | 'awaiting_intake' | 'upcoming'
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'sessions' | 'recent'

  const fetchPatients = async (query = '') => {
    try {
      setLoading(true);
      setError(null);
      const res = await clinicalService.getPatients(query);
      setPatients(Array.isArray(res) ? res : (res?.data?.patients || res?.patients || []));
    } catch (err) {
      console.error('Failed to load patients:', err);
      setError(err.message || 'Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients(search);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPatients(search);
  };

  // Filtered and Sorted Patients
  const displayedPatients = useMemo(() => {
    let result = [...patients];

    // Filter Category
    if (filterCategory === 'active') {
      result = result.filter((p) => p.totalAppointments > 0);
    } else if (filterCategory === 'awaiting_intake') {
      result = result.filter((p) => p.intakeStatus !== 'submitted');
    } else if (filterCategory === 'upcoming') {
      result = result.filter((p) => Boolean(p.nextAppointment));
    }

    // Sort
    if (sortBy === 'name') {
      result.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
    } else if (sortBy === 'sessions') {
      result.sort((a, b) => (b.totalAppointments || 0) - (a.totalAppointments || 0));
    } else if (sortBy === 'recent') {
      result.sort((a, b) => {
        const aDate = a.lastAppointment?.date || '';
        const bDate = b.lastAppointment?.date || '';
        return bDate.localeCompare(aDate);
      });
    }

    return result;
  }, [patients, filterCategory, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 rounded-2xl border border-teal-500/20 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="teal" size="sm">Clinical Practice Workspace</Badge>
            <Badge variant="neutral" size="sm">{patients.length} Authorized Records</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Users className="w-7 h-7 text-teal-400" />
            Patient Management & Medical Charts
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Access assigned patient medical records, review intake assessments, clinical SOAP notes, and treatment plans.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/psychologist/treatment-plans">
            <Button variant="secondary" size="sm" className="text-xs">
              Treatment Plans
            </Button>
          </Link>
          <Link to="/psychologist/reports">
            <Button variant="secondary" size="sm" className="text-xs">
              Clinical Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              filterCategory === 'all'
                ? 'bg-slate-800 text-teal-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Patients ({patients.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('active')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              filterCategory === 'active'
                ? 'bg-slate-800 text-teal-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Active Treatment
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('awaiting_intake')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              filterCategory === 'awaiting_intake'
                ? 'bg-slate-800 text-amber-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Awaiting Intake
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('upcoming')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              filterCategory === 'upcoming'
                ? 'bg-slate-800 text-emerald-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Upcoming Scheduled
          </button>
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search patients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-400"
            />
          </form>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-400"
          >
            <option value="name">Sort: Name (A-Z)</option>
            <option value="sessions">Sort: Most Consultations</option>
            <option value="recent">Sort: Recent Consultation</option>
          </select>
        </div>
      </div>

      {/* Patient Grid / Loading / Empty State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-rose-300 text-center text-xs">
          {error}
        </div>
      ) : displayedPatients.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-12 text-center">
            <EmptyState
              icon={Users}
              title="No Patients Found"
              description={
                search
                  ? `No patients match "${search}". Try adjusting your search query.`
                  : filterCategory !== 'all'
                  ? 'No patients found under this filter category.'
                  : 'Patients will appear in your directory once they book an appointment with your practice.'
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedPatients.map((pat) => (
            <Card
              key={pat.id}
              className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all shadow-md flex flex-col justify-between"
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <InitialsAvatar name={pat.fullName} email={pat.email} size="md" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">{pat.fullName}</h3>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {pat.age ? `${pat.age} yrs` : 'Age unrecorded'} • {pat.gender}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      pat.intakeStatus === 'submitted'
                        ? 'green'
                        : pat.intakeStatus === 'draft'
                        ? 'amber'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {pat.intakeStatus === 'submitted' ? 'Intake Signed' : 'Intake Pending'}
                  </Badge>
                </div>

                {/* Quick stats box */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Consultations</span>
                    <span className="font-semibold text-slate-200">{pat.totalAppointments} sessions</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Next Session</span>
                    <span className="font-semibold text-teal-300">
                      {pat.nextAppointment ? pat.nextAppointment.date : 'None scheduled'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Ref: {pat.id.slice(0, 10)}...
                  </span>
                  <Link to={`/psychologist/patients/${pat.id}`}>
                    <Button variant="secondary" size="sm" className="text-xs flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-teal-400" />
                      Open Chart
                      <ArrowRight className="w-3 h-3" />
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

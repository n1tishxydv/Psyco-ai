import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/cards/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { InitialsAvatar } from '../../components/common/InitialsAvatar';
import { EmptyState } from '../../components/common/EmptyState';
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
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function PatientDirectoryPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchPatients = async (query = '') => {
    try {
      setLoading(true);
      setError(null);
      const res = await clinicalService.getPatients(query);
      setPatients(res.data?.patients || []);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 rounded-2xl border border-emerald-500/20 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="green" size="sm">Clinical Practice</Badge>
            <Badge variant="neutral" size="sm">{patients.length} Assigned Patients</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
            Patient Management & Charts
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Access assigned patient medical records, intake questionnaires, clinical notes, and treatment plans.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/psychologist/treatment-plans">
            <Button variant="secondary" size="sm">
              Treatment Plans
            </Button>
          </Link>
          <Link to="/psychologist/reports">
            <Button variant="secondary" size="sm">
              Clinical Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search assigned patients by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <Button type="submit" variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
              Search
            </Button>
            {search && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  fetchPatients('');
                }}
              >
                Clear
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Patient Grid / Empty State */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-400" />
          Loading patient directory...
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-rose-300 text-center text-xs">
          {error}
        </div>
      ) : patients.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-12 text-center">
            <EmptyState
              icon={Users}
              title="No Assigned Patients Found"
              description={
                search
                  ? `No patients match "${search}". Try adjusting your search query.`
                  : 'Patients will appear in your directory once they book an appointment with your practice.'
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((pat) => (
            <Card
              key={pat.id}
              className="bg-slate-900 border-slate-800 hover:border-slate-700 transition shadow-md flex flex-col justify-between"
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <InitialsAvatar name={pat.fullName} email={pat.email} size="md" />
                    <div>
                      <h3 className="text-sm font-semibold text-slate-100">{pat.fullName}</h3>
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
                    <span className="font-semibold text-emerald-400">
                      {pat.nextAppointment ? pat.nextAppointment.date : 'None scheduled'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">
                    ID: {pat.id.slice(0, 10)}...
                  </span>
                  <Link to={`/psychologist/patients/${pat.id}`}>
                    <Button variant="secondary" size="sm" className="text-xs flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
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

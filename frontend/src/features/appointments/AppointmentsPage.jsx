import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PatientAppointmentsPage } from './PatientAppointmentsPage';
import { PsychologistCalendarPage } from './PsychologistCalendarPage';

export function AppointmentsPage() {
  const { user } = useAuth();
  const role = user?.role;

  if (role === 'psychologist') {
    return <Navigate to="/psychologist/appointments" replace />;
  }

  if (role === 'patient') {
    return <Navigate to="/patient/appointments" replace />;
  }

  return <Navigate to="/find-psychologist" replace />;
}

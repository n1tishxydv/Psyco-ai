import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { InitialsAvatar } from '../common/InitialsAvatar';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from '../common/NotificationBell';
import {
  Sun,
  Moon,
  Menu,
  X,
  Stethoscope,
  ArrowRight,
  LogIn,
  LayoutDashboard,
  User,
  Settings,
  ClipboardList,
  LogOut,
  ChevronDown,
  FileSpreadsheet,
  Calendar,
  Search,
  Clock,
} from 'lucide-react';

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef(null);

  const navLinks = [
    { name: 'Find a Psychologist', path: '/find-psychologist', isHighlight: true },
    { name: 'About Us', path: '/about' },
    { name: 'How It Works', path: '/#how-it-works' },
    { name: 'Services', path: '/services' },
    { name: 'FAQ', path: '/#faq' },
    { name: 'Contact Us', path: '/#contact' },
  ];

  // Close menus when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname, location.hash]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (path) => {
    setMobileMenuOpen(false);
    if (path.startsWith('/#')) {
      const elementId = path.substring(2);
      if (location.pathname === '/') {
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  const isLinkActive = (path) => {
    if (path.startsWith('/#')) {
      return location.pathname === '/' && location.hash === path.substring(1);
    }
    return location.pathname === path;
  };

  const role = user?.role;
  const displayName = user?.fullName || user?.profile?.fullName || (user?.email ? user.email.split('@')[0] : 'User');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-midnightNavy/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group focus-visible:ring-2 focus-visible:ring-softTeal rounded-lg p-1"
            aria-label="Psyco AI Home"
          >
            <Logo size="md" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const active = isLinkActive(link.path);
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => handleNavClick(link.path)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    active
                      ? 'text-softTeal bg-elevatedSlate/80 font-semibold'
                      : link.isHighlight
                      ? 'text-calmGreen hover:bg-calmGreen/10 border border-calmGreen/30'
                      : 'text-secondaryText hover:text-primaryText hover:bg-elevatedSlate/40'
                  }`}
                >
                  {link.isHighlight && <Stethoscope className="w-3.5 h-3.5" />}
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Controls & User Profile */}
          <div className="hidden md:flex items-center gap-3">
            {/* Notification Bell (Authenticated only) */}
            <NotificationBell />

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-secondaryText hover:text-primaryText hover:bg-elevatedSlate/60 transition-colors"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
            </button>

            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-full bg-slate-900 border border-slate-700/80 hover:border-teal-500/50 transition-colors"
                >
                  <span className="text-xs font-semibold text-slate-200 max-w-[120px] truncate">
                    {displayName}
                  </span>
                  <InitialsAvatar name={displayName} email={user?.email} size="sm" />
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-1" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-100">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-xs font-semibold text-slate-200 truncate">{displayName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                      <div className="mt-1">
                        <Badge variant={role === 'psychologist' ? 'green' : 'teal'} size="sm" className="capitalize">
                          {role || 'Standard Member'}
                        </Badge>
                      </div>
                    </div>

                    <div className="py-1 text-xs">
                      {role === 'patient' && (
                        <>
                          <Link
                            to="/patient/dashboard"
                            className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-teal-300"
                          >
                            <LayoutDashboard className="w-4 h-4 text-teal-400" />
                            Patient Dashboard
                          </Link>
                          <Link
                            to="/patient/care-plan"
                            className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-teal-300"
                          >
                            <ClipboardList className="w-4 h-4 text-teal-400" />
                            Care Plan & Homework
                          </Link>
                          <Link
                            to="/patient/appointments"
                            className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-teal-300"
                          >
                            <Calendar className="w-4 h-4 text-teal-400" />
                            My Appointments
                          </Link>
                          <Link
                            to="/patient/profile"
                            className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-teal-300"
                          >
                            <User className="w-4 h-4 text-teal-400" />
                            My Profile
                          </Link>
                          <Link
                            to="/patient/intake"
                            className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-teal-300"
                          >
                            <ClipboardList className="w-4 h-4 text-teal-400" />
                            Clinical Intake
                          </Link>
                        </>
                      )}

                      {role === 'psychologist' && (
                        <>
                          <Link
                            to="/psychologist/dashboard"
                            className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-emerald-300"
                          >
                            <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                            Clinician Dashboard
                          </Link>
                          <Link
                            to="/psychologist/patients"
                            className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-emerald-300 font-medium"
                          >
                            <Stethoscope className="w-4 h-4 text-emerald-400" />
                            Patient Directory & Charts
                          </Link>
                          <Link
                            to="/psychologist/treatment-plans"
                            className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-emerald-300"
                          >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                            Treatment Plans
                          </Link>
                          <Link
                            to="/psychologist/reports"
                            className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-emerald-300"
                          >
                            <ClipboardList className="w-4 h-4 text-emerald-400" />
                            Clinical Reports
                          </Link>
                          <Link
                            to="/psychologist/appointments"
                            className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-emerald-300"
                          >
                            <Calendar className="w-4 h-4 text-emerald-400" />
                            Appointments & Calendar
                          </Link>
                          <Link
                            to="/psychologist/availability"
                            className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-emerald-300"
                          >
                            <Clock className="w-4 h-4 text-emerald-400" />
                            Working Hours & Availability
                          </Link>
                          <Link
                            to="/psychologist/profile"
                            className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-emerald-300"
                          >
                            <User className="w-4 h-4 text-emerald-400" />
                            Practice Profile
                          </Link>
                          <Link
                            to="/psychologist/intake-settings"
                            className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-emerald-300"
                          >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                            Intake Builder
                          </Link>
                        </>
                      )}

                      {role === 'admin' && (
                        <Link
                          to="/admin/dashboard"
                          className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-teal-300"
                        >
                          <LayoutDashboard className="w-4 h-4 text-teal-400" />
                          Admin Governance
                        </Link>
                      )}

                      <Link
                        to="/settings"
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-teal-300"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        Account Settings
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={logout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link to="/login">
                  <Button variant="ghost" size="sm" icon={LogIn}>
                    Sign In
                  </Button>
                </Link>
                <Link to="/get-started">
                  <Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right" className="shadow-md">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Drawer Trigger */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-secondaryText hover:text-primaryText"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-secondaryText hover:text-primaryText hover:bg-elevatedSlate"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-800 bg-deepBlueGray px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-150">
          {isAuthenticated && (
            <div className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800 mb-2">
              <InitialsAvatar name={displayName} email={user?.email} size="md" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-100 truncate">{displayName}</div>
                <div className="text-xs text-slate-400 capitalize">{role || 'User'}</div>
              </div>
            </div>
          )}

          <nav className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => handleNavClick(link.path)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium ${
                  isLinkActive(link.path)
                    ? 'text-softTeal bg-elevatedSlate font-semibold'
                    : 'text-secondaryText hover:text-primaryText hover:bg-elevatedSlate/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  {link.isHighlight && <Stethoscope className="w-4 h-4 text-calmGreen" />}
                  <span>{link.name}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-60" />
              </Link>
            ))}

            {isAuthenticated && (
              <>
                <div className="pt-2 border-t border-slate-800 my-2" />
                {role === 'patient' && (
                  <>
                    <Link
                      to="/patient/dashboard"
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                    >
                      <LayoutDashboard className="w-4 h-4 text-teal-400" />
                      Patient Dashboard
                    </Link>
                    <Link
                      to="/patient/profile"
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                    >
                      <User className="w-4 h-4 text-teal-400" />
                      My Profile
                    </Link>
                    <Link
                      to="/patient/intake"
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                    >
                      <ClipboardList className="w-4 h-4 text-teal-400" />
                      Clinical Intake
                    </Link>
                  </>
                )}

                {role === 'psychologist' && (
                  <>
                    <Link
                      to="/psychologist/dashboard"
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                    >
                      <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                      Clinician Dashboard
                    </Link>
                    <Link
                      to="/psychologist/profile"
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                    >
                      <User className="w-4 h-4 text-emerald-400" />
                      Practice Profile
                    </Link>
                    <Link
                      to="/psychologist/intake-settings"
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      Intake Builder
                    </Link>
                    <Link
                      to="/psychologist/appointments"
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                    >
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      Appointments & Calendar
                    </Link>
                    <Link
                      to="/psychologist/availability"
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                    >
                      <Clock className="w-4 h-4 text-emerald-400" />
                      Working Hours & Availability
                    </Link>
                  </>
                )}

                {role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                  >
                    <LayoutDashboard className="w-4 h-4 text-teal-400" />
                    Admin Governance
                  </Link>
                )}

                <Link
                  to="/settings"
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Settings
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            )}
          </nav>

          {!isAuthenticated && (
            <div className="pt-4 border-t border-slate-800 flex flex-col gap-2.5">
              <Link to="/get-started">
                <Button variant="primary" size="md" className="w-full" icon={ArrowRight} iconPosition="right">
                  Get Started
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="sm" className="w-full" icon={LogIn}>
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

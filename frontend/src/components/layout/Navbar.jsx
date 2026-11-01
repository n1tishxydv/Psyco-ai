import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { InitialsAvatar } from '../common/InitialsAvatar';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from '../common/NotificationBell';
import {
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

  // Click outside to close user dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // DEF-05: Prevent body scroll when mobile navigation drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // DEF-05: Support Escape key dismissal for mobile drawer
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

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

          {/* Right Action Area */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Notification Bell (Authenticated Users) */}
            {isAuthenticated && <NotificationBell />}

            {/* Authenticated User Menu Dropdown */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-elevatedSlate/60 transition-colors focus-visible:ring-2 focus-visible:ring-softTeal"
                  aria-expanded={userDropdownOpen}
                  aria-label="User profile menu"
                >
                  <InitialsAvatar name={displayName} email={user?.email} size="sm" />
                  <div className="text-left hidden xl:block">
                    <div className="text-xs font-semibold text-primaryText truncate max-w-[130px]">{displayName}</div>
                    <div className="text-[10px] text-mutedText capitalize">{role || 'Member'}</div>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-mutedText transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-xl py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <div className="text-xs font-semibold text-slate-100 truncate">{displayName}</div>
                      <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                      <div className="mt-1">
                        <Badge variant="teal" size="sm" className="capitalize">{role || 'user'}</Badge>
                      </div>
                    </div>

                    <div className="py-1">
                      {role === 'patient' && (
                        <>
                          <Link
                            to="/patient/dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4 text-teal-400" />
                            Patient Dashboard
                          </Link>
                          <Link
                            to="/patient/profile"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                          >
                            <User className="w-4 h-4 text-teal-400" />
                            My Profile
                          </Link>
                          <Link
                            to="/patient/intake"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
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
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                            Clinician Dashboard
                          </Link>
                          <Link
                            to="/psychologist/profile"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                          >
                            <User className="w-4 h-4 text-emerald-400" />
                            Practice Profile
                          </Link>
                          <Link
                            to="/psychologist/availability"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                          >
                            <Clock className="w-4 h-4 text-emerald-400" />
                            Availability Settings
                          </Link>
                          <Link
                            to="/clinical/reports"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                          >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                            Clinical Reports
                          </Link>
                        </>
                      )}

                      {role === 'admin' && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-teal-400" />
                          Admin Governance
                        </Link>
                      )}

                      <Link
                        to="/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        Settings
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors text-left"
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

          {/* Mobile Drawer Trigger (Minimum 48x48px Interactive Area - DEF-05) */}
          <div className="flex lg:hidden items-center gap-1.5">
            {isAuthenticated && <NotificationBell />}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-w-[48px] min-h-[48px] p-3 rounded-lg text-secondaryText hover:text-primaryText hover:bg-elevatedSlate flex items-center justify-center focus-visible:ring-2 focus-visible:ring-softTeal"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Modal Backdrop & Slide-Over Panel (DEF-05) */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-slate-950/80 backdrop-blur-sm transition-opacity duration-200"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        >
          <div
            id="mobile-navigation-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="fixed inset-y-0 right-0 w-full max-w-xs sm:max-w-sm bg-slate-900 border-l border-slate-800 p-5 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              {/* Drawer Top Header with 48x48 Close Button */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <Logo size="sm" />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-w-[48px] min-h-[48px] p-3 -mr-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                  aria-label="Close navigation menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {isAuthenticated && (
                <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
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
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                        >
                          <LayoutDashboard className="w-4 h-4 text-teal-400" />
                          Patient Dashboard
                        </Link>
                        <Link
                          to="/patient/profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                        >
                          <User className="w-4 h-4 text-teal-400" />
                          My Profile
                        </Link>
                        <Link
                          to="/patient/intake"
                          onClick={() => setMobileMenuOpen(false)}
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
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                        >
                          <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                          Clinician Dashboard
                        </Link>
                        <Link
                          to="/psychologist/profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                        >
                          <User className="w-4 h-4 text-emerald-400" />
                          Practice Profile
                        </Link>
                        <Link
                          to="/psychologist/intake-settings"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                          Intake Builder
                        </Link>
                        <Link
                          to="/psychologist/appointments"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                        >
                          <Calendar className="w-4 h-4 text-emerald-400" />
                          Appointments & Calendar
                        </Link>
                        <Link
                          to="/psychologist/availability"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                        >
                          <Clock className="w-4 h-4 text-emerald-400" />
                          Working Hours & Availability
                        </Link>
                        <Link
                          to="/clinical/reports"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                          Clinical Reports
                        </Link>
                      </>
                    )}

                    {role === 'admin' && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                      >
                        <LayoutDashboard className="w-4 h-4 text-teal-400" />
                        Admin Governance
                      </Link>
                    )}

                    <Link
                      to="/settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      Settings
                    </Link>
                  </>
                )}
              </nav>
            </div>

            {/* Bottom Drawer Actions */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 text-center"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <Link to="/get-started" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="md" className="w-full justify-center" icon={ArrowRight} iconPosition="right">
                      Get Started
                    </Button>
                  </Link>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="secondary" size="sm" className="w-full justify-center" icon={LogIn}>
                      Sign In
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;

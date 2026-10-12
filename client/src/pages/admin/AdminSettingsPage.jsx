import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Globe,
  Hash,
  Info,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { settingsApi } from '../../services/settingsApi.js';
import { fieldErrors } from '../../utils/fieldErrors.js';

const TIMEZONE_OPTIONS = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST, UTC+05:30)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT, UTC-05:00)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT, UTC-08:00)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST, UTC+00:00)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST, UTC+04:00)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT, UTC+08:00)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST, UTC+09:00)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT, UTC+10:00)' },
];

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    institutionName: '',
    timezone: 'Asia/Kolkata',
    applicationIdPrefix: 'LV',
    contactEmail: '',
    contactPhone: '',
    address: '',
    academicYearStart: '',
    academicYearEnd: '',
  });

  const [leavePolicy, setLeavePolicy] = useState({
    weekendCountsTowardLeave: true,
    holidayCountsTowardLeave: true,
    allowLeaveOnHolidays: true,
  });

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      setGeneralError('');
      try {
        const response = await settingsApi.getSettings();
        const s = response.data?.settings || {};
        setFormData({
          institutionName: s.institutionName || '',
          timezone: s.timezone || 'Asia/Kolkata',
          applicationIdPrefix: s.applicationIdPrefix || 'LV',
          contactEmail: s.contactEmail || '',
          contactPhone: s.contactPhone || '',
          address: s.address || '',
          academicYearStart: s.academicYear?.startDate || '',
          academicYearEnd: s.academicYear?.endDate || '',
        });
        if (s.leavePolicy) {
          setLeavePolicy(s.leavePolicy);
        }
      } catch (err) {
        setGeneralError(err.message || 'Unable to load institution settings');
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setGeneralError('');
    setErrors({});
    setSuccessMsg('');

    try {
      const payload = {
        institutionName: formData.institutionName.trim(),
        timezone: formData.timezone,
        applicationIdPrefix: formData.applicationIdPrefix.trim().toUpperCase(),
        contactEmail: formData.contactEmail.trim(),
        contactPhone: formData.contactPhone.trim(),
        address: formData.address.trim(),
        academicYear: {
          startDate: formData.academicYearStart || null,
          endDate: formData.academicYearEnd || null,
        },
      };

      const response = await settingsApi.updateSettings(payload);
      const s = response.data?.settings || {};
      setFormData({
        institutionName: s.institutionName || '',
        timezone: s.timezone || 'Asia/Kolkata',
        applicationIdPrefix: s.applicationIdPrefix || 'LV',
        contactEmail: s.contactEmail || '',
        contactPhone: s.contactPhone || '',
        address: s.address || '',
        academicYearStart: s.academicYear?.startDate || '',
        academicYearEnd: s.academicYear?.endDate || '',
      });
      setSuccessMsg('Institution parameters and calendar settings successfully updated.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err.details && Array.isArray(err.details)) {
        setErrors(fieldErrors(err.details));
      } else {
        setGeneralError(err.message || 'Failed to save settings.');
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-slate-500 shadow-xs">
        <div className="flex items-center gap-3 text-sm font-medium">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" aria-hidden="true" />
          Loading institution settings…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* LeaveHub Hero Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#132238] via-[#1c3352] to-[#1e3a8a] p-6 text-white shadow-md sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1 text-xs font-semibold text-blue-200 backdrop-blur-xs">
              <Building className="h-3.5 w-3.5" aria-hidden="true" />
              Administrative Governance
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Institution Settings &amp; Policies
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Configure institution profile, authoritative timezone, academic calendar range, and view locked system policies.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 transition-all">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Clock className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-blue-800">System Timezone</p>
              <p className="truncate text-sm font-bold text-slate-900">{formData.timezone}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 transition-all">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white shadow-xs">
              <Hash className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-800">Application ID Prefix</p>
              <p className="truncate text-sm font-bold text-slate-900">{formData.applicationIdPrefix || 'LV'}-YYYY-NNNNNN</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 transition-all">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Calendar className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-emerald-800">Academic Year</p>
              <p className="truncate text-sm font-bold text-slate-900">
                {formData.academicYearStart ? `${formData.academicYearStart.slice(0, 4)} – ${formData.academicYearEnd ? formData.academicYearEnd.slice(0, 4) : 'Present'}` : 'Not Defined'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-purple-100 bg-purple-50/70 p-4 transition-all">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-xs">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-purple-800">Leave Policy Status</p>
              <p className="truncate text-sm font-bold text-slate-900">Enforced &amp; Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
          <span>{successMsg}</span>
        </div>
      )}

      {generalError && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
          <span>{generalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Campus Profile & Contacts */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
          <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Building className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Campus Identity &amp; Contact Information</h2>
              <p className="text-xs text-slate-500">Official details printed on leave recommendation letters and PDF headers</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Institution Name */}
            <div className="sm:col-span-2">
              <label htmlFor="institutionName" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Institution Name <span className="text-red-500">*</span>
              </label>
              <input
                id="institutionName"
                type="text"
                required
                value={formData.institutionName}
                onChange={(e) => handleChange('institutionName', e.target.value)}
                placeholder="e.g. National Institute of Technology"
                className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${
                  errors.institutionName
                    ? 'border-red-300 bg-red-50/50 text-red-900 focus:border-red-500 focus:ring-red-200'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:ring-blue-200'
                }`}
              />
              {errors.institutionName && (
                <p className="mt-1 text-xs text-red-600">{errors.institutionName}</p>
              )}
            </div>

            {/* Contact Email */}
            <div>
              <label htmlFor="contactEmail" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Administrative Contact Email
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
                <input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                  placeholder="admin@institution.edu"
                  className={`w-full rounded-xl border pl-10 pr-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${
                    errors.contactEmail
                      ? 'border-red-300 bg-red-50/50 text-red-900 focus:border-red-500 focus:ring-red-200'
                      : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:ring-blue-200'
                  }`}
                />
              </div>
              {errors.contactEmail && (
                <p className="mt-1 text-xs text-red-600">{errors.contactEmail}</p>
              )}
            </div>

            {/* Contact Phone */}
            <div>
              <label htmlFor="contactPhone" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Official Contact Phone
              </label>
              <div className="relative mt-1.5">
                <Phone className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
                <input
                  id="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => handleChange('contactPhone', e.target.value)}
                  placeholder="+91 (0) 80 1234 5678"
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            {/* Campus Address */}
            <div className="sm:col-span-2">
              <label htmlFor="address" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Campus Location / Address
              </label>
              <div className="relative mt-1.5">
                <MapPin className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
                <textarea
                  id="address"
                  rows={2}
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Main Campus, Academic Block 1, University Road..."
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Timezone, ID Generation, and Academic Year */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
          <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <Globe className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">System Parameters &amp; Academic Year</h2>
              <p className="text-xs text-slate-500">Authoritative timezone and calendar calculation bounds</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Timezone */}
            <div>
              <label htmlFor="timezone" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Authoritative Timezone <span className="text-red-500">*</span>
              </label>
              <select
                id="timezone"
                value={formData.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {TIMEZONE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Used to resolve date-only calculations and 'today' boundaries.
              </p>
            </div>

            {/* Application ID Prefix */}
            <div>
              <label htmlFor="applicationIdPrefix" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Application ID Prefix <span className="text-red-500">*</span>
              </label>
              <input
                id="applicationIdPrefix"
                type="text"
                required
                maxLength={10}
                value={formData.applicationIdPrefix}
                onChange={(e) => handleChange('applicationIdPrefix', e.target.value.toUpperCase())}
                placeholder="LV"
                className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 font-mono text-sm uppercase transition-all focus:outline-none focus:ring-2 ${
                  errors.applicationIdPrefix
                    ? 'border-red-300 bg-red-50/50 text-red-900 focus:border-red-500 focus:ring-red-200'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:ring-blue-200'
                }`}
              />
              {errors.applicationIdPrefix ? (
                <p className="mt-1 text-xs text-red-600">{errors.applicationIdPrefix}</p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  Letters/digits prepended to yearly serial numbers (e.g., {formData.applicationIdPrefix || 'LV'}-2026-000001).
                </p>
              )}
            </div>

            {/* Academic Year Start */}
            <div>
              <label htmlFor="academicYearStart" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Academic Year Start Date
              </label>
              <input
                id="academicYearStart"
                type="date"
                value={formData.academicYearStart}
                onChange={(e) => handleChange('academicYearStart', e.target.value)}
                className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${
                  errors['academicYear.startDate']
                    ? 'border-red-300 bg-red-50/50 text-red-900 focus:border-red-500 focus:ring-red-200'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:ring-blue-200'
                }`}
              />
              {errors['academicYear.startDate'] && (
                <p className="mt-1 text-xs text-red-600">{errors['academicYear.startDate']}</p>
              )}
            </div>

            {/* Academic Year End */}
            <div>
              <label htmlFor="academicYearEnd" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Academic Year End Date
              </label>
              <input
                id="academicYearEnd"
                type="date"
                value={formData.academicYearEnd}
                onChange={(e) => handleChange('academicYearEnd', e.target.value)}
                className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${
                  errors['academicYear.endDate']
                    ? 'border-red-300 bg-red-50/50 text-red-900 focus:border-red-500 focus:ring-red-200'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:ring-blue-200'
                }`}
              />
              {errors['academicYear.endDate'] && (
                <p className="mt-1 text-xs text-red-600">{errors['academicYear.endDate']}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Locked Institution Leave Policy Rules (Reference) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <Lock className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Enforced Institution Leave Policies</h2>
                <p className="text-xs text-slate-500">Core immutable system policy locks confirmed in Stage 0</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
              <ShieldCheck className="h-4 w-4" /> Locked Policy
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Weekends Counted</span>
                <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                  YES
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Policy leave days equal inclusive calendar duration (weekends are counted).
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Holidays Counted</span>
                <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                  YES
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Institutional &amp; public holidays during the span are included in leave tally.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Rejection Reason</span>
                <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                  MANDATORY
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Administrators must supply a documented reason for every rejected leave request.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Decision Lock</span>
                <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                  ATOMIC
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Race-condition protected conditional database updates prevent double-decisions.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="flex items-center justify-end gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-6">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/30 transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Saving settings…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" aria-hidden="true" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

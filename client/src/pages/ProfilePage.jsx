import { useState } from 'react';
import AppShell from '../components/layout/AppShell';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';

const SectionCard = ({ title, children }) => (
  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
    <h2 className="text-sm font-semibold text-zinc-300 mb-5">{title}</h2>
    {children}
  </div>
);

const InputField = ({ label, note, ...props }) => (
  <div>
    <label className="block text-xs font-medium text-zinc-500 mb-1.5">{label}</label>
    <input
      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200
        placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:border-amber-500/50
        focus:ring-amber-500/10 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      {...props}
    />
    {note && <p className="text-[11px] text-zinc-600 mt-1">{note}</p>}
  </div>
);

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [name, setName]           = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw]   = useState(false);
  const [showPw, setShowPw]       = useState({ current: false, new: false, confirm: false });

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Name cannot be blank'); return; }
    setSavingProfile(true);
    try {
      const { data } = await usersAPI.updateProfile({ name });
      updateUser({ name: data.user.name });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (newPw.length < 8)    { toast.error('Password must be at least 8 characters'); return; }
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return; }
    setSavingPw(true);
    try {
      await usersAPI.changePassword({ currentPassword: currentPw, newPassword: newPw });
      toast.success('Password changed');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not change password');
    } finally {
      setSavingPw(false);
    }
  };

  const EyeToggle = ({ field }) => (
    <button type="button" tabIndex={-1}
      onClick={() => setShowPw((p) => ({ ...p, [field]: !p[field] }))}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors p-0.5"
    >
      {showPw[field] ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
        </svg>
      )}
    </button>
  );

  return (
    <AppShell>
      <div className="max-w-xl mx-auto px-6 py-8">
        <h1 className="font-display text-2xl font-bold text-white mb-7">Profile Settings</h1>

        {/* Avatar card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-400 flex items-center justify-center text-xl font-bold text-black flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-zinc-100">{user?.name}</p>
            <p className="text-sm text-zinc-500">{user?.email}</p>
          </div>
          <div className="ml-auto">
            <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-amber-400/10 border border-amber-400/20 text-amber-400">
              Active
            </span>
          </div>
        </div>

        {/* Profile form */}
        <div className="space-y-4 mb-5">
          <SectionCard title="Edit Profile">
            <form onSubmit={handleProfileSave} className="space-y-4">
              <InputField
                label="Display name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
              <InputField
                label="Email address"
                type="email"
                value={user?.email}
                disabled
                note="Email cannot be changed."
              />
              <button type="submit" disabled={savingProfile}
                className="bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-semibold text-sm
                  rounded-xl px-4 py-2.5 transition-all duration-150 active:scale-[0.98]"
              >
                {savingProfile ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </SectionCard>
        </div>

        {/* Password form */}
        <SectionCard title="Change Password">
          <form onSubmit={handlePasswordSave} className="space-y-4">
            {[
              { label: 'Current password', value: currentPw, setter: setCurrentPw, field: 'current', autocomplete: 'current-password' },
              { label: 'New password',     value: newPw,     setter: setNewPw,     field: 'new',     autocomplete: 'new-password' },
              { label: 'Confirm new',      value: confirmPw, setter: setConfirmPw, field: 'confirm', autocomplete: 'new-password' },
            ].map(({ label, value, setter, field, autocomplete }) => (
              <div key={field}>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">{label}</label>
                <div className="relative">
                  <input
                    type={showPw[field] ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    autoComplete={autocomplete}
                    placeholder="••••••••"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 pr-10 text-sm text-zinc-200
                      placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:border-amber-500/50
                      focus:ring-amber-500/10 transition-all duration-150"
                  />
                  <EyeToggle field={field} />
                </div>
              </div>
            ))}
            <button type="submit" disabled={savingPw}
              className="bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-semibold text-sm
                rounded-xl px-4 py-2.5 transition-all duration-150 active:scale-[0.98]"
            >
              {savingPw ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </SectionCard>
      </div>
    </AppShell>
  );
}

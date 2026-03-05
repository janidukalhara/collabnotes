/**
 * CollaboratorPanel.jsx
 *
 * Collaborator Management Flow:
 *  1. Owner clicks "Share" → this panel opens
 *  2. Enter email, select role (editor / viewer), click Invite
 *  3. Backend finds the user by email and adds them
 *  4. Owner can change role inline or remove with one click
 *  5. Non-owners see the list read-only
 */
import { useState } from 'react';
import { notesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

// Resolve ID whether populated object or raw string
const toStr = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (val._id) return val._id.toString();
  return val.toString();
};

function Avatar({ user }) {
  if (!user) {
    return <div className="w-7 h-7 rounded-full bg-zinc-700 flex-shrink-0" />;
  }
  return user.avatar ? (
    <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
  ) : (
    <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center text-[11px] font-bold text-black flex-shrink-0">
      {user.name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

export default function CollaboratorPanel({ note, onUpdate }) {
  const { user }  = useAuth();
  const userId    = toStr(user?._id);
  const isOwner   = toStr(note?.owner) === userId || toStr(note?.owner?._id) === userId;

  const [email, setEmail]     = useState('');
  const [role, setRole]       = useState('editor');
  const [adding, setAdding]   = useState(false);
  const [copied, setCopied]   = useState(false);

  // ── Invite ─────────────────────────────────────────────────────────────────
  const handleInvite = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setAdding(true);
    try {
      const { data } = await notesAPI.addCollaborator(note._id, { email: trimmed, role });
      onUpdate(data.note);
      setEmail('');
      toast.success(`${trimmed} added as ${role}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add collaborator');
    } finally {
      setAdding(false);
    }
  };

  // ── Change role ────────────────────────────────────────────────────────────
  const handleRoleChange = async (collabUserId, newRole) => {
    try {
      const { data } = await notesAPI.updateCollaborator(note._id, collabUserId, { role: newRole });
      onUpdate(data.note);
      toast.success('Role updated');
    } catch {
      toast.error('Could not update role');
    }
  };

  // ── Remove collaborator ────────────────────────────────────────────────────
  const handleRemove = async (collabUserId, name) => {
    if (!window.confirm(`Remove ${name || 'this user'} from this note?`)) return;
    try {
      const { data } = await notesAPI.removeCollaborator(note._id, collabUserId);
      onUpdate(data.note);
      toast.success('Removed');
    } catch {
      toast.error('Could not remove collaborator');
    }
  };

  // ── Copy link ──────────────────────────────────────────────────────────────
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const inputBase = "w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:border-amber-500/50 focus:ring-amber-500/10 transition-all";
  const selectBase = "bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all cursor-pointer hover:border-zinc-600";

  return (
    <div className="flex flex-col gap-6">

      {/* Copy link button */}
      <button
        onClick={handleCopyLink}
        className="w-full flex items-center gap-2.5 bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700
          hover:border-zinc-600 rounded-xl px-3 py-2.5 text-xs transition-all group"
      >
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-zinc-300 transition-colors">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        )}
        <span className={copied ? 'text-emerald-400' : 'text-zinc-400 group-hover:text-zinc-200 transition-colors'}>
          {copied ? 'Copied!' : 'Copy note link'}
        </span>
      </button>

      {/* Owner row */}
      <div>
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-2.5">Owner</p>
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-800/50">
          <Avatar user={note.owner} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-200 truncate">{note.owner?.name ?? '—'}</p>
            <p className="text-[11px] text-zinc-500 truncate">{note.owner?.email ?? '—'}</p>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 text-amber-400 flex-shrink-0">
            Owner
          </span>
        </div>
      </div>

      {/* Collaborators list */}
      {note.collaborators?.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-2.5">
            Collaborators ({note.collaborators.length})
          </p>
          <ul className="space-y-1.5">
            {note.collaborators.map((c) => {
              const cId   = toStr(c.user?._id || c.user);
              const cUser = typeof c.user === 'object' ? c.user : null;
              return (
                <li key={cId} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-800/40 group transition-colors">
                  <Avatar user={cUser} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-300 truncate">{cUser?.name ?? 'Unknown'}</p>
                    <p className="text-[11px] text-zinc-600 truncate">{cUser?.email ?? ''}</p>
                  </div>

                  {isOwner ? (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* Role selector */}
                      <select
                        value={c.role}
                        onChange={(e) => handleRoleChange(cId, e.target.value)}
                        className={selectBase}
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      {/* Remove */}
                      <button
                        onClick={() => handleRemove(cId, cUser?.name)}
                        title="Remove access"
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-zinc-600
                          hover:text-red-400 hover:bg-red-400/10 transition-all"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <line x1="17" y1="11" x2="23" y2="11"/>
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border flex-shrink-0 capitalize
                      ${c.role === 'editor'
                        ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10'
                        : 'text-zinc-500 border-zinc-700 bg-zinc-800'}`}
                    >
                      {c.role}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Invite form — owner only */}
      {isOwner && (
        <div>
          <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-2.5">
            Invite people
          </p>
          <form onSubmit={handleInvite} className="space-y-2.5">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address…"
              required
              className={inputBase}
            />

            <div className="flex gap-2">
              <select value={role} onChange={(e) => setRole(e.target.value)} className={`${selectBase} flex-1 py-2`}>
                <option value="editor">Editor — can edit</option>
                <option value="viewer">Viewer — read only</option>
              </select>
              <button
                type="submit"
                disabled={adding || !email.trim()}
                className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300
                  disabled:opacity-40 disabled:cursor-not-allowed
                  text-black font-semibold text-xs rounded-xl px-4 py-2
                  transition-all active:scale-[0.97]"
              >
                {adding
                  ? <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                }
                {adding ? '…' : 'Invite'}
              </button>
            </div>

            <p className="text-[11px] text-zinc-600">
              They must already have a CollabNotes account.
            </p>
          </form>
        </div>
      )}
    </div>
  );
}

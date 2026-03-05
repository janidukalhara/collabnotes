/**
 * NoteCard.jsx
 *
 * Grid card and list row for notes.
 * - Keyword highlight via <Highlight> when searchQuery is set
 * - Hover overlay: pin / archive / delete (owner only)
 * - Collaborator avatars
 */
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useNotes } from '../../contexts/NotesContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const toStr = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (val._id) return val._id.toString();
  return val.toString();
};

// Highlight matching keyword segments in text
function Highlight({ text = '', query = '' }) {
  if (!query || !text) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts   = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="bg-amber-400/25 text-amber-300 rounded px-0.5 not-italic">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

const ACCENT = {
  '#1c1917': '#a78060',
  '#0f2318': '#34d399',
  '#0f1f33': '#60a5fa',
  '#2d1b1b': '#f87171',
  '#1e1b2e': '#c084fc',
  '#291a03': '#fbbf24',
};

export default function NoteCard({ note, searchQuery = '', listView = false }) {
  const { deleteNote, updateNote } = useNotes();
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const userId   = toStr(user?._id);
  const ownerId  = toStr(note.owner);
  const isOwner  = userId === ownerId;
  const accent   = ACCENT[note.color] || '#71717a';
  const snippet  = note.contentText?.slice(0, listView ? 180 : 120) || '';

  const handlePin = async (e) => {
    e.stopPropagation();
    try {
      const { data } = await import('../../services/api').then((m) => m.notesAPI.update(note._id, { isPinned: !note.isPinned }));
      updateNote(note._id, data.note);
    } catch { toast.error('Could not pin'); }
  };

  const handleArchive = async (e) => {
    e.stopPropagation();
    try {
      const { notesAPI } = await import('../../services/api');
      const { data } = await notesAPI.update(note._id, { isArchived: !note.isArchived });
      updateNote(note._id, data.note);
      toast.success(note.isArchived ? 'Restored' : 'Archived');
    } catch { toast.error('Could not archive'); }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${note.title || 'Untitled Note'}"? This cannot be undone.`)) return;
    try { await deleteNote(note._id); }
    catch { toast.error('Could not delete'); }
  };

  const PinIcon = ({ filled }) => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill={filled ? '#fbbf24' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    </svg>
  );

  const ArchiveIcon = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/>
      <line x1="10" y1="12" x2="14" y2="12"/>
    </svg>
  );

  const TrashIcon = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );

  // ── List view ────────────────────────────────────────────────────────────────
  if (listView) {
    return (
      <div
        onClick={() => navigate(`/notes/${note._id}`)}
        className="group flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl
          px-4 py-3 cursor-pointer hover:border-zinc-700 hover:bg-zinc-800/40
          transition-all animate-fade-in"
      >
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-200 truncate">
              <Highlight text={note.title || 'Untitled Note'} query={searchQuery} />
            </span>
            {note.isPinned && <PinIcon filled />}
          </div>
          {snippet && (
            <p className="text-xs text-zinc-600 truncate mt-0.5">
              <Highlight text={snippet} query={searchQuery} />
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {note.tags?.slice(0, 2).map((t) => (
            <span key={t} className="hidden sm:block text-[10px] px-1.5 py-0.5 rounded
              bg-zinc-800 border border-zinc-700 text-zinc-600 font-mono">
              #{t}
            </span>
          ))}
          <span className="text-[10px] text-zinc-600 font-mono">
            {format(new Date(note.updatedAt), 'MMM d')}
          </span>
          <div className="hidden group-hover:flex items-center gap-0.5">
            <button onClick={handlePin}  className="p-1 text-zinc-600 hover:text-amber-400 transition-colors"><PinIcon filled={note.isPinned} /></button>
            <button onClick={handleArchive} className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors"><ArchiveIcon /></button>
            {isOwner && <button onClick={handleDelete} className="p-1 text-zinc-600 hover:text-red-400 transition-colors"><TrashIcon /></button>}
          </div>
        </div>
      </div>
    );
  }

  // ── Grid card ────────────────────────────────────────────────────────────────
  return (
    <div
      onClick={() => navigate(`/notes/${note._id}`)}
      className="group relative flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl
        overflow-hidden cursor-pointer transition-all duration-200
        hover:border-zinc-600 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/50
        animate-fade-in"
    >
      {/* Accent top bar */}
      <div className="h-[2px] w-full" style={{ backgroundColor: accent }} />

      <div className="p-4 flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display font-semibold text-zinc-100 line-clamp-2 leading-snug text-sm flex-1">
            <Highlight text={note.title || 'Untitled Note'} query={searchQuery} />
          </h3>
          {note.isPinned && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#fbbf24" className="flex-shrink-0 mt-0.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            </svg>
          )}
        </div>

        {snippet && (
          <p className="text-zinc-500 text-xs line-clamp-3 leading-relaxed">
            <Highlight text={snippet} query={searchQuery} />
          </p>
        )}
      </div>

      {/* Tags */}
      {note.tags?.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {note.tags.slice(0, 3).map((tag) => (
            <span key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-800
                text-zinc-500 font-mono border border-zinc-700/60">
              #{tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="text-[10px] text-zinc-700 font-mono">+{note.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 pb-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between gap-2">
        {/* Collaborator avatars */}
        <div className="flex items-center">
          {note.collaborators?.slice(0, 4).map((c, i) => {
            const cUser = typeof c.user === 'object' ? c.user : null;
            return (
              <div
                key={toStr(c.user)}
                title={cUser?.name ?? ''}
                className="w-5 h-5 rounded-full bg-zinc-700 border-2 border-zinc-900
                  flex items-center justify-center text-[9px] font-bold text-zinc-300"
                style={{ marginLeft: i === 0 ? 0 : '-5px', zIndex: 4 - i }}
              >
                {cUser?.name?.[0]?.toUpperCase() ?? '?'}
              </div>
            );
          })}
          {(note.collaborators?.length ?? 0) > 4 && (
            <span className="text-[10px] text-zinc-600 ml-1.5 font-mono">
              +{note.collaborators.length - 4}
            </span>
          )}
        </div>

        <span className="text-[10px] text-zinc-600 font-mono flex-shrink-0">
          {format(new Date(note.updatedAt), 'MMM d')}
        </span>
      </div>

      {/* Hover action buttons */}
      <div className="absolute top-2.5 right-2.5 hidden group-hover:flex items-center
        bg-zinc-800 border border-zinc-700 rounded-lg px-1 py-1 shadow-xl z-10 gap-0.5">
        <button onClick={handlePin}     title={note.isPinned ? 'Unpin' : 'Pin'}
          className="p-1.5 text-zinc-500 hover:text-amber-400 transition-colors rounded">
          <PinIcon filled={note.isPinned} />
        </button>
        <button onClick={handleArchive} title={note.isArchived ? 'Restore' : 'Archive'}
          className="p-1.5 text-zinc-500 hover:text-zinc-200 transition-colors rounded">
          <ArchiveIcon />
        </button>
        {isOwner && (
          <button onClick={handleDelete} title="Delete permanently"
            className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors rounded">
            <TrashIcon />
          </button>
        )}
      </div>
    </div>
  );
}

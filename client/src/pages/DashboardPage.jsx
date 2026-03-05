/**
 * DashboardPage.jsx
 *
 * - Note grid with pinned section
 * - Full-text search with keyword highlight
 * - Archive toggle
 * - New note creation
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import NoteCard from '../components/notes/NoteCard';
import { useNotes } from '../contexts/NotesContext';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const {
    notes, loading, fetchNotes, createNote,
    searchResults, searchQuery, clearSearch,
  } = useNotes();
  const navigate = useNavigate();

  const [showArchived, setShowArchived] = useState(false);
  const [creating, setCreating]         = useState(false);
  const [view, setView]                 = useState('grid'); // 'grid' | 'list'

  useEffect(() => {
    if (!searchQuery) fetchNotes({ archived: showArchived });
  }, [showArchived, searchQuery]);

  const handleNewNote = async () => {
    setCreating(true);
    try {
      const note = await createNote({ title: '', content: '' });
      navigate(`/notes/${note._id}`);
    } catch {
      toast.error('Could not create note');
      setCreating(false);
    }
  };

  const handleToggleArchive = () => {
    clearSearch();
    setShowArchived((v) => !v);
  };

  const displayNotes = searchQuery ? searchResults : notes;
  const pinned   = displayNotes.filter((n) => n.isPinned && !n.isArchived);
  const unpinned = displayNotes.filter((n) => !n.isPinned);

  // ── Sub-components ─────────────────────────────────────────────────────────
  const NoteGrid = ({ items }) => (
    <div className={view === 'list'
      ? 'flex flex-col gap-2'
      : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'
    }>
      {items.map((n) => <NoteCard key={n._id} note={n} searchQuery={searchQuery || ''} listView={view === 'list'} />)}
    </div>
  );

  const SkeletonCard = () => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 animate-pulse">
      <div className="h-3.5 bg-zinc-800 rounded w-3/4" />
      <div className="h-3 bg-zinc-800 rounded w-full" />
      <div className="h-3 bg-zinc-800 rounded w-2/3" />
      <div className="h-3 bg-zinc-800 rounded w-1/2" />
    </div>
  );

  const Empty = () => (
    <div className="flex flex-col items-center justify-center py-28 text-center select-none">
      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-5">
        {searchQuery ? (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
        )}
      </div>
      <h3 className="font-display text-xl font-bold text-zinc-300 mb-2">
        {searchQuery ? 'No results found' : showArchived ? 'No archived notes' : 'No notes yet'}
      </h3>
      <p className="text-zinc-600 text-sm max-w-xs mb-7">
        {searchQuery
          ? `Nothing matched "${searchQuery}". Try different keywords.`
          : showArchived
            ? 'Archived notes will appear here.'
            : 'Create your first note and start capturing ideas.'}
      </p>
      {!searchQuery && !showArchived && (
        <button onClick={handleNewNote} disabled={creating}
          className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50
            text-black font-semibold text-sm rounded-xl px-5 py-2.5
            transition-all duration-150 active:scale-[0.98]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {creating ? 'Creating…' : 'Create first note'}
        </button>
      )}
    </div>
  );

  const SectionHeader = ({ icon, label, count }) => (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h2 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">{label}</h2>
      <span className="text-[10px] text-zinc-700 font-mono bg-zinc-800 px-1.5 py-0.5 rounded">{count}</span>
    </div>
  );

  return (
    <AppShell>
      <div className="px-6 py-6 max-w-7xl mx-auto">

        {/* ── Page header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              {searchQuery
                ? 'Search Results'
                : showArchived ? 'Archived Notes' : 'My Notes'}
            </h1>
            {searchQuery ? (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-zinc-500 text-xs font-mono">
                  {displayNotes.length} result{displayNotes.length !== 1 ? 's' : ''} for{' '}
                  <span className="text-amber-400">"{searchQuery}"</span>
                </p>
                <button onClick={clearSearch}
                  className="text-[11px] text-zinc-600 hover:text-zinc-300 underline transition-colors"
                >
                  Clear
                </button>
              </div>
            ) : (
              <p className="text-zinc-600 text-xs font-mono mt-0.5">
                {displayNotes.length} {displayNotes.length === 1 ? 'note' : 'notes'}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Grid / list toggle */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1">
              <button onClick={() => setView('grid')}
                className={`p-1.5 rounded-md transition-all ${view === 'grid' ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-600 hover:text-zinc-400'}`}
                title="Grid view"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                </svg>
              </button>
              <button onClick={() => setView('list')}
                className={`p-1.5 rounded-md transition-all ${view === 'list' ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-600 hover:text-zinc-400'}`}
                title="List view"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Archive toggle */}
            <button onClick={handleToggleArchive}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all
                ${showArchived
                  ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                  : 'border-zinc-800 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'}`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/>
                <line x1="10" y1="12" x2="14" y2="12"/>
              </svg>
              {showArchived ? 'Active notes' : 'Archived'}
            </button>

            {/* New note */}
            {!showArchived && (
              <button onClick={handleNewNote} disabled={creating}
                className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50
                  text-black font-semibold text-xs rounded-xl px-3 py-2
                  transition-all active:scale-[0.98]"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                {creating ? 'Creating…' : 'New note'}
              </button>
            )}
          </div>
        </div>

        {/* ── Note content ────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : displayNotes.length === 0 ? (
          <Empty />
        ) : (
          <div className="space-y-8">
            {pinned.length > 0 && !showArchived && (
              <section>
                <SectionHeader
                  icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="#fbbf24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/></svg>}
                  label="Pinned"
                  count={pinned.length}
                />
                <NoteGrid items={pinned} />
              </section>
            )}

            {unpinned.length > 0 && (
              <section>
                {pinned.length > 0 && !showArchived && (
                  <SectionHeader
                    icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
                    label={searchQuery ? 'Results' : 'All notes'}
                    count={unpinned.length}
                  />
                )}
                <NoteGrid items={unpinned} />
              </section>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

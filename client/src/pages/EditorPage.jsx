/**
 * EditorPage.jsx
 *
 * Key architecture decisions:
 *  1. `initialContent` is React STATE — guarantees RichTextEditor receives
 *     the correct value when editorKey increments (ref reads during render
 *     are unreliable because refs don't trigger re-renders).
 *  2. `fieldRef` is the single source of truth for saves — updated
 *     synchronously on every keystroke, never stale.
 *  3. `doSave` reads ONLY from fieldRef — zero stale-closure risk.
 *  4. Save-on-unmount via keepalive fetch — navigating away never loses data.
 *  5. beforeunload warning when dirty.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { notesAPI } from '../services/api';
import { useNotes } from '../contexts/NotesContext';
import { useAuth } from '../contexts/AuthContext';
import RichTextEditor from '../components/editor/RichTextEditor';
import CollaboratorPanel from '../components/editor/CollaboratorPanel';
import AppShell from '../components/layout/AppShell';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const NOTE_COLORS = [
  { hex: '#18181b', label: 'Default' },
  { hex: '#1c1917', label: 'Stone'   },
  { hex: '#0f2318', label: 'Forest'  },
  { hex: '#0f1f33', label: 'Navy'    },
  { hex: '#2d1b1b', label: 'Wine'    },
  { hex: '#1e1b2e', label: 'Plum'    },
  { hex: '#291a03', label: 'Amber'   },
];

const toStr = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (val._id) return val._id.toString();
  return val.toString();
};

const stripHtml = (html = '') =>
  html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export default function EditorPage() {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const { updateNote } = useNotes();
  const { user }       = useAuth();

  const [note, setNote]                   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [savedAt, setSavedAt]             = useState(null);
  const [dirty, setDirty]                 = useState(false);
  const [title, setTitle]                 = useState('');
  const [tags, setTags]                   = useState([]);
  const [tagInput, setTagInput]           = useState('');
  const [showSidebar, setShowSidebar]     = useState(false);

  // `initialContent` in STATE so React re-renders RichTextEditor with the
  // correct value when editorKey changes. A ref read during render is NOT
  // reliable for this purpose.
  const [initialContent, setInitialContent] = useState('');
  // Increment to remount Quill with fresh content (on note load)
  const [editorKey, setEditorKey]           = useState(0);

  // fieldRef — every save reads from here. Updated synchronously on each change.
  const fieldRef   = useRef({ title: '', content: '', tags: [] });
  const dirtyRef   = useRef(false);
  const canEditRef = useRef(false);
  const autoSaveRef = useRef(null);
  const noteIdRef   = useRef(id);
  noteIdRef.current = id;

  // Access check
  const userId  = toStr(user?._id);
  const ownerId = toStr(note?.owner);
  const isOwner = !!userId && !!ownerId && userId === ownerId;
  const isEditorCollab = note?.collaborators?.some(
    (c) => toStr(c.user) === userId && c.role === 'editor'
  ) ?? false;
  const canEdit = isOwner || isEditorCollab;
  canEditRef.current = canEdit;

  // ── Core save — reads ONLY from refs, never from React state ─────────────
  const doSave = useCallback(async ({ silent = false } = {}) => {
    const { title: t, content: c, tags: tg } = fieldRef.current;
    setSaving(true);
    try {
      const { data } = await notesAPI.update(noteIdRef.current, {
        title:   (t || '').trim() || 'Untitled Note',
        content: c,
        tags:    tg,
      });
      setNote(data.note);
      updateNote(noteIdRef.current, data.note);
      setSavedAt(new Date());
      setDirty(false);
      dirtyRef.current = false;
      if (!silent) toast.success('Note saved');
    } catch {
      toast.error('Save failed — check your connection');
    } finally {
      setSaving(false);
    }
  }, [updateNote]);

  // ── Load note ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    clearTimeout(autoSaveRef.current);

    const load = async () => {
      setLoading(true);
      setDirty(false);
      dirtyRef.current = false;
      try {
        const { data } = await notesAPI.getById(id);
        if (cancelled) return;
        const n  = data.note;
        const t  = n.title === 'Untitled Note' ? '' : (n.title || '');
        const c  = n.content || '';
        const tg = n.tags   || [];

        // 1. Sync fieldRef — doSave will read from here
        fieldRef.current = { title: t, content: c, tags: tg };

        // 2. Set state — React will re-render with these values
        setNote(n);
        setTitle(t);
        setTags(tg);
        setSavedAt(new Date(n.updatedAt));

        // 3. Set initialContent in STATE (not ref!) then bump editorKey
        //    React batches these: on next render, RichTextEditor receives
        //    the correct initialContent AND a new key → fresh mount ✓
        setInitialContent(c);
        setEditorKey((k) => k + 1);
      } catch (err) {
        if (!cancelled) {
          toast.error(err.response?.data?.message || 'Could not load note');
          navigate('/dashboard');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    // Save-on-unmount: flush any unsaved changes before leaving
    return () => {
      cancelled = true;
      clearTimeout(autoSaveRef.current);
      if (dirtyRef.current && canEditRef.current) {
        const { title: t, content: c, tags: tg } = fieldRef.current;
        const token   = localStorage.getItem('accessToken');
        const apiBase = import.meta.env.VITE_API_URL || '/api';
        fetch(`${apiBase}/notes/${noteIdRef.current}`, {
          method:    'PUT',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            title:   (t || '').trim() || 'Untitled Note',
            content: c,
            tags:    tg,
          }),
          keepalive: true,
        }).catch(() => {});
      }
    };
  }, [id]); // eslint-disable-line

  // beforeunload: browser warning when dirty
  useEffect(() => {
    const h = (e) => { if (dirtyRef.current) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, []);

  // Ctrl / Cmd + S
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (canEditRef.current && !saving) {
          clearTimeout(autoSaveRef.current);
          doSave({ silent: false });
        }
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [saving, doSave]);

  // Auto-save: 2 s debounce
  const scheduleAutoSave = useCallback(() => {
    setDirty(true);
    dirtyRef.current = true;
    clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => doSave({ silent: true }), 2000);
  }, [doSave]);

  // Field handlers
  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    fieldRef.current.title = val;
    scheduleAutoSave();
  };

  // Called by Quill on every user keystroke — updates fieldRef only
  const handleContentChange = useCallback(({ html }) => {
    fieldRef.current.content = html;
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  const handleManualSave = () => {
    if (!canEdit) return;
    clearTimeout(autoSaveRef.current);
    doSave({ silent: false });
  };

  const handleTagKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
      if (!tags.includes(tag)) {
        const next = [...tags, tag];
        setTags(next);
        fieldRef.current.tags = next;
        scheduleAutoSave();
      }
      setTagInput('');
    } else if (e.key === 'Backspace' && !tagInput && tags.length) {
      const next = tags.slice(0, -1);
      setTags(next);
      fieldRef.current.tags = next;
      scheduleAutoSave();
    }
  };

  const removeTag = (t) => {
    const next = tags.filter((x) => x !== t);
    setTags(next);
    fieldRef.current.tags = next;
    scheduleAutoSave();
  };

  const handlePin = async () => {
    try {
      const { data } = await notesAPI.update(id, { isPinned: !note.isPinned });
      setNote(data.note); updateNote(id, data.note);
      toast.success(data.note.isPinned ? 'Pinned' : 'Unpinned');
    } catch { toast.error('Could not pin note'); }
  };

  const handleArchive = async () => {
    if (dirtyRef.current) { clearTimeout(autoSaveRef.current); await doSave({ silent: true }); }
    try {
      const { data } = await notesAPI.update(id, { isArchived: !note.isArchived });
      setNote(data.note); updateNote(id, data.note);
      if (data.note.isArchived) { toast.success('Archived'); navigate('/dashboard'); }
      else toast.success('Restored');
    } catch { toast.error('Could not archive note'); }
  };

  const handleColorChange = async (hex) => {
    try {
      const { data } = await notesAPI.update(id, { color: hex });
      setNote(data.note); updateNote(id, data.note);
    } catch { toast.error('Could not update color'); }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[calc(100vh-56px)]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-7 h-7 border-2 border-zinc-700 border-t-amber-400 rounded-full animate-spin" />
            <p className="text-zinc-600 text-xs font-mono">Loading note…</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const collabCount  = note?.collaborators?.length ?? 0;
  const currentColor = note?.color || '#18181b';
  const wordCount    = stripHtml(fieldRef.current.content).split(/\s+/).filter(Boolean).length;

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-56px)]" style={{ backgroundColor: currentColor }}>
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* ── Toolbar ────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-sm gap-2 flex-wrap shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-200 text-xs font-medium px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 transition-all"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Notes
              </button>

              <div className="flex items-center gap-1.5 min-w-[110px]">
                {saving ? (
                  <span className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
                    <span className="w-3 h-3 border border-zinc-600 border-t-amber-400 rounded-full animate-spin" />
                    Saving…
                  </span>
                ) : dirty ? (
                  <span className="text-[11px] text-amber-500 font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Unsaved changes
                  </span>
                ) : savedAt ? (
                  <span className="text-[11px] text-zinc-600 font-mono">
                    ✓ Saved {format(savedAt, 'h:mm a')}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {canEdit && (
                <button onClick={handleManualSave} disabled={saving}
                  className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold text-xs rounded-lg px-3 py-1.5 transition-all active:scale-[0.97]"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  Save
                </button>
              )}

              <button onClick={handlePin}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${note?.isPinned ? 'bg-amber-400/10 border-amber-400/20 text-amber-400' : 'border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill={note?.isPinned ? '#fbbf24' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                </svg>
                <span className="hidden sm:inline">{note?.isPinned ? 'Pinned' : 'Pin'}</span>
              </button>

              <button onClick={handleArchive}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/>
                  <line x1="10" y1="12" x2="14" y2="12"/>
                </svg>
                <span className="hidden sm:inline">{note?.isArchived ? 'Restore' : 'Archive'}</span>
              </button>

              <div className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5">
                {NOTE_COLORS.map(({ hex, label }) => (
                  <button key={hex} onClick={() => handleColorChange(hex)} title={label}
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all hover:scale-125 ${currentColor === hex ? 'border-amber-400 scale-125' : 'border-zinc-600 hover:border-zinc-400'}`}
                    style={{ backgroundColor: hex === '#18181b' ? '#52525b' : hex }}
                  />
                ))}
              </div>

              <button onClick={() => setShowSidebar((v) => !v)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${showSidebar ? 'bg-amber-400/10 border-amber-400/20 text-amber-400' : 'border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'}`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
                <span className="hidden sm:inline">
                  {collabCount > 0 ? `${collabCount} collab${collabCount > 1 ? 's' : ''}` : 'Share'}
                </span>
              </button>
            </div>
          </div>

          {/* Access badge */}
          {!isOwner && note && (
            <div className="flex items-center gap-2 px-8 pt-3 shrink-0">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border font-mono ${canEdit ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10' : 'text-zinc-500 border-zinc-700 bg-zinc-800'}`}>
                {canEdit ? '✎  Editor access' : '👁  View only'}
              </span>
              {note.owner?.name && <span className="text-[10px] text-zinc-600">Shared by {note.owner.name}</span>}
            </div>
          )}

          {/* Title */}
          <div className="px-8 pt-6 pb-1 shrink-0">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              disabled={!canEdit}
              placeholder="Untitled Note"
              className="w-full font-display text-[2rem] font-bold text-zinc-100 bg-transparent border-none outline-none placeholder:text-zinc-700 disabled:cursor-default disabled:opacity-75"
            />
          </div>

          {/* Tags */}
          <div className="px-8 pb-3 flex flex-wrap items-center gap-1.5 min-h-[28px] shrink-0">
            {tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono">
                #{t}
                {canEdit && (
                  <button onClick={() => removeTag(t)} className="text-zinc-600 hover:text-red-400 transition-colors ml-0.5">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </span>
            ))}
            {canEdit && (
              <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown} placeholder="+ add tag"
                className="text-[11px] px-2 py-0.5 rounded-md bg-transparent border border-dashed border-zinc-700 text-zinc-500 outline-none focus:border-amber-500/50 focus:text-zinc-300 w-20 placeholder:text-zinc-700 font-mono transition-all"
              />
            )}
          </div>

          {/* ── Editor — key remounts Quill with fresh initialContent ── */}
          <div className="flex-1 overflow-auto min-h-0">
            <RichTextEditor
              key={editorKey}
              initialValue={initialContent}
              onChange={handleContentChange}
              readOnly={!canEdit}
            />
          </div>

          {/* Footer */}
          <div className="px-8 py-2 border-t border-zinc-800/50 flex items-center justify-between shrink-0">
            <p className="text-[10px] text-zinc-700 font-mono">
              {wordCount} word{wordCount !== 1 ? 's' : ''}
            </p>
            {canEdit && (
              <p className="text-[10px] text-zinc-700 font-mono hidden sm:block">
                <kbd className="px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-600">Ctrl+S</kbd> to save
              </p>
            )}
          </div>
        </div>

        {/* Collaborator sidebar */}
        {showSidebar && (
          <aside className="w-72 border-l border-zinc-800 bg-zinc-900 flex flex-col flex-shrink-0 animate-slide-in-right">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <div>
                <h2 className="text-sm font-semibold text-zinc-200">Share Note</h2>
                <p className="text-[11px] text-zinc-600 mt-0.5">
                  {collabCount === 0 ? 'Only you have access' : `${collabCount + 1} people have access`}
                </p>
              </div>
              <button onClick={() => setShowSidebar(false)}
                className="text-zinc-600 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-zinc-800 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <CollaboratorPanel note={note} onUpdate={(n) => { setNote(n); updateNote(id, n); }} />
            </div>
          </aside>
        )}
      </div>
    </AppShell>
  );
}

/**
 * SearchBar.jsx
 *
 * Full-Text Search Flow:
 *  1. User types → 300ms debounce → call backend /notes/search?q=...
 *  2. Backend does $text search on title + contentText (with weights)
 *  3. Results sorted by relevance score
 *  4. Result count shown inline; results shown in Dashboard with highlights
 */
import { useState, useCallback } from 'react';
import { useNotes } from '../../contexts/NotesContext';

let debounceTimer;

export default function SearchBar() {
  const { search, clearSearch, searchQuery, searchResults } = useNotes();
  const [value, setValue] = useState('');

  const handleChange = useCallback((e) => {
    const q = e.target.value;
    setValue(q);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (q.trim().length >= 1) search(q.trim());
      else clearSearch();
    }, 300);
  }, [search, clearSearch]);

  const handleClear = () => {
    setValue('');
    clearSearch();
  };

  return (
    <div className="relative w-full">
      {/* Search icon */}
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
        width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>

      <input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder="Search notes by title or content…"
        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl
          pl-9 pr-16 py-2 text-sm text-zinc-200
          placeholder:text-zinc-600
          focus:outline-none focus:ring-2 focus:border-amber-500/50 focus:ring-amber-500/10
          transition-all duration-150 h-9"
      />

      {/* Result count badge */}
      {searchQuery && (
        <span className="absolute right-8 top-1/2 -translate-y-1/2
          text-[10px] font-mono text-amber-400 bg-amber-400/10
          border border-amber-400/20 px-1.5 py-0.5 rounded-md pointer-events-none">
          {searchResults.length}
        </span>
      )}

      {/* Clear */}
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2
            text-zinc-500 hover:text-zinc-200 transition-colors p-0.5"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * NotesContext.jsx
 *
 * Global notes state.  updateNote here is a LOCAL state update only —
 * API calls are made by the page (EditorPage, NoteCard etc) and then
 * they call updateNote to sync the result into the list.
 */
import { createContext, useContext, useState, useCallback } from 'react';
import { notesAPI } from '../services/api';
import toast from 'react-hot-toast';

const NotesContext = createContext(null);

export const NotesProvider = ({ children }) => {
  const [notes, setNotes]                 = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery]     = useState('');
  const [loading, setLoading]             = useState(false);

  const fetchNotes = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await notesAPI.getAll(params);
      setNotes(data.notes);
    } catch {
      // silently fail — page will show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  const createNote = useCallback(async (payload = {}) => {
    const { data } = await notesAPI.create(payload);
    setNotes((prev) => [data.note, ...prev]);
    return data.note;
  }, []);

  /**
   * updateNote — LOCAL state sync only. Does NOT call the API.
   * Pass the full updated note object returned by the API.
   */
  const updateNote = useCallback((id, updatedNote) => {
    setNotes((prev) =>
      prev.map((n) => (n._id === id ? { ...n, ...updatedNote } : n))
    );
  }, []);

  const deleteNote = useCallback(async (id) => {
    await notesAPI.delete(id);
    setNotes((prev) => prev.filter((n) => n._id !== id));
    setSearchResults((prev) => prev.filter((n) => n._id !== id));
    toast.success('Note deleted');
  }, []);

  const search = useCallback(async (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    try {
      const { data } = await notesAPI.search(q);
      setSearchResults(data.notes);
    } catch {
      setSearchResults([]);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  return (
    <NotesContext.Provider value={{
      notes, loading, searchResults, searchQuery,
      fetchNotes, createNote, updateNote, deleteNote,
      search, clearSearch,
    }}>
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotes must be used inside NotesProvider');
  return ctx;
};

/**
 * RichTextEditor.jsx — minimal, bulletproof Quill wrapper
 *
 * Design:
 *  - Parent passes `initialValue` once; Quill owns all content after that
 *  - `onChange` is the only data out — fires on every user keystroke  
 *  - `readOnly` can change at any time (handled by separate effect)
 *  - StrictMode safe: container is cleared before each Quill init
 */
import { useEffect, useRef } from 'react';
import Quill from 'quill';

const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  ['blockquote', 'code-block'],
  [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
  [{ indent: '-1' }, { indent: '+1' }],
  [{ align: [] }],
  ['link', 'image'],
  ['clean'],
];

export default function RichTextEditor({ initialValue = '', onChange, readOnly = false }) {
  const wrapperRef  = useRef(null);   // outer div — never touched by Quill
  const onChangeRef = useRef(onChange);
  const quillRef    = useRef(null);
  const prevRO      = useRef(readOnly);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // Mount — runs once per key (i.e. once per note load)
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // Create a fresh inner container so Quill always starts clean
    // (guards against React StrictMode double-invoke leaving old DOM)
    wrapper.innerHTML = '';
    const container = document.createElement('div');
    wrapper.appendChild(container);

    const quill = new Quill(container, {
      theme: 'snow',
      modules: { toolbar: TOOLBAR },
      placeholder: 'Start writing your note…',
    });

    // Set initial content (API source — won't trigger onChange)
    if (initialValue) {
      quill.root.innerHTML = initialValue;
    }

    // Apply readOnly
    if (readOnly) {
      quill.disable();
    } else {
      requestAnimationFrame(() => {
        quill.focus();
        quill.setSelection(quill.getLength(), 0);
      });
    }

    quill.on('text-change', (_d, _o, source) => {
      if (source !== 'user') return;
      onChangeRef.current?.({ html: quill.root.innerHTML, text: quill.getText() });
    });

    quillRef.current = quill;
    prevRO.current   = readOnly;

    return () => {
      quill.off('text-change');
      quillRef.current = null;
      wrapper.innerHTML = '';
    };
  }, []); // eslint-disable-line — intentional: mount once per key

  // Sync readOnly changes after mount
  useEffect(() => {
    const q = quillRef.current;
    if (!q) return;
    if (readOnly) {
      q.disable();
    } else {
      q.enable();
      if (prevRO.current) requestAnimationFrame(() => q.focus());
    }
    prevRO.current = readOnly;
  }, [readOnly]);

  return (
    <div ref={wrapperRef} className="flex flex-col h-full min-h-0" />
  );
}

import React, { useRef, useEffect } from 'react';
import { decodeHtmlEntities } from '../../utils/formatText';

export default function RichTextEditor({ value, onChange, placeholder, minHeight = '180px', className = '', style = {} }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      const targetValue = value || '';
      if (currentHtml !== targetValue && currentHtml !== targetValue + '<br>') {
        editorRef.current.innerHTML = targetValue;
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      let cleanHtml = (html === '<br>' || html === '<div><br></div>') ? '' : html;
      // If cleanHtml contains no HTML tags, decode &amp; and entity sequences
      if (!/<[a-z][\s\S]*>/i.test(cleanHtml)) {
        cleanHtml = decodeHtmlEntities(cleanHtml);
      }
      onChange(cleanHtml);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      document.execCommand('bold', false, null);
      handleInput();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    handleInput();
  };

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      className={`hr-rich-editor ${className}`}
      data-placeholder={placeholder}
      style={{
        minHeight,
        outline: 'none',
        overflowY: 'auto',
        lineHeight: '1.65',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        ...style
      }}
    />
  );
}

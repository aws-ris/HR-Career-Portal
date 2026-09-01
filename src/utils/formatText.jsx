import React from 'react';

/**
 * Parses markdown-style bold text (**text**) and newlines into clean React elements.
 */
export function FormattedText({ text, className, style }) {
  if (!text) return null;

  const lines = String(text).split('\n');

  return (
    <div className={className} style={{ whiteSpace: 'pre-wrap', ...style }}>
      {lines.map((line, lineIdx) => {
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <React.Fragment key={lineIdx}>
            {parts.map((part, partIdx) => {
              if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
                return (
                  <strong key={partIdx} style={{ fontWeight: 700, color: 'inherit' }}>
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return part;
            })}
            {lineIdx < lines.length - 1 && <br />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default FormattedText;

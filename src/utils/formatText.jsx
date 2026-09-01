import React from 'react';

/**
 * Parses HTML or markdown bold text (**text**) and newlines cleanly.
 */
export function FormattedText({ text, className, style }) {
  if (!text) return null;

  const textStr = String(text);

  // If text is HTML formatted (contains tags like <b>, <strong>, <div>, <p>)
  if (/<[a-z][\s\S]*>/i.test(textStr)) {
    return (
      <div 
        className={className} 
        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', ...style }}
        dangerouslySetInnerHTML={{ __html: textStr }}
      />
    );
  }

  // Fallback for markdown **text** or plain text
  const lines = textStr.split('\n');
  return (
    <div className={className} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', ...style }}>
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

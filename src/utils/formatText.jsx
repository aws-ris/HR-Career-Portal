import React from 'react';

/**
 * Decodes common HTML entities (&amp;, &lt;, &gt;, &quot;, &#39;, &nbsp;) cleanly and recursively.
 */
export function decodeHtmlEntities(str) {
  if (!str) return '';
  let prev = '';
  let curr = String(str);
  let iterations = 0;
  while (curr !== prev && iterations < 5) {
    prev = curr;
    curr = curr
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ');
    iterations++;
  }
  return curr;
}

/**
 * Parses HTML or markdown bold text (**text**) and newlines cleanly with automatic HTML entity decoding.
 */
export function FormattedText({ text, className, style }) {
  if (!text) return null;

  // Gracefully decode HTML entities (&amp; -> &, &quot; -> ", etc.)
  const textStr = decodeHtmlEntities(text);

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

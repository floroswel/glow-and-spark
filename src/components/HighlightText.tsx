import React from "react";

const diacriticMap: Record<string, string> = {
  ă: "a", â: "a", î: "i", ș: "s", ț: "t",
  Ă: "A", Â: "A", Î: "I", Ș: "S", Ț: "T",
};

function removeDiacritics(str: string): string {
  return str.replace(/[ăâîșțĂÂÎȘȚ]/g, (ch) => diacriticMap[ch] || ch);
}

interface HighlightTextProps {
  text: string;
  query: string;
  className?: string;
}

export function HighlightText({ text, query, className }: HighlightTextProps) {
  if (!query || query.trim().length < 2) {
    return <span className={className}>{text}</span>;
  }

  const normalizedText = removeDiacritics(text).toLowerCase();
  const normalizedQuery = removeDiacritics(query).toLowerCase();

  const parts: { text: string; highlight: boolean }[] = [];
  let lastIndex = 0;
  let searchFrom = 0;

  while (searchFrom < normalizedText.length) {
    const matchIndex = normalizedText.indexOf(normalizedQuery, searchFrom);
    if (matchIndex === -1) break;

    if (matchIndex > lastIndex) {
      parts.push({ text: text.slice(lastIndex, matchIndex), highlight: false });
    }
    parts.push({ text: text.slice(matchIndex, matchIndex + normalizedQuery.length), highlight: true });
    lastIndex = matchIndex + normalizedQuery.length;
    searchFrom = lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), highlight: false });
  }

  if (parts.length === 0) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.highlight ? (
          <mark key={i} className="bg-accent/20 text-accent font-semibold rounded-sm px-0.5">
            {part.text}
          </mark>
        ) : (
          <React.Fragment key={i}>{part.text}</React.Fragment>
        )
      )}
    </span>
  );
}

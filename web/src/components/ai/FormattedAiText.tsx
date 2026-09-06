import { Fragment } from "react";

// Renders a minimal markdown-lite subset (**bold**, *italic*, newlines) as real
// React nodes -- never as raw HTML -- so nothing the model writes can inject markup.
export function FormattedAiText({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <>
      {lines.map((line, lineIdx) => (
        <Fragment key={lineIdx}>
          {lineIdx > 0 && <br />}
          {renderInline(line)}
        </Fragment>
      ))}
    </>
  );
}

function renderInline(line: string) {
  const tokens = line.split(/(\*\*.*?\*\*|\*.*?\*)/g).filter(Boolean);
  return tokens.map((token, i) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return <strong key={i}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith("*") && token.endsWith("*")) {
      return <em key={i}>{token.slice(1, -1)}</em>;
    }
    return <Fragment key={i}>{token}</Fragment>;
  });
}

/** Formattazione minima e sicura: **grassetto** e *corsivo*. Nessun HTML grezzo viene interpretato. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.length > 4 && p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
        if (p.length > 2 && p.startsWith('*') && p.endsWith('*')) return <em key={i}>{p.slice(1, -1)}</em>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

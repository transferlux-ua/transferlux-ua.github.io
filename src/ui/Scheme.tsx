/* Minimal schematic of directions: Ukraine on the right, European capitals on the left.
   Thin lines, small arrowheads, no glow. Positions are schematic (west to east), not a map. */
const WEST = [
  { k: "paris", x: 22, y: 64 }, { k: "brussels", x: 34, y: 44 }, { k: "amsterdam", x: 40, y: 26 },
  { k: "berlin", x: 92, y: 34 }, { k: "prague", x: 96, y: 66 }, { k: "vienna", x: 118, y: 92 },
  { k: "milan", x: 66, y: 112 }, { k: "warsaw", x: 150, y: 40 }, { k: "budapest", x: 150, y: 104 }
];
const UA = { x: 236, y: 64 };

export function Scheme({ names, title }: { names: Record<string, string>; title: string }) {
  return (
    <figure className="scheme">
      <svg viewBox="0 0 270 132" role="img" aria-label={title}>
        <defs>
          <marker id="ah" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0 0 6 3 0 6" fill="none" stroke="currentColor" strokeWidth="1" />
          </marker>
        </defs>
        {WEST.map((c) => {
          const mx = (c.x + UA.x) / 2, my = Math.min(c.y, UA.y) - 18;
          return <path key={c.k} d={`M${UA.x - 6} ${UA.y} Q ${mx} ${my} ${c.x + 4} ${c.y}`} className="scheme__line" markerStart="url(#ah)" markerEnd="url(#ah)" />;
        })}
        {WEST.map((c) => (
          <g key={c.k + "p"}>
            <circle cx={c.x} cy={c.y} r="2.2" className="scheme__dot" />
            <text x={c.x} y={c.y + 11} textAnchor="middle" className="scheme__label">{names[c.k]}</text>
          </g>
        ))}
        <circle cx={UA.x} cy={UA.y} r="4" className="scheme__home" />
        <text x={UA.x} y={UA.y + 16} textAnchor="middle" className="scheme__label scheme__label--home">{names.ua}</text>
      </svg>
      <figcaption>{title}</figcaption>
    </figure>
  );
}

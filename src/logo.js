// NPU's icon, built as inline SVG so it needs no request and no innerHTML.
const SVG_NS = "http://www.w3.org/2000/svg";
const SHAPES = [
  ["circle", { cx: 11, cy: 13, r: 11, fill: "#1d5fd1" }],
  ["path", { d: "M11.5 5.5 5.5 14h4.3l-.7 6.2 6.2-8.6h-4.3z", fill: "#fff" }],
  ["circle", { cx: 19, cy: 5, r: 5, fill: "#f5b82e" }],
  ["path", { d: "M19 2.8v4.4M16.8 5h4.4", stroke: "#15181e", "stroke-width": 1.6, "stroke-linecap": "round" }],
];

function icon(doc, size) {
  const svg = doc.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.setAttribute("aria-hidden", "true");
  svg.style.cssText = "display:inline-block;flex:none;vertical-align:-3px;margin-right:6px";
  SHAPES.forEach(([tag, attributes]) => {
    const shape = doc.createElementNS(SVG_NS, tag);
    Object.entries(attributes).forEach(([name, value]) => shape.setAttribute(name, value));
    svg.appendChild(shape);
  });
  return svg;
}

module.exports = { icon };

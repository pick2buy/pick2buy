export type ProductDetail = { label: string; value: string };

const normalize = (value: string) => value.replace(/\s+/g, '').toLowerCase();
const inlineLabels = [
  'Product Safety Information', 'Country of Origin', 'Net Quantity (N)',
  'Cable Length Unit', 'Product Length', 'Product Height', 'Product Breadth',
  'Warranty Period', 'Warranty Type', 'Product Unit', 'Weight Unit',
  'Fastening & Back Detail', 'Sole Material', 'Generic Name', 'Power Source',
  'Cable Length', 'Material', 'Waterproof',
  'Voltage', 'Wattage', 'Weight', 'Color', 'Colour', 'Power', 'Type', 'Name',
  'Sizes',
];
const inlineFields = new RegExp(`(?:^|\\s+)(${[...inlineLabels].sort((a, b) => b.length - a.length).map(label => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\s*:`, 'gi');

export function parseProductDetails(name: string, description: string, specifications: Record<string, unknown> = {}) {
  const details: ProductDetail[] = Object.entries(specifications || {})
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim())
    .map(([label, value]) => ({ label, value: String(value) }));
  const paragraphs: string[] = [];
  // Preserve source line breaks, and also recognize common fields in inline imports.
  const lines = description.replace(inlineFields, '\n$1:').split(/\r?\n/);
  let pendingLabel = '';
  const addDetail = (rawLabel: string, rawValue: string) => {
    const label = /^name$/i.test(rawLabel) ? 'Product name' : rawLabel.trim();
    const value = rawValue.trim();
    if (!value) return;
    if (label === 'Product name' && (normalize(value) === normalize(name) || paragraphs.some(text => normalize(text) === normalize(value)))) return;
    if (!details.some(detail => normalize(detail.label) === normalize(label))) details.push({ label, value });
  };
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    // Copying Meesho's two-column table usually produces tab-separated cells.
    const cells = rawLine.split(/\t+/).map(cell => cell.trim()).filter(Boolean);
    if (cells.length >= 2) {
      addDetail(cells[0], cells.slice(1).join(' '));
      pendingLabel = '';
      continue;
    }
    const field = line.match(/^([\p{L}][\p{L}\d ()/&_-]{0,60}):\s*(.*)$/u);
    if (!field || /^https?$/i.test(field[1])) {
      if (pendingLabel) {
        addDetail(pendingLabel, line);
        pendingLabel = '';
        continue;
      }
      if (normalize(line) !== normalize(name)) paragraphs.push(line);
      continue;
    }
    if (!field[2].trim()) {
      pendingLabel = field[1];
      continue;
    }
    pendingLabel = '';
    addDetail(field[1], field[2]);
  }
  return { details, paragraphs };
}

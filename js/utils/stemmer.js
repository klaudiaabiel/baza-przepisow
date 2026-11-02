// Polish Stemmer Engine for intelligent recipe & ingredient search
export function polishStem(word) {
  if (!word) return '';
  let w = word.trim().toLowerCase();
  if (w.length <= 2) return w;

  // Remove Polish grammatical suffixes (fleksja)
  const end3 = ['ami', 'ach', 'ego', 'emu', 'ych', 'ymi', 'owi'];
  for (const end of end3) {
    if (w.endsWith(end) && w.length > 4) return w.slice(0, -3);
  }

  const end2 = ['ek', 'ki', 'ka', 'em', 'ie', 'ów', 'om', 'am', 'ce', 'ci', 'sz', 'ny', 'na', 'ne', 'ym', 'im'];
  for (const end of end2) {
    if (w.endsWith(end) && w.length > 3) return w.slice(0, -2);
  }

  const end1 = ['a', 'y', 'e', 'u', 'i', 'ą', 'ę', 'o'];
  for (const end of end1) {
    if (w.endsWith(end) && w.length > 2) return w.slice(0, -1);
  }

  return w;
}

export function tokenizeAndStem(text) {
  if (!text) return [];
  const words = String(text)
    .toLowerCase()
    .replace(/[^\p{L}\d\s]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);

  return words.map(polishStem);
}

export function matchSearchQuery(query, title, ingredientsList) {
  if (!query || !query.trim()) return true;
  const qTokens = tokenizeAndStem(query);
  if (qTokens.length === 0) return true;

  const titleTokens = tokenizeAndStem(title);
  const ingsTokens = (ingredientsList || []).flatMap(ing => tokenizeAndStem(typeof ing === 'string' ? ing : (ing.name || '')));
  const targetTokens = new Set([...titleTokens, ...ingsTokens]);

  // Every token in query must match or be a prefix of a token in target
  return qTokens.every(q => {
    for (const t of targetTokens) {
      if (t.includes(q) || q.includes(t)) return true;
    }
    return false;
  });
}

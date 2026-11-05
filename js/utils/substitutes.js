// Diet Substitutes Engine for BiteCraft
// Exact culinary & nutritional equivalents extracted from official clinical diet specifications (Respo)

export const SUBSTITUTE_GROUPS = [
  {
    id: 'fruits',
    name: 'Owoce',
    icon: '🍎',
    description: 'Równoważniki kaloryczne owoców (baza: 1 banan = 120 g / ~110 kcal)',
    baseUnitG: 120, // 1 banana = 120g
    items: [
      { name: 'Banan', ratio: 1.0, homeMeasure: '1 sztuka (120 g)', keywords: ['banan'] },
      { name: 'Jabłko', ratio: 230 / 120, homeMeasure: '2 sztuki (230 g)', keywords: ['jabłk'] },
      { name: 'Pomarańcza', ratio: 240 / 120, homeMeasure: '1 sztuka (240 g)', keywords: ['pomarańcz'] },
      { name: 'Mandarynki', ratio: 180 / 120, homeMeasure: '2 sztuki (180 g)', keywords: ['mandarynk'] },
      { name: 'Brzoskwinia', ratio: 235 / 120, homeMeasure: '2.5 sztuki (235 g)', keywords: ['brzoskwini', 'nektarynk'] },
      { name: 'Gruszka', ratio: 200 / 120, homeMeasure: '1.5 sztuki (200 g)', keywords: ['gruszk'] },
      { name: 'Kiwi', ratio: 160 / 120, homeMeasure: '2 sztuki (160 g)', keywords: ['kiwi'] },
      { name: 'Maliny', ratio: 270 / 120, homeMeasure: '7 garści (270 g)', keywords: ['malin'] },
      { name: 'Truskawki', ratio: 355 / 120, homeMeasure: '5 garści (355 g)', keywords: ['truskawk'] },
      { name: 'Borówki', ratio: 205 / 120, homeMeasure: '4 garście (205 g)', keywords: ['borówk', 'jagod'] },
      { name: 'Winogrona', ratio: 150 / 120, homeMeasure: '2 garście (150 g)', keywords: ['winogron'] },
      { name: 'Mango', ratio: 170 / 120, homeMeasure: '1/2 sztuki (170 g)', keywords: ['mango'] },
      { name: 'Śliwki', ratio: 240 / 120, homeMeasure: '8 sztuk (240 g)', keywords: ['śliwk'] },
      { name: 'Ananas', ratio: 210 / 120, homeMeasure: 'ok. 210 g', keywords: ['ananas'] },
      { name: 'Czereśnie', ratio: 210 / 120, homeMeasure: '1.5 garści (210 g)', keywords: ['czereśn'] },
      { name: 'Kaki', ratio: 140 / 120, homeMeasure: '3/4 sztuki (140 g)', keywords: ['kaki'] },
      { name: 'Grejpfrut', ratio: 300 / 120, homeMeasure: '1.5 sztuki (300 g)', keywords: ['grejpfrut'] },
      { name: 'Owoce suszone (rodzynki/daktyle/żurawina)', ratio: 16 / 120, homeMeasure: 'ok. 16 g', keywords: ['rodzynk', 'daktyl', 'żurawin'] }
    ]
  },
  {
    id: 'flakes',
    name: 'Płatki i kasze śniadaniowe',
    icon: '🥣',
    description: 'Wymienniki 1:1 wagowo (na sucho)',
    baseUnitG: 50,
    items: [
      { name: 'Płatki owsiane', ratio: 1.0, homeMeasure: '5 łyżek (50 g)', keywords: ['płatki owsian'] },
      { name: 'Płatki jaglane', ratio: 1.0, homeMeasure: '5 łyżek (50 g)', keywords: ['płatki jaglan'] },
      { name: 'Płatki gryczane', ratio: 1.0, homeMeasure: '5 łyżek (50 g)', keywords: ['płatki gryczan'] },
      { name: 'Płatki ryżowe', ratio: 1.0, homeMeasure: '5 łyżek (50 g)', keywords: ['płatki ryżow'] },
      { name: 'Płatki orkiszowe', ratio: 1.0, homeMeasure: '5 łyżek (50 g)', keywords: ['płatki orkiszow'] },
      { name: 'Kasza manna', ratio: 1.0, homeMeasure: '4 łyżki (50 g)', keywords: ['kasza manna', 'kaszy manny'] }
    ]
  },
  {
    id: 'grains_pasta_potatoes',
    name: 'Ryż, kasze, makarony i ziemniaki',
    icon: '🍚',
    description: 'Wymienniki węglowodanowe (100 g ryżu/kaszy/makaronu = 475 g ziemniaków/batatów)',
    baseUnitG: 100, // 100g dry grains = 475g potatoes
    items: [
      { name: 'Ryż basmati / jaśminowy', ratio: 1.0, homeMeasure: '1 woreczek / 100 g', keywords: ['ryż basmati', 'ryż jaśminow', 'ryż biały', 'ryż brązow', 'ryż'] },
      { name: 'Kasza gryczana', ratio: 1.0, homeMeasure: '100 g na sucho', keywords: ['kasza gryczan', 'kaszy gryczan'] },
      { name: 'Kasza jaglana', ratio: 1.0, homeMeasure: '100 g na sucho', keywords: ['kasza jaglan', 'kaszy jaglan'] },
      { name: 'Kasza bulgur', ratio: 1.0, homeMeasure: '100 g na sucho', keywords: ['kasza bulgur', 'kaszy bulgur'] },
      { name: 'Kasza pęczak', ratio: 1.0, homeMeasure: '100 g na sucho', keywords: ['kasza pęczak', 'kaszy pęczak'] },
      { name: 'Komosa ryżowa (quinoa)', ratio: 1.0, homeMeasure: '100 g na sucho', keywords: ['quinoa', 'komosa'] },
      { name: 'Makaron pełnoziarnisty / durum', ratio: 1.0, homeMeasure: '100 g na sucho', keywords: ['makaron pełnoziarnist', 'makaron orkiszow', 'makaron gryczan', 'makaron ryżow', 'makaron'] },
      { name: 'Ziemniaki', ratio: 4.75, homeMeasure: 'ok. 475 g (3-4 sztuki)', keywords: ['ziemniak'] },
      { name: 'Bataty', ratio: 4.75, homeMeasure: 'ok. 475 g (2 sztuki)', keywords: ['batat'] }
    ]
  },
  {
    id: 'bread',
    name: 'Pieczywo',
    icon: '🥪',
    description: 'Wymienniki 1:1 wagowo',
    baseUnitG: 70, // 2 standard slices
    items: [
      { name: 'Chleb żytni razowy', ratio: 1.0, homeMeasure: '2 kromki (ok. 70 g)', keywords: ['chleb żytni', 'chleb razow'] },
      { name: 'Chleb orkiszowy / pełnoziarnisty', ratio: 1.0, homeMeasure: '2 kromki (ok. 70 g)', keywords: ['chleb orkiszow', 'chleb pełnoziarnist', 'chleb graham'] },
      { name: 'Bułka grahamka', ratio: 1.0, homeMeasure: '1 sztuka (ok. 70 g)', keywords: ['bułka grahamk', 'grahamka'] },
      { name: 'Bułka owsiana / pełnoziarnista', ratio: 1.0, homeMeasure: '1 sztuka (ok. 70 g)', keywords: ['bułka owsian', 'bułka pełnoziarnist'] },
      { name: 'Chleb tostowy pełnoziarnisty', ratio: 1.0, homeMeasure: '2-3 kromki (ok. 70 g)', keywords: ['chleb tostow'] },
      { name: 'Tortilla pełnoziarnista', ratio: 0.9, homeMeasure: '1 placek (ok. 62 g)', keywords: ['tortill'] }
    ]
  },
  {
    id: 'lean_protein',
    name: 'Chude mięso i drób',
    icon: '🥩',
    description: 'Wymienniki 1:1 wagowo (na surowo)',
    baseUnitG: 100,
    items: [
      { name: 'Mięso z piersi kurczaka', ratio: 1.0, homeMeasure: '100 g na surowo', keywords: ['kurczak'] },
      { name: 'Mięso z piersi indyka', ratio: 1.0, homeMeasure: '100 g na surowo', keywords: ['indyk'] },
      { name: 'Chude mięso mielone drobiowe', ratio: 1.0, homeMeasure: '100 g na surowo', keywords: ['mielone z indyk', 'mielone drobiow', 'mielone z kurczak'] },
      { name: 'Polędwiczka wieprzowa', ratio: 1.0, homeMeasure: '100 g na surowo', keywords: ['polędwic'] },
      { name: 'Schab wieprzowy (bez tłuszczu)', ratio: 1.0, homeMeasure: '100 g na surowo', keywords: ['schab'] },
      { name: 'Tofu naturalne', ratio: 1.0, homeMeasure: '1/2 kostki (100 g)', keywords: ['tofu naturaln', 'tofu'] },
      { name: 'Krewetki tygrysie', ratio: 1.1, homeMeasure: '110 g', keywords: ['krewetk'] }
    ]
  },
  {
    id: 'lean_fish',
    name: 'Chude ryby',
    icon: '🐟',
    description: 'Wymienniki 1:1 wagowo',
    baseUnitG: 100,
    items: [
      { name: 'Dorsz (filet)', ratio: 1.0, homeMeasure: '100 g', keywords: ['dorsz'] },
      { name: 'Mintaj (filet)', ratio: 1.0, homeMeasure: '100 g', keywords: ['mintaj'] },
      { name: 'Pstrąg biały (filet)', ratio: 1.0, homeMeasure: '100 g', keywords: ['pstrąg'] },
      { name: 'Morszczuk / Sandacz', ratio: 1.0, homeMeasure: '100 g', keywords: ['morszczuk', 'sandacz'] },
      { name: 'Tuńczyk w sosie własnym', ratio: 0.9, homeMeasure: 'ok. 90 g po odsączeniu', keywords: ['tuńczyk w sosie własnym', 'tuńczyk'] }
    ]
  },
  {
    id: 'fatty_fish',
    name: 'Tłuste ryby (Omega-3)',
    icon: '🍣',
    description: 'Wymienniki 1:1 wagowo',
    baseUnitG: 100,
    items: [
      { name: 'Łosoś świeży', ratio: 1.0, homeMeasure: '100 g', keywords: ['łosoś śwież', 'filet z łososi'] },
      { name: 'Łosoś wędzony', ratio: 1.0, homeMeasure: '100 g', keywords: ['łosoś wędzon'] },
      { name: 'Pstrąg tęczowy (łososiowy)', ratio: 1.0, homeMeasure: '100 g', keywords: ['pstrąg tęczow', 'pstrąg łososiow'] },
      { name: 'Makrela wędzona / świeża', ratio: 0.95, homeMeasure: 'ok. 95 g', keywords: ['makrel'] },
      { name: 'Śledź (filet)', ratio: 1.0, homeMeasure: '100 g', keywords: ['śledź', 'śledzi'] }
    ]
  },
  {
    id: 'dairy_protein',
    name: 'Białkowy nabiał',
    icon: '🧀',
    description: 'Wymienniki 1:1 wagowo',
    baseUnitG: 150,
    items: [
      { name: 'Serek wiejski lekki / klasyczny', ratio: 1.0, homeMeasure: '1 opakowanie (150-200 g)', keywords: ['serek wiejski'] },
      { name: 'Twaróg chudy / półtłusty', ratio: 0.9, homeMeasure: 'ok. 135 g', keywords: ['twaróg', 'twaroż'] },
      { name: 'Skyr naturalny', ratio: 1.0, homeMeasure: '1 kubek (150 g)', keywords: ['skyr naturaln', 'skyr'] },
      { name: 'Jogurt grecki lekki (0-2%)', ratio: 1.0, homeMeasure: 'ok. 150 g', keywords: ['jogurt grecki'] },
      { name: 'Tofu naturalne', ratio: 0.85, homeMeasure: 'ok. 130 g', keywords: ['tofu'] }
    ]
  },
  {
    id: 'milk_drinks',
    name: 'Mleko i napoje roślinne',
    icon: '🥛',
    description: 'Wymienniki 1:1 objętościowo (ml / g)',
    baseUnitG: 200, // 1 glass = 200ml
    items: [
      { name: 'Mleko 2% / 1.5%', ratio: 1.0, homeMeasure: '1 szklanka (200 ml)', keywords: ['mleko 2%', 'mleko 1.5%', 'mleko bezlaktozow', 'mleko krowi', 'mleko'] },
      { name: 'Napój sojowy niesłodzony', ratio: 1.0, homeMeasure: '1 szklanka (200 ml)', keywords: ['napój sojow', 'mleko sojow'] },
      { name: 'Napój migdałowy niesłodzony', ratio: 1.0, homeMeasure: '1 szklanka (200 ml)', keywords: ['napój migdałow', 'mleko migdałow'] },
      { name: 'Napój owsiany niesłodzony', ratio: 1.0, homeMeasure: '1 szklanka (200 ml)', keywords: ['napój owsian', 'mleko owsian'] }
    ]
  },
  {
    id: 'oils_fats',
    name: 'Oleje i tłuszcze',
    icon: '🫒',
    description: 'Wymienniki 1:1 wagowo',
    baseUnitG: 10, // 1 tablespoon ~ 10g
    items: [
      { name: 'Oliwa z oliwek', ratio: 1.0, homeMeasure: '1 łyżka (10 g)', keywords: ['oliwa z oliwek', 'oliwa'] },
      { name: 'Olej rzepakowy', ratio: 1.0, homeMeasure: '1 łyżka (10 g)', keywords: ['olej rzepakow'] },
      { name: 'Olej z awokado', ratio: 1.0, homeMeasure: '1 łyżka (10 g)', keywords: ['olej z awokado'] },
      { name: 'Masło ekstra', ratio: 1.0, homeMeasure: '1 płaska łyżeczka (10 g)', keywords: ['masło ekstra', 'masło 82%', 'masło klarowan', 'masło'] }
    ]
  },
  {
    id: 'nuts_seeds',
    name: 'Orzechy, pestki i masła orzechowe',
    icon: '🥜',
    description: 'Wymienniki 1:1 wagowo',
    baseUnitG: 20,
    items: [
      { name: 'Orzechy włoskie', ratio: 1.0, homeMeasure: '1 garść (20 g)', keywords: ['orzechy włoski', 'orzechów włoskich'] },
      { name: 'Orzechy nerkowca', ratio: 1.0, homeMeasure: '1 garść (20 g)', keywords: ['nerkowc'] },
      { name: 'Migdały', ratio: 1.0, homeMeasure: '1 garść (20 g)', keywords: ['migdał'] },
      { name: 'Orzechy laskowe', ratio: 1.0, homeMeasure: '1 garść (20 g)', keywords: ['orzechy laskow', 'orzechów laskowych'] },
      { name: 'Masło orzechowe 100%', ratio: 1.0, homeMeasure: '1 czubata łyżeczka (20 g)', keywords: ['masło orzechow', 'masła orzechow'] },
      { name: 'Pestki dyni', ratio: 1.0, homeMeasure: '2 łyżki (20 g)', keywords: ['pestki dyni', 'pestek dyni'] },
      { name: 'Pestki słonecznika', ratio: 1.0, homeMeasure: '2 łyżki (20 g)', keywords: ['słonecznik'] },
      { name: 'Nasiona chia', ratio: 1.0, homeMeasure: '2 łyżeczki (15-20 g)', keywords: ['chia'] },
      { name: 'Siemię lniane', ratio: 1.0, homeMeasure: '2 łyżeczki (15-20 g)', keywords: ['siemię', 'siemienia'] },
      { name: 'Wiórki kokosowe', ratio: 1.0, homeMeasure: '2 łyżki (20 g)', keywords: ['wiórki kokosow'] }
    ]
  },
  {
    id: 'sweeteners',
    name: 'Miód i syropy',
    icon: '🍯',
    description: 'Wymienniki 1:1 wagowo',
    baseUnitG: 20,
    items: [
      { name: 'Miód pszczeli', ratio: 1.0, homeMeasure: '1 łyżka (ok. 20 g)', keywords: ['miód', 'miodu'] },
      { name: 'Syrop klonowy', ratio: 1.0, homeMeasure: '1.5 łyżki (ok. 20 g)', keywords: ['syrop klonow'] },
      { name: 'Syrop z agawy', ratio: 1.0, homeMeasure: '1 łyżka (ok. 20 g)', keywords: ['syrop z agawy'] },
      { name: 'Erytrol / Ksylitol', ratio: 0.9, homeMeasure: '2 łyżeczki (ok. 18 g)', keywords: ['erytrol', 'erytrytol', 'ksylitol'] }
    ]
  }
];

// Helper: Format weight and piece/home unit count e.g. "230 g (2 sztuki)"
export function formatUnitAndGrams(targetGrams, homeMeasureStr) {
  if (!homeMeasureStr) return `${targetGrams} g`;

  // Pattern A: '[ok. ]<count> <unit> (<grams> g)' or '[ok. ]<count> <unit> (ok. <grams> g)'
  const cleanStr = homeMeasureStr.replace(/^(?:ok\.|około)\s*/i, '').trim();
  const m = cleanStr.match(/^(\d+(?:[.,]\d+)?|\d+\/\d+)\s+([a-ząćęłńóśźż\s]+?)\s*(?:\([^)]*\)|\/|$)/i);
  const gMatch = cleanStr.match(/(\d+(?:[.,]\d+)?)\s*(?:g|ml)\b/i);

  if (m && gMatch) {
    let baseCount = m[1].includes('/')
      ? (parseFloat(m[1].split('/')[0]) / parseFloat(m[1].split('/')[1]))
      : parseFloat(m[1].replace(',', '.'));
    let unit = m[2].trim().replace(/^(?:płaska|płaskie|płaskich|czubata|czubate|czubatych)\s+/i, '');
    const baseG = parseFloat(gMatch[1].replace(',', '.'));

    if (baseG > 0 && !['g', 'gram', 'gramy', 'gramów', 'ml'].includes(unit.toLowerCase())) {
      const ratio = targetGrams / baseG;
      const scaledCount = Math.round(baseCount * ratio * 10) / 10;
      let countFormatted = Number.isInteger(scaledCount) ? String(scaledCount) : String(scaledCount).replace('.', ',');

      let displayUnit = unit;
      if (scaledCount === 1) {
        if (unit.startsWith('sztuk')) displayUnit = 'sztuka';
        if (unit.startsWith('kromk')) displayUnit = 'kromka';
        if (unit.startsWith('garś') || unit.startsWith('garc')) displayUnit = 'garść';
        if (unit.includes('łyżeczk')) displayUnit = 'łyżeczka';
        else if (unit.includes('łyżk') || unit.includes('łyżek')) displayUnit = 'łyżka';
        if (unit.startsWith('plack') || unit.startsWith('placek')) displayUnit = 'placek';
        if (unit.startsWith('opakowan')) displayUnit = 'opakowanie';
        if (unit.startsWith('worecz') || unit.startsWith('worek')) displayUnit = 'woreczek';
        if (unit.startsWith('szklank')) displayUnit = 'szklanka';
      } else if (scaledCount >= 2 && scaledCount <= 4) {
        if (unit.startsWith('sztuk')) displayUnit = 'sztuki';
        if (unit.startsWith('kromk')) displayUnit = 'kromki';
        if (unit.startsWith('garś') || unit.startsWith('garc')) displayUnit = 'garście';
        if (unit.includes('łyżeczk')) displayUnit = 'łyżeczki';
        else if (unit.includes('łyżk') || unit.includes('łyżek')) displayUnit = 'łyżki';
        if (unit.startsWith('plack') || unit.startsWith('placek')) displayUnit = 'placki';
        if (unit.startsWith('opakowan')) displayUnit = 'opakowania';
        if (unit.startsWith('worecz') || unit.startsWith('worek')) displayUnit = 'woreczki';
        if (unit.startsWith('szklank')) displayUnit = 'szklanki';
      } else if (scaledCount >= 5) {
        if (unit.startsWith('sztuk')) displayUnit = 'sztuk';
        if (unit.startsWith('kromk')) displayUnit = 'kromek';
        if (unit.startsWith('garś') || unit.startsWith('garc')) displayUnit = 'garści';
        if (unit.includes('łyżeczk')) displayUnit = 'łyżeczek';
        else if (unit.includes('łyżk') || unit.includes('łyżek')) displayUnit = 'łyżek';
        if (unit.startsWith('plack') || unit.startsWith('placek')) displayUnit = 'placków';
        if (unit.startsWith('opakowan')) displayUnit = 'opakowań';
        if (unit.startsWith('worecz') || unit.startsWith('worek')) displayUnit = 'woreczków';
        if (unit.startsWith('szklank')) displayUnit = 'szklanek';
      } else {
        // Fractional values (e.g. 0.5, 1.5, 2.5)
        if (unit.startsWith('sztuk')) displayUnit = 'sztuki';
        if (unit.startsWith('kromk')) displayUnit = 'kromki';
        if (unit.startsWith('garś') || unit.startsWith('garc')) displayUnit = 'garści';
        if (unit.includes('łyżeczk')) displayUnit = 'łyżeczki';
        else if (unit.includes('łyżk') || unit.includes('łyżek')) displayUnit = 'łyżki';
        if (unit.startsWith('szklank')) displayUnit = 'szklanki';
      }

      return `${targetGrams} g (${countFormatted} ${displayUnit})`;
    }
  }

  // Pattern B: 'ok. <grams> g (<count> sztuki)'
  const mSztuki = homeMeasureStr.match(/\((?:ok\.\s*)?(\d+(?:-\d+)?\s*[a-ząćęłńóśźż]+)\)/i);
  if (mSztuki) {
    return `${targetGrams} g (${mSztuki[1]})`;
  }

  return `${targetGrams} g`;
}

// Helper: Find homeMeasure string for substitute item by its name
export function getHomeMeasureForName(name) {
  if (!name) return '';
  const norm = name.toLowerCase().trim();
  for (const group of SUBSTITUTE_GROUPS) {
    for (const item of group.items) {
      if (item.name.toLowerCase() === norm || item.keywords.some(kw => norm.includes(kw))) {
        return item.homeMeasure || '';
      }
    }
  }
  return '';
}

// Helper: Extract weight in grams from amount string or fallback
export function parseIngredientGrams(amountStr, fallbackWeightG = 0) {
  if (fallbackWeightG && fallbackWeightG > 0) return fallbackWeightG;
  if (!amountStr) return 0;

  // Look for gram matches e.g. "(120 g)", "120g", "120 g"
  const gMatch = amountStr.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gram|gramy|gramów)\b/i);
  if (gMatch) {
    return parseFloat(gMatch[1].replace(',', '.'));
  }

  // Look for ml (treated ~1:1 with grams for milk/water/oil)
  const mlMatch = amountStr.match(/(\d+(?:[.,]\d+)?)\s*(?:ml|mililitrów)\b/i);
  if (mlMatch) {
    return parseFloat(mlMatch[1].replace(',', '.'));
  }

  return 0;
}

/**
 * Finds dietary substitutes for a specific ingredient
 * @param {string} ingredientName - Name of the ingredient from recipe
 * @param {string} amountStr - Amount text e.g. "1 sztuka (120 g)"
 * @param {number} weightG - Exact gram weight from recipe data
 * @param {number} portionRatio - Current portion scaling ratio (e.g. 2 for 2 portions)
 * @returns {object|null} - Substitute details or null if no group matches
 */
export function findSubstitutesForIngredient(ingredientName, amountStr = '', weightG = 0, portionRatio = 1) {
  if (!ingredientName) return null;
  const normName = ingredientName.toLowerCase().trim();

  // Find matching group and matching item inside that group
  let matchedGroup = null;
  let matchedItem = null;

  for (const group of SUBSTITUTE_GROUPS) {
    for (const item of group.items) {
      const isMatch = item.keywords.some(kw => {
        if (!normName.includes(kw)) return false;
        // Disambiguation exclusions:
        if (kw === 'masło' && normName.includes('orzech')) return false;
        if (kw === 'mleko' && normName.includes('kokos')) return false;
        return true;
      });

      if (isMatch) {
        matchedGroup = group;
        matchedItem = item;
        break;
      }
    }
    if (matchedGroup) break;
  }

  if (!matchedGroup || !matchedItem) return null;

  // Determine the baseline weight for 1 portion of the matched item
  let baseGrams = parseIngredientGrams(amountStr, weightG);
  if (!baseGrams || baseGrams <= 0) {
    // If not found in text, use standard weight based on ratio
    baseGrams = Math.round(matchedGroup.baseUnitG * matchedItem.ratio);
  }

  // Baseline standard weight for the group (ratio 1.0)
  const standardUnitGrams = baseGrams / matchedItem.ratio;

  // Generate substitutions for all other items in the group
  const substitutes = matchedGroup.items
    .filter(item => item.name.toLowerCase() !== matchedItem.name.toLowerCase() && !item.keywords.some(kw => normName.includes(kw)))
    .map(subItem => {
      // Scale by item ratio and current portion ratio
      const rawGrams = standardUnitGrams * subItem.ratio * portionRatio;
      const targetGrams = Math.round(rawGrams);

      // Format clean readable amount string with weight and piece count
      const formattedAmount = formatUnitAndGrams(targetGrams, subItem.homeMeasure);

      // Department inference
      let dept = 'Warzywa i owoce';
      if (['flakes', 'grains_pasta_potatoes', 'bread'].includes(matchedGroup.id)) dept = 'Pieczywo i zboża';
      if (['lean_protein', 'lean_fish', 'fatty_fish'].includes(matchedGroup.id)) dept = 'Mięso i ryby';
      if (['dairy_protein', 'milk_drinks'].includes(matchedGroup.id)) dept = 'Nabiał i jaja';
      if (['oils_fats', 'nuts_seeds', 'sweeteners'].includes(matchedGroup.id)) dept = 'Spiżarnia i przyprawy';

      return {
        name: subItem.name,
        amount: formattedAmount,
        weight_g: targetGrams,
        department: dept,
        homeMeasure: subItem.homeMeasure,
        ratio: subItem.ratio
      };
    });

  return {
    groupId: matchedGroup.id,
    groupName: matchedGroup.name,
    groupIcon: matchedGroup.icon,
    groupDescription: matchedGroup.description,
    currentIngredientName: matchedItem.name,
    currentBaseGrams: Math.round(baseGrams * portionRatio),
    substitutes
  };
}

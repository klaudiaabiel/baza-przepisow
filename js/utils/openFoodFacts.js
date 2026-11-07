// Open Food Facts API & Nutrition Bridge for BiteCraft
// Connects with https://pl.openfoodfacts.org/ with IndexedDB caching and resilient offline fallback

import { NUTRITION_DATABASE, findNutrientsForIngredient } from './nutritionDb.js';
import { store } from '../store.js';

const MEMORY_CACHE = new Map();

/**
 * Searches Open Food Facts Poland (or falls back to verified Polish nutrition database)
 * @param {string} query - Product or ingredient name
 * @returns {Promise<{ products: Array, source: 'openfoodfacts'|'cache'|'local_database' }>}
 */
export async function searchOpenFoodFacts(query) {
  if (!query || !query.trim()) {
    return { products: [], source: 'empty' };
  }

  const q = query.trim().toLowerCase();

  // 1. Check Memory Cache
  if (MEMORY_CACHE.has(q)) {
    return { products: MEMORY_CACHE.get(q), source: 'cache' };
  }

  // 2. Check IndexedDB Cache
  try {
    const cached = await store.idbGet('off_products', q);
    if (cached && cached.products && cached.products.length > 0) {
      MEMORY_CACHE.set(q, cached.products);
      return { products: cached.products, source: 'cache' };
    }
  } catch (e) {
    // IndexedDB silent pass
  }

  // 3. Attempt Live Open Food Facts API query
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

    const url = `https://pl.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=15`;
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const rawProducts = data.products || [];

      if (rawProducts.length > 0) {
        const formatted = rawProducts
          .map(p => normalizeOffProduct(p))
          .filter(p => p.name && (p.kcal_100g > 0 || p.protein_100g > 0 || p.fat_100g > 0 || p.carbs_100g > 0));

        if (formatted.length > 0) {
          MEMORY_CACHE.set(q, formatted);
          try {
            await store.idbPut('off_products', { id: q, query: q, products: formatted, timestamp: Date.now() });
          } catch (e) {}

          return { products: formatted, source: 'openfoodfacts' };
        }
      }
    }
  } catch (err) {
    console.info('[OpenFoodFacts] Live API unavailable or blocked, falling back to local nutrition database:', err.message);
  }

  // 4. Resilient Offline Fallback (Local Polish Nutritional Database)
  const localMatches = searchLocalDatabase(q);
  MEMORY_CACHE.set(q, localMatches);

  return { products: localMatches, source: 'local_database' };
}

/**
 * Normalizes Open Food Facts raw product record
 */
function normalizeOffProduct(p) {
  const n = p.nutriments || {};
  const kcal = Math.round(n['energy-kcal_100g'] || n.energy_kcal_100g || (n['energy_100g'] ? n['energy_100g'] / 4.184 : 0));
  const protein = Math.round((n.proteins_100g || 0) * 10) / 10;
  const fat = Math.round((n.fat_100g || 0) * 10) / 10;
  const carbs = Math.round((n.carbohydrates_100g || 0) * 10) / 10;
  const sugars = n.sugars_100g !== undefined ? Math.round(n.sugars_100g * 10) / 10 : null;
  const fiber = n.fiber_100g !== undefined ? Math.round(n.fiber_100g * 10) / 10 : null;

  let brandName = '';
  if (Array.isArray(p.brands)) {
    brandName = p.brands.join(', ');
  } else if (typeof p.brands === 'string') {
    brandName = p.brands;
  }

  const name = p.product_name_pl || p.product_name || p.generic_name_pl || p.generic_name || 'Produkt bez nazwy';

  return {
    code: p.code || p._id || '',
    name: name.trim(),
    brand: brandName.trim(),
    image: p.image_front_small_url || p.image_front_url || p.image_url || null,
    nutriscore: (p.nutrition_grades || p.nutriscore_grade || '').toUpperCase() || null,
    kcal_100g: kcal,
    protein_100g: protein,
    fat_100g: fat,
    carbs_100g: carbs,
    sugars_100g: sugars,
    fiber_100g: fiber,
    url: p.code ? `https://pl.openfoodfacts.org/produkt/${p.code}` : 'https://pl.openfoodfacts.org/',
    sourceType: 'Open Food Facts'
  };
}

/**
 * Searches local verified nutrition database for matching ingredients
 */
function searchLocalDatabase(query) {
  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/).filter(w => w.length > 2);

  const matched = [];
  for (const item of NUTRITION_DATABASE) {
    const nameMatch = item.name.toLowerCase().includes(q);
    const keywordMatch = item.keywords.some(kw => q.includes(kw) || kw.includes(q));
    const wordMatch = words.some(w => item.name.toLowerCase().includes(w) || item.keywords.some(kw => kw.includes(w)));

    if (nameMatch || keywordMatch || wordMatch) {
      matched.push({
        code: `local_${item.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name: item.name,
        brand: 'Baza Żywieniowa IŻŻ (Standard)',
        image: null,
        nutriscore: item.kcal < 100 ? 'A' : (item.kcal < 250 ? 'B' : 'C'),
        kcal_100g: item.kcal,
        protein_100g: item.protein,
        fat_100g: item.fat,
        carbs_100g: item.carbs,
        sugars_100g: null,
        fiber_100g: null,
        url: 'https://pl.openfoodfacts.org/',
        sourceType: 'Baza Standardowa'
      });
    }
  }

  return matched;
}

/**
 * Calculates exact nutritional values for a given weight
 * @param {object} product - Object containing kcal_100g, protein_100g, fat_100g, carbs_100g
 * @param {number} weightG - Exact weight in grams
 * @returns {{ kcal: number, protein: number, fat: number, carbs: number }}
 */
export function calculateMacrosForWeight(product, weightG) {
  if (!product || !weightG || weightG <= 0) {
    return { kcal: 0, protein: 0, fat: 0, carbs: 0 };
  }
  const factor = weightG / 100;
  return {
    kcal: Math.round(product.kcal_100g * factor),
    protein: Math.round(product.protein_100g * factor * 10) / 10,
    fat: Math.round(product.fat_100g * factor * 10) / 10,
    carbs: Math.round(product.carbs_100g * factor * 10) / 10
  };
}

/**
 * Resolves macros for any recipe ingredient using local nutrition database or Open Food Facts
 */
export function resolveIngredientMacros(ingredientName, weightG = 100) {
  const item = findNutrientsForIngredient(ingredientName);
  if (!item) return null;

  const factor = (weightG || 100) / 100;
  return {
    name: item.name,
    weight_g: weightG,
    kcal: Math.round(item.kcal * factor),
    protein: Math.round(item.protein * factor * 10) / 10,
    fat: Math.round(item.fat * factor * 10) / 10,
    carbs: Math.round(item.carbs * factor * 10) / 10,
    per_100g: {
      kcal: item.kcal,
      protein: item.protein,
      fat: item.fat,
      carbs: item.carbs
    }
  };
}

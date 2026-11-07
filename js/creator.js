import { store } from './store.js';
import { CATEGORIES_11 } from './catalog.js';
import { escapeHtml, showToast } from './utils/dom.js';

export const CREATOR_PIN = '0000';

const UNITS_REGEX = /(?:g|gram|gramy|gramów|kg|ml|l|litr|litry|litrów|lyzka|lyzki|lyzek|łyżka|łyżki|łyżek|łyżeczka|łyżeczki|łyżeczek|szklanka|szklanki|szklanek|sztuka|sztuki|sztuk|szt|ząbek|ząbki|ząbków|garść|garści|plaster|plastry|plastrów|kromka|kromki|kromek|puszka|puszki|puszek|opakowanie|opakowania|opakowań|porcja|porcje|porcji|szczypta|szczypty|kropla|krople|kropel|kostka|kostki|kostek)/i;

/**
 * Robust ingredient line parser.
 * Splits into { name, amount } handling:
 * - separators: ' – ', ' - ', ' — ', ' : ', ':', '\t'
 * - tight hyphen with number: 'Makaron-100g'
 * - trailing amounts: 'Pesto zielone 7 łyżeczek (35g)', 'Mąka 100g'
 * - leading amounts: '2 kromki chleba (70g)', '1 łyżka oliwy'
 */
export function parseIngredientLine(line) {
  const raw = (line || '').trim();
  if (!raw) return { name: '', amount: '' };

  for (const sep of [' – ', ' — ', ' - ', ' − ', ' : ', ':', '\t']) {
    if (raw.includes(sep)) {
      const idx = raw.indexOf(sep);
      const p0 = raw.slice(0, idx).trim();
      const p1 = raw.slice(idx + sep.length).trim();
      if (p0 && p1) return { name: p0, amount: p1 };
    }
  }

  const mTight = raw.match(/^(.*?)\s*[-–—−]\s*(\d+.*)$/);
  if (mTight && mTight[1].trim() && mTight[2].trim()) {
    return { name: mTight[1].trim(), amount: mTight[2].trim() };
  }

  const mEnd = raw.match(new RegExp('^(.*?)\\s+(\\d+(?:[.,]\\d+)?\\s*(?:x\\s*)?' + UNITS_REGEX.source + '.*)$', 'i'));
  if (mEnd && mEnd[1].trim() && mEnd[2].trim()) {
    return { name: mEnd[1].trim(), amount: mEnd[2].trim() };
  }

  const mNum = raw.match(/^(.*?)\s+(\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l|szt)?(?:\s*\([^)]*\))?)$/i);
  if (mNum && mNum[1].trim().length > 1 && mNum[2].trim()) {
    return { name: mNum[1].trim(), amount: mNum[2].trim() };
  }

  const mStart = raw.match(new RegExp('^(\\d+(?:[.,]\\d+)?\\s*(?:x\\s*)?' + UNITS_REGEX.source + ')\\s+(.*?)(?:\\s*(\\([^)]*\\)))?$', 'i'));
  if (mStart) {
    const unitPart = mStart[1].trim();
    const pName = mStart[2].trim();
    const parens = (mStart[3] || '').trim();
    const pAmt = parens ? `${unitPart} ${parens}` : unitPart;
    if (pName && pAmt) return { name: pName, amount: pAmt };
  }

  return { name: raw, amount: '' };
}

/**
 * Extracts numeric weight in grams from amount string.
 * Supports: (35g), 100g, 0.5 kg, etc.
 */
export function extractWeightG(amountStr) {
  if (!amountStr) return 0;
  const parenG = amountStr.match(/\((\d+(?:[.,]\d+)?)\s*g\)/i);
  if (parenG) return parseFloat(parenG[1].replace(',', '.'));
  const matchKg = amountStr.match(/(\d+(?:[.,]\d+)?)\s*kg/i);
  if (matchKg) return parseFloat(matchKg[1].replace(',', '.')) * 1000;
  const matchG = amountStr.match(/(\d+(?:[.,]\d+)?)\s*g/i);
  if (matchG) return parseFloat(matchG[1].replace(',', '.'));
  return 0;
}

class CreatorModule {
  constructor() {
    this.isUnlocked = localStorage.getItem('creator_mode_active') === 'true';
  }

  init() {
    this.bindEvents();
    this.updateUI();
    this.renderCategorySelect();
    this.initIngredientsUI();
  }

  bindEvents() {
    // PIN Modal & Toggle buttons
    const unlockBtn = document.getElementById('unlock-creator-btn');
    const lockBtn = document.getElementById('lock-creator-btn');
    const exportBtn = document.getElementById('export-recipes-json-btn');
    const addForm = document.getElementById('add-recipe-form');

    if (unlockBtn) {
      unlockBtn.addEventListener('click', () => this.promptPin());
    }

    if (lockBtn) {
      lockBtn.addEventListener('click', () => {
        this.isUnlocked = false;
        localStorage.removeItem('creator_mode_active');
        this.updateUI();
        showToast('Zablokowano Tryb Twórcy.');
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportCleanRecipesJson());
    }

    if (addForm) {
      addForm.addEventListener('submit', (e) => this.handleCreateRecipe(e));
    }

    // Image preview listener
    const fileInput = document.getElementById('new-recipe-image-file');
    const previewEl = document.getElementById('new-recipe-image-preview');
    if (fileInput && previewEl) {
      fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files[0]) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            previewEl.innerHTML = `<img src="${ev.target.result}" class="w-full h-full object-cover rounded-2xl">`;
          };
          reader.readAsDataURL(fileInput.files[0]);
        } else {
          previewEl.innerHTML = '<i class="fa-solid fa-camera text-stone-300 text-xl"></i>';
        }
      });
    }
  }

  initIngredientsUI() {
    const addRowBtn = document.getElementById('add-ingredient-row-btn');
    const toggleBulkBtn = document.getElementById('toggle-bulk-ingredients-btn');
    const applyBulkBtn = document.getElementById('apply-bulk-ingredients-btn');
    const bulkContainer = document.getElementById('bulk-ingredients-container');
    const toggleBulkText = document.getElementById('toggle-bulk-text');

    if (addRowBtn) {
      addRowBtn.addEventListener('click', () => this.addIngredientRow());
    }

    if (toggleBulkBtn && bulkContainer) {
      toggleBulkBtn.addEventListener('click', () => {
        const isHidden = bulkContainer.classList.toggle('hidden');
        if (toggleBulkText) {
          toggleBulkText.innerText = isHidden ? 'Wklej listę hurtowo' : 'Ukryj wklejanie hurtowe';
        }
      });
    }

    if (applyBulkBtn) {
      applyBulkBtn.addEventListener('click', () => this.applyBulkIngredients());
    }

    // Populate initial rows
    this.resetIngredientRows();
  }

  resetIngredientRows() {
    const container = document.getElementById('recipe-ingredients-rows');
    if (!container) return;
    container.innerHTML = '';

    // 3 clean initial rows
    this.addIngredientRow('', '');
    this.addIngredientRow('', '');
    this.addIngredientRow('', '');
  }

  addIngredientRow(name = '', amount = '') {
    const container = document.getElementById('recipe-ingredients-rows');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'ingredient-row flex items-center gap-2';
    row.innerHTML = `
      <input type="text" class="new-ing-name flex-1 p-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm outline-none focus:border-brand-500 bg-white" placeholder="Nazwa składnika (np. Pesto zielone)" value="${escapeHtml(name)}">
      <input type="text" class="new-ing-amount w-36 sm:w-48 p-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm outline-none focus:border-brand-500 bg-white" placeholder="Ilość (np. 7 łyżeczek (35g))" value="${escapeHtml(amount)}">
      <button type="button" class="new-ing-remove w-9 h-9 rounded-xl hover:bg-red-50 text-stone-400 hover:text-red-500 flex items-center justify-center transition cursor-pointer shrink-0" title="Usuń pozycję">
        <i class="fa-solid fa-trash-can text-xs"></i>
      </button>
    `;

    // Smart auto-split on blur if user typed or pasted amount inside the name field!
    const nameInput = row.querySelector('.new-ing-name');
    const amountInput = row.querySelector('.new-ing-amount');
    const removeBtn = row.querySelector('.new-ing-remove');

    nameInput.addEventListener('blur', () => {
      const curName = nameInput.value.trim();
      const curAmt = amountInput.value.trim();
      if (curName && !curAmt) {
        const parsed = parseIngredientLine(curName);
        if (parsed.amount) {
          nameInput.value = parsed.name;
          amountInput.value = parsed.amount;
        }
      }
    });

    removeBtn.addEventListener('click', () => {
      const allRows = container.querySelectorAll('.ingredient-row');
      if (allRows.length > 1) {
        row.remove();
      } else {
        nameInput.value = '';
        amountInput.value = '';
      }
    });

    container.appendChild(row);
  }

  applyBulkIngredients() {
    const bulkInput = document.getElementById('bulk-ingredients-input');
    if (!bulkInput) return;
    const lines = bulkInput.value.split('\n').map(l => l.trim()).filter(Boolean);

    if (lines.length === 0) {
      showToast('Wklej najpierw listę składników do pola tekstowego.');
      return;
    }

    const container = document.getElementById('recipe-ingredients-rows');
    if (container) container.innerHTML = '';

    lines.forEach(line => {
      const parsed = parseIngredientLine(line);
      this.addIngredientRow(parsed.name, parsed.amount);
    });

    bulkInput.value = '';
    const bulkContainer = document.getElementById('bulk-ingredients-container');
    const toggleBulkText = document.getElementById('toggle-bulk-text');
    if (bulkContainer) bulkContainer.classList.add('hidden');
    if (toggleBulkText) toggleBulkText.innerText = 'Wklej listę hurtowo';

    showToast(`✓ Rozdzielono ${lines.length} składników do dedykowanych pól nazwy i ilości!`);
  }

  promptPin() {
    const input = prompt('Wprowadź kod PIN Twórcy:');
    if (input === null) return;

    if (input.trim() === CREATOR_PIN) {
      this.isUnlocked = true;
      localStorage.setItem('creator_mode_active', 'true');
      this.updateUI();
      showToast('✓ Tryb Twórcy aktywowany! Odblokowano usuwanie i eksport bazy.');
    } else {
      showToast('Nieprawidłowy kod PIN.');
    }
  }

  updateUI() {
    const lockedElements = document.querySelectorAll('.creator-only');
    lockedElements.forEach(el => {
      el.classList.toggle('hidden', !this.isUnlocked);
    });

    const lockBtn = document.getElementById('lock-creator-btn');
    const unlockBtn = document.getElementById('unlock-creator-btn');
    const statusText = document.getElementById('creator-status-badge');

    if (lockBtn) lockBtn.classList.toggle('hidden', !this.isUnlocked);
    if (unlockBtn) unlockBtn.classList.toggle('hidden', this.isUnlocked);
    if (statusText) {
      statusText.innerHTML = this.isUnlocked ? 
        '<span class="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-xl flex items-center gap-1.5"><i class="fa-solid fa-lock-open"></i> Tryb Twórcy aktywny</span>' :
        '<span class="text-xs font-bold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-xl flex items-center gap-1.5"><i class="fa-solid fa-lock"></i> Tryb czytelnika</span>';
    }
  }

  renderCategorySelect() {
    const select = document.getElementById('new-recipe-category');
    if (!select) return;

    select.innerHTML = CATEGORIES_11.map(cat => `
      <option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>
    `).join('');
  }

  async handleCreateRecipe(e) {
    e.preventDefault();
    const title = document.getElementById('new-recipe-title').value.trim();
    const category = document.getElementById('new-recipe-category').value;
    const portions = parseInt(document.getElementById('new-recipe-portions').value, 10) || 1;
    const prepTime = parseInt(document.getElementById('new-recipe-time').value, 10) || 15;
    const calories = parseInt(document.getElementById('new-recipe-kcal').value, 10) || 0;
    const protein = parseFloat(document.getElementById('new-recipe-prot').value) || 0;
    const fat = parseFloat(document.getElementById('new-recipe-fat').value) || 0;
    const carbs = parseFloat(document.getElementById('new-recipe-carbs').value) || 0;

    // Collect ingredients from dynamic rows
    const rows = document.querySelectorAll('#recipe-ingredients-rows .ingredient-row');
    const ingredients = [];

    rows.forEach(row => {
      const nameInput = row.querySelector('.new-ing-name');
      const amountInput = row.querySelector('.new-ing-amount');
      let name = nameInput ? nameInput.value.trim() : '';
      let amount = amountInput ? amountInput.value.trim() : '';

      if (!name && !amount) return; // skip empty rows

      // Auto-split if amount was left inside name field
      if (name && !amount) {
        const parsed = parseIngredientLine(name);
        name = parsed.name;
        amount = parsed.amount;
      }

      const weightG = extractWeightG(amount);

      ingredients.push({
        name: name,
        amount: amount,
        weight_g: weightG,
        department: 'Inne'
      });
    });

    // Fallback: if rows were empty but user pasted into bulk textarea
    if (ingredients.length === 0) {
      const bulkInput = document.getElementById('bulk-ingredients-input');
      if (bulkInput && bulkInput.value.trim()) {
        const lines = bulkInput.value.split('\n').map(l => l.trim()).filter(Boolean);
        lines.forEach(line => {
          const parsed = parseIngredientLine(line);
          const weightG = extractWeightG(parsed.amount);
          ingredients.push({
            name: parsed.name,
            amount: parsed.amount,
            weight_g: weightG,
            department: 'Inne'
          });
        });
      }
    }

    if (ingredients.length === 0) {
      showToast('⚠️ Dodaj co najmniej jeden składnik do przepisu.');
      return;
    }

    const stepsRaw = document.getElementById('new-recipe-instructions').value.split('\n').filter(l => l.trim());
    const instructions = stepsRaw.map(s => s.replace(/^\d+[\.\)]\s*/, '').trim());

    const isPublicEl = document.getElementById('new-recipe-is-public');
    const isPublic = isPublicEl ? isPublicEl.checked : false;

    const fileInput = document.getElementById('new-recipe-image-file');
    const imageFile = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;

    const recipe = {
      title: title,
      category: category,
      diets: ['Własne przepisy'],
      calories: calories,
      protein: protein,
      fat: fat,
      carbs: carbs,
      portions: portions,
      prep_time_minutes: prepTime,
      image: 'images/placeholder.svg',
      ingredients: ingredients,
      instructions: instructions,
      tags: ['Własne'],
      is_public: isPublic
    };

    // Persists into IndexedDB and Supabase Cloud
    await store.addCustomRecipe(recipe, imageFile);

    document.getElementById('add-recipe-form').reset();
    const previewEl = document.getElementById('new-recipe-image-preview');
    if (previewEl) previewEl.innerHTML = '<i class="fa-solid fa-camera text-stone-300 text-xl"></i>';
    this.resetIngredientRows();
    showToast(`✓ Przepis "${title}" został pomyślnie dodany i zapisany w bazie!`);

    // Switch to catalog
    window.dispatchEvent(new CustomEvent('switch_tab', { detail: { tab: 'catalog' } }));
  }

  exportCleanRecipesJson() {
    const recipes = store.getRecipes();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(recipes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'recipes.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast(`✓ Pobrano zaktualizowaną bazę recipes.json (${recipes.length} dań)! Gotowe do wdrożenia na GitHubie.`);
  }
}

export const creator = new CreatorModule();

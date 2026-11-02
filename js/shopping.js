import { store } from './store.js';
import { escapeHtml, showToast } from './utils/dom.js';

export const DEPARTMENTS = [
  'Warzywa i owoce',
  'Nabiał i jaja',
  'Mięso i ryby',
  'Pieczywo i zboża',
  'Spiżarnia i przyprawy',
  'Inne'
];

export const DEPARTMENT_ICONS = {
  'Warzywa i owoce': '🥦',
  'Nabiał i jaja': '🧀',
  'Mięso i ryby': '🥩',
  'Pieczywo i zboża': '🥖',
  'Spiżarnia i przyprawy': '🧂',
  'Inne': '🛒'
};

class ShoppingModule {
  constructor() {}

  init() {
    this.bindEvents();
    this.renderList();

    store.addEventListener('ready', () => this.renderList());
    store.addEventListener('shopping_changed', () => this.renderList());
  }

  bindEvents() {
    // Add custom item input
    const addBtn = document.getElementById('add-custom-item-btn');
    const input = document.getElementById('custom-shopping-input');

    if (addBtn && input) {
      addBtn.addEventListener('click', () => this.handleAddCustomItem());
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleAddCustomItem();
        }
      });
    }

    // Generate from Planner button
    const genBtn = document.getElementById('gen-shopping-from-plan-btn');
    if (genBtn) {
      genBtn.addEventListener('click', () => this.generateFromPlanner());
    }

    // Copy to clipboard button
    const copyBtn = document.getElementById('copy-shopping-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copyToClipboard());
    }

    // Print button
    const printBtn = document.getElementById('print-shopping-btn');
    if (printBtn) {
      printBtn.addEventListener('click', () => window.print());
    }

    // Clear checked button
    const clearCheckedBtn = document.getElementById('clear-checked-shopping-btn');
    if (clearCheckedBtn) {
      clearCheckedBtn.addEventListener('click', () => {
        store.clearShoppingList(true);
        showToast('Usunięto kupione artykuły.');
      });
    }

    // Clear all button
    const clearAllBtn = document.getElementById('clear-all-shopping-btn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        if (confirm('Czy na pewno chcesz wyczyścić całą listę zakupów?')) {
          store.clearShoppingList(false);
          showToast('Wyczyszczono listę zakupów.');
        }
      });
    }
  }

  parseInputText(raw) {
    let text = (raw || '').trim();
    if (!text) return null;

    let name = '';
    let count = null;
    let unit = '';

    // Pattern A: <Name> <Number> [Unit] e.g. "banan 2", "jajka 4 szt", "mleko 500ml", "mąka 1.5kg"
    const patternTrailing = /^(.+?)\s+(\d+(?:[.,]\d+)?)\s*([a-ząćęłńóśźż.]*)$/i;
    const matchTrailing = text.match(patternTrailing);

    if (matchTrailing) {
      name = matchTrailing[1].trim();
      count = parseFloat(matchTrailing[2].replace(',', '.'));
      unit = matchTrailing[3].trim().toLowerCase();
    } else {
      // Pattern B: <Number> [Unit] [x] <Name> e.g. "2 banany", "500g mąki", "4x jajko"
      const patternLeading = /^(\d+(?:[.,]\d+)?)\s*([a-ząćęłńóśźż.]*)\s*[xX]?\s+(.+)$/i;
      const matchLeading = text.match(patternLeading);

      if (matchLeading) {
        count = parseFloat(matchLeading[1].replace(',', '.'));
        unit = matchLeading[2].trim().toLowerCase();
        name = matchLeading[3].trim();
      } else {
        name = text;
      }
    }

    let formattedAmount = '';
    if (count !== null) {
      formattedAmount = unit ? `${count} ${unit}` : `${count} szt.`;
    }

    return {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      amount: formattedAmount,
      count: count,
      unit: unit,
      department: this.detectDepartment(name)
    };
  }

  detectDepartment(name) {
    const n = (name || '').toLowerCase();
    if (anyMatch(n, ['jabłk', 'banan', 'pomidor', 'ogórek', 'cytryn', 'truskawk', 'borówk', 'malin', 'marchew', 'szpinak', 'cebul', 'czosnek', 'awokado', 'papryk', 'cukini', 'pieczark', 'rukola', 'ziemniak', 'owoce', 'warzyw', 'szparag', 'śliwk', 'kiwi', 'pomarańcz', 'jagod', 'brzoskwini', 'roszponk'])) {
      return 'Warzywa i owoce';
    }
    if (anyMatch(n, ['mleko', 'jogurt', 'skyr', 'twaróg', 'twaroż', 'ser ', 'serek', 'mozzarell', 'masło', 'jajk', 'jajo', 'feta', 'parmezan', 'śmietan', 'kefir', 'ricotta', 'halloumi', 'burrat'])) {
      return 'Nabiał i jaja';
    }
    if (anyMatch(n, ['kurczak', 'indyk', 'wołowin', 'mięso', 'szynk', 'łosoś', 'tuńczyk', 'ryb', 'krewetk', 'kabanos', 'boczek', 'polędwic'])) {
      return 'Mięso i ryby';
    }
    if (anyMatch(n, ['chleb', 'bułk', 'bajgiel', 'bagietk', 'tortill', 'płatki', 'mąka', 'makaron', 'ryż', 'kasza', 'tost', 'chrupk'])) {
      return 'Pieczywo i zboża';
    }
    if (anyMatch(n, ['oliwa', 'olej', 'sól', 'pieprz', 'cynamon', 'proszek do pieczenia', 'erytrol', 'orzech', 'migdał', 'chia', 'słonecznik', 'dyni', 'kakao', 'czekolad', 'miód', 'sos', 'pesto', 'koncentrat', 'passata', 'masło orzechow'])) {
      return 'Spiżarnia i przyprawy';
    }
    return 'Inne';
  }

  handleAddCustomItem() {
    const input = document.getElementById('custom-shopping-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const parsed = this.parseInputText(text);
    if (!parsed || !parsed.name) return;

    // Check if item already exists to merge safely
    const currentList = store.getShoppingList();
    const existing = currentList.find(it => it.name.toLowerCase() === parsed.name.toLowerCase());

    if (existing && parsed.count !== null) {
      // Safely aggregate counts
      const existCountMatch = (existing.amount || '').match(/(\d+(?:[.,]\d+)?)/);
      if (existCountMatch) {
        const existCount = parseFloat(existCountMatch[1].replace(',', '.'));
        const newTotal = existCount + parsed.count;
        existing.amount = parsed.unit ? `${newTotal} ${parsed.unit}` : `${newTotal} szt.`;
        store.setShoppingList([...currentList]);
        showToast(`✓ Zsumowano "${parsed.name}" do ilości: ${existing.amount}!`);
      } else {
        existing.amount = `${existing.amount}, ${parsed.amount}`;
        store.setShoppingList([...currentList]);
        showToast(`✓ Zaktualizowano "${parsed.name}"!`);
      }
    } else {
      store.addShoppingItem({
        name: parsed.name,
        amount: parsed.amount,
        department: parsed.department,
        recipe_title: 'Własny artykuł',
        is_manual: true
      });
      showToast(`✓ Dodano "${parsed.name}" do listy zakupów!`);
    }

    input.value = '';
    input.focus();
  }

  // P0 Non-destructive generation from meal plan
  generateFromPlanner() {
    const mealPlan = store.getMealPlan();
    if (mealPlan.length === 0) {
      showToast('Jadłospis jest pusty! Dodaj najpierw posiłki w planera.');
      return;
    }

    // 1. Keep all manual items! (Never destroy user notes)
    const existingManualItems = store.getShoppingList().filter(it => it.is_manual);

    // 2. Aggregate ingredients from meal plan
    const aggregated = {};

    mealPlan.forEach(planItem => {
      const recipe = store.getRecipeById(planItem.recipe_id);
      if (!recipe || !recipe.ingredients) return;

      const portions = planItem.portions || 1;
      const basePortions = recipe.portions || 1;
      const ratio = portions / basePortions;

      recipe.ingredients.forEach(ing => {
        const rawName = (ing.name || '').trim();
        if (!rawName) return;

        const key = rawName.toLowerCase();
        const dept = ing.department || this.detectDepartment(rawName);

        if (!aggregated[key]) {
          aggregated[key] = {
            name: rawName,
            department: dept,
            totalGrams: 0,
            totalCount: 0,
            countUnit: '',
            rawAmounts: [],
            recipes: new Set([recipe.title])
          };
        } else {
          aggregated[key].recipes.add(recipe.title);
        }

        if (ing.weight_g && ing.weight_g > 0) {
          aggregated[key].totalGrams += (ing.weight_g * ratio);
        } else if (ing.amount) {
          const matchNum = ing.amount.match(/(\d+(?:[.,]\d+)?)\s*([a-ząćęłńóśźż.]*)/i);
          if (matchNum) {
            aggregated[key].totalCount += (parseFloat(matchNum[1].replace(',', '.')) * ratio);
            if (!aggregated[key].countUnit) aggregated[key].countUnit = matchNum[2] || 'szt.';
          } else {
            aggregated[key].rawAmounts.push(ing.amount);
          }
        }
      });
    });

    // 3. Format aggregated recipe items
    const generatedItems = Object.values(aggregated).map(item => {
      let finalAmount = '';
      if (item.totalGrams > 0) {
        finalAmount = `${Math.round(item.totalGrams)} g`;
      }
      if (item.totalCount > 0) {
        const countStr = `${Math.round(item.totalCount * 10) / 10} ${item.countUnit}`;
        finalAmount = finalAmount ? `${finalAmount} (${countStr})` : countStr;
      }
      if (!finalAmount && item.rawAmounts.length > 0) {
        finalAmount = item.rawAmounts.slice(0, 2).join(', ');
      }

      const recipeList = Array.from(item.recipes).slice(0, 2).join(', ') + (item.recipes.size > 2 ? '...' : '');

      return {
        id: Date.now() + Math.random(),
        name: item.name,
        amount: finalAmount,
        department: item.department,
        recipe_title: recipeList,
        checked: false,
        is_manual: false
      };
    });

    // 4. Combine manual items + fresh generated items
    const combinedList = [...existingManualItems, ...generatedItems];
    store.setShoppingList(combinedList);

    showToast(`✓ Wygenerowano listę zakupów (${generatedItems.length} pozycji z jadłospisu, zachowano ${existingManualItems.length} wpisów własnych)! 🛒`);
  }

  renderList() {
    const container = document.getElementById('shopping-list-container');
    const emptyState = document.getElementById('shopping-empty-state');
    const badge = document.getElementById('shopping-badge');
    if (!container) return;

    const list = store.getShoppingList();
    const uncheckedCount = list.filter(x => !x.checked).length;

    if (badge) {
      badge.innerText = uncheckedCount;
      badge.classList.toggle('hidden', uncheckedCount === 0);
    }

    if (list.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    // Group by department
    const grouped = {};
    DEPARTMENTS.forEach(d => { grouped[d] = []; });
    list.forEach(item => {
      const dept = item.department || 'Inne';
      if (!grouped[dept]) grouped[dept] = [];
      grouped[dept].push(item);
    });

    let html = '';
    DEPARTMENTS.forEach(dept => {
      const items = grouped[dept];
      if (!items || items.length === 0) return;

      const icon = DEPARTMENT_ICONS[dept] || '🛒';

      html += `
        <div class="dept-card bg-white rounded-3xl border border-stone-200/80 p-4 sm:p-5 shadow-xs mb-4">
          <div class="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
            <h3 class="font-extrabold text-stone-900 text-sm sm:text-base flex items-center gap-2">
              <span>${icon}</span>
              <span>${escapeHtml(dept)}</span>
            </h3>
            <span class="text-xs font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">${items.length}</span>
          </div>

          <div class="space-y-2">
      `;

      items.forEach(it => {
        html += `
          <div class="shopping-item-row p-2.5 rounded-2xl hover:bg-stone-50 transition flex items-center justify-between gap-3 group border border-transparent hover:border-stone-200/60 ${it.checked ? 'opacity-50' : ''}">
            <label class="flex items-center gap-3 min-w-0 flex-1 cursor-pointer select-none">
              <input type="checkbox" ${it.checked ? 'checked' : ''} data-item-id="${it.id}" class="shopping-checkbox w-5 h-5 rounded-lg text-brand-600 focus:ring-brand-500 accent-brand-600 cursor-pointer">
              <div class="min-w-0 flex-1">
                <span class="text-xs sm:text-sm font-bold text-stone-800 block truncate ${it.checked ? 'line-through text-stone-400' : ''}">
                  ${escapeHtml(it.name)}
                </span>
                ${it.recipe_title ? `<span class="text-[10px] text-stone-400 font-semibold block truncate">${escapeHtml(it.recipe_title)}</span>` : ''}
              </div>
            </label>

            <div class="flex items-center gap-2 shrink-0">
              ${it.amount ? `<span class="px-2.5 py-1 rounded-xl bg-stone-100 text-stone-700 font-extrabold text-xs">${escapeHtml(it.amount)}</span>` : ''}
              <button type="button" data-delete-id="${it.id}" title="Usuń pozycję" class="delete-shopping-btn p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-stone-100 transition opacity-0 group-hover:opacity-100 cursor-pointer">
                <i class="fa-solid fa-trash-can text-xs"></i>
              </button>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    this.attachListListeners();
  }

  attachListListeners() {
    const container = document.getElementById('shopping-list-container');
    if (!container) return;

    // Toggle checked
    container.querySelectorAll('.shopping-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        const id = cb.getAttribute('data-item-id');
        store.toggleShoppingItem(id);
      });
    });

    // Delete item
    container.querySelectorAll('.delete-shopping-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-delete-id');
        store.deleteShoppingItem(id);
      });
    });
  }

  copyToClipboard() {
    const list = store.getShoppingList();
    if (list.length === 0) {
      showToast('Lista zakupów jest pusta!');
      return;
    }

    let text = '🛒 LISTA ZAKUPÓW (Baza Przepisów):\n\n';

    const grouped = {};
    DEPARTMENTS.forEach(d => { grouped[d] = []; });
    list.forEach(item => {
      const dept = item.department || 'Inne';
      if (!grouped[dept]) grouped[dept] = [];
      grouped[dept].push(item);
    });

    DEPARTMENTS.forEach(dept => {
      const items = grouped[dept];
      if (items.length > 0) {
        text += `🔹 ${dept.toUpperCase()}:\n`;
        items.forEach(it => {
          const checkMark = it.checked ? '✓' : '•';
          text += `  ${checkMark} ${it.name} ${it.amount ? `(${it.amount})` : ''}\n`;
        });
        text += '\n';
      }
    });

    navigator.clipboard.writeText(text).then(() => {
      showToast('✓ Skopiowano listę zakupów do schowka!');
    }).catch(() => {
      showToast('Nie udało się skopiować listy.');
    });
  }
}

function anyMatch(text, keywords) {
  return keywords.some(k => text.includes(k));
}

export const shopping = new ShoppingModule();

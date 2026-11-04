import { store } from './store.js';
import { escapeHtml, showToast, renderMacroPills } from './utils/dom.js';

export function scaleAmount(amountStr, ratio, fallbackWeightG = 0) {
  if (ratio === 1) {
    if (!amountStr && fallbackWeightG > 0) return `${fallbackWeightG} g`;
    return amountStr || '';
  }

  const raw = (amountStr || '').trim();
  if (!raw) {
    if (fallbackWeightG > 0) {
      const scaledG = Math.round(fallbackWeightG * ratio * 10) / 10;
      return `${scaledG} g`;
    }
    return '';
  }

  // Handle fractions if any (e.g. 1/2 -> 0.5)
  const normalized = raw.replace(/(\d+)\s*\/\s*(\d+)/g, (m, n, d) => {
    const v = parseFloat(n) / parseFloat(d);
    return isNaN(v) ? m : String(v);
  });

  return normalized.replace(/\d+(?:[.,]\d+)?/g, (match) => {
    const val = parseFloat(match.replace(',', '.'));
    if (isNaN(val)) return match;
    const scaled = Math.round(val * ratio * 100) / 100;
    const strVal = Number.isInteger(scaled) ? String(scaled) : String(Math.round(scaled * 10) / 10);
    return match.includes(',') ? strVal.replace('.', ',') : strVal;
  });
}

class ModalModule {
  constructor() {
    this.currentRecipe = null;
    this.currentPortions = 1;
    this.wakeLock = null;
    this.isWakeLockActive = false;
  }

  init() {
    this.bindEvents();

    window.addEventListener('open_recipe_modal', (e) => {
      this.openModal(e.detail.id);
    });
  }

  bindEvents() {
    const modal = document.getElementById('modal-recipe');
    const closeBtn = document.getElementById('close-recipe-modal');
    const backdrop = document.getElementById('modal-recipe-backdrop');

    if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
    if (backdrop) backdrop.addEventListener('click', () => this.closeModal());

    // Portion adjustment buttons
    const minusBtn = document.getElementById('modal-portion-minus');
    const plusBtn = document.getElementById('modal-portion-plus');

    if (minusBtn) {
      minusBtn.addEventListener('click', () => this.adjustPortions(-1));
    }
    if (plusBtn) {
      plusBtn.addEventListener('click', () => this.adjustPortions(1));
    }

    // Favorite button in modal
    const favBtn = document.getElementById('modal-fav-btn');
    if (favBtn) {
      favBtn.addEventListener('click', () => {
        if (!this.currentRecipe) return;
        store.toggleFavorite(this.currentRecipe.id).then(() => {
          this.updateFavBtnUI();
        });
      });
    }

    // Add to plan button in modal
    const planBtn = document.getElementById('modal-add-to-plan-btn');
    if (planBtn) {
      planBtn.addEventListener('click', () => {
        if (!this.currentRecipe) return;
        window.dispatchEvent(new CustomEvent('open_day_picker', { detail: { id: this.currentRecipe.id } }));
      });
    }

    // Add ingredients to shopping list button
    const shopBtn = document.getElementById('modal-add-to-shop-btn');
    if (shopBtn) {
      shopBtn.addEventListener('click', () => this.addIngredientsToShoppingList());
    }

    // Wake lock toggle button
    const wakeBtn = document.getElementById('modal-wake-lock-btn');
    if (wakeBtn) {
      wakeBtn.addEventListener('click', () => this.toggleWakeLock());
    }

    // Escape key closes modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
        this.closeModal();
      }
    });
  }

  openModal(recipeId) {
    const r = store.getRecipeById(recipeId);
    if (!r) {
      showToast('Nie znaleziono dania.');
      return;
    }

    this.currentRecipe = r;
    this.currentPortions = r.portions || 1;

    const modal = document.getElementById('modal-recipe');
    if (!modal) return;

    // Set Title, Image, Meta
    const titleEl = document.getElementById('modal-title');
    const imgEl = document.getElementById('modal-img');
    const catEl = document.getElementById('modal-category');
    const timeEl = document.getElementById('modal-time');

    if (titleEl) titleEl.innerText = r.title;
    if (imgEl) {
      imgEl.src = r.image;
      imgEl.alt = r.title;
    }
    if (catEl) catEl.innerText = r.category;
    if (timeEl) timeEl.innerText = `${r.prep_time_minutes || 15} min`;

    this.updateFavBtnUI();
    this.renderMacrosAndIngredients();
    this.renderInstructions();

    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }

  closeModal() {
    const modal = document.getElementById('modal-recipe');
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    this.currentRecipe = null;
    this.releaseWakeLock();
  }

  adjustPortions(delta) {
    if (!this.currentRecipe) return;
    const newP = this.currentPortions + delta;
    if (newP < 1 || newP > 20) return;

    this.currentPortions = newP;
    this.renderMacrosAndIngredients();
  }

  updateFavBtnUI() {
    const favBtn = document.getElementById('modal-fav-btn');
    if (!favBtn || !this.currentRecipe) return;

    const isFav = store.isFavorite(this.currentRecipe.id);
    favBtn.innerHTML = `
      <i class="fa-solid fa-heart ${isFav ? 'text-red-500' : 'text-stone-400'} text-base"></i>
      <span class="text-xs font-bold ${isFav ? 'text-red-600' : 'text-stone-600'}">${isFav ? 'Ulubione' : 'Polub'}</span>
    `;
  }

  renderMacrosAndIngredients() {
    if (!this.currentRecipe) return;
    const r = this.currentRecipe;
    const baseP = r.portions || 1;
    const ratio = this.currentPortions / baseP;

    // Portion count display
    const portionCountEl = document.getElementById('modal-portion-count');
    if (portionCountEl) portionCountEl.innerText = this.currentPortions;

    // Macro display
    const kcalEl = document.getElementById('modal-kcal');
    const protEl = document.getElementById('modal-prot');
    const fatEl = document.getElementById('modal-fat');
    const carbsEl = document.getElementById('modal-carbs');

    if (kcalEl) kcalEl.innerText = Math.round(r.calories * ratio);
    if (protEl) protEl.innerText = `${Math.round(r.protein * ratio * 10) / 10}g`;
    if (fatEl) fatEl.innerText = `${Math.round(r.fat * ratio * 10) / 10}g`;
    if (carbsEl) carbsEl.innerText = `${Math.round(r.carbs * ratio * 10) / 10}g`;

    // Ingredients rendering with universal scaler
    const ingContainer = document.getElementById('modal-ingredients');
    const ingCountEl = document.getElementById('modal-ing-count');
    const ings = r.ingredients || [];

    if (ingCountEl) ingCountEl.innerText = `${ings.length} pozycji`;
    if (!ingContainer) return;

    if (ings.length === 0) {
      ingContainer.innerHTML = '<p class="text-xs text-stone-400">Brak rozpisanych składników.</p>';
      return;
    }

    ingContainer.innerHTML = ings.map(ing => {
      let displayAmount = ing.amount || '';

      // Universal Scaler: scales both textual quantities and gram weights!
      if (ratio !== 1) {
        displayAmount = scaleAmount(ing.amount, ratio, ing.weight_g);
      } else if (!displayAmount && ing.weight_g > 0) {
        displayAmount = `${ing.weight_g} g`;
      }

      return `
        <label class="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50 cursor-pointer border border-transparent hover:border-stone-200 transition select-none group">
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <input type="checkbox" class="modal-ing-check w-4 h-4 rounded text-brand-600 focus:ring-brand-500 accent-brand-600 cursor-pointer">
            <span class="text-xs sm:text-sm font-semibold text-stone-800 transition group-has-checked:line-through group-has-checked:text-stone-400">
              ${escapeHtml(ing.name)}
            </span>
          </div>
          ${displayAmount ? `<span class="text-xs font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-lg shrink-0">${escapeHtml(displayAmount)}</span>` : ''}
        </label>
      `;
    }).join('');
  }

  renderInstructions() {
    if (!this.currentRecipe) return;
    const instContainer = document.getElementById('modal-instructions');
    const steps = this.currentRecipe.instructions || [];
    if (!instContainer) return;

    if (steps.length === 0) {
      instContainer.innerHTML = '<p class="text-xs text-stone-400">Brak instrukcji przygotowania.</p>';
      return;
    }

    instContainer.innerHTML = steps.map((step, idx) => `
      <div class="flex items-start gap-3 p-3 rounded-2xl bg-stone-50/70 border border-stone-100">
        <span class="w-6 h-6 rounded-full bg-brand-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
          ${idx + 1}
        </span>
        <p class="text-xs sm:text-sm font-medium text-stone-700 leading-relaxed flex-1">
          ${escapeHtml(step)}
        </p>
      </div>
    `).join('');
  }

  addIngredientsToShoppingList() {
    if (!this.currentRecipe) return;
    const r = this.currentRecipe;
    const ratio = this.currentPortions / (r.portions || 1);
    const ings = r.ingredients || [];

    if (ings.length === 0) {
      showToast('Ten przepis nie zawiera składników do dodania.');
      return;
    }

    ings.forEach(ing => {
      const amountStr = scaleAmount(ing.amount, ratio, ing.weight_g);

      store.addShoppingItem({
        name: ing.name,
        amount: amountStr,
        department: ing.department || 'Inne',
        recipe_title: r.title,
        is_manual: false
      });
    });

    showToast(`✓ Dodano ${ings.length} składników do listy zakupów (${this.currentPortions} porcji)! 🛒`);
  }

  async toggleWakeLock() {
    const btn = document.getElementById('modal-wake-lock-btn');
    if ('wakeLock' in navigator) {
      if (!this.isWakeLockActive) {
        try {
          this.wakeLock = await navigator.wakeLock.request('screen');
          this.isWakeLockActive = true;
          if (btn) {
            btn.className = 'px-3 py-1.5 rounded-xl bg-amber-500 text-stone-900 font-extrabold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer';
            btn.innerHTML = `<i class="fa-solid fa-sun"></i> Ekran aktywny`;
          }
          showToast('🔆 Włączono tryb kuchenny: ekran nie wygaśnie!');
          this.wakeLock.addEventListener('release', () => {
            this.isWakeLockActive = false;
            this.updateWakeLockBtnUI();
          });
        } catch (err) {
          console.warn('Wake Lock error:', err);
          showToast('Nie udało się zablokować wygaszania ekranu.');
        }
      } else {
        this.releaseWakeLock();
        showToast('Wyłączono tryb kuchenny.');
      }
    } else {
      showToast('Twoja przeglądarka nie obsługuje blokady wygaszania ekranu.');
    }
  }

  releaseWakeLock() {
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
    }
    this.isWakeLockActive = false;
    this.updateWakeLockBtnUI();
  }

  updateWakeLockBtnUI() {
    const btn = document.getElementById('modal-wake-lock-btn');
    if (btn) {
      btn.className = 'px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer';
      btn.innerHTML = `<i class="fa-regular fa-sun"></i> Nie wygaszaj ekranu`;
    }
  }
}

export const modal = new ModalModule();

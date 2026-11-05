import { store } from './store.js';
import { escapeHtml, showToast, renderMacroPills } from './utils/dom.js';
import { findSubstitutesForIngredient } from './utils/substitutes.js';

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
    this.context = null; // { mealPlanId, dateKey, slotIndex, dayName, slotName }
    this.activeMealPlanEntry = null;
    this.localSubstitutions = {}; // Active substitutions map (normKey -> subData)
    this.openSubDrawers = new Set();
    this.wakeLock = null;
    this.isWakeLockActive = false;
  }

  init() {
    this.bindEvents();

    window.addEventListener('open_recipe_modal', (e) => {
      this.openModal(e.detail.id, e.detail);
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

    // Add to plan button in modal (passes active substitutions!)
    const planBtn = document.getElementById('modal-add-to-plan-btn');
    if (planBtn) {
      planBtn.addEventListener('click', () => {
        if (!this.currentRecipe) return;
        window.dispatchEvent(new CustomEvent('open_day_picker', {
          detail: {
            id: this.currentRecipe.id,
            substitutions: this.localSubstitutions
          }
        }));
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

  findMealPlanEntry(context) {
    if (!context) return null;

    // 1. Check direct mealPlanId
    if (context.mealPlanId) {
      const entry = store.getMealPlanEntry(context.mealPlanId);
      if (entry) return entry;
    }

    // 2. Check by dateKey and slotIndex
    if (context.dateKey && typeof context.slotIndex === 'number') {
      const bySlot = store.getMealPlan().find(m => m.date_key === context.dateKey && Number(m.slot_index) === Number(context.slotIndex));
      if (bySlot) return bySlot;
    }

    // 3. Fallback: if recipe is currently planned in exactly 1 slot, auto-link
    if (this.currentRecipe) {
      const planned = store.getMealPlan().filter(m => m.recipe_id === this.currentRecipe.id);
      if (planned.length === 1) {
        return planned[0];
      }
    }

    return null;
  }

  openModal(recipeId, context = {}) {
    const r = store.getRecipeById(recipeId);
    if (!r) {
      showToast('Nie znaleziono dania.');
      return;
    }

    this.currentRecipe = r;
    this.context = context || {};
    this.openSubDrawers.clear();

    // Find if opened for a planned meal slot or linked occurrence
    this.activeMealPlanEntry = this.findMealPlanEntry(this.context);

    if (this.activeMealPlanEntry) {
      this.currentPortions = this.activeMealPlanEntry.portions || r.portions || 1;
      this.localSubstitutions = this.activeMealPlanEntry.substitutions ? JSON.parse(JSON.stringify(this.activeMealPlanEntry.substitutions)) : {};
    } else {
      this.currentPortions = r.portions || 1;
      this.localSubstitutions = {};
    }

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
    this.renderPlanContextBanner();
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
    this.context = null;
    this.activeMealPlanEntry = null;
    this.localSubstitutions = {};
    this.openSubDrawers.clear();
    this.releaseWakeLock();
  }

  renderPlanContextBanner() {
    const banner = document.getElementById('modal-plan-context');
    if (!banner || !this.currentRecipe) return;

    const subCount = Object.keys(this.localSubstitutions || {}).length;

    // Case 1: Opened or linked to a specific planned slot in the planner
    if (this.activeMealPlanEntry) {
      const dayText = this.context?.dayName || `Dzień ${this.activeMealPlanEntry.date_key}`;
      const slotText = this.context?.slotName || `Posiłek ${Number(this.activeMealPlanEntry.slot_index) + 1}`;

      banner.className = 'mt-3 p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/70 border border-amber-200/90 flex items-center justify-between gap-3 shadow-2xs';
      banner.innerHTML = `
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 animate-pulse"></span>
          <div class="min-w-0">
            <span class="font-black text-xs text-stone-900 block leading-tight">
              📅 Posiłek w jadłospisie: <span class="text-brand-700">${escapeHtml(dayText)} • ${escapeHtml(slotText)}</span>
            </span>
            <span class="text-[11px] text-stone-500 font-medium">
              ${subCount > 0 ? `Aktywne zamienniki: <strong>${subCount}</strong>. ` : ''}Zamiany zapisują się <strong>tylko dla tego posiłku</strong> (baza dań pozostaje nienaruszona).
            </span>
          </div>
        </div>
        <span class="px-2.5 py-1 rounded-xl bg-white border border-amber-200 text-amber-900 font-black text-[10px] uppercase tracking-wider shrink-0 shadow-2xs">
          Edycja posiłku
        </span>
      `;
      banner.classList.remove('hidden');
      return;
    }

    // Case 2: Recipe exists in active meal plan multiple times
    const plannedOccurrences = store.getMealPlan().filter(m => m.recipe_id === this.currentRecipe.id);
    if (plannedOccurrences.length > 1) {
      banner.className = 'mt-3 p-3 rounded-2xl bg-stone-50 border border-stone-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5';
      
      const optionsHtml = plannedOccurrences.map(p => {
        return `<option value="${p.id}">Dzień ${p.date_key} (Posiłek ${Number(p.slot_index) + 1})</option>`;
      }).join('');

      banner.innerHTML = `
        <div class="flex items-center gap-2 min-w-0">
          <i class="fa-solid fa-calendar-days text-brand-600 text-xs"></i>
          <span class="text-xs text-stone-700 font-semibold">
            To danie jest w Twoim jadłospisie (${plannedOccurrences.length}x). Wybierz dzień, by przypisać do niego zamienniki:
          </span>
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <select id="modal-select-planned-meal" class="text-xs font-bold bg-white border border-stone-300 rounded-xl px-2.5 py-1 text-stone-800 focus:ring-brand-500 flex-1 sm:flex-none">
            <option value="">-- Wybierz posiłek z jadłospisu --</option>
            ${optionsHtml}
          </select>
        </div>
      `;
      banner.classList.remove('hidden');

      const selectEl = banner.querySelector('#modal-select-planned-meal');
      if (selectEl) {
        selectEl.addEventListener('change', (e) => {
          const chosenId = e.target.value;
          if (chosenId) {
            const entry = store.getMealPlanEntry(chosenId);
            if (entry) {
              this.activeMealPlanEntry = entry;
              this.context = { mealPlanId: entry.id, dateKey: entry.date_key, slotIndex: entry.slot_index };
              this.currentPortions = entry.portions || this.currentRecipe.portions || 1;
              this.localSubstitutions = entry.substitutions ? JSON.parse(JSON.stringify(entry.substitutions)) : {};
              this.renderPlanContextBanner();
              this.renderMacrosAndIngredients();
              showToast('Przełączono w tryb edycji wybranego posiłku z jadłospisu!');
            }
          }
        });
      }
      return;
    }

    // Case 3: Custom substitutions active in preview mode (not yet in planner)
    if (subCount > 0) {
      banner.className = 'mt-3 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs gap-3';
      banner.innerHTML = `
        <div class="flex items-center gap-2 min-w-0">
          <i class="fa-solid fa-arrows-rotate text-amber-600"></i>
          <span class="text-stone-700 font-medium">
            Aktywne zamienniki w podglądzie: <strong>${subCount}</strong>. Aby zapisać je na stałe w jadłospisie, kliknij <strong>"Dodaj do dnia"</strong>.
          </span>
        </div>
      `;
      banner.classList.remove('hidden');
      return;
    }

    // Case 4: Default hidden
    banner.classList.add('hidden');
    banner.innerHTML = '';
  }

  adjustPortions(delta) {
    if (!this.currentRecipe) return;
    const newP = this.currentPortions + delta;
    if (newP < 1 || newP > 20) return;

    this.currentPortions = newP;

    // If this is an active meal plan entry, save portion count
    if (this.activeMealPlanEntry) {
      this.activeMealPlanEntry.portions = newP;
      store.idbPut('meal_plan', this.activeMealPlanEntry);
    }

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

    // Ingredients rendering with universal scaler & substitutes engine
    const ingContainer = document.getElementById('modal-ingredients');
    const ingCountEl = document.getElementById('modal-ing-count');
    const ings = r.ingredients || [];

    if (ingCountEl) ingCountEl.innerText = `${ings.length} pozycji`;
    if (!ingContainer) return;

    if (ings.length === 0) {
      ingContainer.innerHTML = '<p class="text-xs text-stone-400">Brak rozpisanych składników.</p>';
      return;
    }

    ingContainer.innerHTML = ings.map((ing, idx) => {
      const origName = (ing.name || '').trim();
      const normName = origName.toLowerCase();

      // Check if this ingredient has an active substitution
      const subEntry = Object.entries(this.localSubstitutions).find(([k, v]) => normName === k || normName.includes(k) || k.includes(normName));
      const isSubstituted = !!subEntry;
      const subData = isSubstituted ? subEntry[1] : null;

      // Find dietary substitutes for this ingredient with current scaling ratio
      const subInfo = findSubstitutesForIngredient(origName, ing.amount, ing.weight_g, ratio);

      if (isSubstituted) {
        // Render substituted item row
        let displayAmount = subData.amount || '';
        if (ratio !== 1 && subData.baseWeightG) {
          displayAmount = `${Math.round(subData.baseWeightG * ratio)} g`;
        }

        return `
          <div class="ingredient-row p-3 rounded-2xl bg-amber-50/80 border border-amber-300/80 transition space-y-2 mb-2">
            <div class="flex items-center justify-between gap-3">
              <label class="flex items-center gap-3 min-w-0 flex-1 cursor-pointer">
                <input type="checkbox" class="modal-ing-check w-4 h-4 rounded text-brand-600 focus:ring-brand-500 accent-brand-600 cursor-pointer">
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-xs sm:text-sm font-extrabold text-amber-950">${escapeHtml(subData.replacementName)}</span>
                    <span class="text-[9px] font-black uppercase text-amber-800 bg-amber-200/80 px-1.5 py-0.2 rounded-md">Zamiennik aktywny</span>
                  </div>
                  <span class="text-[11px] text-stone-500 block">
                    Zamiast: <span class="line-through font-medium text-stone-400">${escapeHtml(origName)}</span>
                  </span>
                </div>
              </label>

              <div class="flex items-center gap-2 shrink-0">
                <span class="text-xs font-black text-amber-900 bg-amber-100/90 border border-amber-200 px-2 py-0.5 rounded-lg">${escapeHtml(displayAmount)}</span>
                <button type="button" class="btn-restore-sub px-2.5 py-1 rounded-xl bg-white hover:bg-red-50 text-red-600 border border-stone-200 hover:border-red-200 font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shadow-2xs" data-orig="${escapeHtml(origName)}" title="Przywróć oryginalny składnik">
                  <i class="fa-solid fa-rotate-left text-[10px]"></i> Przywróć
                </button>
              </div>
            </div>

            ${subInfo ? `
              <div class="pt-1 flex items-center justify-between text-[11px]">
                <span class="text-stone-400 font-medium">Możesz też wybrać inny z listy:</span>
                <button type="button" class="btn-toggle-sub font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer" data-idx="${idx}">
                  <i class="fa-solid fa-arrows-rotate text-[10px]"></i> Zmień na inny (${subInfo.substitutes.length})
                </button>
              </div>
              ${this.renderSubstitutesDrawer(subInfo, idx, ing, ratio)}
            ` : ''}
          </div>
        `;
      }

      // Standard ingredient row
      let displayAmount = ing.amount || '';
      if (ratio !== 1) {
        displayAmount = scaleAmount(ing.amount, ratio, ing.weight_g);
      } else if (!displayAmount && ing.weight_g > 0) {
        displayAmount = `${ing.weight_g} g`;
      }

      return `
        <div class="ingredient-row rounded-2xl border border-transparent hover:border-stone-200/90 transition mb-1">
          <div class="flex items-center justify-between p-2.5 rounded-2xl hover:bg-stone-50 transition select-none group">
            <label class="flex items-center gap-3 min-w-0 flex-1 cursor-pointer">
              <input type="checkbox" class="modal-ing-check w-4 h-4 rounded text-brand-600 focus:ring-brand-500 accent-brand-600 cursor-pointer">
              <span class="text-xs sm:text-sm font-semibold text-stone-800 transition group-has-checked:line-through group-has-checked:text-stone-400">
                ${escapeHtml(origName)}
              </span>
            </label>

            <div class="flex items-center gap-2 shrink-0">
              ${displayAmount ? `<span class="text-xs font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-lg">${escapeHtml(displayAmount)}</span>` : ''}
              ${subInfo ? `
                <button type="button" class="btn-toggle-sub text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/70 px-2.5 py-1 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs" data-idx="${idx}" title="Zobacz oficjalne zamienniki dietetyczne z dokładną gramaturą">
                  <i class="fa-solid fa-arrows-rotate text-[10px]"></i> Zamienniki
                </button>
              ` : ''}
            </div>
          </div>

          ${subInfo ? this.renderSubstitutesDrawer(subInfo, idx, ing, ratio) : ''}
        </div>
      `;
    }).join('');

    this.attachIngredientListeners();
  }

  renderSubstitutesDrawer(subInfo, idx, originalIng, ratio) {
    const isOpen = this.openSubDrawers.has(idx);

    return `
      <div id="sub-drawer-${idx}" class="${isOpen ? '' : 'hidden'} mt-1 mb-2 p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs">
        <div class="flex items-center justify-between pb-2 mb-2.5 border-b border-amber-200/70">
          <div>
            <span class="font-black text-amber-950 flex items-center gap-1.5">
              <span>${subInfo.groupIcon}</span> ${subInfo.groupName} – zamienniki dla: <span class="text-brand-800 underline underline-offset-2">${escapeHtml(subInfo.currentIngredientName)}</span>
            </span>
            <span class="text-[10px] text-stone-500 font-medium block">${subInfo.groupDescription}</span>
          </div>
          <span class="text-[10px] font-black text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full shrink-0">
            Odpowiednik: ${subInfo.currentBaseGrams} g
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
          ${subInfo.substitutes.map(sub => `
            <div class="p-2.5 rounded-xl bg-white border border-amber-200/70 hover:border-amber-400 shadow-2xs flex items-center justify-between gap-2 transition">
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-1">
                  <span class="font-bold text-stone-900 text-xs truncate" title="${escapeHtml(sub.name)}">${escapeHtml(sub.name)}</span>
                  <span class="font-black text-amber-900 text-xs shrink-0">${escapeHtml(sub.amount)}</span>
                </div>
                <span class="text-[10px] text-stone-400 block">${escapeHtml(sub.homeMeasure)}</span>
              </div>

              <!-- Universal 1-Click Apply Button (Works on both Desktop & Mobile!) -->
              <button type="button" class="btn-apply-sub px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-[11px] transition cursor-pointer shrink-0 shadow-2xs flex items-center gap-1"
                data-orig="${escapeHtml(originalIng.name)}"
                data-name="${escapeHtml(sub.name)}"
                data-amount="${escapeHtml(sub.amount)}"
                data-weight="${sub.weight_g}"
                data-base-weight="${Math.round(sub.weight_g / ratio)}"
                data-dept="${escapeHtml(sub.department)}"
                title="Zastosuj ten zamiennik w przepisie">
                <i class="fa-solid fa-check text-[10px]"></i> Zastosuj
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  attachIngredientListeners() {
    const container = document.getElementById('modal-ingredients');
    if (!container) return;

    // Toggle substitutes drawer
    container.querySelectorAll('.btn-toggle-sub').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const idx = Number(btn.getAttribute('data-idx'));
        if (this.openSubDrawers.has(idx)) {
          this.openSubDrawers.delete(idx);
        } else {
          this.openSubDrawers.add(idx);
        }
        const drawer = document.getElementById(`sub-drawer-${idx}`);
        if (drawer) {
          drawer.classList.toggle('hidden', !this.openSubDrawers.has(idx));
        }
      });
    });

    // Apply substitution (Works instantly on both Desktop & Mobile!)
    container.querySelectorAll('.btn-apply-sub').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const origName = btn.getAttribute('data-orig');
        const repName = btn.getAttribute('data-name');
        const repAmount = btn.getAttribute('data-amount');
        const repWeight = Number(btn.getAttribute('data-weight')) || 0;
        const repBaseWeight = Number(btn.getAttribute('data-base-weight')) || repWeight;
        const repDept = btn.getAttribute('data-dept') || 'Inne';

        const subData = {
          originalName: origName,
          replacementName: repName,
          amount: repAmount,
          weight_g: repWeight,
          baseWeightG: repBaseWeight,
          department: repDept
        };

        const normKey = origName.toLowerCase().trim();
        this.localSubstitutions[normKey] = subData;

        // If this meal is planned in a day, persist it immediately to that slot!
        if (this.activeMealPlanEntry) {
          await store.updateMealPlanSubstitution(this.activeMealPlanEntry.id, origName, subData);
          this.activeMealPlanEntry = store.getMealPlanEntry(this.activeMealPlanEntry.id);
          showToast(`✓ Zastosowano "${repName}" (${repAmount}) w tym posiłku!`);
        } else {
          // If recipe exists in exactly 1 planned slot, auto-save to that slot as well
          const planned = store.getMealPlan().filter(m => m.recipe_id === this.currentRecipe.id);
          if (planned.length === 1) {
            this.activeMealPlanEntry = planned[0];
            await store.updateMealPlanSubstitution(planned[0].id, origName, subData);
            this.activeMealPlanEntry = store.getMealPlanEntry(planned[0].id);
            showToast(`✓ Zastosowano "${repName}" (${repAmount}) dla zaplanowanego posiłku!`);
          } else {
            showToast(`✓ Zastosowano "${repName}" (${repAmount}) w przepisie!`);
          }
        }

        this.renderPlanContextBanner();
        this.renderMacrosAndIngredients();
      });
    });

    // Restore original ingredient
    container.querySelectorAll('.btn-restore-sub').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const origName = btn.getAttribute('data-orig');
        const normKey = origName.toLowerCase().trim();
        delete this.localSubstitutions[normKey];

        if (this.activeMealPlanEntry) {
          await store.removeMealPlanSubstitution(this.activeMealPlanEntry.id, origName);
          this.activeMealPlanEntry = store.getMealPlanEntry(this.activeMealPlanEntry.id);
        }

        showToast(`✓ Przywrócono oryginalny składnik: "${origName}".`);
        this.renderPlanContextBanner();
        this.renderMacrosAndIngredients();
      });
    });
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
    const activeSubs = this.localSubstitutions || {};

    if (ings.length === 0) {
      showToast('Ten przepis nie zawiera składników do dodania.');
      return;
    }

    ings.forEach(ing => {
      let nameToUse = ing.name;
      let amountStr = scaleAmount(ing.amount, ratio, ing.weight_g);
      let dept = ing.department || 'Inne';

      // Check for active substitution
      const normName = (ing.name || '').toLowerCase().trim();
      const subEntry = Object.entries(activeSubs).find(([k, v]) => normName === k || normName.includes(k) || k.includes(normName));

      if (subEntry) {
        const sub = subEntry[1];
        nameToUse = sub.replacementName || sub.name;
        if (sub.baseWeightG && ratio !== 1) {
          amountStr = `${Math.round(sub.baseWeightG * ratio)} g`;
        } else {
          amountStr = sub.amount;
        }
        dept = sub.department || dept;
      }

      store.addShoppingItem({
        name: nameToUse,
        amount: amountStr,
        department: dept,
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

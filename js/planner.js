import { store } from './store.js';
import { escapeHtml, showToast, renderMacroPills } from './utils/dom.js';

export const MEAL_SLOT_NAMES = {
  3: ['Śniadanie', 'Obiad', 'Kolacja'],
  4: ['Śniadanie', 'II Śniadanie', 'Obiad', 'Kolacja'],
  5: ['Śniadanie', 'II Śniadanie', 'Obiad', 'Podwieczorek', 'Kolacja'],
  6: ['Śniadanie', 'II Śniadanie', 'Obiad', 'Podwieczorek', 'Kolacja', 'Przekąska']
};

export const DAYS_NAMES = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];

class PlannerModule {
  constructor() {
    this.currentDate = new Date();
    this.targetDateKey = null;
    this.targetSlotIndex = 0;
    this.targetRecipeId = null;
  }

  init() {
    this.bindEvents();
    this.renderBoard();

    store.addEventListener('ready', () => this.renderBoard());
    store.addEventListener('mealplan_changed', () => this.renderBoard());
    store.addEventListener('setting_changed', (e) => {
      if (e.detail.key === 'dailyMealCount') this.renderBoard();
    });

    // Listen to custom event from card "Dodaj do dnia"
    window.addEventListener('open_day_picker', (e) => {
      this.openDayPickerModal(e.detail.id);
    });
  }

  bindEvents() {
    // Week navigation buttons
    const prevBtn = document.getElementById('planner-prev-week');
    const nextBtn = document.getElementById('planner-next-week');
    const todayBtn = document.getElementById('planner-today-btn');
    const dateInput = document.getElementById('planner-date-input');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.currentDate.setDate(this.currentDate.getDate() - 7);
        this.renderBoard();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.currentDate.setDate(this.currentDate.getDate() + 7);
        this.renderBoard();
      });
    }

    if (todayBtn) {
      todayBtn.addEventListener('click', () => {
        this.currentDate = new Date();
        this.renderBoard();
      });
    }

    if (dateInput) {
      dateInput.addEventListener('change', (e) => {
        if (e.target.value) {
          this.currentDate = new Date(e.target.value);
          this.renderBoard();
        }
      });
    }

    // Modal: 1-Click Day Picker Close
    const closeDayPickerBtn = document.getElementById('close-day-picker-modal');
    if (closeDayPickerBtn) {
      closeDayPickerBtn.addEventListener('click', () => this.closeDayPickerModal());
    }

    // Modal: Dish Selector Close
    const closeDishPickerBtn = document.getElementById('close-dish-picker-modal');
    if (closeDishPickerBtn) {
      closeDishPickerBtn.addEventListener('click', () => this.closeDishPickerModal());
    }
  }

  getWeekDays() {
    const curr = new Date(this.currentDate);
    // Find Monday of the current week (Polish convention: Monday = 1, Sunday = 0)
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(curr.setDate(diff));

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isoKey = d.toISOString().split('T')[0];
      weekDays.push({
        date: d,
        isoKey: isoKey,
        dayIdx: i,
        dayName: DAYS_NAMES[i],
        formattedDate: `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`
      });
    }

    return weekDays;
  }

  renderBoard() {
    const container = document.getElementById('planner-board');
    if (!container) return;

    const weekDays = this.getWeekDays();
    const mealCount = store.getSetting('dailyMealCount', 4);
    const slotNames = MEAL_SLOT_NAMES[mealCount] || MEAL_SLOT_NAMES[4];

    // Update Toolbar Date Text & Input
    const dateInput = document.getElementById('planner-date-input');
    const rangeText = document.getElementById('planner-week-range');
    if (dateInput) dateInput.value = weekDays[0].isoKey;
    if (rangeText) {
      rangeText.innerText = `${weekDays[0].formattedDate} – ${weekDays[6].formattedDate}`;
    }

    const allPlan = store.getMealPlan();

    let html = '';
    weekDays.forEach(w => {
      // Find meals strictly for this date
      const dayMeals = allPlan.filter(m => m.date_key === w.isoKey);

      // Compute total macros for this day
      let dayKcal = 0, dayProt = 0, dayFat = 0, dayCarbs = 0;
      dayMeals.forEach(m => {
        const recipe = store.getRecipeById(m.recipe_id);
        if (recipe) {
          const ratio = (m.portions || 1) / (recipe.portions || 1);
          dayKcal += recipe.calories * ratio;
          dayProt += recipe.protein * ratio;
          dayFat += recipe.fat * ratio;
          dayCarbs += recipe.carbs * ratio;
        }
      });

      const isToday = new Date().toISOString().split('T')[0] === w.isoKey;

      html += `
        <div class="day-card bg-white rounded-3xl border ${isToday ? 'border-brand-500 shadow-md ring-2 ring-brand-500/20' : 'border-stone-200/80 shadow-xs'} p-4 flex flex-col justify-between">
          <div>
            <!-- Day Header -->
            <div class="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-extrabold text-sm sm:text-base text-stone-900">${w.dayName}</span>
                  ${isToday ? '<span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">Dzisiaj</span>' : ''}
                </div>
                <span class="text-xs text-stone-400 font-semibold">${w.formattedDate}</span>
              </div>

              <!-- Day Actions (Clone / Clear) -->
              <div class="flex items-center gap-1">
                <button type="button" title="Kopiuj ten dzień na inny dzień (Meal Prep)" class="clone-day-btn p-1.5 rounded-lg text-stone-400 hover:text-brand-600 hover:bg-brand-50 transition cursor-pointer" data-date="${w.isoKey}">
                  <i class="fa-regular fa-copy text-xs"></i>
                </button>
                <button type="button" title="Wyczyść dzień" class="clear-day-btn p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer" data-date="${w.isoKey}">
                  <i class="fa-regular fa-trash-can text-xs"></i>
                </button>
              </div>
            </div>

            <!-- Day Macro Summary -->
            <div class="py-2.5 px-3 my-3 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-between text-xs">
              <span class="font-black text-stone-900">${Math.round(dayKcal)} kcal</span>
              <div class="flex items-center gap-2 text-[11px] font-bold text-stone-600">
                <span>${Math.round(dayProt)}g <span class="text-[9px] text-amber-600">B</span></span>
                <span>${Math.round(dayFat)}g <span class="text-[9px] text-emerald-600">T</span></span>
                <span>${Math.round(dayCarbs)}g <span class="text-[9px] text-sky-600">W</span></span>
              </div>
            </div>

            <!-- Meal Slots (Strict mapping 0..mealCount-1) -->
            <div class="space-y-2.5">
      `;

      for (let slotIdx = 0; slotIdx < mealCount; slotIdx++) {
        const slotName = slotNames[slotIdx] || `Posiłek ${slotIdx + 1}`;
        const meal = dayMeals.find(m => m.slot_index === slotIdx);

        if (meal) {
          const r = store.getRecipeById(meal.recipe_id);
          const title = r ? r.title : 'Nieznana potrawa';
          const img = r ? r.image : 'images/placeholder.svg';
          const kcal = r ? Math.round(r.calories * (meal.portions || 1)) : 0;

          html += `
            <div class="meal-slot-filled group bg-stone-50/80 hover:bg-brand-50/40 p-2 rounded-2xl border border-stone-200/70 hover:border-brand-500/60 transition flex items-center justify-between gap-2.5 cursor-pointer" data-recipe-id="${meal.recipe_id}">
              <div class="flex items-center gap-2.5 min-w-0 flex-1">
                <div class="w-10 h-10 rounded-xl overflow-hidden bg-stone-200 shrink-0">
                  <img src="${img}" alt="${escapeHtml(title)}" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='images/placeholder.svg';">
                </div>
                <div class="min-w-0 flex-1">
                  <span class="text-[10px] font-black uppercase text-brand-600 block leading-tight">${slotName}</span>
                  <h4 class="text-xs font-bold text-stone-800 truncate" title="${escapeHtml(title)}">${escapeHtml(title)}</h4>
                  <span class="text-[10px] font-semibold text-stone-400">${kcal} kcal</span>
                </div>
              </div>

              <button type="button" title="Usuń posiłek" class="remove-meal-btn w-7 h-7 rounded-lg text-stone-400 hover:text-red-600 hover:bg-white flex items-center justify-center transition cursor-pointer" data-meal-id="${meal.id}">
                <i class="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>
          `;
        } else {
          // Empty Slot -> "+ Dodaj danie" button
          html += `
            <button type="button" class="add-slot-btn w-full p-2.5 rounded-2xl border border-dashed border-stone-200 hover:border-brand-500 hover:bg-brand-50/50 text-stone-400 hover:text-brand-700 transition flex items-center justify-between text-xs font-bold group cursor-pointer" data-date="${w.isoKey}" data-slot="${slotIdx}">
              <span class="text-[11px] text-stone-400 group-hover:text-brand-600 font-extrabold uppercase">${slotName}</span>
              <span class="flex items-center gap-1 text-[11px] text-stone-500 group-hover:text-brand-700 font-bold">
                <i class="fa-solid fa-plus text-xs"></i> Dodaj danie
              </span>
            </button>
          `;
        }
      }

      html += `
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    this.attachBoardListeners();
  }

  attachBoardListeners() {
    const container = document.getElementById('planner-board');
    if (!container) return;

    // Click on filled meal slot -> Open recipe modal
    container.querySelectorAll('.meal-slot-filled').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.remove-meal-btn')) return;
        const recipeId = el.getAttribute('data-recipe-id');
        window.dispatchEvent(new CustomEvent('open_recipe_modal', { detail: { id: Number(recipeId) } }));
      });
    });

    // Remove meal button
    container.querySelectorAll('.remove-meal-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const mealId = btn.getAttribute('data-meal-id');
        store.removeMealPlanEntry(mealId);
        showToast('Usunięto danie z jadłospisu.');
      });
    });

    // Add slot button -> Open dish picker for that specific slot
    container.querySelectorAll('.add-slot-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dateKey = btn.getAttribute('data-date');
        const slotIdx = Number(btn.getAttribute('data-slot'));
        this.openDishPickerModal(dateKey, slotIdx);
      });
    });

    // Clear day button
    container.querySelectorAll('.clear-day-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dateKey = btn.getAttribute('data-date');
        if (confirm('Czy na pewno chcesz wyczyścić wszystkie posiłki z tego dnia?')) {
          const dayMeals = store.getMealPlan().filter(m => m.date_key === dateKey);
          dayMeals.forEach(m => store.removeMealPlanEntry(m.id));
          showToast('Wyczyszczono posiłki z wybranego dnia.');
        }
      });
    });

    // Clone day button (Meal Prep)
    container.querySelectorAll('.clone-day-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dateKey = btn.getAttribute('data-date');
        this.promptCloneDay(dateKey);
      });
    });
  }

  promptCloneDay(fromDateKey) {
    const weekDays = this.getWeekDays();
    const fromDay = weekDays.find(w => w.isoKey === fromDateKey);
    const dayName = fromDay ? fromDay.dayName : fromDateKey;

    const targetDate = prompt(`Skopiuj wszystkie posiłki z dnia: ${dayName} do innego dnia tygodnia.\nPodaj dzień docelowy (np. Wtorek, Środa) lub datę (YYYY-MM-DD):`);
    if (!targetDate) return;

    let targetIsoKey = null;
    const matchDay = weekDays.find(w => w.dayName.toLowerCase().startsWith(targetDate.trim().toLowerCase()));
    if (matchDay) {
      targetIsoKey = matchDay.isoKey;
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(targetDate.trim())) {
      targetIsoKey = targetDate.trim();
    }

    if (!targetIsoKey) {
      alert('Nie rozpoznano podanego dnia.');
      return;
    }

    store.cloneDayMealPlan(fromDateKey, targetIsoKey).then(count => {
      if (count > 0) {
        showToast(`✓ Skopiowano ${count} posiłki na dzień: ${targetDate}!`);
      } else {
        showToast('Brak posiłków do skopiowania w tym dniu.');
      }
    });
  }

  // --- 1-Click Day Picker Modal (opened from recipe card) ---
  openDayPickerModal(recipeId) {
    this.targetRecipeId = Number(recipeId);
    const recipe = store.getRecipeById(recipeId);
    if (!recipe) return;

    const modal = document.getElementById('modal-day-picker');
    const titleEl = document.getElementById('picker-recipe-title');
    const container = document.getElementById('picker-days-container');
    if (!modal || !container) return;

    if (titleEl) titleEl.innerText = recipe.title;

    const weekDays = this.getWeekDays();
    const mealCount = store.getSetting('dailyMealCount', 4);
    const slotNames = MEAL_SLOT_NAMES[mealCount] || MEAL_SLOT_NAMES[4];

    // Determine default suggested slot by recipe category
    let defaultSlot = 0;
    if (recipe.category.includes('Makarony') || recipe.category.includes('fast foody')) {
      defaultSlot = Math.min(2, mealCount - 1); // Obiad
    } else if (recipe.category.includes('Kanapki') || recipe.category.includes('desery')) {
      defaultSlot = mealCount - 1; // Kolacja
    }

    container.innerHTML = weekDays.map((w, idx) => `
      <div class="p-3 rounded-2xl bg-stone-50 hover:bg-brand-50/50 border border-stone-200 transition flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="w-8 h-8 rounded-xl bg-stone-200 font-extrabold text-xs text-stone-700 flex items-center justify-center">${idx + 1}</span>
          <div>
            <span class="font-extrabold text-sm text-stone-900 block">${w.dayName}</span>
            <span class="text-xs text-stone-400 font-semibold">${w.formattedDate}</span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <select class="picker-slot-select px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-800 outline-none" data-date="${w.isoKey}">
            ${slotNames.map((sn, sIdx) => `
              <option value="${sIdx}" ${sIdx === defaultSlot ? 'selected' : ''}>${sn}</option>
            `).join('')}
          </select>

          <button type="button" class="btn-assign-day px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs transition shadow-sm cursor-pointer" data-date="${w.isoKey}">
            Wybierz
          </button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.btn-assign-day').forEach(btn => {
      btn.addEventListener('click', () => {
        const dateKey = btn.getAttribute('data-date');
        const select = container.querySelector(`.picker-slot-select[data-date="${dateKey}"]`);
        const slotIdx = select ? Number(select.value) : defaultSlot;
        
        store.addMealPlanEntry(dateKey, slotIdx, this.targetRecipeId, 1).then(() => {
          showToast(`✓ Przypisano "${recipe.title}" do jadłospisu!`);
          this.closeDayPickerModal();
        });
      });
    });

    modal.classList.remove('hidden');
  }

  closeDayPickerModal() {
    const modal = document.getElementById('modal-day-picker');
    if (modal) modal.classList.add('hidden');
    this.targetRecipeId = null;
  }

  // --- Dish Selector Modal (opened from "+ Dodaj danie" slot button) ---
  openDishPickerModal(dateKey, slotIndex) {
    this.targetDateKey = dateKey;
    this.targetSlotIndex = slotIndex;

    const modal = document.getElementById('modal-planner-dish-picker');
    if (!modal) return;

    const weekDays = this.getWeekDays();
    const targetDay = weekDays.find(w => w.isoKey === dateKey);
    const mealCount = store.getSetting('dailyMealCount', 4);
    const slotNames = MEAL_SLOT_NAMES[mealCount] || MEAL_SLOT_NAMES[4];
    const slotName = slotNames[slotIndex] || `Posiłek ${slotIndex + 1}`;

    const label = document.getElementById('planner-picker-target-day');
    if (label && targetDay) {
      label.innerText = `${targetDay.dayName} • ${slotName}`;
    }

    this.renderDishPickerList();
    modal.classList.remove('hidden');
  }

  renderDishPickerList(query = '', category = 'Wszystkie') {
    const listEl = document.getElementById('planner-picker-list');
    if (!listEl) return;

    let recipes = store.getRecipes();
    if (category && category !== 'Wszystkie') {
      recipes = recipes.filter(r => r.category === category);
    }
    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      recipes = recipes.filter(r => r.title.toLowerCase().includes(q));
    }

    listEl.innerHTML = recipes.slice(0, 50).map(r => `
      <div class="picker-dish-item p-2.5 rounded-2xl bg-white hover:bg-brand-50 border border-stone-200 hover:border-brand-500 transition flex items-center justify-between gap-3 cursor-pointer" data-id="${r.id}">
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <div class="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 shrink-0">
            <img src="${r.image}" alt="${escapeHtml(r.title)}" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='images/placeholder.svg';">
          </div>
          <div class="min-w-0 flex-1">
            <h4 class="font-extrabold text-stone-900 text-xs sm:text-sm truncate">${escapeHtml(r.title)}</h4>
            <div class="flex items-center gap-2 text-[11px] font-semibold text-stone-500 mt-0.5">
              <span class="font-bold text-stone-800">${r.calories} kcal</span>
              <span>•</span>
              <span>${r.category}</span>
            </div>
          </div>
        </div>

        <button type="button" class="px-3 py-1.5 rounded-xl bg-brand-600 text-white font-extrabold text-xs shadow-sm">
          Wybierz
        </button>
      </div>
    `).join('');

    listEl.querySelectorAll('.picker-dish-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = Number(item.getAttribute('data-id'));
        store.addMealPlanEntry(this.targetDateKey, this.targetSlotIndex, id, 1).then(() => {
          const r = store.getRecipeById(id);
          showToast(`✓ Dodano "${r ? r.title : ''}" do wybranego slotu!`);
          this.closeDishPickerModal();
        });
      });
    });

    // Bind search inside modal
    const searchInput = document.getElementById('planner-dish-search');
    if (searchInput && !searchInput._bound) {
      searchInput._bound = true;
      searchInput.addEventListener('input', (e) => {
        this.renderDishPickerList(e.target.value);
      });
    }
  }

  closeDishPickerModal() {
    const modal = document.getElementById('modal-planner-dish-picker');
    if (modal) modal.classList.add('hidden');
    this.targetDateKey = null;
    this.targetSlotIndex = 0;
  }
}

export const planner = new PlannerModule();

import { store } from './store.js';
import { matchSearchQuery } from './utils/stemmer.js';
import { escapeHtml, renderMacroPills } from './utils/dom.js';

export const CATEGORIES_11 = [
  'Owsianki, puddingi i kasze',
  'Nabiał i skyr-bowls',
  'Jajka',
  'Kanapki i tosty',
  'Naleśniki, gofry i placki',
  'Dania główne i obiady',
  'Makarony i zapiekanki',
  'Wrapy, tortille i fit fast food',
  'Sałatki i wytrawne bowle',
  'Fit desery i słodkie wypieki',
  'Szybkie gotowce (SOS)'
];

export const CATEGORY_ICONS = {
  'Owsianki, puddingi i kasze': '🥣',
  'Nabiał i skyr-bowls': '🥛',
  'Jajka': '🍳',
  'Kanapki i tosty': '🥪',
  'Naleśniki, gofry i placki': '🥞',
  'Dania główne i obiady': '🍛',
  'Makarony i zapiekanki': '🍝',
  'Wrapy, tortille i fit fast food': '🌯',
  'Sałatki i wytrawne bowle': '🥗',
  'Fit desery i słodkie wypieki': '🧁',
  'Szybkie gotowce (SOS)': '🛒'
};

class CatalogModule {
  constructor() {
    this.filters = {
      query: '',
      categories: [],
      prepTimes: [], // e.g. [15, 30]
      ingredients: [],
      diet: 'Wszystkie',
      onlyFavorites: false,
      sortBy: 'title'
    };
    this.visibleCount = 24;
    this.filteredRecipes = [];
    this.observer = null;
  }

  init() {
    this.bindEvents();
    this.renderCategoryPills();
    this.renderTimeChips();
    this.renderDietOptions();
    this.applyFilters();

    // Subscribe to store events
    store.addEventListener('ready', () => {
      this.renderCategoryPills();
      this.renderDietOptions();
      this.applyFilters();
    });

    store.addEventListener('recipes_updated', () => {
      this.renderCategoryPills();
      this.applyFilters();
    });

    store.addEventListener('favorites_changed', (e) => {
      this.updateCardFavoriteState(e.detail.id, e.detail.isFavorite);
    });

    store.addEventListener('recipe_deleted', () => {
      this.applyFilters();
      this.renderCategoryPills();
    });

    store.addEventListener('recipe_added', () => {
      this.applyFilters();
      this.renderCategoryPills();
    });
  }

  bindEvents() {
    // Search input with debounce
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear-btn');
    let debounceTimer;

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (searchClear) searchClear.classList.toggle('hidden', val.length === 0);

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.filters.query = val;
          this.visibleCount = 24;
          this.applyFilters();
        }, 120);
      });
    }

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        searchClear.classList.add('hidden');
        this.filters.query = '';
        this.visibleCount = 24;
        this.applyFilters();
      });
    }

    // View switcher (Grid vs Compact)
    const btnGrid = document.getElementById('view-grid-btn');
    const btnCompact = document.getElementById('view-compact-btn');
    if (btnGrid) {
      btnGrid.addEventListener('click', () => this.setView('grid'));
    }
    if (btnCompact) {
      btnCompact.addEventListener('click', () => this.setView('compact'));
    }

    // Sort select
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.filters.sortBy = e.target.value;
        this.applyFilters();
      });
    }

    // Diet select
    const dietSelect = document.getElementById('diet-select');
    if (dietSelect) {
      dietSelect.addEventListener('change', (e) => {
        this.filters.diet = e.target.value;
        this.applyFilters();
      });
    }

    // Favorite toggle button
    const favToggleBtn = document.getElementById('fav-toggle-btn');
    if (favToggleBtn) {
      favToggleBtn.addEventListener('click', () => {
        this.filters.onlyFavorites = !this.filters.onlyFavorites;
        favToggleBtn.classList.toggle('bg-red-50', this.filters.onlyFavorites);
        favToggleBtn.classList.toggle('text-red-600', this.filters.onlyFavorites);
        favToggleBtn.classList.toggle('border-red-300', this.filters.onlyFavorites);
        this.applyFilters();
      });
    }

    // Reset filters button
    const resetBtn = document.getElementById('reset-filters-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetFilters());
    }
  }

  resetFilters() {
    this.filters.query = '';
    this.filters.categories = [];
    this.filters.prepTimes = [];
    this.filters.ingredients = [];
    this.filters.diet = 'Wszystkie';
    this.filters.onlyFavorites = false;
    this.filters.sortBy = 'title';

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    const searchClear = document.getElementById('search-clear-btn');
    if (searchClear) searchClear.classList.add('hidden');

    const dietSelect = document.getElementById('diet-select');
    if (dietSelect) dietSelect.value = 'Wszystkie';

    const favToggleBtn = document.getElementById('fav-toggle-btn');
    if (favToggleBtn) {
      favToggleBtn.className = 'p-2.5 rounded-xl border border-stone-200 text-stone-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all text-sm font-medium flex items-center gap-1.5 cursor-pointer';
    }

    this.renderCategoryPills();
    this.renderTimeChips();
    this.applyFilters();
  }

  setView(view) {
    store.setSetting('cardView', view);
    const btnGrid = document.getElementById('view-grid-btn');
    const btnCompact = document.getElementById('view-compact-btn');
    if (btnGrid) btnGrid.className = view === 'grid' ? 'p-1.5 rounded-lg bg-stone-200 text-stone-800' : 'p-1.5 rounded-lg hover:bg-stone-200 text-stone-500 cursor-pointer';
    if (btnCompact) btnCompact.className = view === 'compact' ? 'p-1.5 rounded-lg bg-stone-200 text-stone-800' : 'p-1.5 rounded-lg hover:bg-stone-200 text-stone-500 cursor-pointer';
    this.renderCards();
  }

  renderCategoryPills() {
    const container = document.getElementById('hero-category-pills');
    if (!container) return;

    const allRecipes = store.getRecipes();
    const counts = {};
    CATEGORIES_11.forEach(c => { counts[c] = 0; });
    allRecipes.forEach(r => {
      if (counts[r.category] !== undefined) counts[r.category]++;
    });

    const isAllActive = this.filters.categories.length === 0;

    let html = `
      <button type="button" data-cat="all" class="hero-cat-pill px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${isAllActive ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25 font-black' : 'bg-white/90 hover:bg-white text-stone-800 border border-orange-200/70 shadow-2xs'}">
        <span>✨ Wszystkie</span>
        <span class="text-[10px] px-1.5 py-0.5 rounded-md ${isAllActive ? 'bg-orange-700 text-white' : 'bg-orange-50 text-stone-600'} font-black">${allRecipes.length}</span>
      </button>
    `;

    CATEGORIES_11.forEach(cat => {
      const active = this.filters.categories.includes(cat);
      const icon = CATEGORY_ICONS[cat] || '🍽️';
      const count = counts[cat] || 0;

      html += `
        <button type="button" data-cat="${escapeHtml(cat)}" class="hero-cat-pill px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${active ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25 font-black' : 'bg-white/90 hover:bg-white text-stone-800 border border-orange-200/70 shadow-2xs'}">
          <span>${icon} ${escapeHtml(cat)}</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded-md ${active ? 'bg-orange-700 text-white' : 'bg-orange-50 text-stone-600'} font-bold">${count}</span>
        </button>
      `;
    });

    container.innerHTML = html;

    container.querySelectorAll('.hero-cat-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-cat');
        if (cat === 'all') {
          this.filters.categories = [];
        } else {
          const idx = this.filters.categories.indexOf(cat);
          if (idx > -1) {
            this.filters.categories.splice(idx, 1);
          } else {
            this.filters.categories.push(cat);
          }
        }
        this.visibleCount = 24;
        this.renderCategoryPills();
        this.applyFilters();
      });
    });
  }

  renderTimeChips() {
    const times = [15, 30, 60];
    times.forEach(t => {
      const btn = document.getElementById(`hero-time-${t}`);
      if (!btn) return;

      const active = this.filters.prepTimes.includes(t);
      btn.className = `px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${active ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25 font-black' : 'bg-white/90 hover:bg-white text-stone-800 border border-orange-200/70 shadow-2xs'}`;
      
      btn.onclick = () => {
        const idx = this.filters.prepTimes.indexOf(t);
        if (idx > -1) {
          this.filters.prepTimes.splice(idx, 1);
        } else {
          this.filters.prepTimes.push(t);
        }
        this.renderTimeChips();
        this.applyFilters();
      };
    });
  }

  renderDietOptions() {
    const select = document.getElementById('diet-select');
    if (!select) return;

    const allDiets = new Set();
    store.getRecipes().forEach(r => {
      (r.diets || []).forEach(d => allDiets.add(d));
    });

    const currentVal = this.filters.diet;
    let html = `<option value="Wszystkie">Wszystkie diety</option>`;
    Array.from(allDiets).sort().forEach(d => {
      html += `<option value="${escapeHtml(d)}" ${d === currentVal ? 'selected' : ''}>${escapeHtml(d)}</option>`;
    });
    select.innerHTML = html;
  }

  applyFilters() {
    let list = store.getRecipes();

    // 1. Text Search (Stemmed)
    if (this.filters.query) {
      list = list.filter(r => matchSearchQuery(this.filters.query, r.title, r.ingredients));
    }

    // 2. 11 Categories Filter (Multi-select)
    if (this.filters.categories.length > 0) {
      list = list.filter(r => this.filters.categories.includes(r.category));
    }

    // 3. Prep Time Filter (Multi-select: matches any selected threshold)
    if (this.filters.prepTimes.length > 0) {
      list = list.filter(r => {
        const prep = r.prep_time_minutes || 15;
        return this.filters.prepTimes.some(maxM => prep <= maxM);
      });
    }

    // 4. Diet Filter
    if (this.filters.diet && this.filters.diet !== 'Wszystkie') {
      list = list.filter(r => (r.diets || []).includes(this.filters.diet));
    }

    // 5. Favorites Filter
    if (this.filters.onlyFavorites) {
      list = list.filter(r => store.isFavorite(r.id));
    }

    // 6. Sorting
    list = [...list];
    switch (this.filters.sortBy) {
      case 'calories_asc':
        list.sort((a, b) => a.calories - b.calories);
        break;
      case 'calories_desc':
        list.sort((a, b) => b.calories - a.calories);
        break;
      case 'protein_desc':
        list.sort((a, b) => b.protein - a.protein);
        break;
      case 'prep_time_asc':
        list.sort((a, b) => (a.prep_time_minutes || 15) - (b.prep_time_minutes || 15));
        break;
      case 'title':
      default:
        list.sort((a, b) => a.title.localeCompare(b.title, 'pl'));
        break;
    }

    this.filteredRecipes = list;

    // Update Counter (P0: Always in sync with actual results!)
    const countEl = document.getElementById('results-count') || document.getElementById('recipes-count');
    if (countEl) countEl.innerText = list.length;

    this.renderCards();
  }

  renderCards() {
    const container = document.getElementById('recipes-grid');
    const emptyState = document.getElementById('empty-state');
    if (!container) return;

    if (this.filteredRecipes.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    const view = store.getSetting('cardView', 'grid');
    const visibleList = this.filteredRecipes.slice(0, this.visibleCount);
    const hasMore = this.visibleCount < this.filteredRecipes.length;

    if (view === 'compact') {
      container.className = 'flex flex-col gap-3';
      container.innerHTML = visibleList.map(r => this.renderCompactCardHtml(r)).join('') + this.renderLoadMoreHtml(hasMore);
    } else {
      container.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6';
      container.innerHTML = visibleList.map(r => this.renderGridCardHtml(r)).join('') + this.renderLoadMoreHtml(hasMore);
    }

    this.attachCardEventListeners();
    this.setupInfiniteScroll();
  }

  renderGridCardHtml(r) {
    const isFav = store.isFavorite(r.id);
    const icon = CATEGORY_ICONS[r.category] || '🍽️';

    return `
      <div data-recipe-id="${r.id}" class="recipe-card group bg-white rounded-3xl border border-stone-200/80 hover:border-brand-500/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between shadow-xs">
        <div class="relative w-full aspect-[4/3] bg-stone-100 overflow-hidden">
          <img src="${r.image}" alt="${escapeHtml(r.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onerror="this.onerror=null;this.src='images/placeholder.svg';">
          
          <!-- Favorite button -->
          <button type="button" data-fav-id="${r.id}" class="card-fav-btn absolute top-3 right-3 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-stone-400 backdrop-blur-md shadow-sm flex items-center justify-center transition-all cursor-pointer ${isFav ? 'text-red-500' : 'hover:text-red-500'}">
            <i class="fa-solid fa-heart ${isFav ? 'text-red-500' : ''}"></i>
          </button>

          <!-- Category pill on image -->
          <div class="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-xl text-[11px] font-bold text-stone-800 shadow-sm flex items-center gap-1.5">
            <span>${icon}</span>
            <span>${escapeHtml(r.category)}</span>
          </div>

          <!-- Time badge -->
          <div class="absolute bottom-3 right-3 bg-stone-900/80 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-extrabold text-white flex items-center gap-1">
            <i class="fa-regular fa-clock"></i>
            <span>${r.prep_time_minutes || 15} min</span>
          </div>
        </div>

        <div class="p-4 flex flex-col justify-between flex-1">
          <div>
            <h3 class="font-extrabold text-stone-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-brand-600 transition-colors" title="${escapeHtml(r.title)}">
              ${escapeHtml(r.title)}
            </h3>
          </div>

          <div class="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
            ${renderMacroPills(r.calories, r.protein, r.fat, r.carbs)}

            <button type="button" data-plan-id="${r.id}" title="Dodaj do dnia" class="card-plan-btn p-2 rounded-xl bg-stone-50 hover:bg-brand-50 hover:text-brand-700 text-stone-500 border border-stone-200 transition-colors cursor-pointer shrink-0">
              <i class="fa-regular fa-calendar-plus text-sm"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderCompactCardHtml(r) {
    const isFav = store.isFavorite(r.id);
    const icon = CATEGORY_ICONS[r.category] || '🍽️';

    return `
      <div data-recipe-id="${r.id}" class="recipe-card group bg-white rounded-2xl border border-stone-200/90 hover:border-brand-500 hover:shadow-md transition-all p-3 flex items-center justify-between gap-3 sm:gap-4 cursor-pointer">
        <div class="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-100 relative">
            <img src="${r.image}" alt="${escapeHtml(r.title)}" class="w-full h-full object-cover group-hover:scale-105 transition" loading="lazy" onerror="this.onerror=null;this.src='images/placeholder.svg';">
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[11px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                ${icon} ${escapeHtml(r.category)}
              </span>
              <span class="text-[11px] text-stone-400 font-semibold hidden sm:inline">⏱️ ${r.prep_time_minutes || 15} min</span>
            </div>
            <h3 class="font-extrabold text-stone-900 text-sm sm:text-base truncate group-hover:text-brand-600 transition" title="${escapeHtml(r.title)}">
              ${escapeHtml(r.title)}
            </h3>
            <div class="mt-1">
              ${renderMacroPills(r.calories, r.protein, r.fat, r.carbs)}
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button type="button" data-fav-id="${r.id}" class="card-fav-btn p-2 rounded-xl text-stone-400 hover:text-red-500 hover:bg-stone-50 transition cursor-pointer">
            <i class="fa-solid fa-heart ${isFav ? 'text-red-500' : ''}"></i>
          </button>
          <button type="button" data-plan-id="${r.id}" class="card-plan-btn py-2 px-3 rounded-xl bg-stone-50 hover:bg-brand-50 hover:text-brand-700 text-stone-700 font-bold text-xs border border-stone-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer">
            <i class="fa-regular fa-calendar-plus text-brand-600"></i>
            <span class="hidden sm:inline">Dodaj do dnia</span>
          </button>
        </div>
      </div>
    `;
  }

  renderLoadMoreHtml(hasMore) {
    if (!hasMore) return '';
    return `
      <div id="infinite-scroll-trigger" class="col-span-full py-8 flex flex-col items-center justify-center gap-2">
        <button type="button" id="load-more-btn" class="px-6 py-2.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 text-xs font-bold shadow-xs transition flex items-center gap-2 group cursor-pointer">
          <i class="fa-solid fa-arrow-down text-brand-600 group-hover:translate-y-0.5 transition-transform"></i>
          <span>Pokaż więcej dań (Wyświetlono ${Math.min(this.visibleCount, this.filteredRecipes.length)} z ${this.filteredRecipes.length})</span>
        </button>
      </div>
    `;
  }

  attachCardEventListeners() {
    const container = document.getElementById('recipes-grid');
    if (!container) return;

    // Card click -> Open Recipe Modal
    container.querySelectorAll('.recipe-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Prevent if clicked favorite or plan button
        if (e.target.closest('.card-fav-btn') || e.target.closest('.card-plan-btn')) return;
        const id = card.getAttribute('data-recipe-id');
        window.dispatchEvent(new CustomEvent('open_recipe_modal', { detail: { id: Number(id) } }));
      });
    });

    // Favorite click
    container.querySelectorAll('.card-fav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-fav-id');
        store.toggleFavorite(id);
      });
    });

    // Plan click (P0 Fix: 1-click modal assignment directly from card)
    container.querySelectorAll('.card-plan-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-plan-id');
        window.dispatchEvent(new CustomEvent('open_day_picker', { detail: { id: Number(id) } }));
      });
    });

    // Load more button click
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        this.visibleCount += 24;
        this.renderCards();
      });
    }
  }

  setupInfiniteScroll() {
    const trigger = document.getElementById('infinite-scroll-trigger');
    if (!trigger) return;

    if (this.observer) this.observer.disconnect();

    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (this.visibleCount < this.filteredRecipes.length) {
          this.visibleCount += 24;
          this.renderCards();
        }
      }
    }, { rootMargin: '300px' });

    this.observer.observe(trigger);
  }

  updateCardFavoriteState(id, isFav) {
    document.querySelectorAll(`[data-fav-id="${id}"] i`).forEach(icon => {
      icon.className = `fa-solid fa-heart ${isFav ? 'text-red-500' : ''}`;
    });
  }
}

export const catalog = new CatalogModule();

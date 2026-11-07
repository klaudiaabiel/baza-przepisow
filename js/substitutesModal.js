// Dietary Substitutes Cheat Sheet Modal (Wariant A - Pełna Ściąga Kliniczna)
import { SUBSTITUTE_GROUPS } from './utils/substitutes.js';
import { escapeHtml } from './utils/dom.js';

let activeGroupId = 'all';
let searchQuery = '';

export function initSubstitutesModal() {
  const modal = document.getElementById('modal-substitutes');
  const backdrop = document.getElementById('modal-substitutes-backdrop');
  const closeBtn = document.getElementById('close-substitutes-modal');
  const searchInput = document.getElementById('substitutes-search-input');
  const clearSearchBtn = document.getElementById('substitutes-search-clear');

  // Trigger buttons (in header, toolbar, recipe modal)
  document.querySelectorAll('.open-substitutes-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const gid = btn.getAttribute('data-group-id') || 'all';
      openSubstitutesModal(gid);
    });
  });

  const navBtn = document.getElementById('nav-substitutes-btn');
  if (navBtn) {
    navBtn.addEventListener('click', () => openSubstitutesModal('all'));
  }

  const modalRecipeBtn = document.getElementById('modal-open-substitutes-btn');
  if (modalRecipeBtn) {
    modalRecipeBtn.addEventListener('click', () => openSubstitutesModal('all'));
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeSubstitutesModal);
  }
  if (backdrop) {
    backdrop.addEventListener('click', closeSubstitutesModal);
  }

  // Keyboard shortcut Esc
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      closeSubstitutesModal();
    }
  });

  // Search input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      if (clearSearchBtn) {
        clearSearchBtn.classList.toggle('hidden', searchQuery.length === 0);
      }
      renderSubstitutesContent();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.classList.add('hidden');
      renderSubstitutesContent();
    });
  }
}

export function openSubstitutesModal(defaultGroupId = 'all') {
  const modal = document.getElementById('modal-substitutes');
  if (!modal) return;

  activeGroupId = defaultGroupId;
  const searchInput = document.getElementById('substitutes-search-input');
  if (searchInput) searchInput.value = '';
  searchQuery = '';

  renderSubstitutesTabs();
  renderSubstitutesContent();

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

export function closeSubstitutesModal() {
  const modal = document.getElementById('modal-substitutes');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

function renderSubstitutesTabs() {
  const container = document.getElementById('substitutes-category-tabs');
  if (!container) return;

  let html = `
    <button type="button" data-group="all" class="sub-tab-btn px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${activeGroupId === 'all' ? 'bg-amber-600 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'}">
      <span>✨ Wszystkie</span>
      <span class="text-[10px] opacity-80">(${SUBSTITUTE_GROUPS.length})</span>
    </button>
  `;

  SUBSTITUTE_GROUPS.forEach(g => {
    const isActive = activeGroupId === g.id;
    html += `
      <button type="button" data-group="${escapeHtml(g.id)}" class="sub-tab-btn px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${isActive ? 'bg-amber-600 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'}">
        <span>${g.icon} ${escapeHtml(g.name)}</span>
      </button>
    `;
  });

  container.innerHTML = html;

  container.querySelectorAll('.sub-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeGroupId = btn.getAttribute('data-group');
      renderSubstitutesTabs();
      renderSubstitutesContent();
    });
  });
}

function renderSubstitutesContent() {
  const container = document.getElementById('substitutes-content-grid');
  if (!container) return;

  let groupsToRender = SUBSTITUTE_GROUPS;

  if (activeGroupId !== 'all') {
    groupsToRender = groupsToRender.filter(g => g.id === activeGroupId);
  }

  // Filter items by search query if present
  let totalMatches = 0;
  const filteredGroups = [];

  groupsToRender.forEach(g => {
    let matchedItems = g.items;
    if (searchQuery) {
      matchedItems = g.items.filter(item => {
        const inName = item.name.toLowerCase().includes(searchQuery);
        const inMeasure = item.homeMeasure.toLowerCase().includes(searchQuery);
        const inKeywords = (item.keywords || []).some(k => k.includes(searchQuery));
        return inName || inMeasure || inKeywords;
      });
    }

    if (matchedItems.length > 0) {
      totalMatches += matchedItems.length;
      filteredGroups.push({
        ...g,
        items: matchedItems
      });
    }
  });

  if (filteredGroups.length === 0) {
    container.innerHTML = `
      <div class="py-12 text-center col-span-full">
        <div class="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3 text-xl">
          <i class="fa-solid fa-magnifying-glass"></i>
        </div>
        <h4 class="font-bold text-stone-800 text-sm">Nie znaleziono zamienników dla "${escapeHtml(searchQuery)}"</h4>
        <p class="text-xs text-stone-400 mt-1">Spróbuj wpisać inną nazwę produktu (np. banan, ryż, twaróg, łosoś, oliwa).</p>
      </div>
    `;
    return;
  }

  let html = '';

  filteredGroups.forEach(g => {
    html += `
      <div class="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden flex flex-col">
        <!-- Group Header -->
        <div class="p-4 bg-gradient-to-r from-amber-50/80 to-orange-50/40 border-b border-stone-200/70 flex items-start justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">${g.icon}</span>
            <div>
              <h4 class="font-extrabold text-stone-900 text-sm sm:text-base leading-tight">${escapeHtml(g.name)}</h4>
              <p class="text-[11px] text-amber-900/80 font-medium mt-0.5">${escapeHtml(g.description)}</p>
            </div>
          </div>
          <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-amber-100/80 text-amber-900 shrink-0">
            ${g.items.length} pozycji
          </span>
        </div>

        <!-- Items Table / Grid -->
        <div class="p-3 divide-y divide-stone-100">
          ${g.items.map(item => `
            <div class="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-stone-50/80 rounded-xl transition">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                <span class="font-bold text-xs sm:text-sm text-stone-800">${escapeHtml(item.name)}</span>
              </div>
              <div class="text-right shrink-0">
                <span class="font-black text-xs sm:text-sm text-stone-900 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200/60 inline-block">
                  ${escapeHtml(item.homeMeasure)}
                </span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Open Food Facts Search & Macro Calculator Modal for BiteCraft
import { searchOpenFoodFacts, calculateMacrosForWeight } from './utils/openFoodFacts.js';
import { escapeHtml, showToast } from './utils/dom.js';

let onSelectCallback = null;
let currentTargetWeightG = 100;
let debounceTimer = null;

export function initOffModal() {
  const modal = document.getElementById('modal-off-search');
  const backdrop = document.getElementById('modal-off-backdrop');
  const closeBtn = document.getElementById('close-off-modal');
  const searchInput = document.getElementById('off-search-input');
  const clearBtn = document.getElementById('off-search-clear');

  // Trigger buttons (in header, toolbar, creator)
  const navBtn = document.getElementById('nav-off-btn');
  if (navBtn) {
    navBtn.addEventListener('click', () => openOffSearchModal({ initialQuery: 'skyr' }));
  }

  if (closeBtn) closeBtn.addEventListener('click', closeOffModal);
  if (backdrop) backdrop.addEventListener('click', closeOffModal);

  // Keyboard shortcut Esc
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      closeOffModal();
    }
  });

  // Search input debounced
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if (clearBtn) clearBtn.classList.toggle('hidden', q.length === 0);

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        performSearch(q);
      }, 350);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      clearBtn.classList.add('hidden');
      performSearch('');
    });
  }

  // Quick suggestion chips
  document.querySelectorAll('.off-quick-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.getAttribute('data-query');
      if (searchInput) searchInput.value = q;
      if (clearBtn) clearBtn.classList.remove('hidden');
      performSearch(q);
    });
  });
}

/**
 * Opens the Open Food Facts modal
 * @param {object} options - { initialQuery: string, onSelect: function(product)|null, targetWeightG: number }
 */
export function openOffSearchModal(options = {}) {
  const modal = document.getElementById('modal-off-search');
  if (!modal) return;

  onSelectCallback = typeof options.onSelect === 'function' ? options.onSelect : null;
  currentTargetWeightG = options.targetWeightG || 100;

  const searchInput = document.getElementById('off-search-input');
  const clearBtn = document.getElementById('off-search-clear');
  const initialQ = (options.initialQuery || '').trim();

  if (searchInput) {
    searchInput.value = initialQ;
    if (clearBtn) clearBtn.classList.toggle('hidden', initialQ.length === 0);
  }

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  if (searchInput) {
    setTimeout(() => searchInput.focus(), 100);
  }

  performSearch(initialQ || 'skyr');
}

export function closeOffModal() {
  const modal = document.getElementById('modal-off-search');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
  onSelectCallback = null;
}

async function performSearch(query) {
  const resultsContainer = document.getElementById('off-results-container');
  const statusEl = document.getElementById('off-search-status');
  if (!resultsContainer) return;

  if (!query || !query.trim()) {
    resultsContainer.innerHTML = `
      <div class="py-12 text-center col-span-full">
        <div class="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-3 text-xl">
          <i class="fa-solid fa-barcode"></i>
        </div>
        <h4 class="font-extrabold text-stone-800 text-sm">Wyszukaj w bazie Open Food Facts Polska</h4>
        <p class="text-xs text-stone-400 mt-1 max-w-sm mx-auto">Wpisz nazwę produktu, składnika lub markę (np. Piątnica, Crownfield, Vitanella, Pilos).</p>
      </div>
    `;
    if (statusEl) statusEl.innerText = '';
    return;
  }

  resultsContainer.innerHTML = `
    <div class="py-12 text-center col-span-full">
      <div class="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs font-bold text-stone-600">Przeszukiwanie bazy Open Food Facts...</p>
    </div>
  `;

  try {
    const { products, source } = await searchOpenFoodFacts(query);

    if (statusEl) {
      if (source === 'openfoodfacts') {
        statusEl.innerHTML = `<span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"><i class="fa-solid fa-cloud-check"></i> Połączono na żywo: pl.openfoodfacts.org (${products.length})</span>`;
      } else if (source === 'cache') {
        statusEl.innerHTML = `<span class="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200"><i class="fa-solid fa-bolt"></i> Z pamięci podręcznej PWA (${products.length})</span>`;
      } else {
        statusEl.innerHTML = `<span class="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200"><i class="fa-solid fa-database"></i> Baza standardowa IŻŻ (${products.length})</span>`;
      }
    }

    if (!products || products.length === 0) {
      resultsContainer.innerHTML = `
        <div class="py-12 text-center col-span-full">
          <div class="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3 text-xl">
            <i class="fa-solid fa-circle-question"></i>
          </div>
          <h4 class="font-extrabold text-stone-800 text-sm">Nie znaleziono produktów dla "${escapeHtml(query)}"</h4>
          <p class="text-xs text-stone-400 mt-1 max-w-sm mx-auto">Spróbuj wpisać prostszą nazwę (np. twaróg, banan, pierś z kurczaka, płatki owsiane).</p>
        </div>
      `;
      return;
    }

    let html = '';
    products.forEach((p, idx) => {
      const nutriscoreBadge = getNutriscoreBadge(p.nutriscore);
      const isSelectMode = typeof onSelectCallback === 'function';

      html += `
        <div class="bg-white rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-md transition-all p-4 flex flex-col justify-between gap-3">
          
          <!-- Top row: Image & Name -->
          <div class="flex items-start gap-3">
            <div class="w-14 h-14 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
              ${p.image ? `
                <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" class="w-full h-full object-contain" loading="lazy">
              ` : `
                <i class="fa-solid fa-bowl-food text-stone-300 text-xl"></i>
              `}
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-1.5">
                ${nutriscoreBadge}
                <span class="text-[10px] text-stone-400 font-semibold truncate">${escapeHtml(p.sourceType || 'Open Food Facts')}</span>
              </div>
              <h4 class="font-extrabold text-stone-900 text-xs sm:text-sm leading-snug mt-1 line-clamp-2" title="${escapeHtml(p.name)}">
                ${escapeHtml(p.name)}
              </h4>
              ${p.brand ? `
                <p class="text-[11px] font-bold text-orange-700/90 truncate mt-0.5">
                  <i class="fa-solid fa-tag text-[9px]"></i> ${escapeHtml(p.brand)}
                </p>
              ` : ''}
            </div>
          </div>

          <!-- Macros per 100g -->
          <div class="bg-stone-50 rounded-xl p-2.5 border border-stone-100">
            <div class="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Wartości na 100g:</span>
              <span class="font-black text-stone-900 text-xs">${p.kcal_100g} kcal</span>
            </div>
            <div class="grid grid-cols-3 gap-1 text-center text-xs">
              <div class="bg-white py-1 px-1.5 rounded-lg border border-stone-200/60">
                <span class="text-[9px] text-amber-600 font-bold block">Białko</span>
                <span class="font-extrabold text-stone-900">${p.protein_100g}g</span>
              </div>
              <div class="bg-white py-1 px-1.5 rounded-lg border border-stone-200/60">
                <span class="text-[9px] text-emerald-600 font-bold block">Tłuszcze</span>
                <span class="font-extrabold text-stone-900">${p.fat_100g}g</span>
              </div>
              <div class="bg-white py-1 px-1.5 rounded-lg border border-stone-200/60">
                <span class="text-[9px] text-sky-600 font-bold block">Węgle</span>
                <span class="font-extrabold text-stone-900">${p.carbs_100g}g</span>
              </div>
            </div>
          </div>

          <!-- Bottom Actions -->
          <div class="flex items-center justify-between gap-2 pt-1">
            <a href="${escapeHtml(p.url)}" target="_blank" rel="noopener" class="text-[11px] font-bold text-stone-500 hover:text-orange-600 transition flex items-center gap-1" title="Zobacz produkt na pl.openfoodfacts.org">
              <span>pl.openfoodfacts.org</span> <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
            </a>

            ${isSelectMode ? `
              <button type="button" class="btn-select-off-product px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-2xs transition cursor-pointer flex items-center gap-1.5" data-idx="${idx}">
                <i class="fa-solid fa-check"></i> Wybierz
              </button>
            ` : `
              <button type="button" class="btn-copy-off-product px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-2xs transition cursor-pointer flex items-center gap-1.5" data-idx="${idx}">
                <i class="fa-regular fa-copy"></i> Kopiuj makro
              </button>
            `}
          </div>

        </div>
      `;
    });

    resultsContainer.innerHTML = html;

    // Bind selection / copy
    resultsContainer.querySelectorAll('.btn-select-off-product').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-idx'));
        const product = products[idx];
        if (product && typeof onSelectCallback === 'function') {
          onSelectCallback(product);
          showToast(`✓ Wybrano produkt: ${product.name}`);
          closeOffModal();
        }
      });
    });

    resultsContainer.querySelectorAll('.btn-copy-off-product').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-idx'));
        const p = products[idx];
        if (p) {
          const text = `${p.name} (${p.brand || 'Brak marki'}): ${p.kcal_100g} kcal | B: ${p.protein_100g}g | T: ${p.fat_100g}g | W: ${p.carbs_100g}g (na 100g)`;
          navigator.clipboard.writeText(text).then(() => {
            showToast('✓ Skopiowano wartości odżywcze do schowka!');
          });
        }
      });
    });

  } catch (err) {
    resultsContainer.innerHTML = `
      <div class="py-10 text-center col-span-full text-red-600">
        <i class="fa-solid fa-triangle-exclamation text-2xl mb-2"></i>
        <p class="font-bold text-xs">Błąd podczas wyszukiwania w Open Food Facts</p>
        <p class="text-[11px] text-stone-400 mt-1">${escapeHtml(err.message)}</p>
      </div>
    `;
  }
}

function getNutriscoreBadge(grade) {
  if (!grade) return '<span class="text-[10px] font-bold text-stone-400">Nutri-Score: —</span>';
  const g = grade.toLowerCase();
  const colors = {
    a: 'bg-emerald-600 text-white',
    b: 'bg-lime-600 text-white',
    c: 'bg-amber-500 text-white',
    d: 'bg-orange-600 text-white',
    e: 'bg-red-600 text-white'
  };
  const colorClass = colors[g] || 'bg-stone-500 text-white';

  return `
    <span class="inline-flex items-center gap-1 text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md ${colorClass}">
      Nutri-Score ${g.toUpperCase()}
    </span>
  `;
}

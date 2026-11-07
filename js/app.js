import { store } from './store.js';
import { auth } from './auth.js';
import { catalog } from './catalog.js';
import { planner } from './planner.js';
import { shopping } from './shopping.js';
import { modal } from './modal.js';
import { creator } from './creator.js';
import { initSubstitutesModal } from './substitutesModal.js';
import { showToast } from './utils/dom.js';

class Application {
  constructor() {
    this.activeTab = 'catalog';
  }

  async start() {
    // 1. Initialize central reactive store & auth
    await store.init();
    await auth.init();

    // 2. Initialize UI modules
    catalog.init();
    planner.init();
    shopping.init();
    modal.init();
    creator.init();
    initSubstitutesModal();

    // 3. Bind navigation & settings
    this.bindNavigation();
    this.bindSettings();

    // 4. Register PWA Service Worker
    this.registerServiceWorker();

    console.log('⚡ BiteCraft zainicjalizowany pomyślnie! Craft your week, bite by bite.');
  }

  bindNavigation() {
    const tabs = ['catalog', 'planner', 'shopping', 'settings', 'add'];

    // Desktop nav buttons
    tabs.forEach(t => {
      const deskBtn = document.getElementById(`nav-${t}`);
      const mobBtn = document.getElementById(`mob-${t}`);

      if (deskBtn) deskBtn.addEventListener('click', () => this.switchTab(t));
      if (mobBtn) mobBtn.addEventListener('click', () => this.switchTab(t));
    });

    // Logo Click (P0: Returns to catalog, resets filters, scrolls to top)
    const logoEl = document.getElementById('app-logo');
    if (logoEl) {
      logoEl.addEventListener('click', () => {
        this.switchTab('catalog');
        catalog.resetFilters();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Listen to custom switch tab event
    window.addEventListener('switch_tab', (e) => {
      if (e.detail && e.detail.tab) {
        this.switchTab(e.detail.tab);
      }
    });
  }

  switchTab(tab) {
    this.activeTab = tab;
    const tabs = ['catalog', 'planner', 'shopping', 'settings', 'add'];

    tabs.forEach(t => {
      const section = document.getElementById(`tab-${t}`);
      const deskBtn = document.getElementById(`nav-${t}`);
      const mobBtn = document.getElementById(`mob-${t}`);

      if (section) {
        section.classList.toggle('hidden', t !== tab);
      }

      if (deskBtn) {
        if (t === tab) {
          deskBtn.className = 'nav-btn px-4 py-2 rounded-xl text-sm font-extrabold transition-all text-brand-700 bg-brand-50 shadow-xs cursor-pointer';
        } else {
          deskBtn.className = 'nav-btn px-4 py-2 rounded-xl text-sm font-semibold transition-all text-stone-600 hover:text-stone-900 hover:bg-stone-100 cursor-pointer';
        }
      }

      if (mobBtn) {
        if (t === tab) {
          mobBtn.className = 'mob-btn flex flex-col items-center py-1 px-3 text-brand-600 font-extrabold cursor-pointer';
        } else {
          mobBtn.className = 'mob-btn flex flex-col items-center py-1 px-3 text-stone-400 hover:text-stone-600 font-medium cursor-pointer';
        }
      }
    });

    // Special tab lifecycle triggers
    if (tab === 'planner') {
      planner.renderBoard();
    } else if (tab === 'shopping') {
      shopping.renderList();
    } else if (tab === 'settings') {
      this.renderSettingsUI();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  bindSettings() {
    const container = document.getElementById('settings-meal-options');
    if (!container) return;

    this.renderSettingsUI();
  }

  renderSettingsUI() {
    const container = document.getElementById('settings-meal-options');
    if (!container) return;

    const currentCount = store.getSetting('dailyMealCount', 4);
    const options = [
      { count: 3, label: '3 posiłki', desc: 'Śniadanie • Obiad • Kolacja' },
      { count: 4, label: '4 posiłki (Domyślnie)', desc: 'Śniadanie • II Śniadanie • Obiad • Kolacja' },
      { count: 5, label: '5 posiłków', desc: 'Śniadanie • II Śniadanie • Obiad • Podwieczorek • Kolacja' },
      { count: 6, label: '6 posiłków', desc: 'Śniadanie • II Śniadanie • Obiad • Podwieczorek • Kolacja • Przekąska' }
    ];

    container.innerHTML = options.map(opt => {
      const active = opt.count === currentCount;
      return `
        <label class="meal-option-card flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${active ? 'border-brand-500 bg-brand-50/50 shadow-sm ring-1 ring-brand-500' : 'border-stone-200 bg-white hover:bg-stone-50'}">
          <div class="flex items-center gap-3">
            <input type="radio" name="dailyMealCount" value="${opt.count}" ${active ? 'checked' : ''} class="w-4 h-4 text-brand-600 accent-brand-600 cursor-pointer">
            <div>
              <span class="font-extrabold text-sm text-stone-900 block">${opt.label}</span>
              <span class="text-xs text-stone-500 font-medium">${opt.desc}</span>
            </div>
          </div>
          ${active ? '<i class="fa-solid fa-circle-check text-brand-600 text-lg"></i>' : ''}
        </label>
      `;
    }).join('');

    container.querySelectorAll('input[name="dailyMealCount"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const val = parseInt(e.target.value, 10);
        store.setSetting('dailyMealCount', val);
        showToast(`✓ Ustawiono ${val} posiłki dziennie.`);
        this.renderSettingsUI();
      });
    });
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(reg => {
          console.log('[PWA] Service Worker zarejestrowany pomyślnie:', reg.scope);
          // Force immediate check for updates on each load
          reg.update();
        }).catch(err => {
          console.warn('[PWA] Błąd rejestracji Service Workera:', err);
        });
      });
    }
  }
}

// Bootstrap on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new Application();
  app.start();
});

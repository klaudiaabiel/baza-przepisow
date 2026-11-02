import { store } from './store.js';
import { CATEGORIES_11 } from './catalog.js';
import { escapeHtml, showToast } from './utils/dom.js';

export const CREATOR_PIN = '0000';

class CreatorModule {
  constructor() {
    this.isUnlocked = localStorage.getItem('creator_mode_active') === 'true';
  }

  init() {
    this.bindEvents();
    this.updateUI();
    this.renderCategorySelect();
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

    const ingsRaw = document.getElementById('new-recipe-ingredients').value.split('\n').filter(l => l.trim());
    const ingredients = ingsRaw.map(line => {
      let name = line.trim();
      let amount = '';
      let weightG = 0;

      if (line.includes('–')) {
        const parts = line.split('–');
        name = parts[0].trim();
        amount = parts[1].trim();
      } else if (line.includes('-')) {
        const parts = line.split('-');
        name = parts[0].trim();
        amount = parts[1].trim();
      }

      const matchG = amount.match(/(\d+)\s*g/i);
      if (matchG) weightG = parseFloat(matchG[1]);

      return {
        name: name,
        amount: amount,
        weight_g: weightG,
        department: 'Inne'
      };
    });

    const stepsRaw = document.getElementById('new-recipe-instructions').value.split('\n').filter(l => l.trim());
    const instructions = stepsRaw.map(s => s.replace(/^\d+[\.\)]\s*/, '').trim());

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
      tags: ['Własne']
    };

    // P0 Fix: Persists into IndexedDB! Never lost on F5!
    await store.addCustomRecipe(recipe);

    document.getElementById('add-recipe-form').reset();
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

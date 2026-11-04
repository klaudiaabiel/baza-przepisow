// Central Reactive Store with IndexedDB Persistence
// Handles async storage, reactive events, and zero-data-loss migration

const DB_NAME = 'BazaPrzepisowDB';
const DB_VERSION = 1;

class AppStore extends EventTarget {
  constructor() {
    super();
    this.db = null;
    this.recipes = [];
    this.favorites = new Set();
    this.deletedRecipeIds = new Set();
    this.mealPlan = [];
    this.shoppingList = [];
    this.settings = {
      dailyMealCount: 4,
      cardView: 'grid'
    };
    this.isReady = false;
  }

  async init() {
    this.db = await this.openDatabase();
    await this.runMigrationFromLocalStorage();
    await this.loadLocalState();
    await this.fetchRecipes();
    this.isReady = true;
    this.emit('ready', { recipesCount: this.recipes.length });
  }

  openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('recipes')) {
          db.createObjectStore('recipes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('meal_plan')) {
          const planStore = db.createObjectStore('meal_plan', { keyPath: 'id' });
          planStore.createIndex('date_key', 'date_key', { unique: false });
        }
        if (!db.objectStoreNames.contains('shopping_list')) {
          db.createObjectStore('shopping_list', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('favorites')) {
          db.createObjectStore('favorites', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('deleted_recipes')) {
          db.createObjectStore('deleted_recipes', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async runMigrationFromLocalStorage() {
    try {
      // 1. Migrate favorites
      const legacyFavs = localStorage.getItem('baza_favs');
      if (legacyFavs) {
        const favIds = JSON.parse(legacyFavs);
        for (const id of favIds) {
          await this.idbPut('favorites', { id: Number(id) });
        }
      }

      // 2. Migrate deleted recipes
      const legacyDeleted = localStorage.getItem('deleted_recipe_ids');
      if (legacyDeleted) {
        const delIds = JSON.parse(legacyDeleted);
        for (const id of delIds) {
          await this.idbPut('deleted_recipes', { id: Number(id) });
        }
      }

      // 3. Migrate meal plan
      const legacyPlan = localStorage.getItem('baza_mealplan');
      if (legacyPlan) {
        const entries = JSON.parse(legacyPlan);
        for (const item of entries) {
          await this.idbPut('meal_plan', {
            id: item.id || (Date.now() + Math.random()),
            date_key: item.date_key || new Date().toISOString().split('T')[0],
            slot_index: typeof item.slot_index === 'number' ? item.slot_index : 0,
            recipe_id: Number(item.recipe_id),
            portions: item.portions || 1
          });
        }
      }

      // 4. Migrate shopping list
      const legacyShopping = localStorage.getItem('baza_shopping');
      if (legacyShopping) {
        const items = JSON.parse(legacyShopping);
        for (const it of items) {
          await this.idbPut('shopping_list', {
            id: it.id || (Date.now() + Math.random()),
            name: it.name,
            amount: it.amount || '',
            department: it.department || 'Inne',
            recipe_title: it.recipe_title || '',
            checked: !!it.checked,
            is_manual: it.is_manual !== false
          });
        }
      }

      // 5. Migrate settings
      const legacyMealCount = localStorage.getItem('daily_meal_count');
      if (legacyMealCount) {
        await this.idbPut('settings', { key: 'dailyMealCount', value: parseInt(legacyMealCount, 10) });
      }
    } catch (e) {
      console.warn('[Store] Migration from localStorage skipped or already done:', e);
    }
  }

  async loadLocalState() {
    // Favorites
    const favRows = await this.idbGetAll('favorites');
    this.favorites = new Set(favRows.map(r => r.id));

    // Deleted recipes
    const delRows = await this.idbGetAll('deleted_recipes');
    this.deletedRecipeIds = new Set(delRows.map(r => r.id));

    // Meal Plan
    this.mealPlan = await this.idbGetAll('meal_plan');

    // Shopping List
    this.shoppingList = await this.idbGetAll('shopping_list');

    // Settings
    const countSetting = await this.idbGet('settings', 'dailyMealCount');
    if (countSetting) this.settings.dailyMealCount = countSetting.value;

    const viewSetting = await this.idbGet('settings', 'cardView');
    if (viewSetting) this.settings.cardView = viewSetting.value;
  }

  async fetchRecipes() {
    // 1. Try local cache from IndexedDB
    const cached = await this.idbGetAll('recipes');
    if (cached && cached.length > 0) {
      this.recipes = cached.filter(r => !this.deletedRecipeIds.has(r.id));
      this.syncRecipeFavorites();
    }

    // 2. Fetch fresh recipes.json in background or if no cache
    try {
      const res = await fetch('recipes.json');
      if (res.ok) {
        const fresh = await res.json();
        // Update IndexedDB store
        for (const r of fresh) {
          await this.idbPut('recipes', r);
        }
        this.recipes = fresh.filter(r => !this.deletedRecipeIds.has(r.id));
        this.syncRecipeFavorites();
        this.emit('recipes_updated', { count: this.recipes.length });
      }
    } catch (err) {
      console.warn('[Store] Network fetch failed, relying on offline cache:', err);
    }
  }

  syncRecipeFavorites() {
    this.recipes.forEach(r => {
      r.is_favorite = this.favorites.has(r.id);
    });
  }

  // --- IndexedDB Core Helpers ---
  idbPut(storeName, value) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  idbGet(storeName, key) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  idbGetAll(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  idbDelete(storeName, key) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  idbClear(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  emit(eventName, detail = {}) {
    this.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  // --- Public Store Operations ---
  getRecipes() {
    return this.recipes;
  }

  getRecipeById(id) {
    return this.recipes.find(r => Number(r.id) === Number(id)) || null;
  }

  async toggleFavorite(recipeId) {
    const id = Number(recipeId);
    if (this.favorites.has(id)) {
      this.favorites.delete(id);
      await this.idbDelete('favorites', id);
    } else {
      this.favorites.add(id);
      await this.idbPut('favorites', { id });
    }
    this.syncRecipeFavorites();
    this.emit('favorites_changed', { id, isFavorite: this.favorites.has(id) });
  }

  isFavorite(recipeId) {
    return this.favorites.has(Number(recipeId));
  }

  // --- Meal Plan Operations (Strict Slots 0..5) ---
  getMealPlan() {
    return this.mealPlan;
  }

  getMealPlanEntry(id) {
    return this.mealPlan.find(m => m.id === id || String(m.id) === String(id)) || null;
  }

  async addMealPlanEntry(dateKey, slotIndex, recipeId, portions = 1, substitutions = {}) {
    const entry = {
      id: Date.now() + Math.random(),
      date_key: dateKey,
      slot_index: Number(slotIndex),
      recipe_id: Number(recipeId),
      portions: Number(portions) || 1,
      substitutions: substitutions ? JSON.parse(JSON.stringify(substitutions)) : {}
    };
    await this.idbPut('meal_plan', entry);
    this.mealPlan.push(entry);
    this.emit('mealplan_changed', { action: 'add', entry });
    return entry;
  }

  async removeMealPlanEntry(id) {
    await this.idbDelete('meal_plan', id);
    this.mealPlan = this.mealPlan.filter(m => m.id !== id && String(m.id) !== String(id));
    this.emit('mealplan_changed', { action: 'remove', id });
  }

  async updateMealPlanSubstitution(mealPlanId, originalName, replacementData) {
    const entry = this.getMealPlanEntry(mealPlanId);
    if (!entry) return false;

    if (!entry.substitutions) entry.substitutions = {};
    const key = (originalName || '').toLowerCase().trim();
    entry.substitutions[key] = replacementData;

    await this.idbPut('meal_plan', entry);
    this.emit('mealplan_changed', { action: 'substitute', entry, originalName, replacementData });
    return true;
  }

  async removeMealPlanSubstitution(mealPlanId, originalName) {
    const entry = this.getMealPlanEntry(mealPlanId);
    if (!entry || !entry.substitutions) return false;

    const key = (originalName || '').toLowerCase().trim();
    delete entry.substitutions[key];

    await this.idbPut('meal_plan', entry);
    this.emit('mealplan_changed', { action: 'substitute_restore', entry, originalName });
    return true;
  }

  async cloneDayMealPlan(fromDateKey, toDateKey) {
    const sourceMeals = this.mealPlan.filter(m => m.date_key === fromDateKey);
    if (sourceMeals.length === 0) return 0;

    // Clear destination date first
    const existingDest = this.mealPlan.filter(m => m.date_key === toDateKey);
    for (const em of existingDest) {
      await this.idbDelete('meal_plan', em.id);
    }
    this.mealPlan = this.mealPlan.filter(m => m.date_key !== toDateKey);

    // Insert cloned meals
    const cloned = [];
    for (const m of sourceMeals) {
      const entry = {
        id: Date.now() + Math.random(),
        date_key: toDateKey,
        slot_index: m.slot_index,
        recipe_id: m.recipe_id,
        portions: m.portions,
        substitutions: m.substitutions ? JSON.parse(JSON.stringify(m.substitutions)) : {}
      };
      await this.idbPut('meal_plan', entry);
      this.mealPlan.push(entry);
      cloned.push(entry);
    }

    this.emit('mealplan_changed', { action: 'clone', count: cloned.length });
    return cloned.length;
  }

  // --- Shopping List Operations (Safe / Non-destructive) ---
  getShoppingList() {
    return this.shoppingList;
  }

  async addShoppingItem(item) {
    const entry = {
      id: item.id || (Date.now() + Math.random()),
      name: item.name,
      amount: item.amount || '',
      department: item.department || 'Inne',
      recipe_title: item.recipe_title || '',
      checked: false,
      is_manual: item.is_manual !== false
    };
    await this.idbPut('shopping_list', entry);
    this.shoppingList.push(entry);
    this.emit('shopping_changed', { action: 'add', entry });
    return entry;
  }

  async toggleShoppingItem(id) {
    const it = this.shoppingList.find(x => x.id === id);
    if (it) {
      it.checked = !it.checked;
      await this.idbPut('shopping_list', it);
      this.emit('shopping_changed', { action: 'toggle', item: it });
    }
  }

  async deleteShoppingItem(id) {
    await this.idbDelete('shopping_list', id);
    this.shoppingList = this.shoppingList.filter(x => x.id !== id);
    this.emit('shopping_changed', { action: 'delete', id });
  }

  async clearShoppingList(onlyChecked = false) {
    if (onlyChecked) {
      const toDelete = this.shoppingList.filter(x => x.checked);
      for (const it of toDelete) {
        await this.idbDelete('shopping_list', it.id);
      }
      this.shoppingList = this.shoppingList.filter(x => !x.checked);
    } else {
      await this.idbClear('shopping_list');
      this.shoppingList = [];
    }
    this.emit('shopping_changed', { action: 'clear' });
  }

  async setShoppingList(newList) {
    await this.idbClear('shopping_list');
    for (const it of newList) {
      await this.idbPut('shopping_list', it);
    }
    this.shoppingList = newList;
    this.emit('shopping_changed', { action: 'bulk_update' });
  }

  // --- Creator & Admin Operations ---
  async deleteRecipePermanently(id) {
    const numId = Number(id);
    this.deletedRecipeIds.add(numId);
    await this.idbPut('deleted_recipes', { id: numId });
    await this.idbDelete('recipes', numId);
    this.recipes = this.recipes.filter(r => r.id !== numId);

    // Clean from meal plan
    const affectedPlans = this.mealPlan.filter(m => m.recipe_id === numId);
    for (const m of affectedPlans) {
      await this.removeMealPlanEntry(m.id);
    }

    this.emit('recipe_deleted', { id: numId });
  }

  async addCustomRecipe(recipe) {
    const numId = Date.now();
    const entry = {
      ...recipe,
      id: numId,
      image: recipe.image || 'images/placeholder.svg'
    };
    await this.idbPut('recipes', entry);
    this.recipes.unshift(entry);
    this.emit('recipe_added', { recipe: entry });
    return entry;
  }

  // --- Settings ---
  async setSetting(key, value) {
    this.settings[key] = value;
    await this.idbPut('settings', { key, value });
    this.emit('setting_changed', { key, value });
  }

  getSetting(key, defaultValue) {
    return this.settings[key] !== undefined ? this.settings[key] : defaultValue;
  }
}

export const store = new AppStore();

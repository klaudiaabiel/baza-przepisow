// Central Reactive Store with IndexedDB Persistence & Supabase Cloud Sync
// Handles local-first async storage, reactive events, and cross-device sync

import { supabase } from './supabaseClient.js';

const DB_NAME = 'BazaPrzepisowDB';
const DB_VERSION = 1;

export async function compressImageToWebP(file, maxDimension = 1000, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
        }, 'image/webp', quality);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

class AppStore extends EventTarget {
  constructor() {
    super();
    this.db = null;
    this.baseRecipes = [];
    this.cloudRecipes = [];
    this.recipes = [];
    this.favorites = new Set();
    this.deletedRecipeIds = new Set();
    this.mealPlan = [];
    this.shoppingList = [];
    this.settings = {
      dailyMealCount: 4,
      cardView: 'grid'
    };
    this.currentUser = null;
    this.isReady = false;
  }

  async init() {
    this.db = await this.openDatabase();
    await this.runMigrationFromLocalStorage();
    await this.loadLocalState();
    await this.fetchRecipes();
    await this.fetchCloudRecipes();
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
      const legacyFavs = localStorage.getItem('baza_favs');
      if (legacyFavs) {
        const favIds = JSON.parse(legacyFavs);
        for (const id of favIds) {
          await this.idbPut('favorites', { id: String(id) });
        }
      }

      const legacyDeleted = localStorage.getItem('deleted_recipe_ids');
      if (legacyDeleted) {
        const delIds = JSON.parse(legacyDeleted);
        for (const id of delIds) {
          await this.idbPut('deleted_recipes', { id: String(id) });
        }
      }

      // Legacy meal plan cleanup: do NOT auto-inject old test meals.
      // Remove stale localStorage key so ghost meals never reappear.
      localStorage.removeItem('baza_mealplan');

      const legacyShopping = localStorage.getItem('baza_shopping');
      if (legacyShopping) {
        const items = JSON.parse(legacyShopping);
        for (const it of items) {
          await this.idbPut('shopping_list', {
            id: String(it.id || (Date.now() + Math.random())),
            name: it.name,
            amount: it.amount || '',
            department: it.department || 'Inne',
            recipe_title: it.recipe_title || '',
            checked: !!it.checked,
            is_manual: it.is_manual !== false
          });
        }
      }

      const legacyMealCount = localStorage.getItem('daily_meal_count');
      if (legacyMealCount) {
        await this.idbPut('settings', { key: 'dailyMealCount', value: parseInt(legacyMealCount, 10) });
      }
    } catch (e) {
      console.warn('[Store] Migracja z localStorage pominięta:', e);
    }
  }

  async loadLocalState() {
    const favRows = await this.idbGetAll('favorites');
    this.favorites = new Set(favRows.map(r => String(r.id)));

    const delRows = await this.idbGetAll('deleted_recipes');
    this.deletedRecipeIds = new Set(delRows.map(r => String(r.id)));

    // One-time purge of legacy/stale ghost meal plans
    if (!localStorage.getItem('baza_clean_plan_init')) {
      await this.idbClear('meal_plan');
      localStorage.setItem('baza_clean_plan_init', '1');
    }

    this.mealPlan = await this.idbGetAll('meal_plan');
    this.shoppingList = await this.idbGetAll('shopping_list');

    const countSetting = await this.idbGet('settings', 'dailyMealCount');
    if (countSetting) this.settings.dailyMealCount = countSetting.value;

    const viewSetting = await this.idbGet('settings', 'cardView');
    if (viewSetting) this.settings.cardView = viewSetting.value;
  }

  async fetchRecipes() {
    // 1. Load cached base recipes
    const cached = await this.idbGetAll('recipes');
    if (cached && cached.length > 0) {
      this.baseRecipes = cached;
      this.mergeRecipes();
    }

    // 2. Fetch fresh static recipes.json
    try {
      const res = await fetch('recipes.json');
      if (res.ok) {
        const fresh = await res.json();
        for (const r of fresh) {
          await this.idbPut('recipes', r);
        }
        this.baseRecipes = fresh;
        this.mergeRecipes();
      }
    } catch (err) {
      console.warn('[Store] Pobieranie recipes.json z sieci nie powiodło się, używam cache:', err);
    }
  }

  async fetchCloudRecipes() {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[Store] Błąd pobierania przepisów z Supabase:', error);
        return;
      }

      if (data) {
        for (const r of data) {
          await this.idbPut('recipes', r);
        }
        this.cloudRecipes = data;
        this.mergeRecipes();
      }
    } catch (e) {
      console.warn('[Store] Supabase offline:', e);
    }
  }

  mergeRecipes() {
    const map = new Map();
    // Base 229 recipes
    for (const r of this.baseRecipes) {
      const idStr = String(r.id);
      if (!this.deletedRecipeIds.has(idStr)) {
        map.set(idStr, r);
      }
    }
    // Cloud recipes (community + user's private)
    for (const r of this.cloudRecipes) {
      const idStr = String(r.id);
      if (!this.deletedRecipeIds.has(idStr)) {
        map.set(idStr, r);
      }
    }
    this.recipes = Array.from(map.values());
    this.syncRecipeFavorites();
    this.emit('recipes_updated', { count: this.recipes.length });
  }

  syncRecipeFavorites() {
    this.recipes.forEach(r => {
      r.is_favorite = this.favorites.has(String(r.id));
    });
  }

  // --- Auth & Cross-Device Cloud Sync ---
  async onAuthChange(user) {
    this.currentUser = user;
    this.emit('auth_changed', { user });
    if (user) {
      await this.syncWithCloud();
    }
    await this.fetchCloudRecipes();
  }

  async syncWithCloud() {
    if (!supabase || !this.currentUser) return;

    try {
      // 1. Sync Favorites
      const { data: cloudFavs } = await supabase
        .from('favorites')
        .select('recipe_id')
        .eq('user_id', this.currentUser.id);

      if (cloudFavs) {
        for (const cf of cloudFavs) {
          this.favorites.add(String(cf.recipe_id));
          await this.idbPut('favorites', { id: String(cf.recipe_id) });
        }
        // Push local favorites to cloud
        for (const fid of this.favorites) {
          await supabase.from('favorites').upsert({
            user_id: this.currentUser.id,
            recipe_id: String(fid)
          });
        }
        this.syncRecipeFavorites();
        this.emit('favorites_changed', { isSync: true });
      }

      // 2. Sync Meal Plan
      const { data: cloudPlan } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', this.currentUser.id);

      if (cloudPlan) {
        const cloudMap = new Map(cloudPlan.map(p => [String(p.id), p]));
        const localPlan = await this.idbGetAll('meal_plan');

        // Push local items to cloud
        for (const lp of localPlan) {
          const lpId = String(lp.id);
          if (!cloudMap.has(lpId)) {
            await supabase.from('meal_plans').upsert({
              id: lpId,
              user_id: this.currentUser.id,
              date_key: lp.date_key,
              slot_index: lp.slot_index,
              recipe_id: String(lp.recipe_id),
              portions: lp.portions || 1,
              substitutions: lp.substitutions || {}
            });
          }
        }

        // Save merged to local IDB
        for (const cp of cloudPlan) {
          await this.idbPut('meal_plan', cp);
        }
        this.mealPlan = await this.idbGetAll('meal_plan');
        this.emit('mealplan_changed', { action: 'cloud_sync' });
      }

      // 3. Sync Shopping List
      const { data: cloudShop } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('user_id', this.currentUser.id);

      if (cloudShop) {
        const cloudMap = new Map(cloudShop.map(s => [String(s.id), s]));
        const localShop = await this.idbGetAll('shopping_list');

        for (const ls of localShop) {
          const lsId = String(ls.id);
          if (!cloudMap.has(lsId)) {
            await supabase.from('shopping_items').upsert({
              id: lsId,
              user_id: this.currentUser.id,
              name: ls.name,
              amount: ls.amount || '',
              department: ls.department || 'Inne',
              recipe_title: ls.recipe_title || '',
              checked: !!ls.checked,
              is_manual: ls.is_manual !== false
            });
          }
        }

        for (const cs of cloudShop) {
          await this.idbPut('shopping_list', cs);
        }
        this.shoppingList = await this.idbGetAll('shopping_list');
        this.emit('shopping_changed', { action: 'cloud_sync' });
      }

    } catch (err) {
      console.warn('[Store] Błąd synchronizacji z chmurą:', err);
    }
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
    return this.recipes.find(r => String(r.id) === String(id)) || null;
  }

  async toggleFavorite(recipeId) {
    const id = String(recipeId);
    if (this.favorites.has(id)) {
      this.favorites.delete(id);
      await this.idbDelete('favorites', id);
      if (supabase && this.currentUser) {
        supabase.from('favorites').delete().match({ user_id: this.currentUser.id, recipe_id: id }).catch(e => console.warn(e));
      }
    } else {
      this.favorites.add(id);
      await this.idbPut('favorites', { id });
      if (supabase && this.currentUser) {
        supabase.from('favorites').upsert({ user_id: this.currentUser.id, recipe_id: id }).catch(e => console.warn(e));
      }
    }
    this.syncRecipeFavorites();
    this.emit('favorites_changed', { id, isFavorite: this.favorites.has(id) });
  }

  isFavorite(recipeId) {
    return this.favorites.has(String(recipeId));
  }

  // --- Meal Plan Operations ---
  getMealPlan() {
    return this.mealPlan;
  }

  getMealPlanEntry(id) {
    return this.mealPlan.find(m => String(m.id) === String(id)) || null;
  }

  async addMealPlanEntry(dateKey, slotIndex, recipeId, portions = 1, substitutions = {}) {
    const entry = {
      id: String(Date.now() + Math.random()),
      date_key: dateKey,
      slot_index: Number(slotIndex),
      recipe_id: String(recipeId),
      portions: Number(portions) || 1,
      substitutions: substitutions ? JSON.parse(JSON.stringify(substitutions)) : {}
    };
    await this.idbPut('meal_plan', entry);
    this.mealPlan.push(entry);
    this.emit('mealplan_changed', { action: 'add', entry });

    if (supabase && this.currentUser) {
      supabase.from('meal_plans').upsert({
        id: entry.id,
        user_id: this.currentUser.id,
        date_key: entry.date_key,
        slot_index: entry.slot_index,
        recipe_id: entry.recipe_id,
        portions: entry.portions,
        substitutions: entry.substitutions
      }).catch(e => console.warn('[Store] Błąd zapisu jadłospisu w chmurze:', e));
    }
    return entry;
  }

  async removeMealPlanEntry(id) {
    const strId = String(id);
    await this.idbDelete('meal_plan', strId);
    this.mealPlan = this.mealPlan.filter(m => String(m.id) !== strId);
    this.emit('mealplan_changed', { action: 'remove', id: strId });

    if (supabase && this.currentUser) {
      supabase.from('meal_plans').delete().eq('id', strId).catch(e => console.warn(e));
    }
  }

  async clearAllMealPlan() {
    await this.idbClear('meal_plan');
    if (supabase && this.currentUser) {
      await supabase.from('meal_plans').delete().eq('user_id', this.currentUser.id).catch(e => console.warn(e));
    }
    this.mealPlan = [];
    this.emit('mealplan_changed', { action: 'clear_all' });
  }

  async clearWeekMealPlan(dateKeys) {
    if (!Array.isArray(dateKeys) || dateKeys.length === 0) return;
    const keysSet = new Set(dateKeys);
    const toDelete = this.mealPlan.filter(m => keysSet.has(m.date_key));
    for (const m of toDelete) {
      await this.idbDelete('meal_plan', String(m.id));
      if (supabase && this.currentUser) {
        supabase.from('meal_plans').delete().eq('id', String(m.id)).catch(e => console.warn(e));
      }
    }
    this.mealPlan = this.mealPlan.filter(m => !keysSet.has(m.date_key));
    this.emit('mealplan_changed', { action: 'clear_week' });
  }

  async updateMealPlanSubstitution(mealPlanId, originalName, replacementData) {
    const entry = this.getMealPlanEntry(mealPlanId);
    if (!entry) return false;

    if (!entry.substitutions) entry.substitutions = {};
    const key = (originalName || '').toLowerCase().trim();
    entry.substitutions[key] = replacementData;

    await this.idbPut('meal_plan', entry);
    this.emit('mealplan_changed', { action: 'substitute', entry, originalName, replacementData });

    if (supabase && this.currentUser) {
      supabase.from('meal_plans').update({ substitutions: entry.substitutions }).eq('id', String(entry.id)).catch(e => console.warn(e));
    }
    return true;
  }

  async removeMealPlanSubstitution(mealPlanId, originalName) {
    const entry = this.getMealPlanEntry(mealPlanId);
    if (!entry || !entry.substitutions) return false;

    const key = (originalName || '').toLowerCase().trim();
    delete entry.substitutions[key];

    await this.idbPut('meal_plan', entry);
    this.emit('mealplan_changed', { action: 'substitute_restore', entry, originalName });

    if (supabase && this.currentUser) {
      supabase.from('meal_plans').update({ substitutions: entry.substitutions }).eq('id', String(entry.id)).catch(e => console.warn(e));
    }
    return true;
  }

  async cloneDayMealPlan(fromDateKey, toDateKey) {
    const sourceMeals = this.mealPlan.filter(m => m.date_key === fromDateKey);
    if (sourceMeals.length === 0) return 0;

    const existingDest = this.mealPlan.filter(m => m.date_key === toDateKey);
    for (const em of existingDest) {
      await this.removeMealPlanEntry(em.id);
    }

    const cloned = [];
    for (const m of sourceMeals) {
      const entry = await this.addMealPlanEntry(
        toDateKey,
        m.slot_index,
        m.recipe_id,
        m.portions,
        m.substitutions
      );
      cloned.push(entry);
    }

    this.emit('mealplan_changed', { action: 'clone', count: cloned.length });
    return cloned.length;
  }

  // --- Shopping List Operations ---
  getShoppingList() {
    return this.shoppingList;
  }

  async addShoppingItem(item) {
    const entry = {
      id: String(item.id || (Date.now() + Math.random())),
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

    if (supabase && this.currentUser) {
      supabase.from('shopping_items').upsert({
        id: entry.id,
        user_id: this.currentUser.id,
        name: entry.name,
        amount: entry.amount,
        department: entry.department,
        recipe_title: entry.recipe_title,
        checked: entry.checked,
        is_manual: entry.is_manual
      }).catch(e => console.warn(e));
    }
    return entry;
  }

  async toggleShoppingItem(id) {
    const it = this.shoppingList.find(x => String(x.id) === String(id));
    if (it) {
      it.checked = !it.checked;
      await this.idbPut('shopping_list', it);
      this.emit('shopping_changed', { action: 'toggle', item: it });

      if (supabase && this.currentUser) {
        supabase.from('shopping_items').update({ checked: it.checked }).eq('id', String(it.id)).catch(e => console.warn(e));
      }
    }
  }

  async deleteShoppingItem(id) {
    const strId = String(id);
    await this.idbDelete('shopping_list', strId);
    this.shoppingList = this.shoppingList.filter(x => String(x.id) !== strId);
    this.emit('shopping_changed', { action: 'delete', id: strId });

    if (supabase && this.currentUser) {
      supabase.from('shopping_items').delete().eq('id', strId).catch(e => console.warn(e));
    }
  }

  async clearShoppingList(onlyChecked = false) {
    if (onlyChecked) {
      const toDelete = this.shoppingList.filter(x => x.checked);
      for (const it of toDelete) {
        await this.deleteShoppingItem(it.id);
      }
    } else {
      for (const it of this.shoppingList) {
        if (supabase && this.currentUser) {
          supabase.from('shopping_items').delete().eq('id', String(it.id)).catch(e => console.warn(e));
        }
      }
      await this.idbClear('shopping_list');
      this.shoppingList = [];
      this.emit('shopping_changed', { action: 'clear' });
    }
  }

  async setShoppingList(newList) {
    await this.idbClear('shopping_list');
    for (const it of newList) {
      it.id = String(it.id || (Date.now() + Math.random()));
      await this.idbPut('shopping_list', it);
      if (supabase && this.currentUser) {
        supabase.from('shopping_items').upsert({
          id: it.id,
          user_id: this.currentUser.id,
          name: it.name,
          amount: it.amount || '',
          department: it.department || 'Inne',
          recipe_title: it.recipe_title || '',
          checked: !!it.checked,
          is_manual: it.is_manual !== false
        }).catch(e => console.warn(e));
      }
    }
    this.shoppingList = newList;
    this.emit('shopping_changed', { action: 'bulk_update' });
  }

  // --- Creator & Custom Recipes ---
  async deleteRecipePermanently(id) {
    const strId = String(id);
    const numId = Number(id);
    this.deletedRecipeIds.add(strId);
    if (!isNaN(numId)) this.deletedRecipeIds.add(numId);

    await this.idbPut('deleted_recipes', { id: strId });
    await this.idbDelete('recipes', strId);
    if (!isNaN(numId)) await this.idbDelete('recipes', numId);

    this.recipes = this.recipes.filter(r => String(r.id) !== strId && r.id !== numId);

    if (supabase && this.currentUser) {
      await supabase.from('recipes').delete().eq('id', strId).catch(e => console.warn(e));
    }

    const affectedPlans = this.mealPlan.filter(m => String(m.recipe_id) === strId || m.recipe_id === numId);
    for (const m of affectedPlans) {
      await this.removeMealPlanEntry(m.id);
    }

    this.emit('recipe_deleted', { id: strId });
  }

  async addCustomRecipe(recipe, imageFile = null) {
    const strId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let imageUrl = recipe.image || 'images/placeholder.svg';

    // Handle photo upload to Supabase Storage if user provided a file
    if (imageFile && supabase && this.currentUser) {
      try {
        const compressedBlob = await compressImageToWebP(imageFile, 1000, 0.82);
        const storagePath = `${this.currentUser.id}_${Date.now()}.webp`;
        const { error: uploadError } = await supabase.storage
          .from('recipe-images')
          .upload(storagePath, compressedBlob, {
            contentType: 'image/webp',
            upsert: true
          });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('recipe-images')
            .getPublicUrl(storagePath);
          imageUrl = publicUrl;
        } else {
          console.warn('[Store] Upload zdjęcia nie powiódł się:', uploadError);
        }
      } catch (e) {
        console.warn('[Store] Kompresja zdjęcia nie powiodła się:', e);
      }
    }

    const entry = {
      ...recipe,
      id: strId,
      image: imageUrl,
      user_id: this.currentUser ? this.currentUser.id : null,
      author_name: this.currentUser ? this.currentUser.username : 'Gość',
      is_public: !!recipe.is_public
    };

    await this.idbPut('recipes', entry);
    this.recipes.unshift(entry);

    if (supabase && this.currentUser) {
      const { error } = await supabase.from('recipes').insert([{
        id: strId,
        user_id: this.currentUser.id,
        author_name: this.currentUser.username,
        is_public: entry.is_public,
        title: entry.title,
        category: entry.category,
        diets: entry.diets || [],
        calories: entry.calories || 0,
        protein: entry.protein || 0,
        fat: entry.fat || 0,
        carbs: entry.carbs || 0,
        portions: entry.portions || 1,
        prep_time_minutes: entry.prep_time_minutes || 15,
        image: entry.image,
        ingredients: entry.ingredients || [],
        instructions: entry.instructions || [],
        tags: entry.tags || []
      }]);

      if (error) {
        console.error('[Store] Błąd zapisu dania w Supabase:', error);
      }
    }

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

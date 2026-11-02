// DOM & Security Utilities
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function cleanRecipeTitle(title) {
  if (!title) return '';
  return String(title)
    .replace(/\[\s*urodzinowa paczka\s*\]/gi, '')
    .replace(/\(\s*urodzinowa paczka\s*\)/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function showToast(msg, duration = 3000) {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.className = 'fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 transform transition-all duration-300 opacity-0 translate-y-3 pointer-events-none';
    toast.innerHTML = `
      <div class="bg-stone-900/95 backdrop-blur-md text-white text-xs sm:text-sm font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-stone-800">
        <i class="fa-solid fa-circle-check text-brand-500 text-base"></i>
        <span id="global-toast-text"></span>
      </div>
    `;
    document.body.appendChild(toast);
  }

  const textEl = document.getElementById('global-toast-text');
  if (textEl) textEl.textContent = msg;

  toast.classList.remove('opacity-0', 'translate-y-3', 'pointer-events-none');
  toast.classList.add('opacity-100', 'translate-y-0');

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', 'translate-y-3', 'pointer-events-none');
  }, duration);
}

export function renderMacroPills(kcal, protein, fat, carbs) {
  return `
    <div class="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-stone-500 flex-wrap">
      <span class="font-black text-stone-900">${Math.round(kcal)} kcal</span>
      <span class="text-stone-300">•</span>
      <span><strong class="text-stone-800">${(Math.round(protein * 10) / 10)}g</strong> <span class="text-[10px] text-amber-600 font-bold">B</span></span>
      <span class="text-stone-300">•</span>
      <span><strong class="text-stone-800">${(Math.round(fat * 10) / 10)}g</strong> <span class="text-[10px] text-emerald-600 font-bold">T</span></span>
      <span class="text-stone-300">•</span>
      <span><strong class="text-stone-800">${(Math.round(carbs * 10) / 10)}g</strong> <span class="text-[10px] text-sky-600 font-bold">W</span></span>
    </div>
  `;
}

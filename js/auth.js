import { supabase } from './supabaseClient.js';
import { store } from './store.js';
import { showToast, escapeHtml } from './utils/dom.js';

class AuthModule {
  constructor() {
    this.currentUser = null;
    this.activeTab = 'login'; // 'login' | 'register'
  }

  async init() {
    this.bindEvents();

    if (!supabase) {
      this.updateAuthUI();
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        await this.setCurrentUserFromSession(session.user);
      } else {
        this.currentUser = null;
        this.updateAuthUI();
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session && session.user) {
          await this.setCurrentUserFromSession(session.user);
        } else {
          this.currentUser = null;
          this.updateAuthUI();
          store.onAuthChange(null);
        }
      });
    } catch (err) {
      console.warn('[Auth] Błąd pobierania sesji:', err);
      this.currentUser = null;
      this.updateAuthUI();
    }
  }

  async setCurrentUserFromSession(user) {
    let username = user.user_metadata?.username;

    if (!username && supabase) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        if (profile && profile.username) {
          username = profile.username;
        }
      } catch (e) {
        console.warn('[Auth] Nie udało się pobrać profilu:', e);
      }
    }

    this.currentUser = {
      id: user.id,
      email: user.email,
      username: username || user.email.split('@')[0]
    };

    this.updateAuthUI();
    store.onAuthChange(this.currentUser);
  }

  bindEvents() {
    const openBtn = document.getElementById('auth-open-btn');
    const closeBtn = document.getElementById('close-auth-modal');
    const backdrop = document.getElementById('modal-auth-backdrop');
    const tabLogin = document.getElementById('auth-tab-login');
    const tabRegister = document.getElementById('auth-tab-register');
    const formLogin = document.getElementById('auth-form-login');
    const formRegister = document.getElementById('auth-form-register');
    const logoutBtn = document.getElementById('auth-logout-btn');

    if (openBtn) openBtn.addEventListener('click', () => this.openModal('login'));
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
    if (backdrop) backdrop.addEventListener('click', () => this.closeModal());

    if (tabLogin) {
      tabLogin.addEventListener('click', () => this.switchTab('login'));
    }
    if (tabRegister) {
      tabRegister.addEventListener('click', () => this.switchTab('register'));
    }

    if (formLogin) {
      formLogin.addEventListener('submit', (e) => this.handleLogin(e));
    }
    if (formRegister) {
      formRegister.addEventListener('submit', (e) => this.handleRegister(e));
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }
  }

  openModal(tab = 'login') {
    const modal = document.getElementById('modal-auth');
    if (!modal) return;
    this.switchTab(tab);
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }

  closeModal() {
    const modal = document.getElementById('modal-auth');
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    this.clearErrors();
  }

  switchTab(tab) {
    this.activeTab = tab;
    this.clearErrors();

    const tabLogin = document.getElementById('auth-tab-login');
    const tabRegister = document.getElementById('auth-tab-register');
    const formLogin = document.getElementById('auth-form-login');
    const formRegister = document.getElementById('auth-form-register');

    if (tab === 'login') {
      if (tabLogin) tabLogin.className = 'flex-1 py-2.5 text-xs sm:text-sm font-extrabold text-brand-700 border-b-2 border-brand-600 cursor-pointer text-center';
      if (tabRegister) tabRegister.className = 'flex-1 py-2.5 text-xs sm:text-sm font-semibold text-stone-500 hover:text-stone-800 border-b-2 border-transparent cursor-pointer text-center';
      if (formLogin) formLogin.classList.remove('hidden');
      if (formRegister) formRegister.classList.add('hidden');
    } else {
      if (tabLogin) tabLogin.className = 'flex-1 py-2.5 text-xs sm:text-sm font-semibold text-stone-500 hover:text-stone-800 border-b-2 border-transparent cursor-pointer text-center';
      if (tabRegister) tabRegister.className = 'flex-1 py-2.5 text-xs sm:text-sm font-extrabold text-brand-700 border-b-2 border-brand-600 cursor-pointer text-center';
      if (formLogin) formLogin.classList.add('hidden');
      if (formRegister) formRegister.classList.remove('hidden');
    }
  }

  clearErrors() {
    const errBox = document.getElementById('auth-error-msg');
    if (errBox) {
      errBox.innerText = '';
      errBox.classList.add('hidden');
    }
  }

  showError(msg) {
    const errBox = document.getElementById('auth-error-msg');
    if (errBox) {
      errBox.innerText = msg;
      errBox.classList.remove('hidden');
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    if (!supabase) {
      this.showError('Brak połączenia z chmurą Supabase.');
      return;
    }

    const email = document.getElementById('auth-login-email').value.trim();
    const password = document.getElementById('auth-login-password').value;
    const submitBtn = document.getElementById('auth-login-submit-btn');

    if (!email || !password) {
      this.showError('Podaj adres email i hasło.');
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Logowanie...';
      }
      this.clearErrors();

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      showToast(`✓ Witaj ponownie, ${data.user.email}!`);
      this.closeModal();
      document.getElementById('auth-form-login').reset();
    } catch (err) {
      console.error('[Auth] Błąd logowania:', err);
      let message = 'Nieprawidłowy email lub hasło.';
      if (err.message && err.message.includes('Email not confirmed')) {
        message = 'Potwierdź swój adres email klikając link wysłany w wiadomości.';
      }
      this.showError(message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Zaloguj się';
      }
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    if (!supabase) {
      this.showError('Brak połączenia z chmurą Supabase.');
      return;
    }

    const username = document.getElementById('auth-reg-username').value.trim();
    const email = document.getElementById('auth-reg-email').value.trim();
    const password = document.getElementById('auth-reg-password').value;
    const submitBtn = document.getElementById('auth-reg-submit-btn');

    if (!username || username.length < 3) {
      this.showError('Nazwa użytkownika musi mieć co najmniej 3 znaki.');
      return;
    }
    if (!email || !password || password.length < 6) {
      this.showError('Hasło musi mieć co najmniej 6 znaków.');
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Tworzenie konta...';
      }
      this.clearErrors();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username }
        }
      });
      if (error) throw error;

      showToast('✓ Konto utworzone pomyślnie!');
      this.closeModal();
      document.getElementById('auth-form-register').reset();
    } catch (err) {
      console.error('[Auth] Błąd rejestracji:', err);
      this.showError(err.message || 'Wystąpił błąd podczas rejestracji.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Zarejestruj się';
      }
    }
  }

  async handleLogout() {
    if (!confirm('Czy na pewno chcesz się wylogować?')) return;

    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      this.currentUser = null;
      this.updateAuthUI();
      store.onAuthChange(null);
      showToast('Wylogowano z konta.');
    } catch (err) {
      console.error('[Auth] Błąd wylogowania:', err);
    }
  }

  updateAuthUI() {
    const authBtn = document.getElementById('auth-open-btn');
    const userPill = document.getElementById('auth-user-pill');
    const userNameEl = document.getElementById('auth-user-name');

    if (this.currentUser) {
      if (authBtn) authBtn.classList.add('hidden');
      if (userPill) userPill.classList.remove('hidden');
      if (userNameEl) userNameEl.innerText = this.currentUser.username;
    } else {
      if (authBtn) authBtn.classList.remove('hidden');
      if (userPill) userPill.classList.add('hidden');
    }
  }

  getUser() {
    return this.currentUser;
  }
}

export const auth = new AuthModule();

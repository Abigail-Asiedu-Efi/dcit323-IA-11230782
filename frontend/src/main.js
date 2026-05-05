const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const state = {
  user: null,
  token: localStorage.getItem("coinbase_token"),
  crypto: [],
  view: "market",
  marketMode: "all",
  theme: localStorage.getItem("efichain_theme") || "dark",
  profileMenuOpen: false,
  query: "",
  sortBy: "change",
  watchlist: JSON.parse(localStorage.getItem("efichain_watchlist") || localStorage.getItem("coinbase_watchlist") || "[]"),
  loading: false,
  message: "",
  error: ""
};

const app = document.querySelector("#app");
let globalEventsBound = false;

const ui = {
  page: "mx-auto w-[min(1180px,calc(100%-32px))]",
  panel: "glass",
  panelStrong: "glass-strong"
};

const theme = {
  text: () => (state.theme === "light" ? "text-slate-950" : "text-cyan-50"),
  muted: () => (state.theme === "light" ? "text-slate-700" : "text-cyan-100/60"),
  dim: () => (state.theme === "light" ? "text-slate-500" : "text-cyan-100/45"),
  kicker: () => (state.theme === "light" ? "text-dodger" : "text-neon"),
  accent: () => (state.theme === "light" ? "text-dodger" : "text-neon"),
  alt: () => (state.theme === "light" ? "text-dodger" : "text-orchid"),
  border: () => (state.theme === "light" ? "border-dodger/20" : "border-cyan-200/10"),
  soft: () => (state.theme === "light" ? "bg-dodger/10" : "bg-white/[0.04]"),
  nav: () => (state.theme === "light" ? "bg-white/82 shadow-[0_8px_30px_rgba(15,23,42,0.08)]" : "bg-void/82"),
  tableHead: () => (state.theme === "light" ? "bg-slate-950/[0.035]" : "bg-white/[0.03]"),
  skeleton: () => (state.theme === "light" ? "border-slate-200 bg-slate-200/70" : "border-cyan-200/10 bg-white/[0.04]"),
  input: () =>
    state.theme === "light"
      ? "w-full border border-dodger/20 bg-white/70 px-4 py-3 text-slate-950 placeholder:text-slate-400 transition focus:border-dodger focus:bg-white"
      : "w-full border border-cyan-200/15 bg-white/[0.06] px-4 py-3 text-cyan-50 placeholder:text-cyan-100/35 transition focus:border-neon focus:bg-white/[0.09]",
  label: () =>
    state.theme === "light"
      ? "grid gap-2 text-sm font-black uppercase tracking-[0.08em] text-slate-700"
      : "grid gap-2 text-sm font-black uppercase tracking-[0.08em] text-cyan-100/80",
  chip: () =>
    state.theme === "light"
      ? "border border-dodger/20 bg-white/55 px-4 py-2 text-sm font-black text-slate-700 transition hover:border-dodger hover:text-dodger"
      : "border border-cyan-200/15 bg-white/[0.04] px-4 py-2 text-sm font-black text-cyan-100/80 transition hover:border-neon/50 hover:text-neon",
  activeChip: () =>
    state.theme === "light"
      ? "border border-dodger bg-dodger px-4 py-2 text-sm font-black text-white shadow-[0_0_24px_rgba(30,144,255,0.24)]"
      : "border border-neon bg-neon px-4 py-2 text-sm font-black text-void shadow-[0_0_24px_rgba(0,255,136,0.24)]",
  secondary: () =>
    state.theme === "light"
      ? "border border-dodger/35 bg-dodger/10 px-5 py-3 font-black text-dodger transition hover:-translate-y-0.5 hover:border-dodger hover:bg-dodger/15"
      : "border border-neon/30 bg-neon/10 px-5 py-3 font-black text-neon transition hover:-translate-y-0.5 hover:border-neon hover:bg-neon/15",
  primary: () =>
    state.theme === "light"
      ? "border border-dodger bg-dodger px-5 py-3 font-black text-white shadow-[0_0_32px_rgba(30,144,255,0.24)] transition hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-[0_0_44px_rgba(30,144,255,0.34)] active:translate-y-0"
      : "border border-neon/50 bg-neon px-5 py-3 font-black text-void shadow-[0_0_32px_rgba(0,255,136,0.28)] transition hover:-translate-y-0.5 hover:bg-neon-soft hover:shadow-[0_0_44px_rgba(0,255,136,0.42)] active:translate-y-0",
  positive: () => (state.theme === "light" ? "text-dodger" : "text-neon"),
  successBox: () =>
    state.theme === "light"
      ? "border border-dodger/30 bg-dodger/10 px-4 py-3 text-sm font-black text-dodger"
      : "border border-neon/30 bg-neon/10 px-4 py-3 text-sm font-black text-neon",
  glowText: () =>
    state.theme === "light"
      ? "[text-shadow:0_0_22px_rgba(30,144,255,0.34)]"
      : "[text-shadow:0_0_22px_rgba(0,255,136,0.42)]",
  rowHover: () => (state.theme === "light" ? "hover:bg-dodger/[0.055]" : "hover:bg-neon/[0.055]")
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value > 10 ? 2 : 4
  }).format(value);

const formatDate = (date) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date));

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function defaultAvatar(name = "EfiChain") {
  const initial = escapeHtml(name.trim().slice(0, 1).toUpperCase() || "E");
  const fill = state.theme === "light" ? "#1e90ff" : "#00ff88";
  const text = state.theme === "light" ? "#ffffff" : "#05070d";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="80" fill="${fill}"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="${text}" font-family="Arial, sans-serif" font-size="72" font-weight="800">${initial}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function avatarUrl(user = state.user) {
  return user?.avatar || defaultAvatar(user?.name || "EfiChain");
}

function themeToggleImage() {
  return state.theme === "light"
    ? "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f319.svg"
    : "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/2600.svg";
}

function getCoinId(coin) {
  return coin._id || coin.symbol;
}

function getVisibleCrypto() {
  const query = state.query.trim().toLowerCase();
  const filtered = query
    ? state.crypto.filter((coin) => `${coin.name} ${coin.symbol}`.toLowerCase().includes(query))
    : [...state.crypto];

  return filtered.sort((a, b) => {
    if (state.sortBy === "price") return b.price - a.price;
    if (state.sortBy === "name") return a.name.localeCompare(b.name);
    if (state.sortBy === "new") return new Date(b.createdAt) - new Date(a.createdAt);
    return b.change24h - a.change24h;
  });
}

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include"
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed. Please try again.");
  }

  return data;
}

function setNotice({ message = "", error = "" } = {}) {
  state.message = message;
  state.error = error;
  render();
}

function applyTheme() {
  document.body.classList.toggle("theme-light", state.theme === "light");
  document.body.classList.toggle("theme-dark", state.theme === "dark");
}

async function loadProfile({ silent = false } = {}) {
  try {
    const data = await api("/profile");
    state.user = data.user;
    render();
  } catch (error) {
    state.user = null;
    if (!silent) {
      setNotice({ error: "Please log in to view your profile." });
    }
  }
}

async function loadCrypto(mode = state.marketMode) {
  state.loading = true;
  state.marketMode = mode;
  render();

  const endpoint = mode === "gainers" ? "/crypto/gainers" : mode === "new" ? "/crypto/new" : "/crypto";

  try {
    const data = await api(endpoint);
    state.crypto = data.crypto;
    state.error = "";
  } catch (error) {
    state.error = error.message;
  } finally {
    state.loading = false;
    render();
  }
}

async function submitAuth(event, mode) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const payload = Object.fromEntries(form.entries());

  try {
    const data = await api(`/${mode}`, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    state.user = data.user;
    state.token = data.token;
    localStorage.setItem("coinbase_token", data.token);
    state.view = "market";
    state.message = data.message;
    state.error = "";
    await loadCrypto();
  } catch (error) {
    setNotice({ error: error.message });
  }
}

async function logout() {
  try {
    await api("/logout", { method: "POST" });
  } catch (error) {
    console.warn(error.message);
  }

  state.user = null;
  state.token = "";
  localStorage.removeItem("coinbase_token");
  state.view = "login";
  setNotice({ message: "You have been logged out." });
}

async function addCrypto(event) {
  event.preventDefault();

  if (!state.user) {
    state.view = "login";
    setNotice({ error: "Log in before adding a new cryptocurrency." });
    return;
  }

  const form = new FormData(event.currentTarget);
  const payload = {
    name: form.get("name"),
    symbol: form.get("symbol"),
    image: form.get("image"),
    price: Number(form.get("price")),
    change24h: Number(form.get("change24h"))
  };

  try {
    const data = await api("/crypto", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    event.currentTarget.reset();
    state.message = data.message;
    state.error = "";
    await loadCrypto("new");
  } catch (error) {
    setNotice({ error: error.message });
  }
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("Could not read that image.")));
    reader.readAsDataURL(file);
  });
}

async function uploadAvatar(event) {
  const file = event.target.files?.[0];
  event.target.value = "";

  if (!file) return;

  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    setNotice({ error: "Choose a PNG, JPG, or WebP profile picture." });
    return;
  }

  if (file.size > 350 * 1024) {
    setNotice({ error: "Choose a profile picture under 350 KB." });
    return;
  }

  try {
    const avatar = await readImageFile(file);
    const data = await api("/profile/avatar", {
      method: "PATCH",
      body: JSON.stringify({ avatar })
    });
    state.user = data.user;
    state.profileMenuOpen = false;
    setNotice({ message: data.message });
  } catch (error) {
    setNotice({ error: error.message });
  }
}

function navigate(view) {
  if (view === "profile" && !state.user) {
    state.view = "login";
    setNotice({ error: "Please log in to access your profile." });
    return;
  }

  state.view = view;
  state.profileMenuOpen = false;
  state.message = "";
  state.error = "";
  render();
}

function toggleWatchlist(id) {
  state.watchlist = state.watchlist.includes(id)
    ? state.watchlist.filter((savedId) => savedId !== id)
    : [...state.watchlist, id];
  localStorage.setItem("efichain_watchlist", JSON.stringify(state.watchlist));
  render();
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  localStorage.setItem("efichain_theme", state.theme);
  render();
}

function toggleProfileMenu() {
  state.profileMenuOpen = !state.profileMenuOpen;
  render();
}

function closeProfileMenu() {
  if (!state.profileMenuOpen) return;
  state.profileMenuOpen = false;
  render();
}

function shell(content) {
  applyTheme();

  return `
    <div class="min-h-screen overflow-hidden ${theme.text()}">
      <header class="sticky top-0 z-30 border-b ${theme.border()} ${theme.nav()} backdrop-blur-2xl">
        <div class="${ui.page} flex items-center justify-between gap-4 py-4">
          <button class="group flex items-center gap-3 text-left" data-nav="market" aria-label="Open market">
            <span class="grid size-10 place-items-center border ${state.theme === "light" ? "border-dodger bg-dodger text-white shadow-[0_0_26px_rgba(30,144,255,0.28)]" : "border-neon/60 bg-neon text-void shadow-[0_0_26px_rgba(0,255,136,0.35)]"} text-lg font-black transition group-hover:rotate-6">E</span>
            <span>
              <span class="block text-sm font-black uppercase tracking-[0.18em] ${theme.accent()}">EfiChain</span>
              <span class="block text-xs font-bold ${theme.dim()}">Crypto portfolio platform</span>
            </span>
          </button>
          <nav class="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <button data-nav="market" class="${state.view === "market" ? theme.activeChip() : theme.chip()}">Market</button>
            ${
              state.user
                ? `<div class="relative" data-profile-menu-root>
                    <button class="grid size-12 place-items-center rounded-full border ${state.view === "profile" ? (state.theme === "light" ? "border-dodger" : "border-neon") : theme.border()} ${theme.soft()} p-1 font-black transition hover:-translate-y-0.5" data-action="profile-menu" aria-expanded="${state.profileMenuOpen}" aria-label="Open user menu">
                      <img class="size-10 rounded-full object-cover" src="${escapeHtml(avatarUrl())}" alt="${escapeHtml(state.user.name)} avatar" />
                    </button>
                    ${
                      state.profileMenuOpen
                        ? `<div class="${ui.panelStrong} absolute right-0 top-14 z-40 w-[min(18rem,calc(100vw-2rem))] p-3">
                            <div class="flex items-center gap-3 border-b ${theme.border()} pb-3">
                              <img class="size-12 rounded-full object-cover" src="${escapeHtml(avatarUrl())}" alt="${escapeHtml(state.user.name)} avatar" />
                              <div class="min-w-0">
                                <strong class="block truncate ${theme.text()}">${escapeHtml(state.user.name)}</strong>
                                <span class="block truncate text-xs font-bold ${theme.dim()}">${escapeHtml(state.user.email)}</span>
                              </div>
                            </div>
                            <button class="mt-3 w-full border ${theme.border()} ${theme.soft()} px-3 py-2 text-left text-sm font-black ${theme.text()} transition ${state.theme === "light" ? "hover:border-dodger" : "hover:border-neon"}" data-nav="profile">View profile</button>
                            <label class="mt-2 block w-full border ${theme.border()} ${theme.soft()} px-3 py-2 text-sm font-black ${theme.text()} transition ${state.theme === "light" ? "hover:border-dodger" : "hover:border-neon"}">
                              Upload picture
                              <input class="sr-only" type="file" accept="image/png,image/jpeg,image/webp" data-avatar-upload />
                            </label>
                            <button class="mt-2 w-full border border-danger/35 bg-danger/10 px-3 py-2 text-left text-sm font-black text-danger transition hover:bg-danger/15" data-action="logout">Log out</button>
                          </div>`
                        : ""
                    }
                  </div>`
                : `<button data-nav="login" class="${state.view === "login" ? theme.activeChip() : theme.chip()}">Log in</button>
                   <button class="${theme.primary()}" data-nav="register">Register</button>`
            }
          </nav>
        </div>
      </header>
      <div class="pointer-events-none fixed left-1/2 top-20 -z-10 h-72 w-72 -translate-x-1/2 ${state.theme === "light" ? "bg-dodger/15" : "bg-neon/10"} blur-[90px]"></div>
      <button class="group fixed bottom-5 right-5 z-50 grid size-16 place-items-center rounded-full bg-transparent p-0 transition hover:-translate-y-1 hover:scale-105 active:translate-y-0 active:scale-100" data-action="theme" aria-label="${state.theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}" title="${state.theme === "dark" ? "Light mode" : "Dark mode"}">
        <img class="size-14 object-contain drop-shadow-xl transition group-hover:rotate-12" src="${themeToggleImage()}" alt="" aria-hidden="true" />
      </button>
      ${state.message ? `<div class="${ui.page} pt-4"><div class="${theme.successBox()}">${state.message}</div></div>` : ""}
      ${state.error ? `<div class="${ui.page} pt-4"><div class="border border-danger/40 bg-danger/10 px-4 py-3 text-sm font-black text-pink-200">${state.error}</div></div>` : ""}
      ${content}
    </div>
  `;
}

function renderHeroStats(top, gainers, watchCount) {
  return `
    <div class="${ui.panelStrong} p-5 transition duration-300 hover:-translate-y-1 ${state.theme === "light" ? "hover:border-dodger/40" : "hover:border-neon/40"}">
      <div class="flex items-center justify-between border-b border-cyan-200/10 pb-4">
        <span class="text-sm font-bold text-cyan-100/55">Session</span>
        <strong class="${state.user ? theme.accent() : theme.alt()}">${state.user ? "Authenticated" : "Guest"}</strong>
      </div>
      <div class="my-5 border ${state.theme === "light" ? "border-dodger/30 bg-gradient-to-br from-dodger/20 via-white/60 to-transparent" : "border-neon/25 bg-gradient-to-br from-neon/18 via-orchid/10 to-transparent"} p-6">
        <span class="text-sm font-black uppercase tracking-[0.16em] ${theme.dim()}">Signal leader</span>
        <strong class="${theme.glowText()} mt-2 block text-7xl font-black leading-none ${theme.accent()}">${top ? escapeHtml(top.symbol) : "--"}</strong>
        <em class="mt-3 block not-italic text-2xl font-black ${theme.text()}">${top ? formatCurrency(top.price) : "Load market"}</em>
      </div>
      <div class="grid grid-cols-3 gap-3">
        <span class="border ${theme.border()} ${theme.soft()} p-3"><strong class="block text-2xl ${theme.text()}">${state.crypto.length}</strong><span class="text-xs font-bold ${theme.dim()}">Assets</span></span>
        <span class="border ${theme.border()} ${theme.soft()} p-3"><strong class="block text-2xl ${theme.accent()}">${gainers}</strong><span class="text-xs font-bold ${theme.dim()}">Gainers</span></span>
        <span class="border ${theme.border()} ${theme.soft()} p-3"><strong class="block text-2xl ${theme.alt()}">${watchCount}</strong><span class="text-xs font-bold ${theme.dim()}">Saved</span></span>
      </div>
    </div>
  `;
}

function renderAssetRows(visibleCrypto) {
  if (state.loading) {
    return `<div class="grid gap-3 p-4">${Array.from({ length: 4 })
      .map(() => `<div class="h-16 animate-pulse border border-cyan-200/10 bg-white/[0.04]"></div>`)
      .join("")}</div>`;
  }

  if (!visibleCrypto.length) {
    return `<div class="p-8 text-center font-bold text-cyan-100/55">No assets match your current filters.</div>`;
  }

  return visibleCrypto
    .map((coin) => {
      const id = getCoinId(coin);
      const watched = state.watchlist.includes(id);
      return `
        <article class="grid gap-4 border-t ${theme.border()} p-4 transition ${theme.rowHover()} md:grid-cols-[minmax(240px,1.7fr)_1fr_.75fr_1fr_auto] md:items-center">
          <div class="flex items-center gap-3">
            <img class="size-11 bg-white/20" src="${escapeHtml(coin.image)}" alt="${escapeHtml(coin.name)} logo" />
            <div>
              <strong class="block text-base ${theme.text()}">${escapeHtml(coin.name)}</strong>
              <span class="text-sm font-black uppercase tracking-[0.12em] ${theme.alt()}">${escapeHtml(coin.symbol)}</span>
            </div>
          </div>
          <strong class="${theme.text()}">${formatCurrency(coin.price)}</strong>
          <span class="${coin.change24h >= 0 ? theme.positive() : "text-danger"} font-black">${coin.change24h >= 0 ? "+" : ""}${coin.change24h}%</span>
          <span class="text-sm font-bold ${theme.dim()}">${formatDate(coin.createdAt)}</span>
          <button class="border ${watched ? (state.theme === "light" ? "border-dodger bg-dodger text-white" : "border-neon bg-neon text-void") : `${theme.border()} ${theme.soft()} ${theme.muted()}`} px-3 py-2 text-sm font-black transition ${state.theme === "light" ? "hover:border-dodger hover:text-dodger" : "hover:border-neon hover:text-neon"}" data-watch="${escapeHtml(id)}" aria-label="Toggle ${escapeHtml(coin.name)} watchlist">
            ${watched ? "Saved" : "Watch"}
          </button>
        </article>
      `;
    })
    .join("");
}

function renderMarket() {
  const visibleCrypto = getVisibleCrypto();
  const top = [...state.crypto].sort((a, b) => b.price - a.price)[0];
  const gainers = state.crypto.filter((item) => item.change24h > 0).length;
  const watchCount = state.watchlist.length;

  return shell(`
    <main class="${ui.page}">
      <section class="grid items-center gap-10 py-10 md:py-16 lg:grid-cols-[1.12fr_.88fr] lg:py-20">
        <div>
          <p class="mb-4 text-sm font-black uppercase tracking-[0.18em] ${theme.kicker()}">Smarter crypto momentum</p>
          <h1 class="max-w-4xl text-4xl font-black leading-[0.98] tracking-tight ${theme.text()} sm:text-5xl md:text-7xl lg:text-8xl">
            Crypto markets with <span class="${theme.accent()} ${theme.glowText()}">electric</span> clarity.
          </h1>
          <p class="mt-6 max-w-2xl text-lg leading-8 ${theme.muted()}">
            Watch market movers, save your favorite assets, and discover new listings with a portfolio experience built for fast decisions.
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <button class="${theme.primary()}" data-nav="${state.user ? "profile" : "register"}">${state.user ? "Open profile" : "Create account"}</button>
            <button class="${theme.secondary()}" data-scroll="listing">List token</button>
            <button class="${theme.chip()}" data-refresh="market">Refresh data</button>
          </div>
        </div>
        ${renderHeroStats(top, gainers, watchCount)}
      </section>

      <section class="pb-12">
        <div class="${ui.panel} overflow-hidden">
          <div class="grid gap-4 border-b ${theme.border()} p-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p class="mb-2 text-xs font-black uppercase tracking-[0.18em] ${theme.alt()}">Market pulse</p>
              <h2 class="text-3xl font-black ${theme.text()} md:text-4xl">Tradable cryptocurrencies</h2>
            </div>
            <div class="flex flex-wrap gap-2">
              <button data-market="all" class="${state.marketMode === "all" ? theme.activeChip() : theme.chip()}">All</button>
              <button data-market="gainers" class="${state.marketMode === "gainers" ? theme.activeChip() : theme.chip()}">Gainers</button>
              <button data-market="new" class="${state.marketMode === "new" ? theme.activeChip() : theme.chip()}">New</button>
            </div>
          </div>

          <div class="grid gap-3 border-b ${theme.border()} p-5 md:grid-cols-[minmax(0,1fr)_220px]">
            <label class="sr-only" for="market-search">Search assets</label>
            <input id="market-search" class="${theme.input()}" value="${escapeHtml(state.query)}" placeholder="Search Bitcoin, ETH, Solana..." data-search="market" />
            <select class="border ${theme.border()} ${state.theme === "light" ? "bg-white/80 text-slate-950" : "bg-panel text-cyan-50"} px-4 py-3 font-black" data-sort="market" aria-label="Sort assets">
              <option value="change" ${state.sortBy === "change" ? "selected" : ""}>Sort: 24h change</option>
              <option value="price" ${state.sortBy === "price" ? "selected" : ""}>Sort: price</option>
              <option value="new" ${state.sortBy === "new" ? "selected" : ""}>Sort: newest</option>
              <option value="name" ${state.sortBy === "name" ? "selected" : ""}>Sort: name</option>
            </select>
          </div>

          <div class="hidden grid-cols-[minmax(240px,1.7fr)_1fr_.75fr_1fr_auto] gap-4 ${theme.tableHead()} px-4 py-3 text-xs font-black uppercase tracking-[0.14em] ${theme.dim()} md:grid">
            <span>Asset</span><span>Price</span><span>24h</span><span>Listed</span><span>Watch</span>
          </div>
          ${renderAssetRows(visibleCrypto)}
        </div>
      </section>

      <section class="grid gap-8 pb-16 lg:grid-cols-[.8fr_1fr]" id="listing">
        <div class="py-2">
          <p class="mb-3 text-xs font-black uppercase tracking-[0.18em] ${theme.kicker()}">Grow the market</p>
          <h2 class="text-3xl font-black ${theme.text()} md:text-5xl">List a new cryptocurrency</h2>
          <p class="mt-5 max-w-xl text-lg leading-8 ${theme.muted()}">
            Add promising assets to EfiChain so your watchlist and market views stay fresh, useful, and easy to act on.
          </p>
        </div>
        <form class="${ui.panelStrong} grid gap-4 p-5 md:grid-cols-2" data-form="crypto">
          <label class="${theme.label()}">Name<input class="${theme.input()}" name="name" placeholder="Polygon" required /></label>
          <label class="${theme.label()}">Symbol<input class="${theme.input()}" name="symbol" placeholder="MATIC" required /></label>
          <label class="${theme.label()}">Price<input class="${theme.input()}" name="price" type="number" min="0" step="0.0001" placeholder="0.72" required /></label>
          <label class="${theme.label()}">24h Change %<input class="${theme.input()}" name="change24h" type="number" step="0.01" placeholder="+2.50" required /></label>
          <label class="${theme.label()} md:col-span-2">Image URL<input class="${theme.input()}" name="image" type="url" placeholder="https://assets.coincap.io/assets/icons/matic@2x.png" required /></label>
          <button class="${theme.primary()} md:col-span-2" type="submit">Add cryptocurrency</button>
        </form>
      </section>
    </main>
  `);
}

function renderAuth(mode) {
  const isRegister = mode === "register";
  return shell(`
    <main class="${ui.page} grid min-h-[calc(100vh-80px)] items-center gap-8 py-12 lg:grid-cols-[1fr_430px]">
      <section>
        <p class="mb-4 text-sm font-black uppercase tracking-[0.18em] ${theme.kicker()}">${isRegister ? "Start trading" : "Welcome back"}</p>
        <h1 class="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight ${theme.text()} md:text-7xl">
          ${isRegister ? "Create your secure crypto account." : "Sign in to continue."}
        </h1>
        <p class="mt-6 max-w-xl text-lg leading-8 ${theme.muted()}">
          Access your personalized profile, saved assets, and listing tools with a secure account.
        </p>
      </section>
      <form class="${ui.panelStrong} grid gap-4 p-6" data-form="${mode}">
        <h2 class="text-3xl font-black ${theme.text()}">${isRegister ? "Register" : "Login"}</h2>
        ${isRegister ? `<label class="${theme.label()}">Name<input class="${theme.input()}" name="name" autocomplete="name" placeholder="Ada Lovelace" required /></label>` : ""}
        <label class="${theme.label()}">Email<input class="${theme.input()}" name="email" type="email" autocomplete="email" placeholder="you@example.com" required /></label>
        <label class="${theme.label()}">Password<input class="${theme.input()}" name="password" type="password" autocomplete="${isRegister ? "new-password" : "current-password"}" placeholder="At least 6 characters" required /></label>
        <button class="${theme.primary()}" type="submit">${isRegister ? "Create account" : "Log in"}</button>
        <p class="text-sm font-bold ${theme.dim()}">
          ${isRegister ? "Already have an account?" : "Need an account?"}
          <button class="font-black ${theme.accent()} hover:opacity-80" type="button" data-nav="${isRegister ? "login" : "register"}">${isRegister ? "Log in" : "Register"}</button>
        </p>
      </form>
    </main>
  `);
}

function renderProfile() {
  return shell(`
    <main class="${ui.page} grid min-h-[calc(100vh-80px)] place-items-center py-12">
      <section class="${ui.panelStrong} w-full max-w-3xl p-7">
        <div class="grid gap-6 md:grid-cols-[112px_1fr] md:items-center">
          <div class="relative size-28">
            <img class="size-28 rounded-full object-cover ${state.theme === "light" ? "shadow-[0_0_34px_rgba(30,144,255,0.24)]" : "shadow-[0_0_34px_rgba(0,255,136,0.32)]"}" src="${escapeHtml(avatarUrl())}" alt="${escapeHtml(state.user.name)} avatar" />
            <label class="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap border ${theme.border()} ${theme.soft()} px-3 py-1 text-xs font-black ${theme.text()} transition ${state.theme === "light" ? "hover:border-dodger" : "hover:border-neon"}">
              Change
              <input class="sr-only" type="file" accept="image/png,image/jpeg,image/webp" data-avatar-upload />
            </label>
          </div>
          <div>
            <p class="mb-2 text-xs font-black uppercase tracking-[0.18em] ${theme.kicker()}">Protected profile</p>
            <h1 class="text-4xl font-black ${theme.text()} md:text-6xl">${escapeHtml(state.user.name)}</h1>
            <p class="mt-3 text-lg ${theme.muted()}">${escapeHtml(state.user.email)}</p>
          </div>
        </div>
        <dl class="mt-8 grid gap-3">
          <div class="grid gap-2 border-t ${theme.border()} pt-4 md:grid-cols-[140px_1fr]"><dt class="font-black ${theme.dim()}">User ID</dt><dd class="break-all font-bold ${theme.text()}">${escapeHtml(state.user.id)}</dd></div>
          <div class="grid gap-2 border-t ${theme.border()} pt-4 md:grid-cols-[140px_1fr]"><dt class="font-black ${theme.dim()}">Joined</dt><dd class="font-bold ${theme.text()}">${formatDate(state.user.createdAt)}</dd></div>
          <div class="grid gap-2 border-t ${theme.border()} pt-4 md:grid-cols-[140px_1fr]"><dt class="font-black ${theme.dim()}">Status</dt><dd class="font-bold ${theme.accent()}">Active account</dd></div>
          <div class="grid gap-2 border-t ${theme.border()} pt-4 md:grid-cols-[140px_1fr]"><dt class="font-black ${theme.dim()}">Watchlist</dt><dd class="font-bold ${theme.alt()}">${state.watchlist.length} saved assets</dd></div>
        </dl>
      </section>
    </main>
  `);
}

function render() {
  if (state.view === "login") {
    app.innerHTML = renderAuth("login");
  } else if (state.view === "register") {
    app.innerHTML = renderAuth("register");
  } else if (state.view === "profile" && state.user) {
    app.innerHTML = renderProfile();
  } else {
    app.innerHTML = renderMarket();
  }

  bindEvents();
}

function bindEvents() {
  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.nav));
  });

  document.querySelectorAll("[data-market]").forEach((button) => {
    button.addEventListener("click", () => loadCrypto(button.dataset.market));
  });

  document.querySelectorAll("[data-watch]").forEach((button) => {
    button.addEventListener("click", () => toggleWatchlist(button.dataset.watch));
  });

  document.querySelector("[data-refresh='market']")?.addEventListener("click", () => loadCrypto());
  document.querySelector("[data-action='theme']")?.addEventListener("click", toggleTheme);
  document.querySelector("[data-action='profile-menu']")?.addEventListener("click", toggleProfileMenu);
  document.querySelector("[data-action='logout']")?.addEventListener("click", logout);
  document.querySelectorAll("[data-avatar-upload]").forEach((input) => {
    input.addEventListener("change", uploadAvatar);
  });
  document.querySelector("[data-form='login']")?.addEventListener("submit", (event) => submitAuth(event, "login"));
  document.querySelector("[data-form='register']")?.addEventListener("submit", (event) => submitAuth(event, "register"));
  document.querySelector("[data-form='crypto']")?.addEventListener("submit", addCrypto);
  document.querySelector("[data-search='market']")?.addEventListener("input", (event) => {
    state.query = event.target.value;
    render();
    document.querySelector("[data-search='market']")?.focus();
  });
  document.querySelector("[data-sort='market']")?.addEventListener("change", (event) => {
    state.sortBy = event.target.value;
    render();
  });
  document.querySelector("[data-scroll='listing']")?.addEventListener("click", () => {
    document.querySelector("#listing")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  bindGlobalEvents();
}

function bindGlobalEvents() {
  if (globalEventsBound) return;
  globalEventsBound = true;

  document.addEventListener("click", (event) => {
    if (!state.profileMenuOpen) return;
    if (event.target.closest("[data-profile-menu-root]")) return;
    closeProfileMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeProfileMenu();
    }
  });
}

render();
loadCrypto();
loadProfile({ silent: true });

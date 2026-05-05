const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const state = {
  user: null,
  token: localStorage.getItem("coinbase_token"),
  crypto: [],
  view: "market",
  marketMode: "all",
  query: "",
  sortBy: "change",
  watchlist: JSON.parse(localStorage.getItem("coinbase_watchlist") || "[]"),
  loading: false,
  message: "",
  error: ""
};

const app = document.querySelector("#app");

const ui = {
  page: "mx-auto w-[min(1180px,calc(100%-32px))]",
  label: "grid gap-2 text-sm font-black uppercase tracking-[0.08em] text-cyan-100/80",
  input:
    "w-full border border-cyan-200/15 bg-white/[0.06] px-4 py-3 text-cyan-50 placeholder:text-cyan-100/35 transition focus:border-neon focus:bg-white/[0.09]",
  primary:
    "border border-neon/50 bg-neon px-5 py-3 font-black text-void shadow-[0_0_32px_rgba(0,255,136,0.28)] transition hover:-translate-y-0.5 hover:bg-neon-soft hover:shadow-[0_0_44px_rgba(0,255,136,0.42)] active:translate-y-0",
  secondary:
    "border border-dodger/40 bg-dodger/12 px-5 py-3 font-black text-skyline transition hover:-translate-y-0.5 hover:border-dodger hover:bg-dodger/20",
  chip: "border border-cyan-200/15 bg-white/[0.04] px-4 py-2 text-sm font-black text-cyan-100/80 transition hover:border-neon/50 hover:text-neon",
  activeChip: "border border-neon bg-neon px-4 py-2 text-sm font-black text-void shadow-[0_0_24px_rgba(0,255,136,0.24)]",
  panel: "glass",
  panelStrong: "glass-strong"
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

function navigate(view) {
  if (view === "profile" && !state.user) {
    state.view = "login";
    setNotice({ error: "Please log in to access your profile." });
    return;
  }

  state.view = view;
  state.message = "";
  state.error = "";
  render();
}

function toggleWatchlist(id) {
  state.watchlist = state.watchlist.includes(id)
    ? state.watchlist.filter((savedId) => savedId !== id)
    : [...state.watchlist, id];
  localStorage.setItem("coinbase_watchlist", JSON.stringify(state.watchlist));
  render();
}

function shell(content) {
  return `
    <div class="min-h-screen overflow-hidden text-cyan-50">
      <header class="sticky top-0 z-30 border-b border-cyan-200/10 bg-void/75 backdrop-blur-2xl">
        <div class="${ui.page} flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <button class="group flex items-center gap-3 text-left" data-nav="market" aria-label="Open market">
            <span class="grid size-10 place-items-center border border-neon/60 bg-neon text-lg font-black text-void shadow-[0_0_26px_rgba(0,255,136,0.35)] transition group-hover:rotate-6">C</span>
            <span>
              <span class="block text-sm font-black uppercase tracking-[0.18em] text-neon">Coinbase</span>
              <span class="block text-xs font-bold text-cyan-100/55">Full-stack clone</span>
            </span>
          </button>
          <nav class="flex flex-wrap items-center gap-2">
            <button data-nav="market" class="${state.view === "market" ? ui.activeChip : ui.chip}">Market</button>
            <button data-nav="profile" class="${state.view === "profile" ? ui.activeChip : ui.chip}">Profile</button>
            ${
              state.user
                ? `<button class="${ui.secondary}" data-action="logout">Log out</button>`
                : `<button data-nav="login" class="${state.view === "login" ? ui.activeChip : ui.chip}">Log in</button>
                   <button class="${ui.primary}" data-nav="register">Register</button>`
            }
          </nav>
        </div>
      </header>
      <div class="pointer-events-none fixed left-1/2 top-20 -z-10 h-72 w-72 -translate-x-1/2 bg-neon/10 blur-[90px]"></div>
      ${state.message ? `<div class="${ui.page} pt-4"><div class="border border-neon/30 bg-neon/10 px-4 py-3 text-sm font-black text-neon">${state.message}</div></div>` : ""}
      ${state.error ? `<div class="${ui.page} pt-4"><div class="border border-danger/40 bg-danger/10 px-4 py-3 text-sm font-black text-pink-200">${state.error}</div></div>` : ""}
      ${content}
    </div>
  `;
}

function renderHeroStats(top, gainers, watchCount) {
  return `
    <div class="${ui.panelStrong} p-5 transition duration-300 hover:-translate-y-1 hover:border-neon/40">
      <div class="flex items-center justify-between border-b border-cyan-200/10 pb-4">
        <span class="text-sm font-bold text-cyan-100/55">Session</span>
        <strong class="${state.user ? "text-neon" : "text-skyline"}">${state.user ? "Authenticated" : "Guest"}</strong>
      </div>
      <div class="my-5 border border-dodger/30 bg-gradient-to-br from-dodger/30 via-neon/10 to-transparent p-6">
        <span class="text-sm font-black uppercase tracking-[0.16em] text-cyan-100/55">Signal leader</span>
        <strong class="neon-text mt-2 block text-7xl font-black leading-none text-neon">${top ? escapeHtml(top.symbol) : "--"}</strong>
        <em class="mt-3 block not-italic text-2xl font-black text-cyan-50">${top ? formatCurrency(top.price) : "Load market"}</em>
      </div>
      <div class="grid grid-cols-3 gap-3">
        <span class="border border-cyan-200/10 bg-white/[0.04] p-3"><strong class="block text-2xl text-cyan-50">${state.crypto.length}</strong><span class="text-xs font-bold text-cyan-100/50">Assets</span></span>
        <span class="border border-cyan-200/10 bg-white/[0.04] p-3"><strong class="block text-2xl text-neon">${gainers}</strong><span class="text-xs font-bold text-cyan-100/50">Gainers</span></span>
        <span class="border border-cyan-200/10 bg-white/[0.04] p-3"><strong class="block text-2xl text-skyline">${watchCount}</strong><span class="text-xs font-bold text-cyan-100/50">Saved</span></span>
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
        <article class="grid gap-4 border-t border-cyan-200/10 p-4 transition hover:bg-neon/[0.055] md:grid-cols-[minmax(240px,1.7fr)_1fr_.75fr_1fr_auto] md:items-center">
          <div class="flex items-center gap-3">
            <img class="size-11 border border-cyan-200/10 bg-white/10" src="${escapeHtml(coin.image)}" alt="${escapeHtml(coin.name)} logo" />
            <div>
              <strong class="block text-base text-cyan-50">${escapeHtml(coin.name)}</strong>
              <span class="text-sm font-black uppercase tracking-[0.12em] text-skyline">${escapeHtml(coin.symbol)}</span>
            </div>
          </div>
          <strong class="text-cyan-50">${formatCurrency(coin.price)}</strong>
          <span class="${coin.change24h >= 0 ? "text-neon" : "text-danger"} font-black">${coin.change24h >= 0 ? "+" : ""}${coin.change24h}%</span>
          <span class="text-sm font-bold text-cyan-100/55">${formatDate(coin.createdAt)}</span>
          <button class="border ${watched ? "border-neon bg-neon text-void" : "border-cyan-200/15 bg-white/[0.04] text-cyan-100/70"} px-3 py-2 text-sm font-black transition hover:border-neon hover:text-neon" data-watch="${escapeHtml(id)}" aria-label="Toggle ${escapeHtml(coin.name)} watchlist">
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
      <section class="grid min-h-[620px] items-center gap-10 py-12 lg:grid-cols-[1.12fr_.88fr] lg:py-20">
        <div>
          <p class="mb-4 text-sm font-black uppercase tracking-[0.18em] text-neon">Dark neon trading desk</p>
          <h1 class="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-cyan-50 md:text-7xl lg:text-8xl">
            Crypto markets with <span class="text-neon neon-text">electric</span> clarity.
          </h1>
          <p class="mt-6 max-w-2xl text-lg leading-8 text-cyan-100/65">
            Track live API data, filter market movers, save a watchlist, and list new tokens through the protected MongoDB backend.
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <button class="${ui.primary}" data-nav="${state.user ? "profile" : "register"}">${state.user ? "Open profile" : "Create account"}</button>
            <button class="${ui.secondary}" data-scroll="listing">List token</button>
            <button class="${ui.chip}" data-refresh="market">Refresh data</button>
          </div>
        </div>
        ${renderHeroStats(top, gainers, watchCount)}
      </section>

      <section class="pb-12">
        <div class="${ui.panel} overflow-hidden">
          <div class="grid gap-4 border-b border-cyan-200/10 p-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p class="mb-2 text-xs font-black uppercase tracking-[0.18em] text-skyline">Live API data</p>
              <h2 class="text-3xl font-black text-cyan-50 md:text-4xl">Tradable cryptocurrencies</h2>
            </div>
            <div class="flex flex-wrap gap-2">
              <button data-market="all" class="${state.marketMode === "all" ? ui.activeChip : ui.chip}">All</button>
              <button data-market="gainers" class="${state.marketMode === "gainers" ? ui.activeChip : ui.chip}">Gainers</button>
              <button data-market="new" class="${state.marketMode === "new" ? ui.activeChip : ui.chip}">New</button>
            </div>
          </div>

          <div class="grid gap-3 border-b border-cyan-200/10 p-5 md:grid-cols-[minmax(0,1fr)_220px]">
            <label class="sr-only" for="market-search">Search assets</label>
            <input id="market-search" class="${ui.input}" value="${escapeHtml(state.query)}" placeholder="Search Bitcoin, ETH, Solana..." data-search="market" />
            <select class="border border-cyan-200/15 bg-panel px-4 py-3 font-black text-cyan-50" data-sort="market" aria-label="Sort assets">
              <option value="change" ${state.sortBy === "change" ? "selected" : ""}>Sort: 24h change</option>
              <option value="price" ${state.sortBy === "price" ? "selected" : ""}>Sort: price</option>
              <option value="new" ${state.sortBy === "new" ? "selected" : ""}>Sort: newest</option>
              <option value="name" ${state.sortBy === "name" ? "selected" : ""}>Sort: name</option>
            </select>
          </div>

          <div class="hidden grid-cols-[minmax(240px,1.7fr)_1fr_.75fr_1fr_auto] gap-4 bg-white/[0.03] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-cyan-100/45 md:grid">
            <span>Asset</span><span>Price</span><span>24h</span><span>Listed</span><span>Watch</span>
          </div>
          ${renderAssetRows(visibleCrypto)}
        </div>
      </section>

      <section class="grid gap-8 pb-16 lg:grid-cols-[.8fr_1fr]" id="listing">
        <div class="py-2">
          <p class="mb-3 text-xs font-black uppercase tracking-[0.18em] text-neon">Protected action</p>
          <h2 class="text-3xl font-black text-cyan-50 md:text-5xl">List a new cryptocurrency</h2>
          <p class="mt-5 max-w-xl text-lg leading-8 text-cyan-100/60">
            The form saves to MongoDB through <code class="text-neon">POST /crypto</code>. Guests are sent to login before the protected API call is made.
          </p>
        </div>
        <form class="${ui.panelStrong} grid gap-4 p-5 md:grid-cols-2" data-form="crypto">
          <label class="${ui.label}">Name<input class="${ui.input}" name="name" placeholder="Polygon" required /></label>
          <label class="${ui.label}">Symbol<input class="${ui.input}" name="symbol" placeholder="MATIC" required /></label>
          <label class="${ui.label}">Price<input class="${ui.input}" name="price" type="number" min="0" step="0.0001" placeholder="0.72" required /></label>
          <label class="${ui.label}">24h Change %<input class="${ui.input}" name="change24h" type="number" step="0.01" placeholder="+2.50" required /></label>
          <label class="${ui.label} md:col-span-2">Image URL<input class="${ui.input}" name="image" type="url" placeholder="https://assets.coincap.io/assets/icons/matic@2x.png" required /></label>
          <button class="${ui.primary} md:col-span-2" type="submit">Add cryptocurrency</button>
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
        <p class="mb-4 text-sm font-black uppercase tracking-[0.18em] text-neon">${isRegister ? "Start trading" : "Welcome back"}</p>
        <h1 class="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight text-cyan-50 md:text-7xl">
          ${isRegister ? "Create your secure crypto account." : "Sign in to continue."}
        </h1>
        <p class="mt-6 max-w-xl text-lg leading-8 text-cyan-100/60">
          JWT authentication is stored in an HTTP-only cookie by the API, with a local token fallback for development demos.
        </p>
      </section>
      <form class="${ui.panelStrong} grid gap-4 p-6" data-form="${mode}">
        <h2 class="text-3xl font-black text-cyan-50">${isRegister ? "Register" : "Login"}</h2>
        ${isRegister ? `<label class="${ui.label}">Name<input class="${ui.input}" name="name" autocomplete="name" placeholder="Ada Lovelace" required /></label>` : ""}
        <label class="${ui.label}">Email<input class="${ui.input}" name="email" type="email" autocomplete="email" placeholder="you@example.com" required /></label>
        <label class="${ui.label}">Password<input class="${ui.input}" name="password" type="password" autocomplete="${isRegister ? "new-password" : "current-password"}" placeholder="At least 6 characters" required /></label>
        <button class="${ui.primary}" type="submit">${isRegister ? "Create account" : "Log in"}</button>
        <p class="text-sm font-bold text-cyan-100/55">
          ${isRegister ? "Already have an account?" : "Need an account?"}
          <button class="font-black text-neon hover:text-neon-soft" type="button" data-nav="${isRegister ? "login" : "register"}">${isRegister ? "Log in" : "Register"}</button>
        </p>
      </form>
    </main>
  `);
}

function renderProfile() {
  return shell(`
    <main class="${ui.page} grid min-h-[calc(100vh-80px)] place-items-center py-12">
      <section class="${ui.panelStrong} w-full max-w-3xl p-7">
        <div class="grid gap-6 md:grid-cols-[96px_1fr] md:items-center">
          <div class="grid size-24 place-items-center border border-neon bg-neon text-4xl font-black text-void shadow-[0_0_34px_rgba(0,255,136,0.32)]">
            ${escapeHtml(state.user.name.slice(0, 1).toUpperCase())}
          </div>
          <div>
            <p class="mb-2 text-xs font-black uppercase tracking-[0.18em] text-neon">Protected profile</p>
            <h1 class="text-4xl font-black text-cyan-50 md:text-6xl">${escapeHtml(state.user.name)}</h1>
            <p class="mt-3 text-lg text-cyan-100/60">${escapeHtml(state.user.email)}</p>
          </div>
        </div>
        <dl class="mt-8 grid gap-3">
          <div class="grid gap-2 border-t border-cyan-200/10 pt-4 md:grid-cols-[140px_1fr]"><dt class="font-black text-cyan-100/45">User ID</dt><dd class="break-all font-bold text-cyan-50">${escapeHtml(state.user.id)}</dd></div>
          <div class="grid gap-2 border-t border-cyan-200/10 pt-4 md:grid-cols-[140px_1fr]"><dt class="font-black text-cyan-100/45">Joined</dt><dd class="font-bold text-cyan-50">${formatDate(state.user.createdAt)}</dd></div>
          <div class="grid gap-2 border-t border-cyan-200/10 pt-4 md:grid-cols-[140px_1fr]"><dt class="font-black text-cyan-100/45">Auth</dt><dd class="font-bold text-neon">Valid JWT session</dd></div>
          <div class="grid gap-2 border-t border-cyan-200/10 pt-4 md:grid-cols-[140px_1fr]"><dt class="font-black text-cyan-100/45">Watchlist</dt><dd class="font-bold text-skyline">${state.watchlist.length} saved assets</dd></div>
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
  document.querySelector("[data-action='logout']")?.addEventListener("click", logout);
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
}

render();
loadCrypto();
loadProfile({ silent: true });

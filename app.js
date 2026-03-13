/* ============================================================
   PLAIO マイページ v2 — SPA ルーター & ページレンダラー
   ============================================================ */
'use strict';

/* ---- ユーティリティ ---- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const el = (tag, cls, html = '') => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
};
const fmt = n => '¥' + Number(n).toLocaleString('ja-JP');
const fmtPt = n => Number(n).toLocaleString('ja-JP') + 'pt';

/* ---- メンバー/プラン色分け ---- */
const MEMBER_COLORS = ['#6C5CE7', '#e17055', '#00b894', '#0984e3', '#d63031', '#fdcb6e', '#6c5ce7', '#00cec9'];
const PLAN_COLORS = { 'voice': '#6C5CE7', 'data': '#0984e3', 'kake': '#e17055', 'wimax': '#00b894', 'care': '#d63031' };
function getMemberColor(memberId) {
  if (memberId === 'owner') return MEMBER_COLORS[0];
  const idx = STATE.familyMembers.findIndex(m => m.id === memberId);
  return MEMBER_COLORS[(idx + 1) % MEMBER_COLORS.length];
}
function getPlanColor(planId) {
  if (!planId) return '#374151';
  const prefix = planId.split('-')[0];
  return PLAN_COLORS[prefix] || '#374151';
}

/* ---- トースト通知 ---- */
function showToast(message, duration = 3000) {
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => { toast.remove(); }, duration);
}

/* ---- カルーセル ---- */
let carouselIdx = 0;
let carouselTimer = null;

/* ---- ルーター ---- */
const ROUTES = {
  login: renderLogin,
  dashboard: renderDashboard,
  billing: renderBilling,
  points: renderPoints,
  'points-member': renderPointsMember,
  links: renderLinks,
  'family-group': renderFamilyGroup,
  'services-sim': renderServiceSIM,
  'services-wimax': renderServiceWiMAX,
  'services-care': renderServiceCare,
  profile: renderProfile,
};

function navigate(route, params = {}) {
  if (params.id) location.hash = `#/${route}/${params.id}`;
  else location.hash = `#/${route}`;
}

function handleRoute() {
  const hash = location.hash.replace(/^#\//, '') || 'login';
  const parts = hash.split('/');
  let route, id;

  if (parts[0] === 'points' && parts[1] === 'member') {
    route = 'points-member'; id = parts[2] || null;
  } else if (parts[0] === 'family-group' || (parts[0] === 'family' && parts[1] === 'group')) {
    route = 'family-group'; id = null;
  } else if (parts[0] === 'services') {
    const sub = parts[1] || 'sim';
    if (sub === 'smartphone-care') route = 'services-care';
    else if (sub === 'wimax') route = 'services-wimax';
    else route = 'services-sim';
    id = null;
  } else {
    route = parts[0]; id = parts[1] || null;
  }

  if (route !== 'login' && !STATE.loggedIn) {
    location.hash = '#/login';
    return;
  }

  if (carouselTimer) { clearInterval(carouselTimer); carouselTimer = null; }

  const sidebar = $('#app-sidebar');
  const mainWrap = $('#main-wrap');
  const loginPage = $('#page-login');

  if (route === 'login') {
    sidebar.style.display = 'none';
    mainWrap.style.display = 'none';
    loginPage.style.display = 'flex';
  } else {
    sidebar.style.display = 'flex';
    mainWrap.style.display = 'block';
    loginPage.style.display = 'none';
    let activeRoute = route;
    if (route === 'points-member') activeRoute = 'points';
    if (route.startsWith('services-')) activeRoute = 'services';
    updateSidebarActive(activeRoute);
    updateServiceSubActive(route);
  }

  if (route === 'login') {
    renderLogin();
    return;
  }

  const main = $('#main-content');
  main.innerHTML = '';
  const renderer = ROUTES[route];
  if (renderer) renderer(main, id);
  else main.innerHTML = '<div style="padding:40px;text-align:center;color:#9ca3af;">ページが見つかりません</div>';
}

function updateSidebarActive(route) {
  $$('.sidebar-nav > a, .sidebar-nav > .nav-group > a').forEach(a => {
    a.classList.toggle('active', a.dataset.route === route);
  });
}

function updateServiceSubActive(route) {
  $$('.service-sub a').forEach(a => {
    a.classList.toggle('active', a.dataset.route === route);
  });
}

window.addEventListener('hashchange', handleRoute);
window.addEventListener('DOMContentLoaded', () => {
  renderSidebar();
  handleRoute();
});

/* ============================================================
   サイドバー
   ============================================================ */
function renderSidebar() {
  const sb = $('#app-sidebar');
  sb.innerHTML = `
    <div class="sidebar-logo">PLAIO</div>
    <div class="sidebar-user">
      <div class="sidebar-avatar">${STATE.currentUser ? STATE.currentUser.name[0] : '山'}</div>
      <div class="sidebar-user-info">
        <div class="sidebar-user-name">${STATE.currentUser ? STATE.currentUser.name : '山田太郎'}</div>
        <div class="sidebar-user-email">${STATE.currentUser ? STATE.currentUser.email : 'yamada@example.com'}</div>
      </div>
    </div>
    <nav class="sidebar-nav">
      <a href="#/dashboard" data-route="dashboard">
        <span class="nav-icon">🏠</span>TOP
      </a>
      <div class="nav-group">
        <a href="javascript:void(0)" data-route="services" id="nav-services-toggle">
          <span class="nav-icon">📦</span>サービス<span class="nav-arrow" id="nav-services-arrow">▸</span>
        </a>
        <div class="service-sub" id="service-sub" style="display:none;">
          <a href="#/services/sim" data-route="services-sim">SIM</a>
          <a href="#/services/wimax" data-route="services-wimax">WiMAX</a>
          <a href="#/services/smartphone-care" data-route="services-care">スマホケア</a>
        </div>
      </div>
      <a href="#/billing" data-route="billing">
        <span class="nav-icon">📄</span>明細
      </a>
      <a href="#/points" data-route="points">
        <span class="nav-icon">⭐</span>ポイント
      </a>
      <a href="#/links" data-route="links">
        <span class="nav-icon">🔗</span>紐づけ
      </a>
      <a href="#/family-group" data-route="family-group">
        <span class="nav-icon">👨‍👩‍👧</span>家族グループ
      </a>
      <a href="#/profile" data-route="profile">
        <span class="nav-icon">👤</span>プロフィール
      </a>
    </nav>
    <div class="sidebar-logout">
      <button id="btn-logout"><span>🚪</span>ログアウト</button>
    </div>
  `;

  $('#nav-services-toggle').addEventListener('click', () => {
    const sub = $('#service-sub');
    const arrow = $('#nav-services-arrow');
    if (sub.style.display === 'none') {
      sub.style.display = 'block';
      arrow.textContent = '▾';
    } else {
      sub.style.display = 'none';
      arrow.textContent = '▸';
    }
  });

  $('#btn-logout').addEventListener('click', () => {
    STATE.loggedIn = false;
    STATE.accountCreated = false;
    STATE.loginStep = 0;
    STATE.currentUser = null;
    STATE._regData = null;
    STATE.myServices = { SIM: [], WiMAX: [], スマホケア: [] };
    STATE.familyGroups = [];
    STATE.familyMembers = [];
    STATE.familyMemberCount = 0;
    location.hash = '#/login';
  });
}

/* ============================================================
   【修正5】ログイン / アカウント作成
   loginStep === 0: PLAIOロゴ + タイトル + 「作成する」ボタンのみ
   loginStep === 1: サービスログイン — ボタン「ログインしてアカウントを作る」
   loginStep === 2: 完了画面（現状維持）
   ============================================================ */
function renderLogin() {
  const card = $('.login-card');
  if (STATE.loginStep === 0) {
    card.innerHTML = `
      <div class="login-logo">PLAIO</div>
      <div class="login-subtitle">PLAIOアカウントを作成する</div>
      <button id="btn-login" class="btn-primary">作成する</button>
    `;
    $('#btn-login').addEventListener('click', () => {
      STATE.loginStep = 1;
      renderLogin();
    });
  } else if (STATE.loginStep === 1) {
    card.innerHTML = `
      <div class="login-logo">PLAIO</div>
      <div class="login-subtitle">アカウント情報を入力してください</div>
      <div class="form-group">
        <label class="form-label">お名前</label>
        <input id="reg-name" class="form-input" type="text" placeholder="山田太郎" value="山田太郎">
      </div>
      <div class="form-group">
        <label class="form-label">住所</label>
        <input id="reg-address" class="form-input" type="text" placeholder="東京都渋谷区..." value="東京都渋谷区神宮前1-2-3">
      </div>
      <div class="form-group">
        <label class="form-label">性別</label>
        <select id="reg-gender" class="form-input">
          <option value="男性" selected>男性</option>
          <option value="女性">女性</option>
          <option value="その他">その他</option>
          <option value="回答しない">回答しない</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">生年月日</label>
        <input id="reg-birthday" class="form-input" type="date" value="1990-05-15">
      </div>
      <div class="form-group">
        <label class="form-label">ユーザーID</label>
        <input id="reg-userid" class="form-input" type="text" placeholder="yamada_taro" value="yamada_taro">
      </div>
      <div class="form-group">
        <label class="form-label">パスワード</label>
        <input id="reg-password" class="form-input" type="password" placeholder="パスワードを設定" value="password123">
      </div>
      <button id="btn-register" class="btn-primary">アカウントを作成する</button>
    `;
    $('#btn-register').addEventListener('click', () => {
      STATE._regData = {
        name: $('#reg-name').value || '山田太郎',
        address: $('#reg-address').value || '東京都渋谷区神宮前1-2-3',
        gender: $('#reg-gender').value || '男性',
        birthday: $('#reg-birthday').value || '1990-05-15',
        userId: $('#reg-userid').value || 'yamada_taro',
      };
      STATE.loginStep = 2;
      renderLogin();
    });
  } else if (STATE.loginStep === 2) {
    const regName = STATE._regData ? STATE._regData.name : '山田太郎';
    card.innerHTML = `
      <div class="login-logo">PLAIO</div>
      <div class="login-complete-icon">✅</div>
      <div class="login-subtitle">PLAIOアカウントが作成されました</div>
      <p style="color:#6b7280;text-align:center;margin:8px 0 24px;">アカウント名: <strong>${regName}</strong><br>作成したアカウントにログインしてください。</p>
      <div class="form-group">
        <label class="form-label">ユーザーID</label>
        <input id="login-userid" class="form-input" type="text" placeholder="ユーザーIDを入力">
      </div>
      <div class="form-group">
        <label class="form-label">パスワード</label>
        <input id="login-password" class="form-input" type="password" placeholder="パスワードを入力">
      </div>
      <button id="btn-do-login" class="btn-primary">ログインする</button>
    `;
    $('#btn-do-login').addEventListener('click', () => {
      setupInitialService();
      location.hash = '#/dashboard';
    });
  }
}

/* ============================================================
   ダッシュボード
   ============================================================ */
function renderDashboard(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1>マイページ</h1>
      <div class="user-badge">${STATE.currentUser.name} 様 <span class="user-avatar-sm">山</span></div>
    </div>
  `;

  renderCarousel(container);
  renderBillingSummary(container);

  const fgSec = el('div', 'section-card');
  fgSec.innerHTML = `<div class="section-card-header"><span>👨‍👩‍👧</span>家族グループ</div>`;
  if (STATE.familyGroups.length === 0) {
    fgSec.innerHTML += `<p style="color:#9ca3af;margin:16px 0;">まだグループが作成されていません。</p>
      <button class="btn-purple" onclick="location.hash='#/family-group'">+ グループを作成する</button>`;
  } else {
    const g = STATE.familyGroups[0];
    fgSec.innerHTML += `<div class="card" style="margin-top:12px;"><div class="flex-between"><strong>${g.name}</strong>
      <span class="text-sm text-gray">メンバー: ${1 + STATE.familyMembers.length}人</span></div></div>`;
  }
  container.appendChild(fgSec);

  const nSec = el('div', 'section-card');
  const unread = NOTIFICATIONS.filter(n => n.unread).length;
  nSec.innerHTML = `<div class="section-card-header"><span>🔔</span>お知らせ ${unread ? `<span class="badge-red">${unread}</span>` : ''}</div>`;
  for (const n of NOTIFICATIONS) {
    const catCls = n.category === 'メンテナンス' ? 'badge-yellow' : n.category === '更新情報' ? 'badge-green' : 'badge-orange';
    nSec.innerHTML += `<div class="notif-card${n.unread ? ' notif-unread' : ''}">
      <div class="flex-between"><div><span class="notif-badge ${catCls}">${n.category}</span>
      <strong>${n.title}</strong></div><span class="text-sm text-gray">${n.date}</span></div>
      <p class="text-sm text-gray" style="margin:4px 0 0;">${n.body}</p></div>`;
  }
  container.appendChild(nSec);
}

function renderCarousel(container) {
  const sec = el('div', 'carousel-wrap');
  sec.innerHTML = `
    <button class="carousel-arrow carousel-prev">&lt;</button>
    <div class="carousel-track-wrap">
      <div class="carousel-track" style="transform:translateX(-${carouselIdx * 100}%)">
        ${BANNERS.map(b => `
          <div class="carousel-slide">
            <div class="banner-card">
              <h3>${b.title}</h3>
              <p>${b.subtitle}</p>
              <small>${b.period}</small>
              <div style="margin-top:12px;"><button class="btn-white-sm">詳細を見る</button></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    <button class="carousel-arrow carousel-next">&gt;</button>
    <div class="carousel-dots">${BANNERS.map((_, i) => `<span class="dot${i === carouselIdx ? ' active' : ''}" data-i="${i}"></span>`).join('')}</div>
  `;
  container.appendChild(sec);

  const track = sec.querySelector('.carousel-track');
  const dots = sec.querySelectorAll('.dot');
  const move = (idx) => {
    carouselIdx = ((idx % BANNERS.length) + BANNERS.length) % BANNERS.length;
    track.style.transform = `translateX(-${carouselIdx * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === carouselIdx));
  };
  sec.querySelector('.carousel-prev').onclick = () => move(carouselIdx - 1);
  sec.querySelector('.carousel-next').onclick = () => move(carouselIdx + 1);
  dots.forEach(d => d.onclick = () => move(+d.dataset.i));
  carouselTimer = setInterval(() => move(carouselIdx + 1), 5000);
}

/* ============================================================
   【修正10】renderBillingSummary — シェブロン + サービス行アコーディオン
   ============================================================ */
function renderBillingSummary(container) {
  const rawData = getBillingForMonth(STATE.billingMonth);
  // shareBillingがfalseのメンバーを除外
  rawData.members = rawData.members.filter(m => {
    if (m.id === 'owner') return true;
    const fm = STATE.familyMembers.find(x => x.id === m.id);
    return fm ? fm.shareBilling !== false : true;
  });
  rawData.total = rawData.members.reduce((s, m) => s + m.total, 0);
  const data = filterBilling(rawData, 'すべて');
  const sec = el('div', 'section-card');
  sec.innerHTML = `<div class="billing-header"><span>今月の請求額</span><span class="billing-total">${fmt(data.total)}</span></div>`;

  for (const m of data.members) {
    const card = el('div', 'member-card');
    card.innerHTML = `
      <div class="member-card-header" style="background:${SERVICE_COLORS.SIM.grad}">
        <div class="flex-between" style="width:100%;">
          <div><strong>${m.name}</strong> <span>${m.avatar}</span></div>
          <div class="flex-center" style="gap:8px;">
            <div style="text-align:right;"><span class="fw-700">${fmt(m.total)}</span><br><small>${m.billingDate}</small></div>
            <span class="member-chevron">▶</span>
          </div>
        </div>
      </div>
      <div class="member-card-body" style="display:none;"></div>
    `;
    const header = card.querySelector('.member-card-header');
    const body = card.querySelector('.member-card-body');
    const chevron = card.querySelector('.member-chevron');
    header.style.cursor = 'pointer';
    header.onclick = () => {
      const open = body.style.display !== 'none';
      body.style.display = open ? 'none' : 'block';
      chevron.classList.toggle('open', !open);
    };
    for (const s of m.services) {
      const svcEl = el('div', 'svc-row-expandable');
      svcEl.innerHTML = `
        <div class="svc-row svc-row-clickable">
          <div><strong>${s.planName}</strong><br><small class="text-gray">${SERVICE_ICONS[s.type]} ${s.type}</small></div>
          <div class="flex-center" style="gap:8px;"><span class="fw-700">${fmt(s.amount)}</span><span class="arrow-icon">▸</span></div>
        </div>
        <div class="svc-breakdown" style="display:none;">
          ${s.breakdown.map(b => `<div class="breakdown-row"><span>${b.label}</span><span>${fmt(b.amount)}</span></div>`).join('')}
          <div class="breakdown-row fw-700" style="border-top:1px solid #e5e7eb;padding-top:8px;"><span>合計</span><span>${fmt(s.amount)}</span></div>
        </div>
      `;
      const row = svcEl.querySelector('.svc-row-clickable');
      const bd = svcEl.querySelector('.svc-breakdown');
      const arrow = svcEl.querySelector('.arrow-icon');
      row.onclick = () => {
        const open = bd.style.display !== 'none';
        bd.style.display = open ? 'none' : 'block';
        arrow.textContent = open ? '▸' : '▾';
      };
      body.appendChild(svcEl);
    }
    const footerEl = el('div', '', `<div style="text-align:right;margin-top:8px;">
      <button class="btn-purple-sm" onclick="location.hash='#/billing'">明細ページへ →</button></div>`);
    body.appendChild(footerEl);
    sec.appendChild(card);
  }
  container.appendChild(sec);
}

/* ============================================================
   ご利用明細（shareBillingがfalseのメンバーを除外）
   ============================================================ */
function renderBilling(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1>ご利用明細</h1>
      <select id="billing-month" class="form-select-sm">
        ${BILLING_MONTHS.map(m => `<option${m === STATE.billingMonth ? ' selected' : ''}>${m}</option>`).join('')}
      </select>
    </div>
  `;

  const rawData = getBillingForMonth(STATE.billingMonth);
  // shareBillingがfalseのメンバーを除外（オーナーは常に表示）
  rawData.members = rawData.members.filter(m => {
    if (m.id === 'owner') return true;
    const fm = STATE.familyMembers.find(x => x.id === m.id);
    return fm ? fm.shareBilling !== false : true;
  });
  rawData.total = rawData.members.reduce((s, m) => s + m.total, 0);

  const data = filterBilling(rawData, STATE.billingFilter);

  const banner = el('div', 'billing-banner');
  banner.innerHTML = `<span>${STATE.billingMonth}</span><span class="billing-banner-total">${fmt(data.total)}</span>`;
  container.appendChild(banner);

  const tabs = el('div', 'filter-tabs');
  for (const f of ['すべて', 'SIM', 'WiMAX', 'スマホケア']) {
    const btn = el('button', 'filter-tab' + (f === STATE.billingFilter ? ' active' : ''), f);
    btn.onclick = () => {
      STATE.billingFilter = f;
      const mc = $('#main-content');
      mc.innerHTML = '';
      renderBilling(mc);
    };
    tabs.appendChild(btn);
  }
  container.appendChild(tabs);

  for (const m of data.members) {
    const card = el('div', 'member-card');
    card.innerHTML = `
      <div class="member-card-header" style="background:${SERVICE_COLORS.SIM.grad}">
        <div class="flex-between" style="width:100%;">
          <div><strong>${m.name}</strong> <span>${m.avatar}</span></div>
          <div style="text-align:right;"><span class="fw-700">${fmt(m.total)}</span><br><small>${m.billingDate}</small></div>
        </div>
      </div>
      <div class="member-card-body"></div>
    `;
    const body = card.querySelector('.member-card-body');
    for (const s of m.services) {
      const svcEl = el('div', 'svc-row-expandable');
      svcEl.innerHTML = `
        <div class="svc-row svc-row-clickable">
          <div><strong>${s.planName}</strong><br><small class="text-gray">${SERVICE_ICONS[s.type]} ${s.type}</small></div>
          <div class="flex-center" style="gap:8px;"><span class="fw-700">${fmt(s.amount)}</span><span class="arrow-icon">▸</span></div>
        </div>
        <div class="svc-breakdown" style="display:none;">
          ${s.breakdown.map(b => `<div class="breakdown-row"><span>${b.label}</span><span>${fmt(b.amount)}</span></div>`).join('')}
          <div class="breakdown-row fw-700" style="border-top:1px solid #e5e7eb;padding-top:8px;"><span>合計</span><span>${fmt(s.amount)}</span></div>
        </div>
      `;
      const row = svcEl.querySelector('.svc-row-clickable');
      const bd = svcEl.querySelector('.svc-breakdown');
      const arrow = svcEl.querySelector('.arrow-icon');
      row.onclick = () => {
        const open = bd.style.display !== 'none';
        bd.style.display = open ? 'none' : 'block';
        arrow.textContent = open ? '▸' : '▾';
      };
      body.appendChild(svcEl);
    }
    container.appendChild(card);
  }

  if (data.members.length === 0) {
    container.appendChild(el('div', 'empty-state', '<p>該当するサービスはありません</p>'));
  }

  $('#billing-month').onchange = (e) => {
    STATE.billingMonth = e.target.value;
    const mc = $('#main-content');
    mc.innerHTML = '';
    renderBilling(mc);
  };
}

/* ============================================================
   【修正9】ポイント概要 — 「ポイント明細」「ポイント利用」の2タブ
   sharePointsがfalseのメンバーを除外
   ============================================================ */
function renderPoints(container) {
  const members = getAllMembers();

  // sharePointsがfalseのメンバーをポイント集計から除外（オーナーは常に含む）
  const visibleMembers = members.filter(m => {
    if (m.id === 'owner') return true;
    const fm = STATE.familyMembers.find(x => x.id === m.id);
    return fm ? fm.sharePoints !== false : true;
  });

  const totalPts = visibleMembers.reduce((s, m) => s + getMemberPoints(m), 0);

  container.innerHTML = `
    <div class="page-header"><h1>ポイント</h1></div>
    <div class="points-hero" style="background:linear-gradient(135deg,#4a6cf7,#6c5ce7);">
      <div class="points-hero-label">総保有ポイント（家族全員）</div>
      <div class="points-hero-value">${fmtPt(totalPts)}</div>
      <div class="points-hero-sub">(${(totalPts / 10).toLocaleString('ja-JP')}円相当) <span class="rate-badge">10pt = 1円</span></div>
    </div>
  `;

  // タブ
  const tabs = el('div', 'points-tabs');
  tabs.innerHTML = `
    <button class="points-tab active" data-tab="detail">ポイント明細</button>
    <button class="points-tab" data-tab="usage">ポイント利用</button>
  `;
  container.appendChild(tabs);

  const tabContent = el('div', '');
  container.appendChild(tabContent);

  function showTab(tabName) {
    $$('.points-tab', container).forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
    tabContent.innerHTML = '';
    if (tabName === 'detail') {
      renderPointsDetail(tabContent, visibleMembers);
    } else {
      renderPointsUsage(tabContent, visibleMembers);
    }
  }

  tabs.querySelectorAll('.points-tab').forEach(t => {
    t.onclick = () => showTab(t.dataset.tab);
  });

  showTab('detail');
}

/* ---- ポイント明細タブ: メンバー別ポイント一覧 + 譲渡セクション ---- */
function renderPointsDetail(container, visibleMembers) {
  const memSec = el('div', 'section-card');
  memSec.innerHTML = `<div class="section-card-header"><span>👥</span>メンバー別ポイント</div>`;
  for (const m of visibleMembers) {
    const pts = getMemberPoints(m);
    const card = el('div', 'point-member-card');
    card.innerHTML = `
      <div class="flex-between">
        <div class="flex-center" style="gap:8px;">
          <span class="member-avatar-sm">${m.avatar}</span>
          <strong>${m.name}</strong>
        </div>
        <div class="flex-center" style="gap:10px;">
          <div style="text-align:right;">
            <span class="fw-700">${fmtPt(pts)}</span>
            <small class="text-gray"> (${(pts / 10).toLocaleString('ja-JP')}円相当)</small>
          </div>
          <span class="point-member-arrow">›</span>
        </div>
      </div>
    `;
    card.onclick = () => navigate('points/member', { id: m.id });
    memSec.appendChild(card);
  }
  container.appendChild(memSec);

  if (STATE.familyMembers.length > 0) {
    renderPointsTransfer(container, visibleMembers);
  }
}

/* ---- ポイント利用タブ ---- */
function renderPointsUsage(container, members) {
  for (const m of members) {
    const simTotal = (m.services.SIM || []).reduce((s, svc) => s + svc.amount, 0);
    const pts = getMemberPoints(m);

    const card = el('div', 'point-usage-card');
    card.innerHTML = `
      <div class="usage-header">
        <span class="member-avatar-sm">${m.avatar}</span>
        <strong>${m.name}</strong>
      </div>
      <div class="usage-row"><span class="label">SIM合計料金</span><span class="value">${fmt(simTotal)}/月</span></div>
      <div class="usage-row"><span class="label">保有ポイント</span><span class="value">${fmtPt(pts)}</span></div>
      <div class="usage-input-row">
        <span>利用ポイント:</span>
        <input type="number" class="usage-pt-input" data-member-id="${m.id}" value="${Math.min(pts, simTotal * 10)}" min="0" max="${pts}" step="10">
        <span>pt</span>
      </div>
      <div class="point-usage-result" data-result-id="${m.id}">
        ${formatUsageResult(pts, simTotal, Math.min(pts, simTotal * 10))}
      </div>
    `;
    container.appendChild(card);
  }

  // 入力変更時に結果を更新
  container.addEventListener('input', (e) => {
    if (!e.target.classList.contains('usage-pt-input')) return;
    const memberId = e.target.dataset.memberId;
    const m = members.find(x => x.id === memberId);
    const simTotal = (m.services.SIM || []).reduce((s, svc) => s + svc.amount, 0);
    const pts = getMemberPoints(m);
    const usePt = Math.min(pts, Math.max(0, +e.target.value));
    const resultEl = container.querySelector(`[data-result-id="${memberId}"]`);
    resultEl.innerHTML = formatUsageResult(pts, simTotal, usePt);
  });

  // 合計サマリー
  const totalSim = members.reduce((s, m) => s + (m.services.SIM || []).reduce((s2, svc) => s2 + svc.amount, 0), 0);
  const totalPts = members.reduce((s, m) => s + getMemberPoints(m), 0);
  const summary = el('div', 'section-card');
  summary.innerHTML = `
    <div class="section-card-header"><span>📊</span>合計サマリー</div>
    <div class="usage-row"><span class="label">SIM合計料金（全メンバー）</span><span class="value">${fmt(totalSim)}/月</span></div>
    <div class="usage-row"><span class="label">総保有ポイント</span><span class="value">${fmtPt(totalPts)}</span></div>
  `;
  container.appendChild(summary);
}

function formatUsageResult(pts, simTotal, usePt) {
  const yenEquiv = Math.floor(usePt / 10);
  const afterDiscount = Math.max(0, simTotal - yenEquiv);
  return `${fmtPt(usePt)}利用（${fmt(yenEquiv)}相当） → 実質 ${fmt(afterDiscount)}/月`;
}

/* ---- 【修正8】ポイント譲渡 — 管理者のみ譲渡元 ---- */
function renderPointsTransfer(container, members) {
  const sec = el('div', 'section-card');

  const ownerMember = members.find(m => m.id === 'owner') || members[0];
  const familyOnlyMembers = members.filter(m => m.id !== 'owner');

  sec.innerHTML = `
    <div class="section-card-header"><span>🔄</span>ポイント譲渡</div>
    <div class="transfer-form">
      <div class="form-group">
        <label class="form-label">譲渡元</label>
        <div class="form-input" style="background:#f3f4f6;border:none;">
          山田太郎 — ${fmtPt(getMemberPoints(ownerMember))}保有
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">譲渡先</label>
        <select id="tf-to" class="form-input">
          ${familyOnlyMembers.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">譲渡ポイント数（10pt単位）</label>
        <div class="spinner-wrap">
          <button class="spinner-btn" id="tf-minus">−</button>
          <input id="tf-amount" class="form-input spinner-input" type="number" value="100" min="10" step="10">
          <button class="spinner-btn" id="tf-plus">＋</button>
        </div>
        <small class="text-gray">保有ポイントの範囲内で譲渡できます（10pt単位）</small>
      </div>
      <button id="tf-submit" class="btn-primary" style="width:100%;">譲渡する</button>
      <div id="tf-message" class="transfer-message" style="display:none;"></div>
    </div>
  `;
  container.appendChild(sec);

  const toSel = sec.querySelector('#tf-to');
  const amtInput = sec.querySelector('#tf-amount');
  const msgEl = sec.querySelector('#tf-message');

  sec.querySelector('#tf-minus').onclick = () => {
    amtInput.value = Math.max(10, +amtInput.value - 10);
  };
  sec.querySelector('#tf-plus').onclick = () => {
    amtInput.value = +amtInput.value + 10;
  };

  // 譲渡実行 — fromIdは常に 'owner'
  sec.querySelector('#tf-submit').onclick = () => {
    const fromId = 'owner';
    const toId = toSel.value;
    const amount = Math.round(+amtInput.value / 10) * 10;

    if (!toId) {
      showTransferMsg(msgEl, 'error', '譲渡先を選択してください。');
      return;
    }
    if (amount < 10) {
      showTransferMsg(msgEl, 'error', '10pt以上を指定してください。');
      return;
    }

    const toMember = members.find(m => m.id === toId);
    const fromPts = getMemberPoints(ownerMember);

    // 残高チェック
    if (fromPts < amount) {
      showTransferMsg(msgEl, 'error', `山田太郎の保有ポイントが不足しています（保有: ${fmtPt(fromPts)}）。`);
      return;
    }

    addBonusPoints(fromId, -amount);
    addBonusPoints(toId, +amount);

    showTransferMsg(msgEl, 'success', `山田太郎から${toMember.name}へ${fmtPt(amount)}を譲渡しました。`);

    // ポイントページ再レンダリング
    setTimeout(() => {
      const mc = $('#main-content');
      mc.innerHTML = '';
      renderPoints(mc);
    }, 1200);
  };
}

function showTransferMsg(el, type, text) {
  el.className = `transfer-message ${type}`;
  el.textContent = text;
  el.style.display = 'block';
}

/* ============================================================
   【修正9B】メンバーポイント詳細 — 月別タブ追加
   ============================================================ */
function renderPointsMember(container, memberId) {
  const members = getAllMembers();
  const member = members.find(m => m.id === memberId);
  if (!member) { container.innerHTML = '<p>メンバーが見つかりません</p>'; return; }

  const pts = getMemberPoints(member);
  const simPts = calcPoints(member.services);
  const bonusPts = getBonusPoints(member.id);
  const allSvcs = getAllServicesOf(member.services);

  container.innerHTML = `
    <a href="#/points" class="back-link">← 戻る</a>
    <div class="points-member-hero" style="background:linear-gradient(135deg,#00b894,#55efc4);">
      <div class="points-hero-label">${member.name}</div>
      <div class="points-hero-value">${fmtPt(pts)}</div>
      <div class="points-hero-sub">(${(pts / 10).toLocaleString('ja-JP')}円相当) <span class="rate-badge">10pt = 1円</span></div>
    </div>
  `;

  // 月別タブ
  const monthTabs = el('div', 'month-tabs');
  const months = BILLING_MONTHS;
  for (const month of months) {
    const btn = el('button', 'month-tab' + (month === months[0] ? ' active' : ''), month.replace('分', ''));
    btn.dataset.month = month;
    monthTabs.appendChild(btn);
  }
  container.appendChild(monthTabs);

  const monthContent = el('div', 'section-card');
  container.appendChild(monthContent);

  function showMonth(monthLabel) {
    $$('.month-tab', container).forEach(t => t.classList.toggle('active', t.dataset.month === monthLabel));
    // getMonthlyPointsForMember は data.js で定義
    const pointData = getMonthlyPointsForMember(member, monthLabel);
    const total = pointData.reduce((s, d) => s + d.points, 0);
    monthContent.innerHTML = `
      <div class="section-card-header"><span>📊</span>${monthLabel.replace('分', '')} ポイント獲得</div>
      <table class="points-source-table">
        <thead><tr><th>ポイント種別</th><th style="text-align:right;">獲得ポイント</th></tr></thead>
        <tbody>
          ${pointData.map(d => `<tr><td>${d.source}</td><td style="text-align:right;">${fmtPt(d.points)}</td></tr>`).join('')}
          <tr class="total-row"><td>合計</td><td style="text-align:right;">${fmtPt(total)}</td></tr>
        </tbody>
      </table>
      <div style="text-align:center;margin-top:12px;">
        <button class="btn-purple-sm" id="btn-points-history-detail">ポイント履歴の詳細を見る</button>
      </div>
    `;
    monthContent.querySelector('#btn-points-history-detail').onclick = () => {
      alert('マイページのポイント履歴のところに遷移します');
    };
  }

  monthTabs.querySelectorAll('.month-tab').forEach(t => {
    t.onclick = () => showMonth(t.dataset.month);
  });
  showMonth(months[0]);

  // 契約サービス一覧（月別タブの下に配置）
  const svcSec = el('div', 'section-card');
  svcSec.innerHTML = `<div class="section-card-header"><span>📋</span>契約サービス一覧</div>`;
  if (allSvcs.length === 0) {
    svcSec.innerHTML += '<p class="text-gray" style="margin:12px 0;">紐づけ済みのサービスはありません</p>';
  }
  for (const s of allSvcs) {
    svcSec.innerHTML += `<div class="svc-row"><div><strong>${s.planName}</strong><br>
      <small class="text-gray">${SERVICE_ICONS[s.type]} ${s.type}</small></div>
      <span class="fw-700">${fmt(s.amount)}/月</span></div>`;
  }
  container.appendChild(svcSec);
}

/* ============================================================
   プロフィールページ
   ============================================================ */
function renderProfile(container) {
  const u = STATE.currentUser || {};
  const birthdayDisplay = u.birthday ? u.birthday.replace(/-/g, '/') : '';
  container.innerHTML = `
    <div class="section-card" style="margin-bottom:24px;">
      <div class="section-card-header"><span>👤</span>プロフィール情報</div>
      <div class="profile-info">
        <div class="profile-avatar">${u.name ? u.name[0] : '山'}</div>
        <div class="profile-fields">
          <div class="profile-row"><span class="profile-label">お名前</span><span class="profile-value">${u.name || '-'}</span></div>
          <div class="profile-row"><span class="profile-label">ユーザーID</span><span class="profile-value">${u.userId || '-'}</span></div>
          <div class="profile-row"><span class="profile-label">メールアドレス</span><span class="profile-value">${u.email || '-'}</span></div>
          <div class="profile-row"><span class="profile-label">住所</span><span class="profile-value">${u.address || '-'}</span></div>
          <div class="profile-row"><span class="profile-label">性別</span><span class="profile-value">${u.gender || '-'}</span></div>
          <div class="profile-row"><span class="profile-label">生年月日</span><span class="profile-value">${birthdayDisplay || '-'}</span></div>
        </div>
      </div>
    </div>
  `;
}

/* ============================================================
   【修正2】サービス紐づけ — 横並びカード + ランダムプラン
   【修正7】SIMボーナスポイント付与を削除
   ============================================================ */
function renderLinks(container) {
  container.innerHTML = `
    <div class="page-header"><h1>サービス紐づけ</h1>
      <div class="user-badge">${STATE.currentUser.name} <span class="user-avatar-sm">山</span></div>
    </div>
    <div class="info-box"><span class="info-border"></span>各サービスのアカウントを紐づけることで、一つのマイページからすべてのサービスを管理できます。</div>
  `;

  const grid = el('div', 'link-cards-grid');

  const configs = [
    { key: 'SIM',      label: 'SIM',      color: SERVICE_COLORS.SIM.bg,      grad: SERVICE_COLORS.SIM.grad,      icon: '📱' },
    { key: 'WiMAX',    label: 'WiMAX',    color: SERVICE_COLORS.WiMAX.bg,    grad: SERVICE_COLORS.WiMAX.grad,    icon: '📶' },
    { key: 'スマホケア', label: 'スマホケア', color: SERVICE_COLORS.スマホケア.bg, grad: SERVICE_COLORS.スマホケア.grad, icon: '🛡️' },
  ];

  for (const cfg of configs) {
    renderLinkCardH(grid, cfg);
  }

  container.appendChild(grid);
}

function renderLinkCardH(container, cfg) {
  const linked = STATE.myServices[cfg.key];
  const count = linked.length;

  const card = el('div', 'link-card-h');
  card.innerHTML = `
    <div class="link-card-h-header" style="background:${cfg.grad};">
      <div class="flex-between" style="width:100%;">
        <div class="flex-center" style="gap:8px;">
          <span style="font-size:24px;">${cfg.icon}</span>
          <strong style="font-size:16px;">${cfg.label}</strong>
        </div>
        <div class="flex-center" style="gap:6px;">
          ${count > 0 ? `<span class="link-badge">紐づけ済み ${count}件</span>` : ''}
          <span class="link-arrow">▸</span>
        </div>
      </div>
    </div>
    <div class="link-card-h-body" style="display:none;">
      ${count > 0 ? `<div class="linked-list">
        <div class="text-sm fw-700" style="margin-bottom:8px;">紐づけ済みサービス:</div>
        ${linked.map(s => `<div class="linked-item"><span>${SERVICE_ICONS[cfg.key]} ${s.planName}</span><span class="text-gray">${fmt(s.amount)}/月</span></div>`).join('')}
      </div>` : ''}
      <button class="link-menu-btn link-add-btn">+ アカウントを紐づける</button>
      <div class="link-form-area"></div>
    </div>
  `;

  const header = card.querySelector('.link-card-h-header');
  const body = card.querySelector('.link-card-h-body');
  const arrow = card.querySelector('.link-arrow');

  header.style.cursor = 'pointer';
  header.onclick = () => {
    const open = body.style.display !== 'none';
    body.style.display = open ? 'none' : 'block';
    arrow.textContent = open ? '▸' : '▾';
  };

  const addBtn = card.querySelector('.link-add-btn');
  const formArea = card.querySelector('.link-form-area');

  addBtn.onclick = () => {
    if (count >= 5) {
      formArea.innerHTML = '<p class="text-sm" style="color:#e17055;margin-top:8px;">最大5件まで紐づけできます。</p>';
      return;
    }
    formArea.innerHTML = buildLinkForm(cfg.key);
    formArea.style.display = 'block';

    formArea.querySelector('.btn-link-submit').onclick = () => {
      const phone = formArea.querySelector('input[type=tel]').value.trim();
      const pass = formArea.querySelector('input[type=password]').value;
      if (!phone || !pass) {
        formArea.querySelector('.link-form-error').style.display = 'block';
        return;
      }
      // ランダムプランで紐づけ
      addMyServiceRandom(cfg.key);
      // トースト通知表示（ページ遷移なし）
      const addedSvc = STATE.myServices[cfg.key][STATE.myServices[cfg.key].length - 1];
      showToast(`✅ ${cfg.label} 「${addedSvc.planName}」 が紐づけられました`);
      // 紐づけカードを再描画
      const mc = $('#main-content');
      mc.innerHTML = '';
      renderLinks(mc);
    };

    formArea.querySelector('.btn-link-cancel').onclick = () => {
      formArea.innerHTML = '';
    };
  };

  container.appendChild(card);
}

/* buildLinkForm — プラン選択なし、電話番号+パスワードのみ */
function buildLinkForm(serviceType) {
  return `
    <div class="link-form">
      <p class="text-sm text-gray" style="margin-bottom:12px;">${serviceType}サービスを紐づけます</p>
      <div class="form-group">
        <label class="form-label">電話番号</label>
        <input class="form-input" type="tel" placeholder="ハイフンなしで入力してください">
      </div>
      <div class="form-group">
        <label class="form-label">パスワード</label>
        <input class="form-input" type="password" placeholder="パスワードを入力">
      </div>
      <p class="link-form-error text-sm" style="color:#e17055;display:none;">電話番号とパスワードを入力してください。</p>
      <div class="link-form-btns">
        <button class="btn-link-submit btn-primary">紐づけする</button>
        <button class="btn-link-cancel btn-outline">キャンセル</button>
      </div>
    </div>
  `;
}

function findPlan(type, planId) {
  if (type === 'SIM') return ALL_SIM_PLANS.find(p => p.id === planId);
  if (type === 'WiMAX') return PLANS.WiMAX.find(p => p.id === planId);
  return PLANS.スマホケア.find(p => p.id === planId);
}

/* ============================================================
   家族グループ
   ============================================================ */
function renderFamilyGroup(container) {
  container.innerHTML = `
    <div class="page-header"><h1>家族グループ</h1>
      <div class="user-badge">${STATE.currentUser.name} <span class="user-avatar-sm">山</span></div>
    </div>
    <div class="info-box"><span class="info-border"></span>家族グループを作成して、家族メンバーを招待できます。</div>
  `;

  if (STATE.familyGroups.length === 0) {
    const btn = el('button', 'btn-purple', '+ グループを作成する');
    btn.onclick = () => showCreateGroupModal(container);
    container.appendChild(btn);
  } else {
    renderGroupDetail(container);
  }
}

function showCreateGroupModal(_pageContainer) {
  const overlay = $('#modal-overlay');
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header"><h3>グループを作成する</h3><button class="modal-close">&times;</button></div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">グループ名</label>
          <input id="group-name-input" class="form-input" placeholder="例: 山田家">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-primary" id="modal-create">作成する</button>
        <button class="btn-outline" id="modal-cancel">キャンセル</button>
      </div>
    </div>
  `;
  overlay.classList.add('active');
  const close = () => { overlay.classList.remove('active'); overlay.innerHTML = ''; };
  overlay.querySelector('.modal-close').onclick = close;
  overlay.querySelector('#modal-cancel').onclick = close;
  overlay.querySelector('#modal-create').onclick = () => {
    const name = overlay.querySelector('#group-name-input').value.trim() || '山田家';
    STATE.familyGroups.push({
      name,
      createdAt: '2026/3/12',
      invites: [],
    });
    close();
    const mc = $('#main-content');
    mc.innerHTML = '';
    renderFamilyGroup(mc);
  };
}

/* 【修正4】renderGroupDetail — 公開設定チェックボックス削除（受諾モーダルに移動）、メンバー削除ボタンは残す */
function renderGroupDetail(container) {
  const g = STATE.familyGroups[0];

  const sec = el('div', 'section-card');
  sec.innerHTML = `
    <div class="section-card-header"><span>👨‍👩‍👧</span>作成したグループ</div>
    <div class="group-card">
      <div class="flex-between">
        <div>
          <h3>${g.name}</h3>
          <div class="text-sm text-gray">作成者: ${STATE.currentUser.name} / メンバー: ${1 + STATE.familyMembers.length}人 / 作成日: ${g.createdAt}</div>
        </div>
      </div>
    </div>
  `;

  for (let i = 0; i < g.invites.length; i++) {
    const inv = g.invites[i];
    const accepted = inv.accepted;
    const invEl = el('div', 'invite-card');

    // 受諾済みメンバーを探す
    const fm = accepted ? STATE.familyMembers.find(m => m.name === inv.memberName) : null;

    invEl.innerHTML = `
      <div class="invite-header flex-between">
        <strong>招待 #${i + 1}</strong>
        ${accepted
          ? `<span class="link-badge" style="background:#d1fae5;color:#065f46;">受諾済み: ${inv.memberName}</span>`
          : '<span class="text-sm text-gray">未受諾</span>'}
      </div>
      ${!accepted ? `
        <div class="invite-url-section">
          <div class="invite-url-row">
            <input class="form-input invite-url-input" readonly value="${inv.url}">
            <button class="btn-purple-sm copy-btn">コピー</button>
          </div>
          <div class="invite-qr">
            ${generateQRPlaceholder(inv.url)}
            <small class="text-gray">スマートフォンで読み取って参加</small>
          </div>
          <button class="btn-demo-accept btn-outline" style="margin-top:8px;">（デモ）この招待を受諾する</button>
        </div>
      ` : `
        <div style="margin-top:8px;">
          <div class="text-sm">
            <strong>${inv.memberName}</strong>が <span class="fw-700">${inv.serviceType}</span> (${inv.planName}) で参加しました
          </div>
          ${fm ? `
          <div class="member-settings">
            <button class="delete-member-btn" data-invite-idx="${i}" data-member-id="${fm.id}">メンバーを削除する</button>
          </div>
          ` : ''}
        </div>
      `}
    `;
    sec.appendChild(invEl);

    if (!accepted) {
      invEl.querySelector('.copy-btn').onclick = () => {
        navigator.clipboard.writeText(inv.url).then(() => alert('URLをコピーしました'));
      };
      invEl.querySelector('.btn-demo-accept').onclick = () => {
        showAcceptModal(i, container);
      };
    }
  }

  // イベント委譲: メンバー削除ボタン
  sec.addEventListener('click', (e) => {
    const btn = e.target.closest('.delete-member-btn');
    if (!btn) return;
    const invIdx = +btn.dataset.inviteIdx;
    const memberId = btn.dataset.memberId;
    if (!confirm('このメンバーをグループから削除しますか？')) return;

    // STATE.familyMembers から削除
    STATE.familyMembers = STATE.familyMembers.filter(m => m.id !== memberId);

    // 招待をリセット
    const inv = g.invites[invIdx];
    if (inv) {
      inv.accepted = false;
      inv.memberName = null;
      inv.serviceType = null;
      inv.planName = null;
    }

    const mc = $('#main-content');
    mc.innerHTML = '';
    renderFamilyGroup(mc);
  });

  // 招待ボタン文言: 0人 → 「招待する」、1人以上 → 「+ 別の人を招待する」
  const hasMembers = STATE.familyMembers.length > 0;
  const invBtnLabel = hasMembers ? '+ 別の人を招待する' : '招待する';
  const invBtn = el('button', 'btn-purple', invBtnLabel);
  invBtn.style.marginTop = '16px';
  invBtn.onclick = () => {
    const invId = genInviteId();
    g.invites.push({
      id: invId,
      url: `https://plaio.jp/invite/${invId}`,
      accepted: false,
      memberName: null,
      serviceType: null,
      planName: null,
    });
    const mc = $('#main-content');
    mc.innerHTML = '';
    renderFamilyGroup(mc);
  };
  sec.appendChild(invBtn);
  container.appendChild(sec);
}

/* 【修正4・5】showAcceptModal — タイトル「招待を受諾する」、ボタン「招待を受諾する」、公開設定チェックボックス追加 */
function showAcceptModal(inviteIdx, _pageContainer) {
  const overlay = $('#modal-overlay');
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header"><h3>招待を受諾する</h3><button class="modal-close">&times;</button></div>
      <div class="modal-body">
        <p style="margin-bottom:16px;">この家族グループに招待されています。<br>お持ちのサービスでログインしてください。</p>
        <div class="form-group">
          <label class="form-label">サービス選択</label>
          <select id="accept-svc" class="form-input">
            <option value="SIM">SIM</option>
            <option value="WiMAX">WiMAX</option>
            <option value="スマホケア">スマホケア</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">電話番号</label>
          <input class="form-input" type="tel" placeholder="09012345678">
        </div>
        <div class="form-group">
          <label class="form-label">パスワード</label>
          <input class="form-input" type="password" placeholder="パスワードを入力">
        </div>
        <div class="member-settings" style="margin-top:16px;">
          <div class="text-sm fw-700" style="margin-bottom:8px;">公開設定</div>
          <div class="member-setting-row">
            <label><input type="checkbox" id="accept-share-billing" checked> 料金明細を公開する</label>
          </div>
          <div class="member-setting-row">
            <label><input type="checkbox" id="accept-share-points" checked> ポイントを公開する</label>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-primary" id="accept-submit">招待を受諾する</button>
        <button class="btn-outline" id="accept-cancel">キャンセル</button>
      </div>
    </div>
  `;
  overlay.classList.add('active');

  const svcSel = overlay.querySelector('#accept-svc');
  const close = () => { overlay.classList.remove('active'); overlay.innerHTML = ''; };
  overlay.querySelector('.modal-close').onclick = close;
  overlay.querySelector('#accept-cancel').onclick = close;

  overlay.querySelector('#accept-submit').onclick = () => {
    const type = svcSel.value;
    const shareBilling = overlay.querySelector('#accept-share-billing').checked;
    const sharePoints = overlay.querySelector('#accept-share-points').checked;
    // ランダムプランで家族メンバー追加
    const plan = getRandomPlan(type);
    const newMember = addFamilyMember(type, plan);
    newMember.shareBilling = shareBilling;
    newMember.sharePoints = sharePoints;
    const g = STATE.familyGroups[0];
    const inv = g.invites[inviteIdx];
    inv.accepted = true;
    inv.memberName = newMember.name;
    inv.serviceType = type;
    inv.planName = plan.name;

    close();
    const mc = $('#main-content');
    mc.innerHTML = '';
    renderFamilyGroup(mc);
  };
}

function generateQRPlaceholder(url) {
  const size = 120;
  const cells = 11;
  const cellSize = size / cells;
  let rects = '';
  let seed = 0;
  for (let i = 0; i < url.length; i++) seed = ((seed << 5) - seed + url.charCodeAt(i)) | 0;
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if ((r < 3 && c < 3) || (r < 3 && c >= cells - 3) || (r >= cells - 3 && c < 3)) {
        rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#000"/>`;
      } else {
        seed = (seed * 16807 + 0) % 2147483647;
        if (seed % 3 === 0) {
          rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#000"/>`;
        }
      }
    }
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="border:4px solid #fff;background:#fff;">${rects}</svg>`;
}

/* ============================================================
   サービスページ — SIM / WiMAX / スマホケア
   ============================================================ */
function renderServiceSIM(container) {
  openServiceSubMenu();
  renderServicePage(container, 'SIM', {
    title: 'SIMサービス',
    color: SERVICE_COLORS.SIM,
    icon: '📱',
    desc: 'PLAIO SIMサービスの新規お申し込み・プラン変更はこちら',
    productPage: renderSIMProductPage,
  });
}

function renderServiceWiMAX(container) {
  openServiceSubMenu();
  renderServicePage(container, 'WiMAX', {
    title: 'WiMAXサービス',
    color: SERVICE_COLORS.WiMAX,
    icon: '📶',
    desc: 'PLAIO WiMAXサービスの新規お申し込みはこちら',
    productPage: renderWiMAXProductPage,
  });
}

function renderServiceCare(container) {
  openServiceSubMenu();
  renderServicePage(container, 'スマホケア', {
    title: 'スマホケアサービス',
    color: SERVICE_COLORS.スマホケア,
    icon: '🛡️',
    desc: 'スマホケア保険サービスのお申し込みはこちら',
    productPage: renderCareProductPage,
  });
}

function openServiceSubMenu() {
  const sub = $('#service-sub');
  const arrow = $('#nav-services-arrow');
  if (sub) { sub.style.display = 'block'; arrow.textContent = '▾'; }
}

/* 【修正1・2・3】renderServicePage — 契約単位ドロップダウン、リンク簡略化、タイトル・説明文変更 */
function renderServicePage(container, serviceType, cfg) {
  const members = getAllMembers();
  const contractMembers = members.filter(m => (m.services[serviceType] || []).length > 0);
  const hasContracts = contractMembers.length > 0;

  // 【修正3】タイトル・説明文を上書き
  if (serviceType === 'SIM') {
    if (hasContracts) { cfg.title = 'SIMサービス マイページ'; cfg.desc = 'PLAIO SIMのサービスのマイページです'; }
    else { cfg.title = 'SIMサービス 商品ページ'; cfg.desc = 'PLAIO SIMの商品ページです'; }
  } else if (serviceType === 'WiMAX') {
    if (hasContracts) { cfg.title = 'WiMAX マイページ'; cfg.desc = 'PLAIO WiMAXのマイページが表示されます'; }
    else { cfg.title = 'WiMAXの 商品ページ'; }
  } else if (serviceType === 'スマホケア') {
    if (hasContracts) { cfg.title = 'スマホケア マイページ'; }
    else { cfg.title = 'スマホケア 商品ページ'; }
  }

  // 【修正1】契約単位でオプションを生成
  const allContracts = [];
  for (const m of contractMembers) {
    const svcs = m.services[serviceType] || [];
    svcs.forEach((svc, idx) => {
      allContracts.push({ member: m, svc, idx });
    });
  }

  const buildContractOptions = () => {
    return allContracts.map((c, i) => {
      let label;
      if (serviceType === 'SIM') {
        label = `${c.member.name} - ${c.svc.planName}`;
      } else if (serviceType === 'WiMAX') {
        const sameCount = allContracts.filter(x => x.member.id === c.member.id && x.svc.planName === c.svc.planName);
        if (sameCount.length > 1) {
          const myIdx = sameCount.indexOf(c) + 1;
          label = `${c.member.name} - ${c.svc.planName} ${myIdx}`;
        } else {
          label = `${c.member.name} - ${c.svc.planName}`;
        }
      } else { // スマホケア
        label = `${c.member.name} - スマホケア${c.svc.planName}`;
      }
      return `<option value="${c.member.id}:${c.idx}">${label}</option>`;
    }).join('');
  };

  container.innerHTML = `
    <div class="svc-page-top">
      <div class="svc-account-switcher" id="svc-switcher">
        <span>${cfg.icon} ${serviceType}アカウント</span>
        ${hasContracts ? `<select id="svc-account-select" class="form-select-sm">
          ${buildContractOptions()}
        </select>` : '<span class="text-gray text-sm">契約なし</span>'}
      </div>
      <div class="svc-page-links">
        ${!hasContracts
          ? `<button class="btn-purple-sm" onclick="location.hash='#/links'">サービスを紐付ける</button>`
          : `<a href="javascript:void(0)" id="lnk-product-page">商品ページを見る →</a>`}
      </div>
    </div>
    <div class="svc-hero" style="background:${cfg.color.grad}">
      <div style="font-size:28px;">${cfg.icon}</div>
      <h2>${cfg.title}</h2>
      <p>${cfg.desc}</p>
    </div>
  `;

  const contentArea = el('div', 'svc-content');
  container.appendChild(contentArea);

  // 初期表示
  if (hasContracts && allContracts.length > 0) {
    renderContractView(contentArea, allContracts[0].member, serviceType, cfg, allContracts[0].idx);
  } else {
    cfg.productPage(contentArea);
  }

  // 【修正1】アカウント切り替え（契約単位）
  const sel = container.querySelector('#svc-account-select');
  if (sel) {
    sel.onchange = () => {
      const [memberId, svcIdx] = sel.value.split(':');
      const m = members.find(x => x.id === memberId);
      contentArea.style.opacity = '0';
      contentArea.style.transform = 'translateY(8px)';
      setTimeout(() => {
        contentArea.innerHTML = '';
        if (m) renderContractView(contentArea, m, serviceType, cfg, +svcIdx);
        contentArea.style.transition = 'opacity .3s ease, transform .3s ease';
        contentArea.style.opacity = '1';
        contentArea.style.transform = 'translateY(0)';
      }, 150);
    };
  }

  // 【修正15】商品ページリンク — 全サービス同一タブ内表示（契約済み時のみ）
  const heroH2 = container.querySelector('.svc-hero h2');
  const heroP = container.querySelector('.svc-hero p');
  const savedTitle = cfg.title;
  const savedDesc = cfg.desc;
  const productTitle = serviceType === 'SIM' ? 'SIMサービス 商品ページ'
    : serviceType === 'WiMAX' ? 'WiMAXの 商品ページ'
    : 'スマホケア 商品ページ';
  const productDesc = serviceType === 'SIM' ? 'PLAIO SIMの商品ページです'
    : serviceType === 'WiMAX' ? 'PLAIO WiMAXの商品ページです'
    : 'PLAIOスマホケアの商品ページです';

  const lnkProduct = container.querySelector('#lnk-product-page');
  if (lnkProduct) lnkProduct.onclick = () => {
    contentArea.innerHTML = '';
    cfg.productPage(contentArea);
    if (heroH2) heroH2.textContent = productTitle;
    if (heroP) heroP.textContent = productDesc;
    if (hasContracts) {
      const backLink = el('div', '', `<a href="javascript:void(0)" class="back-link lnk-back-mypage">← マイページに戻る</a>`);
      contentArea.prepend(backLink);
      contentArea.querySelector('.lnk-back-mypage').onclick = () => {
        contentArea.innerHTML = '';
        if (heroH2) heroH2.textContent = savedTitle;
        if (heroP) heroP.textContent = savedDesc;
        if (allContracts.length > 0) {
          renderContractView(contentArea, allContracts[0].member, serviceType, cfg, allContracts[0].idx);
        }
      };
    }
  };
}

/* 【修正3補足】renderContractView — SIMキャプション変更 + svcIdxパラメータ追加 */
function renderContractView(area, member, serviceType, cfg, svcIdx) {
  area.innerHTML = '';
  svcIdx = svcIdx || 0;

  if (serviceType === 'SIM') {
    // SIM: maimo-appのスクリーンショット画像をそのまま表示
    const svc = member.services['SIM'][svcIdx] || member.services['SIM'][0];
    area.innerHTML = `
      <div class="svc-image-page">
        <div class="svc-image-caption"><span class="caption-name" style="color:${getMemberColor(member.id)}">${member.name}</span>さんの <span class="caption-plan" style="color:${getPlanColor(svc ? svc.planId : '')}">${svc ? svc.planName + 'プラン' : 'SIM'}</span> のマイページ</div>
        <img src="img-sim-mypage.png" alt="SIMマイページ" class="svc-page-screenshot">
      </div>
    `;
  } else {
    // WiMAX・スマホケア: maimo風HTMLレイアウト
    const svcs = member.services[serviceType] || [];
    const mainSvc = svcs[svcIdx] || svcs[0];
    const total = mainSvc ? mainSvc.amount : 0;

    // スマホケアのプラン表示名
    const displayPlanName = serviceType === 'スマホケア' && mainSvc
      ? `スマホケア${mainSvc.planName}プラン`
      : (mainSvc ? mainSvc.planName : '契約なし');

    const banner = el('div', 'maimo-banner', `
      <div style="font-size:13px;margin-bottom:4px;"><span style="font-weight:700;background:rgba(255,255,255,.25);padding:1px 6px;border-radius:4px;">${member.name}</span>さんの${serviceType}契約</div>
      <div style="font-size:20px;font-weight:700;background:rgba(255,255,255,.15);display:inline-block;padding:2px 10px;border-radius:6px;">${displayPlanName}</div>
      <div style="font-size:15px;margin-top:4px;">${fmt(total)}<span style="font-size:12px;">/月</span></div>
    `);
    banner.style.background = cfg.color.grad;
    area.appendChild(banner);

    const categories = [
      { icon: '📋', label: 'プラン変更' },
      { icon: '➕', label: 'オプション' },
      { icon: '📊', label: '利用状況' },
      { icon: '💳', label: '支払い方法' },
      { icon: '📄', label: '契約情報' },
      { icon: '🔧', label: '各種手続き' },
    ];
    const catGrid = el('div', 'maimo-category-grid');
    for (const cat of categories) {
      catGrid.innerHTML += `
        <div class="maimo-category-item">
          <span class="maimo-cat-icon">${cat.icon}</span>
          <span class="maimo-cat-label">${cat.label}</span>
        </div>
      `;
    }
    area.appendChild(catGrid);

    const appPromo = el('div', 'maimo-app-promo', `
      <div class="maimo-app-promo-inner">
        <div>
          <div style="font-weight:700;margin-bottom:4px;">アプリでもっと便利に</div>
          <div style="font-size:13px;color:#6b7280;">PLAIOアプリでデータ残量・請求額をいつでも確認</div>
        </div>
        <button class="btn-purple-sm">ダウンロード</button>
      </div>
    `);
    area.appendChild(appPromo);

    const contentGrid = el('div', 'maimo-content-grid');
    contentGrid.innerHTML = `
      <div class="maimo-content-card">
        <div class="maimo-content-card-header">🎁 キャンペーン情報</div>
        <div class="maimo-content-card-body">
          <p class="text-sm">新規加入で3ヶ月間基本料金半額キャンペーン実施中！</p>
          <a href="#" class="text-sm" style="color:#6C5CE7;">詳細を見る →</a>
        </div>
      </div>
      <div class="maimo-content-card">
        <div class="maimo-content-card-header">🔔 お知らせ</div>
        <div class="maimo-content-card-body">
          <p class="text-sm">4月より新料金プランが開始されます。</p>
          <a href="#" class="text-sm" style="color:#6C5CE7;">詳細を見る →</a>
        </div>
      </div>
    `;
    area.appendChild(contentGrid);
  }
}

/* SIM 商品ページ — スクリーンショット画像を表示 */
function renderSIMProductPage(area) {
  area.innerHTML = `
    <div class="svc-image-page">
      <img src="img-sim-product.png" alt="センターモバイル SIM 商品ページ" class="svc-page-screenshot">
    </div>
  `;
}

/* WiMAX 商品ページ — スクリーンショット画像を表示 */
function renderWiMAXProductPage(area) {
  area.innerHTML = `
    <div class="svc-image-page">
      <img src="img-wimax-product.png" alt="PLAIO WiMAX 商品ページ" class="svc-page-screenshot">
    </div>
    <div style="text-align:center;margin-top:16px;">
      <button class="btn-purple" onclick="location.hash='#/links'">紐づけページへ</button>
    </div>
  `;
}

/* スマホケア 商品ページ — スクリーンショット画像を表示 */
function renderCareProductPage(area) {
  area.innerHTML = `
    <div class="svc-image-page">
      <img src="img-care-product.png" alt="スマホケア商品ページ" class="svc-page-screenshot">
    </div>

    <div style="text-align:center;margin-top:16px;">
      <button class="btn-purple" onclick="location.hash='#/links'">紐づけページへ</button>
    </div>
  `;
}

function renderPlanCards(groupName, plans) {
  return `<div class="plan-group-label">${groupName}</div>` +
    plans.map(p => `
      <div class="plan-card" style="border-color:#4a6cf7;">
        <div class="plan-card-name" style="background:#4a6cf7;">${p.name}</div>
        <div class="plan-card-price">${fmt(p.amount)}<small>/月(税込)</small></div>
      </div>
    `).join('');
}

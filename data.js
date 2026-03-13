// ============================================================
// PLAIO マイページ v2 — データ層
// ============================================================
'use strict';

// ---- 料金マスタ（税込） ---- //
const PLANS = {
  SIM: {
    voice: [
      { id: 'voice-3',  name: '音声SIM 3GB',  category: '音声SIM', amount: 1408 },
      { id: 'voice-12', name: '音声SIM 12GB', category: '音声SIM', amount: 1958 },
      { id: 'voice-20', name: '音声SIM 20GB', category: '音声SIM', amount: 2728 },
      { id: 'voice-50', name: '音声SIM 50GB', category: '音声SIM', amount: 4378 },
    ],
    data: [
      { id: 'data-3',  name: 'データSIM 3GB',  category: 'データSIM', amount: 1298 },
      { id: 'data-12', name: 'データSIM 12GB', category: 'データSIM', amount: 1848 },
      { id: 'data-20', name: 'データSIM 20GB', category: 'データSIM', amount: 2508 },
      { id: 'data-50', name: 'データSIM 50GB', category: 'データSIM', amount: 4158 },
    ],
    kakehoudai: [
      { id: 'kake-3',  name: 'かけ放題セット 3GB',  category: 'かけ放題', amount: 3278 },
      { id: 'kake-20', name: 'かけ放題セット 20GB', category: 'かけ放題', amount: 4070 },
      { id: 'kake-50', name: 'かけ放題セット 50GB', category: 'かけ放題', amount: 5478 },
    ],
  },
  WiMAX: [
    { id: 'wimax-2y',   name: '2年とくとくプラン',       amount: 4378, device: 770 },
    { id: 'wimax-free', name: '縛りなしシンプルプラン', amount: 4708, device: 770 },
  ],
  スマホケア: [
    { id: 'care-basic',    name: 'ベーシック',         amount: 770,  desc: '駆け付けサービス+スマホ保険' },
    { id: 'care-data',     name: '安心データプラス',   amount: 1078, desc: 'ベーシック+データバックアップ' },
    { id: 'care-security', name: 'セキュリティプラス', amount: 1078, desc: 'ベーシック+セキュリティ' },
    { id: 'care-max',      name: 'MAX',               amount: 1430, desc: 'ベーシック+セキュリティ+データバックアップ' },
  ],
};

// WiMAX オプション
const WIMAX_OPTIONS = [
  { id: 'ws-basic', name: '安心サポート',           amount: 330 },
  { id: 'ws-wide',  name: '安心サポートワイド',     amount: 660 },
  { id: 'ws-wplus', name: '安心サポートワイドプラス', amount: 880 },
];

// 全SIMプラン（フラット）
const ALL_SIM_PLANS = [...PLANS.SIM.voice, ...PLANS.SIM.data, ...PLANS.SIM.kakehoudai];

// ---- 定数データ ---- //
const BANNERS = [
  { title: '新規加入で3ヶ月間基本料金半額',         subtitle: 'SIMプラン新規加入で最大3ヶ月間基本料金が50%OFF！', period: '期間: 2026/1/1 〜 2026/9/30' },
  { title: 'WiMAX同時加入で5,000ポイントプレゼント', subtitle: 'SIMとWiMAXを同時契約で5,000ptをプレゼント！',       period: '期間: 2026/1/1 〜 2026/6/30' },
  { title: 'スマホケア初月無料キャンペーン',         subtitle: '新規オプション追加で初月利用料が無料に！',         period: '期間: 2026/2/1 〜 2026/4/30' },
];

const NOTIFICATIONS = [
  { category: 'メンテナンス', title: 'メンテナンス実施のお知らせ', body: '4月5日(日) 2:00〜4:00にシステムメンテナンスを実施いたします。', date: '2026/3/10', unread: true },
  { category: '更新情報',     title: '新料金プラン開始のお知らせ', body: '4月より新料金プランが開始されます。詳細はマイページでご確認ください。', date: '2026/3/5', unread: true },
  { category: 'キャンペーン', title: '春のキャンペーン開催中',     body: '春の新生活応援キャンペーン実施中！3月31日まで。',                     date: '2026/3/1', unread: false },
];

const BILLING_MONTHS = [
  '2026年3月分', '2026年2月分', '2026年1月分',
  '2025年12月分', '2025年11月分', '2025年10月分',
];

const FAMILY_PRESETS = [
  { name: '山田花子',       avatar: '花' },
  { name: '山田ゆうすけ',   avatar: '祐' },
  { name: '山田あかり',     avatar: 'あ' },
  { name: '山田けんた',     avatar: '健' },
  { name: '山田みさき',     avatar: '美' },
];
const EXTRA_NAMES = ['はると','さくら','りく','ひなた','そうた','あおい','ゆうき','まお','こうき','ことね'];

const SERVICE_TYPES = ['SIM', 'WiMAX', 'スマホケア'];
const SERVICE_ICONS = { SIM: '📱', WiMAX: '📶', スマホケア: '🛡️' };
const SERVICE_COLORS = {
  SIM:      { bg: '#6C5CE7', grad: 'linear-gradient(135deg, #6C5CE7, #a29bfe)' },
  WiMAX:    { bg: '#00b894', grad: 'linear-gradient(135deg, #00b894, #55efc4)' },
  スマホケア: { bg: '#e17055', grad: 'linear-gradient(135deg, #e17055, #fab1a0)' },
};

// ---- 状態管理 ---- //
const STATE = {
  accountCreated: false,
  loggedIn: false,
  loginStep: 0, // 0=create, 1=service-login, 2=complete
  currentUser: null,

  myServices: { SIM: [], WiMAX: [], スマホケア: [] },

  familyGroups: [],
  familyMembers: [],
  familyMemberCount: 0,

  billingMonth: '2026年3月分',
  billingFilter: 'すべて',

  editingPointsForMember: null,
  editValues: {},
};

// ---- ID生成 ---- //
let _sid = 0;
function genId() { return 's' + (++_sid); }
let _iid = 0;
function genInviteId() { return 'inv' + (++_iid); }

// ---- サービス追加 ---- //
function buildBreakdown(type, plan) {
  const items = [{ label: '基本料金', amount: plan.amount }];
  if (type === 'WiMAX' && plan.device) {
    items.push({ label: '端末代 (36回払い)', amount: plan.device });
  }
  if (type === 'SIM') {
    // SIM契約にはオプションを1つランダムに付与
    const simOptions = [
      { label: '留守番電話サービス', amount: 330 },
      { label: '5分かけ放題オプション', amount: 550 },
      { label: '10分かけ放題オプション', amount: 935 },
      { label: '24時間かけ放題オプション', amount: 1650 },
      { label: '割込通話', amount: 220 },
      { label: '紙明細オプション', amount: 220 },
    ];
    const opt = simOptions[Math.floor(Math.random() * simOptions.length)];
    items.push({ label: opt.label, amount: opt.amount });
  }
  return items;
}

function createServiceEntry(type, plan, contractDate) {
  const breakdown = buildBreakdown(type, plan);
  const amount = breakdown.reduce((s, b) => s + b.amount, 0);
  return {
    id: genId(),
    planId: plan.id,
    planName: plan.name,
    type: type,
    amount: amount,
    baseAmount: plan.amount,
    contractDate: contractDate || '2026年3月1日',
    breakdown: breakdown,
  };
}

function addMyService(type, plan) {
  if (STATE.myServices[type].length >= 5) return false;
  STATE.myServices[type].push(createServiceEntry(type, plan, '2026年3月1日'));
  return true;
}

function addFamilyService(memberId, type, plan) {
  const m = STATE.familyMembers.find(x => x.id === memberId);
  if (!m || m.services[type].length >= 5) return false;
  m.services[type].push(createServiceEntry(type, plan, '2026年3月1日'));
  return true;
}

// ---- クエリ ---- //
function getAllServicesOf(svcMap) {
  const all = [];
  for (const t of SERVICE_TYPES) {
    for (const s of (svcMap[t] || [])) all.push(s);
  }
  return all;
}

function calcPoints(svcMap) {
  return (svcMap.SIM || []).length * 1000;
}

function getAllMembers() {
  const list = [{
    id: 'owner',
    name: '山田太郎',
    avatar: '山',
    services: STATE.myServices,
    isOwner: true,
  }];
  for (const fm of STATE.familyMembers) list.push(fm);
  return list;
}

function getTotalPoints() {
  let pts = calcPoints(STATE.myServices);
  for (const fm of STATE.familyMembers) pts += calcPoints(fm.services);
  return pts;
}

// ---- 明細 ---- //
function getBillingForMonth(monthLabel) {
  const members = getAllMembers();
  const result = { total: 0, members: [] };
  for (const m of members) {
    const svcs = getAllServicesOf(m.services);
    if (svcs.length === 0) continue;
    const t = svcs.reduce((s, v) => s + v.amount, 0);
    result.total += t;
    result.members.push({
      id: m.id, name: m.name, avatar: m.avatar,
      total: t, services: svcs,
      billingDate: monthLabel.replace('分', '10日'),
    });
  }
  return result;
}

function filterBilling(data, filter) {
  if (filter === 'すべて') return data;
  const out = { total: 0, members: [] };
  for (const m of data.members) {
    const svcs = m.services.filter(s => s.type === filter);
    if (svcs.length === 0) continue;
    const t = svcs.reduce((s, v) => s + v.amount, 0);
    out.total += t;
    out.members.push({ ...m, total: t, services: svcs });
  }
  return out;
}

// ---- 初期セットアップ ---- //
function setupInitialService() {
  const plan = PLANS.SIM.voice.find(p => p.id === 'voice-20');
  STATE.myServices.SIM.push(createServiceEntry('SIM', plan, '2025年9月1日'));
  STATE.currentUser = { name: '山田太郎', email: 'yamada@example.com' };
  STATE.loggedIn = true;
  STATE.accountCreated = true;
}

// ---- ランダムプラン選択 ---- //
function getRandomPlan(type) {
  if (type === 'SIM') return ALL_SIM_PLANS[Math.floor(Math.random() * ALL_SIM_PLANS.length)];
  if (type === 'WiMAX') return PLANS.WiMAX[Math.floor(Math.random() * PLANS.WiMAX.length)];
  return PLANS.スマホケア[Math.floor(Math.random() * PLANS.スマホケア.length)];
}

function addMyServiceRandom(type) {
  const plan = getRandomPlan(type);
  return addMyService(type, plan);
}

// ---- ポイント管理 ---- //
// ボーナスポイント（譲渡による増減を管理）
// calcPoints は SIM件数×1000 + bonusPoints
const _bonusPoints = {}; // memberId -> number
function getBonusPoints(memberId) { return _bonusPoints[memberId] || 0; }
function addBonusPoints(memberId, amount) { _bonusPoints[memberId] = (_bonusPoints[memberId] || 0) + amount; }
function getMemberPoints(member) {
  return calcPoints(member.services) + getBonusPoints(member.id);
}

// ---- ポイント月別データ生成 ---- //
function _seedFromMonthLabel(monthLabel) {
  let hash = 0;
  for (let i = 0; i < monthLabel.length; i++) {
    hash = ((hash << 5) - hash) + monthLabel.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function _seededRandom(seed) {
  // 簡易シード付き乱数（xorshift風）
  let s = seed;
  return function () {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return ((s >>> 0) / 4294967296);
  };
}

function getMonthlyPointsForMember(member, monthLabel) {
  const seed = _seedFromMonthLabel(monthLabel + member.id);
  const rng = _seededRandom(seed);

  const simCount = (member.services.SIM || []).length;
  const wimaxCount = (member.services.WiMAX || []).length;

  // PLAIOアプリ: SIM 1契約あたり 250〜1000pt（50pt刻み）
  let appPoints = 0;
  for (let i = 0; i < simCount; i++) {
    appPoints += (Math.floor(rng() * 16) + 5) * 50; // 250〜1000, 50pt刻み
  }

  // WiMAX: 1契約あたり 300pt
  const wimaxPoints = wimaxCount * 300;

  return [
    { source: 'PLAIOアプリ', points: appPoints },
    { source: 'WiMAX', points: wimaxPoints },
    { source: 'PLAIO光', points: 0 },
  ];
}

// ---- 家族メンバー追加 ---- //
function addFamilyMember(serviceType, plan) {
  const idx = STATE.familyMemberCount;
  const preset = FAMILY_PRESETS[idx] || (() => {
    const n = EXTRA_NAMES[idx % EXTRA_NAMES.length];
    return { name: '山田' + n, avatar: n[0] };
  })();
  const member = {
    id: 'fam' + (idx + 1),
    name: preset.name,
    avatar: preset.avatar,
    services: { SIM: [], WiMAX: [], スマホケア: [] },
    shareBilling: true,
    sharePoints: true,
  };
  member.services[serviceType].push(createServiceEntry(serviceType, plan, '2026年3月1日'));
  STATE.familyMembers.push(member);
  STATE.familyMemberCount++;
  return member;
}

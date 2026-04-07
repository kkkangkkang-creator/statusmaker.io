/* ============================================================
   preview.js — 실시간 미리보기 렌더링
   ============================================================ */

/**
 * 상태창 미리보기 HTML 생성
 * @param {Array} fields - 필드 배열
 * @param {Object} config - 전체 설정 (header, theme 등)
 * @returns {string} 완전한 HTML
 */
function renderPreview(fields, config) {
  const vars = getCurrentThemeVars();
  const headerConfig = config.header || {};
  const showProfile = headerConfig.showProfile !== false;
  const headerTitle = headerConfig.title || '상태창';
  const charName = headerConfig.charName || '{{user}}';
  const collapsible = headerConfig.collapsible !== false;
  const subText = headerConfig.subText || '';

  // CSS 변수를 인라인 스타일로
  let cssVarStr = '';
  for (const [k, v] of Object.entries(vars)) {
    cssVarStr += `${k}:${v};`;
  }

  let html = '';

  // ── CSS ──
  html += `<style>
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');

.sw-root {
  ${cssVarStr}
  font-family: var(--sw-font, 'Pretendard', sans-serif);
  max-width: 580px;
  margin: 0 auto;
  background: var(--sw-bg);
  border-radius: var(--sw-radius);
  border: 1px solid var(--sw-border);
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  color: var(--sw-text);
  font-size: 13px;
  line-height: 1.5;
}
.sw-root * { margin:0; padding:0; box-sizing:border-box; }

/* 애니메이션 */
@keyframes sw-fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes sw-barFill { from{width:0%} }
@keyframes sw-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.02)} }

.sw-animate { animation: sw-fadeIn 0.4s ease both; }
.sw-animate-delay-1 { animation-delay:0.06s; }
.sw-animate-delay-2 { animation-delay:0.12s; }
.sw-animate-delay-3 { animation-delay:0.18s; }
.sw-animate-delay-4 { animation-delay:0.24s; }
.sw-animate-delay-5 { animation-delay:0.30s; }

/* 헤더 */
.sw-header {
  background: var(--sw-header-bg);
  color: var(--sw-header-text);
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
  transition: filter 0.2s;
}
.sw-header:hover { filter:brightness(1.08); }
.sw-header-left {
  display:flex; align-items:center; gap:10px; min-width:0;
}
.sw-profile-img {
  width:38px; height:38px; border-radius:50%;
  border:2px solid rgba(255,255,255,0.6);
  object-fit:cover; background:rgba(255,255,255,0.1);
  flex-shrink:0;
}
.sw-char-name {
  font-size:15px; font-weight:700; white-space:nowrap;
  overflow:hidden; text-overflow:ellipsis;
}
.sw-header-right {
  display:flex; align-items:center; gap:8px; flex-shrink:0;
}
.sw-toggle-arrow {
  font-size:11px; opacity:0.6; transition:transform 0.25s;
}
details[open] .sw-toggle-arrow { transform:rotate(180deg); }

/* 본문 */
.sw-body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--sw-bg);
}

/* 텍스트 필드 */
.sw-text-card {
  background: var(--sw-surface);
  border: 1px solid var(--sw-border);
  border-radius: calc(var(--sw-radius) * 0.6);
  padding: 10px 14px;
  transition: all 0.2s;
}
.sw-text-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transform: translateY(-1px);
}
.sw-text-label {
  font-size:10px; color:var(--sw-text-secondary);
  text-transform:uppercase; letter-spacing:0.5px;
  display:flex; align-items:center; gap:4px; margin-bottom:2px;
}
.sw-text-value {
  font-size:13px; font-weight:600; color:var(--sw-text);
}

/* 수치 바 */
.sw-bar-card {
  background: var(--sw-surface);
  border: 1px solid var(--sw-border);
  border-radius: calc(var(--sw-radius) * 0.6);
  padding: 10px 14px;
  transition: all 0.2s;
}
.sw-bar-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transform: translateY(-1px);
}
.sw-bar-top {
  display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;
}
.sw-bar-label {
  font-size:11px; color:var(--sw-text-secondary);
  display:flex; align-items:center; gap:5px;
}
.sw-bar-val { font-size:13px; font-weight:700; }
.sw-bar-track {
  height:6px; background:var(--sw-border); border-radius:3px; overflow:hidden;
}
.sw-bar-fill {
  height:100%; border-radius:3px;
  animation: sw-barFill 0.8s ease both;
  transition: width 0.4s ease;
}

/* 뱃지 */
.sw-badge-wrap {
  background: var(--sw-surface);
  border: 1px solid var(--sw-border);
  border-radius: calc(var(--sw-radius) * 0.6);
  padding: 10px 14px;
  transition: all 0.2s;
}
.sw-badge-wrap:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transform: translateY(-1px);
}
.sw-badge-list { display:flex; flex-wrap:wrap; gap:4px; margin-top:4px; }
.sw-badge {
  display:inline-block; padding:3px 10px; border-radius:14px;
  font-size:11px; font-weight:600;
  background: var(--sw-primary-light); color:var(--sw-primary);
  border:1px solid rgba(0,0,0,0.06);
}

/* 그리드 스탯 */
.sw-grid-card {
  background: var(--sw-surface);
  border: 1px solid var(--sw-border);
  border-radius: calc(var(--sw-radius) * 0.6);
  padding: 10px 14px;
  transition: all 0.2s;
}
.sw-grid-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transform: translateY(-1px);
}
.sw-grid {
  display:flex; justify-content:space-around; flex-wrap:wrap; gap:8px; margin-top:4px;
}
.sw-grid-item { text-align:center; min-width:45px; }
.sw-grid-label { font-size:10px; color:var(--sw-text-secondary); }
.sw-grid-value { font-size:16px; font-weight:700; color:var(--sw-primary); }

/* 접이식 섹션 */
.sw-section {
  background: var(--sw-surface);
  border: 1px solid var(--sw-border);
  border-radius: calc(var(--sw-radius) * 0.6);
  overflow:hidden;
  transition: all 0.2s;
}
.sw-section:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.sw-section-header {
  padding: 10px 14px;
  background: var(--sw-surface-alt);
  border-bottom: 1px solid var(--sw-border);
  font-size:11px; font-weight:700; color:var(--sw-text-secondary);
  text-transform:uppercase; letter-spacing:1px;
  cursor:pointer; display:flex; justify-content:space-between; align-items:center;
}
.sw-section-body {
  padding:10px 14px;
  display:flex; flex-direction:column; gap:8px;
}

/* 키-값 쌍 */
.sw-keyvalue-card {
  background: var(--sw-surface);
  border: 1px solid var(--sw-border);
  border-radius: calc(var(--sw-radius) * 0.6);
  padding: 10px 14px;
  transition: all 0.2s;
}
.sw-keyvalue-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transform: translateY(-1px);
}
.sw-keyvalue-grid {
  display: grid;
  gap: 6px;
  margin-top: 6px;
}
.sw-keyvalue-grid.cols-2 { grid-template-columns: 1fr 1fr; }
.sw-keyvalue-grid.cols-1 { grid-template-columns: 1fr; }
.sw-keyvalue-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 8px;
  background: var(--sw-surface-alt, rgba(0,0,0,0.03));
  border-radius: calc(var(--sw-radius) * 0.4);
  font-size: 12px;
}
.sw-keyvalue-label { color: var(--sw-text-secondary); font-size: 11px; }
.sw-keyvalue-value { font-weight: 700; color: var(--sw-text); }
.sw-keyvalue-bonus { font-size: 10px; color: var(--sw-accent, #f59e0b); font-weight: 700; margin-left: 4px; }

/* 카드형 */
.sw-card-group {
  background: var(--sw-surface);
  border: 1px solid var(--sw-border);
  border-radius: calc(var(--sw-radius) * 0.6);
  padding: 10px 14px;
  transition: all 0.2s;
}
.sw-card-group:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.sw-card-grid {
  display: grid;
  gap: 8px;
  margin-top: 6px;
}
.sw-card-grid.cols-2 { grid-template-columns: 1fr 1fr; }
.sw-card-grid.cols-1 { grid-template-columns: 1fr; }
.sw-card-item {
  border: 1px solid var(--sw-border);
  border-radius: calc(var(--sw-radius) * 0.5);
  padding: 8px 10px;
  background: var(--sw-surface-alt, rgba(0,0,0,0.02));
  transition: all 0.2s;
}
.sw-card-item:hover { box-shadow: 0 2px 6px rgba(0,0,0,0.08); transform: translateY(-1px); }
.sw-card-title { font-size: 12px; font-weight: 700; color: var(--sw-text); margin-bottom: 3px; }
.sw-card-desc { font-size: 11px; color: var(--sw-text-secondary); line-height: 1.4; margin-bottom: 4px; }
.sw-card-tag {
  display: inline-block; padding: 1px 7px; border-radius: 8px;
  font-size: 10px; font-weight: 700; color: #fff;
}

/* 버프/디버프 */
.sw-buff-group {
  background: var(--sw-surface);
  border: 1px solid var(--sw-border);
  border-radius: calc(var(--sw-radius) * 0.6);
  padding: 10px 14px;
  transition: all 0.2s;
}
.sw-buff-group:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.sw-buff-grid {
  display: grid;
  gap: 6px;
  margin-top: 6px;
}
.sw-buff-grid.cols-2 { grid-template-columns: 1fr 1fr; }
.sw-buff-grid.cols-1 { grid-template-columns: 1fr; }
.sw-buff-card {
  padding: 6px 10px;
  border-radius: calc(var(--sw-radius) * 0.4);
  border-left: 3px solid;
  font-size: 11px;
}
.sw-buff-card.buff {
  background: rgba(16,185,129,0.08);
  border-color: #10b981;
}
.sw-buff-card.debuff {
  background: rgba(239,68,68,0.08);
  border-color: #ef4444;
}
.sw-buff-name { font-weight: 700; font-size: 11px; margin-bottom: 1px; }
.sw-buff-card.buff .sw-buff-name { color: #10b981; }
.sw-buff-card.debuff .sw-buff-name { color: #ef4444; }
.sw-buff-effect { font-size: 10px; color: var(--sw-text-secondary); }

/* 구분선 */
.sw-separator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  color: var(--sw-text-secondary);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.sw-separator::before,
.sw-separator::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--sw-border);
}
.sw-separator-plain {
  height: 1px;
  background: var(--sw-border);
  border: none;
  margin: 4px 0;
}

/* 아이템 목록 */
.sw-itemlist-wrap {
  background: var(--sw-surface);
  border: 1px solid var(--sw-border);
  border-radius: calc(var(--sw-radius) * 0.6);
  padding: 10px 14px;
  transition: all 0.2s;
}
.sw-itemlist-wrap:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transform: translateY(-1px);
}
.sw-itemlist {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 4px;
}
.sw-itemlist-item {
  display: inline-block;
  padding: 4px 12px;
  border: 1px solid var(--sw-border);
  border-radius: calc(var(--sw-radius) * 0.4);
  font-size: 11px;
  font-weight: 600;
  color: var(--sw-text);
  background: var(--sw-surface);
  transition: all 0.15s;
}
.sw-itemlist-item:hover {
  border-color: var(--sw-primary);
  color: var(--sw-primary);
  background: var(--sw-primary-light);
}

/* 2열 행 */
.sw-row {
  display:flex; gap:8px;
}
.sw-row > * { flex:1; min-width:0; }

/* 폰트 크기 */
.sw-fs-small { font-size: 11px !important; }
.sw-fs-normal { font-size: 13px !important; }
.sw-fs-large  { font-size: 15px !important; }

/* 보조 텍스트 */
.sw-sub-text {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: calc(var(--sw-radius) * 0.4);
  background: var(--sw-surface-alt);
  color: var(--sw-header-text);
  border: 1px solid rgba(255,255,255,0.2);
  white-space: nowrap;
  opacity: 0.85;
}

/* 1줄 바 레이아웃 */
.sw-bar-inline .sw-bar-inline-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sw-bar-inline .sw-bar-label { flex-shrink: 0; font-weight: 700; font-size: 13px; }
.sw-bar-inline .sw-bar-track { flex: 1; }
.sw-bar-inline .sw-bar-val { flex-shrink: 0; }

/* 1줄 뱃지/아이템목록 레이아웃 */
.sw-badge-inline .sw-badge-inline-row,
.sw-itemlist-inline .sw-itemlist-inline-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.sw-badge-inline .sw-text-label,
.sw-itemlist-inline .sw-text-label { flex-shrink: 0; }

@media(max-width:480px) {
  .sw-row { flex-direction:column; }
  .sw-keyvalue-grid.cols-2,
  .sw-card-grid.cols-2,
  .sw-buff-grid.cols-2 { grid-template-columns: 1fr; }
}
</style>`;

  // ── HTML ──
  html += `<div class="sw-root">`;
  if (collapsible) {
    html += `<details open>`;
    html += `<summary style="list-style:none;cursor:pointer;outline:none;">`;
  } else {
    html += `<div>`;
  }

  // 헤더
  html += `<div class="sw-header">`;
  html += `<div class="sw-header-left">`;
  if (showProfile) {
    html += `<img class="sw-profile-img" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='35' r='18' fill='rgba(255,255,255,0.3)'/%3E%3Cellipse cx='50' cy='80' rx='28' ry='22' fill='rgba(255,255,255,0.3)'/%3E%3C/svg%3E" alt="Profile">`;
  }
  html += `<div class="sw-char-name">${escapeHtml(charName)}</div>`;
  html += `</div>`;
  html += `<div class="sw-header-right">`;
  if (subText) {
    html += `<span class="sw-sub-text">${escapeHtml(subText)}</span>`;
  }
  if (collapsible) {
    html += `<i class="fa-solid fa-chevron-down sw-toggle-arrow"></i>`;
  }
  html += `</div>`;
  html += `</div>`;
  if (collapsible) {
    html += `</summary>`;
  }

  // 본문
  html += `<div class="sw-body">`;

  let animIdx = 0;
  let halfBuffer = []; // half 폭 필드를 2개씩 묶기

  function flushHalf() {
    if (halfBuffer.length === 0) return '';
    let out = '<div class="sw-row">';
    halfBuffer.forEach(h => { out += h; });
    // 홀수개면 빈 div
    if (halfBuffer.length === 1) out += '<div></div>';
    out += '</div>';
    halfBuffer = [];
    return out;
  }

  const fullTypes = ['section', 'grid', 'keyvalue', 'card', 'buff', 'separator', 'itemlist'];

  // Collect all child field IDs so we skip them at top level
  const childFieldIds = new Set();
  fields.forEach(field => {
    if (field.type === 'section' && Array.isArray(field.children)) {
      field.children.forEach(id => childFieldIds.add(id));
    }
  });

  fields.forEach(field => {
    // Skip fields that are children of a section
    if (childFieldIds.has(field.id)) return;

    const isFull = field.width === 'full' || fullTypes.includes(field.type);
    const delayClass = `sw-animate sw-animate-delay-${Math.min(animIdx, 5)}`;
    animIdx++;

    let fieldHtml = '';

    switch (field.type) {
      case 'text':
        fieldHtml = renderPreviewText(field, delayClass);
        break;
      case 'bar':
        fieldHtml = renderPreviewBar(field, delayClass);
        break;
      case 'badge':
        fieldHtml = renderPreviewBadge(field, delayClass);
        break;
      case 'grid':
        fieldHtml = renderPreviewGrid(field, delayClass);
        break;
      case 'section':
        fieldHtml = renderPreviewSection(field, delayClass, fields);
        break;
      case 'keyvalue':
        fieldHtml = renderPreviewKeyValue(field, delayClass);
        break;
      case 'card':
        fieldHtml = renderPreviewCard(field, delayClass);
        break;
      case 'buff':
        fieldHtml = renderPreviewBuff(field, delayClass);
        break;
      case 'separator':
        fieldHtml = renderPreviewSeparator(field, delayClass);
        break;
      case 'itemlist':
        fieldHtml = renderPreviewItemList(field, delayClass);
        break;
    }

    if (isFull) {
      html += flushHalf();
      html += fieldHtml;
    } else {
      halfBuffer.push(fieldHtml);
      if (halfBuffer.length >= 2) {
        html += flushHalf();
      }
    }
  });

  html += flushHalf(); // 남은 half 필드 처리
  html += `</div>`; // sw-body
  if (collapsible) {
    html += `</details>`;
  } else {
    html += `</div>`;
  }
  html += `</div>`; // sw-root

  return html;
}

/** 아이콘 HTML */
function iconHtml(field) {
  if (!field) return '';
  if (field.iconType === 'emoji') return `<span>${field.emoji || '📌'}</span>`;
  return `<i class="${field.icon || 'fa-solid fa-circle'}"></i>`;
}

/** 커스텀 인라인 스타일 빌더 (색상값 검증 포함) */
function buildCustomStyle(field) {
  const parts = [];
  if (isValidCSSColor(field.customBg)) parts.push(`background:${field.customBg}`);
  if (isValidCSSColor(field.customTextColor)) parts.push(`color:${field.customTextColor}`);
  if (isValidCSSColor(field.customBorderColor)) parts.push(`border-color:${field.customBorderColor}`);
  return parts.length ? `style="${parts.join(';')}"` : '';
}

/** CSS 색상값 기본 검증 */
function isValidCSSColor(val) {
  if (!val || typeof val !== 'string') return false;
  const v = val.trim();
  // hex, rgb(), rgba(), hsl(), hsla(), 또는 named color (단순 알파벳)
  return /^#[0-9a-fA-F]{3,8}$/.test(v)
    || /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i.test(v)
    || /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/i.test(v)
    || /^hsl\(\s*[\d.]+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*\)$/i.test(v)
    || /^hsla\(\s*[\d.]+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*,\s*[\d.]+\s*\)$/i.test(v)
    || /^[a-zA-Z]+$/.test(v);
}

/** 커스텀 폰트 크기 클래스 */
function buildFontSizeClass(field) {
  if (!field.customFontSize) return '';
  const map = { small: 'sw-fs-small', normal: 'sw-fs-normal', large: 'sw-fs-large' };
  return map[field.customFontSize] || '';
}

/** 텍스트 필드 미리보기 */
function renderPreviewText(field, animClass) {
  const customStyle = buildCustomStyle(field);
  const fsClass = buildFontSizeClass(field);
  return `
    <div class="sw-text-card ${animClass} ${fsClass}" ${customStyle}>
      <div class="sw-text-label">${iconHtml(field)} ${escapeHtml(field.label)}</div>
      <div class="sw-text-value">${escapeHtml(field.sampleValue || '-')}</div>
    </div>
  `;
}

/** 수치 바 미리보기 */
function renderPreviewBar(field, animClass) {
  const val = parseFloat(field.sampleValue) || 0;
  const min = parseFloat(field.min) || 0;
  const max = parseFloat(field.max) || 100;
  const range = max - min || 1;
  const pct = Math.max(0, Math.min(100, ((val - min) / range) * 100));

  let displayVal = '';
  switch (field.displayFormat) {
    case 'current/max':
      displayVal = `${val}/${max}`;
      break;
    case 'percent':
      displayVal = `${Math.round(pct)}%`;
      break;
    case 'signed':
      displayVal = (val >= 0 ? '+' : '') + val;
      break;
    default:
      displayVal = `${val}/${max}`;
  }

  const gradientStart = isValidCSSColor(field.barGradientStart) ? field.barGradientStart : '#ef4444';
  const gradientEnd = isValidCSSColor(field.barGradientEnd) ? field.barGradientEnd : '#f59e0b';
  const barColorSafe = isValidCSSColor(field.barColor) ? field.barColor : 'var(--sw-primary)';

  const barBg = field.useGradient
    ? `background:linear-gradient(to right,${gradientStart},${gradientEnd})`
    : `background:${barColorSafe}`;

  const barValColor = field.useGradient
    ? gradientStart
    : barColorSafe;

  const customStyle = buildCustomStyle(field);
  const fsClass = buildFontSizeClass(field);

  if (field.layout === 'inline') {
    return `
      <div class="sw-bar-card sw-bar-inline ${animClass} ${fsClass}" ${customStyle}>
        <div class="sw-bar-inline-row">
          <div class="sw-bar-label">${iconHtml(field)} ${escapeHtml(field.label)}</div>
          <div class="sw-bar-track" style="flex:1">
            <div class="sw-bar-fill" style="width:${pct}%;${barBg}"></div>
          </div>
          <div class="sw-bar-val" style="color:${barValColor}">${displayVal}</div>
        </div>
      </div>
    `;
  }

  return `
    <div class="sw-bar-card ${animClass} ${fsClass}" ${customStyle}>
      <div class="sw-bar-top">
        <div class="sw-bar-label">${iconHtml(field)} ${escapeHtml(field.label)}</div>
        <div class="sw-bar-val" style="color:${barValColor}">${displayVal}</div>
      </div>
      <div class="sw-bar-track">
        <div class="sw-bar-fill" style="width:${pct}%;${barBg}"></div>
      </div>
    </div>
  `;
}

/** 뱃지 미리보기 */
function renderPreviewBadge(field, animClass) {
  const items = (field.sampleValue || '').split(field.separator || ',').map(s => s.trim()).filter(Boolean);
  const badges = items.map(item => `<span class="sw-badge">${escapeHtml(item)}</span>`).join('');
  const customStyle = buildCustomStyle(field);
  const fsClass = buildFontSizeClass(field);

  if (field.layout === 'inline') {
    return `
      <div class="sw-badge-wrap sw-badge-inline ${animClass} ${fsClass}" ${customStyle}>
        <div class="sw-badge-inline-row">
          <div class="sw-text-label">${iconHtml(field)} ${escapeHtml(field.label)}</div>
          <div class="sw-badge-list">${badges || '<span style="color:var(--sw-text-secondary);font-size:11px">없음</span>'}</div>
        </div>
      </div>
    `;
  }

  return `
    <div class="sw-badge-wrap ${animClass} ${fsClass}" ${customStyle}>
      <div class="sw-text-label">${iconHtml(field)} ${escapeHtml(field.label)}</div>
      <div class="sw-badge-list">${badges || '<span style="color:var(--sw-text-secondary);font-size:11px">없음</span>'}</div>
    </div>
  `;
}

/** 그리드 스탯 미리보기 */
function renderPreviewGrid(field, animClass) {
  const stats = field.stats || [];
  const items = stats.map(s => `
    <div class="sw-grid-item">
      <div class="sw-grid-label">${escapeHtml(s.label)}</div>
      <div class="sw-grid-value">${escapeHtml(s.sampleValue || '0')}</div>
    </div>
  `).join('');
  const customStyle = buildCustomStyle(field);
  const fsClass = buildFontSizeClass(field);

  return `
    <div class="sw-grid-card ${animClass} ${fsClass}" ${customStyle}>
      <div class="sw-text-label">${escapeHtml(field.label || '스탯')}</div>
      <div class="sw-grid">${items}</div>
    </div>
  `;
}

/** 접이식 섹션 미리보기 */
function renderPreviewSection(field, animClass, allFields) {
  const customStyle = buildCustomStyle(field);
  const fsClass = buildFontSizeClass(field);

  const children = field.children || [];
  let childrenHtml = '';

  if (children.length > 0 && allFields) {
    children.forEach(childId => {
      const childField = allFields.find(f => f.id === childId);
      if (!childField) return;
      switch (childField.type) {
        case 'text': childrenHtml += renderPreviewText(childField, ''); break;
        case 'bar': childrenHtml += renderPreviewBar(childField, ''); break;
        case 'badge': childrenHtml += renderPreviewBadge(childField, ''); break;
        case 'grid': childrenHtml += renderPreviewGrid(childField, ''); break;
        case 'keyvalue': childrenHtml += renderPreviewKeyValue(childField, ''); break;
        case 'card': childrenHtml += renderPreviewCard(childField, ''); break;
        case 'buff': childrenHtml += renderPreviewBuff(childField, ''); break;
        case 'separator': childrenHtml += renderPreviewSeparator(childField, ''); break;
        case 'itemlist': childrenHtml += renderPreviewItemList(childField, ''); break;
      }
    });
  } else if (children.length === 0) {
    childrenHtml = `<div style="text-align:center;padding:10px;color:var(--sw-text-secondary);font-size:11px">(섹션 내 필드를 추가하세요)</div>`;
  }

  return `
    <div class="sw-section ${animClass} ${fsClass}" ${customStyle}>
      <div class="sw-section-header">
        <span>${iconHtml(field)} ${escapeHtml(field.label)}</span>
        <span style="font-size:10px;opacity:0.6">▼</span>
      </div>
      <div class="sw-section-body">
        ${childrenHtml}
      </div>
    </div>
  `;
}

/** 키-값 쌍 미리보기 */
function renderPreviewKeyValue(field, animClass) {
  const items = field.items || [];
  const cols = parseInt(field.columns) || 2;
  const customStyle = buildCustomStyle(field);
  const fsClass = buildFontSizeClass(field);

  const itemsHtml = items.map(item => `
    <div class="sw-keyvalue-item">
      <span class="sw-keyvalue-label">${escapeHtml(item.label)}</span>
      <span>
        <span class="sw-keyvalue-value">${escapeHtml(item.sampleValue || '0')}</span>
        ${field.showBonus && item.bonus ? `<span class="sw-keyvalue-bonus">${escapeHtml(item.bonus)}</span>` : ''}
      </span>
    </div>
  `).join('');

  return `
    <div class="sw-keyvalue-card ${animClass} ${fsClass}" ${customStyle}>
      <div class="sw-text-label">${iconHtml(field)} ${escapeHtml(field.label)}</div>
      <div class="sw-keyvalue-grid cols-${cols}">${itemsHtml}</div>
    </div>
  `;
}

/** 카드형 미리보기 */
function renderPreviewCard(field, animClass) {
  const items = field.items || [];
  const cols = parseInt(field.columns) || 2;
  const customStyle = buildCustomStyle(field);
  const fsClass = buildFontSizeClass(field);

  const cardsHtml = items.map(item => `
    <div class="sw-card-item">
      <div class="sw-card-title">${escapeHtml(item.title || '')}</div>
      <div class="sw-card-desc">${escapeHtml(item.description || '')}</div>
      ${item.tag ? `<span class="sw-card-tag" style="background:${isValidCSSColor(item.tagColor) ? item.tagColor : '#6366f1'}">${escapeHtml(item.tag)}</span>` : ''}
    </div>
  `).join('');

  return `
    <div class="sw-card-group ${animClass} ${fsClass}" ${customStyle}>
      <div class="sw-text-label">${iconHtml(field)} ${escapeHtml(field.label)}</div>
      <div class="sw-card-grid cols-${cols}">${cardsHtml}</div>
    </div>
  `;
}

/** 버프/디버프 미리보기 */
function renderPreviewBuff(field, animClass) {
  const items = field.items || [];
  const cols = parseInt(field.columns) || 2;
  const customStyle = buildCustomStyle(field);
  const fsClass = buildFontSizeClass(field);

  const buffsHtml = items.map(item => `
    <div class="sw-buff-card ${item.type === 'debuff' ? 'debuff' : 'buff'}">
      <div class="sw-buff-name">${escapeHtml(item.name || '')}</div>
      <div class="sw-buff-effect">${escapeHtml(item.effect || '')}</div>
    </div>
  `).join('');

  return `
    <div class="sw-buff-group ${animClass} ${fsClass}" ${customStyle}>
      <div class="sw-text-label">${iconHtml(field)} ${escapeHtml(field.label)}</div>
      <div class="sw-buff-grid cols-${cols}">${buffsHtml}</div>
    </div>
  `;
}

/** 구분선 미리보기 */
function renderPreviewSeparator(field, animClass) {
  const hasLabel = field.style === 'labeled' && field.separatorLabel;
  const customBorderStyle = field.customBorderColor ? `style="color:${field.customBorderColor}"` : '';
  if (hasLabel) {
    return `<div class="sw-separator ${animClass}" ${customBorderStyle}>${escapeHtml(field.separatorLabel)}</div>`;
  }
  return `<hr class="sw-separator-plain ${animClass}">`;
}

/** 아이템 목록 미리보기 */
function renderPreviewItemList(field, animClass) {
  const items = (field.sampleValue || '').split(field.separator || ',').map(s => s.trim()).filter(Boolean);
  const customStyle = buildCustomStyle(field);
  const fsClass = buildFontSizeClass(field);

  const itemsHtml = items.map(item => `<span class="sw-itemlist-item">${escapeHtml(item)}</span>`).join('');

  if (field.layout === 'inline') {
    return `
      <div class="sw-itemlist-wrap sw-itemlist-inline ${animClass} ${fsClass}" ${customStyle}>
        <div class="sw-itemlist-inline-row">
          <div class="sw-text-label">${iconHtml(field)} ${escapeHtml(field.label)}</div>
          <div class="sw-itemlist">${itemsHtml || '<span style="color:var(--sw-text-secondary);font-size:11px">없음</span>'}</div>
        </div>
      </div>
    `;
  }

  return `
    <div class="sw-itemlist-wrap ${animClass} ${fsClass}" ${customStyle}>
      <div class="sw-text-label">${iconHtml(field)} ${escapeHtml(field.label)}</div>
      <div class="sw-itemlist">${itemsHtml || '<span style="color:var(--sw-text-secondary);font-size:11px">없음</span>'}</div>
    </div>
  `;
}

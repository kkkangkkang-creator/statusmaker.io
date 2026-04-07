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

/* 2열 행 */
.sw-row {
  display:flex; gap:8px;
}
.sw-row > * { flex:1; min-width:0; }

@media(max-width:480px) {
  .sw-row { flex-direction:column; }
}
</style>`;

  // ── HTML ──
  html += `<div class="sw-root">`;
  html += `<details open>`;

  // 헤더
  html += `<summary style="list-style:none;cursor:pointer;outline:none;">`;
  html += `<div class="sw-header">`;
  html += `<div class="sw-header-left">`;
  if (showProfile) {
    html += `<img class="sw-profile-img" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='35' r='18' fill='rgba(255,255,255,0.3)'/%3E%3Cellipse cx='50' cy='80' rx='28' ry='22' fill='rgba(255,255,255,0.3)'/%3E%3C/svg%3E" alt="Profile">`;
  }
  html += `<div class="sw-char-name">${escapeHtml(charName)}</div>`;
  html += `</div>`;
  html += `<div class="sw-header-right">`;
  html += `<i class="fa-solid fa-chevron-down sw-toggle-arrow"></i>`;
  html += `</div>`;
  html += `</div>`;
  html += `</summary>`;

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

  fields.forEach(field => {
    const isFull = field.width === 'full' || field.type === 'section' || field.type === 'grid';
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
        fieldHtml = renderPreviewSection(field, delayClass);
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
  html += `</details>`;
  html += `</div>`; // sw-root

  return html;
}

/** 아이콘 HTML */
function iconHtml(field) {
  if (!field) return '';
  if (field.iconType === 'emoji') return `<span>${field.emoji || '📌'}</span>`;
  return `<i class="${field.icon || 'fa-solid fa-circle'}"></i>`;
}

/** 텍스트 필드 미리보기 */
function renderPreviewText(field, animClass) {
  return `
    <div class="sw-text-card ${animClass}">
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

  return `
    <div class="sw-bar-card ${animClass}">
      <div class="sw-bar-top">
        <div class="sw-bar-label">${iconHtml(field)} ${escapeHtml(field.label)}</div>
        <div class="sw-bar-val" style="color:${field.barColor || 'var(--sw-primary)'}">${displayVal}</div>
      </div>
      <div class="sw-bar-track">
        <div class="sw-bar-fill" style="width:${pct}%;background:${field.barColor || 'var(--sw-primary)'}"></div>
      </div>
    </div>
  `;
}

/** 뱃지 미리보기 */
function renderPreviewBadge(field, animClass) {
  const items = (field.sampleValue || '').split(field.separator || ',').map(s => s.trim()).filter(Boolean);
  const badges = items.map(item => `<span class="sw-badge">${escapeHtml(item)}</span>`).join('');

  return `
    <div class="sw-badge-wrap ${animClass}">
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

  return `
    <div class="sw-grid-card ${animClass}">
      <div class="sw-text-label">${escapeHtml(field.label || '스탯')}</div>
      <div class="sw-grid">${items}</div>
    </div>
  `;
}

/** 접이식 섹션 미리보기 */
function renderPreviewSection(field, animClass) {
  return `
    <div class="sw-section ${animClass}">
      <div class="sw-section-header">
        <span>${iconHtml(field)} ${escapeHtml(field.label)}</span>
        <span style="font-size:10px;opacity:0.6">▼</span>
      </div>
      <div class="sw-section-body">
        <div style="text-align:center;padding:10px;color:var(--sw-text-secondary);font-size:11px">
          (섹션 내 필드를 추가하세요)
        </div>
      </div>
    </div>
  `;
}

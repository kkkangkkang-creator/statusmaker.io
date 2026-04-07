/* ============================================================
   fields.js — 필드 타입 정의 및 관리
   ============================================================ */

/**
 * 필드 타입 정의
 * 각 타입은 기본값, 에디터 렌더, 미리보기 렌더를 포함
 */
const FIELD_TYPES = {
  text: {
    label: '텍스트',
    icon: '📝',
    description: '단순 키:값 텍스트 필드',
    defaults: {
      key: 'Name',
      label: '이름',
      icon: 'fa-solid fa-user',
      iconType: 'fontawesome', // 'fontawesome' | 'emoji'
      emoji: '👤',
      sampleValue: '홍길동',
      width: 'half', // 'full' | 'half'
      customBg: '',
      customTextColor: '',
      customBorderColor: '',
      customFontSize: '',
    }
  },
  bar: {
    label: '수치 바',
    icon: '📊',
    description: 'HP, 에너지 등 프로그레스 바',
    defaults: {
      key: 'HP',
      label: 'HP',
      icon: 'fa-solid fa-heart',
      iconType: 'fontawesome',
      emoji: '❤️',
      sampleValue: '80',
      min: 0,
      max: 100,
      barColor: '#ef4444',
      useGradient: false,
      barGradientStart: '#ef4444',
      barGradientEnd: '#f59e0b',
      displayFormat: 'current/max', // 'current/max' | 'percent' | 'signed'
      layout: 'stacked', // 'stacked' | 'inline'
      width: 'full',
      customBg: '',
      customTextColor: '',
      customBorderColor: '',
      customFontSize: '',
    }
  },
  badge: {
    label: '뱃지/태그',
    icon: '🏷️',
    description: '인벤토리, 아이템 등 태그 목록',
    defaults: {
      key: 'Items',
      label: '아이템',
      icon: 'fa-solid fa-suitcase',
      iconType: 'fontawesome',
      emoji: '🎒',
      sampleValue: '검,방패,물약',
      separator: ',',
      showRarity: false,
      raritySeparator: '§',
      layout: 'stacked', // 'stacked' | 'inline'
      width: 'full',
      customBg: '',
      customTextColor: '',
      customBorderColor: '',
      customFontSize: '',
    }
  },
  grid: {
    label: '그리드 스탯',
    icon: '⚔️',
    description: 'STR/INT/AGI 등 다수 수치',
    defaults: {
      key: 'Stats',
      label: '스탯',
      stats: [
        { key: 'STR', label: 'STR', sampleValue: '10' },
        { key: 'INT', label: 'INT', sampleValue: '8' },
        { key: 'AGI', label: 'AGI', sampleValue: '12' },
        { key: 'END', label: 'END', sampleValue: '9' },
        { key: 'SEN', label: 'SEN', sampleValue: '7' },
        { key: 'LUK', label: 'LUK', sampleValue: '6' },
      ],
      width: 'full',
      customBg: '',
      customTextColor: '',
      customBorderColor: '',
      customFontSize: '',
    }
  },
  section: {
    label: '접이식 섹션',
    icon: '📂',
    description: '여러 필드를 묶어 접이식으로',
    defaults: {
      key: 'Section',
      label: '섹션',
      icon: 'fa-solid fa-folder',
      iconType: 'fontawesome',
      emoji: '📂',
      collapsed: false,
      children: [], // 하위 필드 ID 배열
      width: 'full',
      customBg: '',
      customTextColor: '',
      customBorderColor: '',
      customFontSize: '',
    }
  },
  keyvalue: {
    label: '키-값 쌍',
    icon: '🔑',
    description: '라벨+값, 보너스 표시. 2열 레이아웃 지원',
    defaults: {
      key: 'Stat',
      label: '능력치',
      icon: 'fa-solid fa-dumbbell',
      iconType: 'fontawesome',
      emoji: '💪',
      items: [
        { key: 'STR', label: '힘', sampleValue: '72', bonus: '+12' },
        { key: 'DEF', label: '방어력', sampleValue: '45', bonus: '' },
        { key: 'AGI', label: '민첩', sampleValue: '88', bonus: '+5' },
        { key: 'WIS', label: '지혜', sampleValue: '60', bonus: '' },
      ],
      showBonus: true,
      columns: 2, // 1 or 2
      width: 'full',
      customBg: '',
      customTextColor: '',
      customBorderColor: '',
      customFontSize: '',
    }
  },
  card: {
    label: '카드',
    icon: '🃏',
    description: '제목+설명+카테고리 태그 (스킬, 아이템)',
    defaults: {
      key: 'Card',
      label: '카드',
      icon: 'fa-solid fa-star',
      iconType: 'fontawesome',
      emoji: '⭐',
      items: [
        { key: 'Skill1', title: '화염구', description: '강력한 화염 마법', tag: '공격', tagColor: '#ef4444' },
        { key: 'Skill2', title: '치유술', description: 'HP를 회복한다', tag: '회복', tagColor: '#10b981' },
      ],
      columns: 2, // 1 or 2
      width: 'full',
      customBg: '',
      customTextColor: '',
      customBorderColor: '',
      customFontSize: '',
    }
  },
  buff: {
    label: '버프/디버프',
    icon: '✨',
    description: '효과 이름+설명, 색상으로 버프/디버프 구분',
    defaults: {
      key: 'Buffs',
      label: '버프/디버프',
      icon: 'fa-solid fa-bolt',
      iconType: 'fontawesome',
      emoji: '⚡',
      items: [
        { key: 'Buff1', name: 'Adrenaline', effect: '공격력 +20%', type: 'buff' },
        { key: 'Buff2', name: 'Muscle Fatigue', effect: '이동속도 -15%', type: 'debuff' },
      ],
      columns: 2,
      width: 'full',
      customBg: '',
      customTextColor: '',
      customBorderColor: '',
      customFontSize: '',
    }
  },
  separator: {
    label: '구분선',
    icon: '➖',
    description: '단순 가로선 또는 라벨 있는 구분선',
    defaults: {
      key: 'Sep',
      label: '구분선',
      separatorLabel: '',
      style: 'line', // 'line' | 'labeled'
      width: 'full',
      customBg: '',
      customTextColor: '',
      customBorderColor: '',
      customFontSize: '',
    }
  },
  itemlist: {
    label: '아이템 목록',
    icon: '📦',
    description: '테두리 있는 버튼형 아이템 목록',
    defaults: {
      key: 'Equipment',
      label: '장착 장비',
      icon: 'fa-solid fa-shield',
      iconType: 'fontawesome',
      emoji: '🛡️',
      sampleValue: '롱소드,체인메일,부츠',
      separator: ',',
      layout: 'stacked', // 'stacked' | 'inline'
      width: 'full',
      customBg: '',
      customTextColor: '',
      customBorderColor: '',
      customFontSize: '',
    }
  },
};

/**
 * 새 필드 생성
 */
function createField(type) {
  const def = FIELD_TYPES[type];
  if (!def) return null;
  return {
    id: generateUUID(),
    type: type,
    ...deepClone(def.defaults),
  };
}

/**
 * 필드 에디터 HTML 렌더링
 */
function renderFieldEditor(field) {
  const type = FIELD_TYPES[field.type];
  if (!type) return '';

  let bodyHtml = '';

  // separator는 키/라벨만, 아이콘 없음
  const isSeparator = field.type === 'separator';

  // 공통: 키, 라벨, 아이콘, 폭
  bodyHtml += `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">데이터 키</label>
        <input class="form-input field-opt" data-field-id="${field.id}" data-opt="key"
               value="${escapeHtml(field.key)}" placeholder="Key">
      </div>
      <div class="form-group">
        <label class="form-label">표시 라벨</label>
        <input class="form-input field-opt" data-field-id="${field.id}" data-opt="label"
               value="${escapeHtml(field.label)}" placeholder="라벨">
      </div>
    </div>
  `;

  // 아이콘 설정 (grid, separator, card, buff, keyvalue의 items 기반 타입 제외)
  if (!['grid', 'separator'].includes(field.type)) {
    bodyHtml += `
      <div class="form-group">
        <label class="form-label">아이콘</label>
        <div class="form-row">
          <select class="form-select field-opt" data-field-id="${field.id}" data-opt="iconType">
            <option value="fontawesome" ${field.iconType === 'fontawesome' ? 'selected' : ''}>Font Awesome</option>
            <option value="emoji" ${field.iconType === 'emoji' ? 'selected' : ''}>이모지</option>
          </select>
          <input class="form-input field-opt" data-field-id="${field.id}"
                 data-opt="${field.iconType === 'emoji' ? 'emoji' : 'icon'}"
                 value="${escapeHtml(field.iconType === 'emoji' ? (field.emoji || '') : (field.icon || ''))}"
                 placeholder="${field.iconType === 'emoji' ? '🎯' : 'fa-solid fa-star'}">
        </div>
        <div class="form-hint">Font Awesome: fa-solid fa-heart / 이모지: ❤️</div>
      </div>
    `;
  }

  // 폭 설정
  if (field.type !== 'section') {
    bodyHtml += `
      <div class="form-group">
        <label class="form-label">필드 폭</label>
        <select class="form-select field-opt" data-field-id="${field.id}" data-opt="width">
          <option value="full" ${field.width === 'full' ? 'selected' : ''}>전체 폭</option>
          <option value="half" ${field.width === 'half' ? 'selected' : ''}>반 폭 (2열)</option>
        </select>
      </div>
    `;
  }

  // 타입별 설정
  switch (field.type) {
    case 'text':
      bodyHtml += `
        <div class="form-group">
          <label class="form-label">샘플 값</label>
          <input class="form-input field-opt" data-field-id="${field.id}" data-opt="sampleValue"
                 value="${escapeHtml(field.sampleValue || '')}" placeholder="미리보기용 샘플">
        </div>
      `;
      break;

    case 'bar':
      bodyHtml += `
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">최소값</label>
            <input class="form-input field-opt" type="number" data-field-id="${field.id}" data-opt="min"
                   value="${field.min}">
          </div>
          <div class="form-group">
            <label class="form-label">최대값</label>
            <input class="form-input field-opt" type="number" data-field-id="${field.id}" data-opt="max"
                   value="${field.max}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">샘플 값</label>
            <input class="form-input field-opt" data-field-id="${field.id}" data-opt="sampleValue"
                   value="${escapeHtml(field.sampleValue || '')}" placeholder="80">
          </div>
          <div class="form-group">
            <label class="form-label">표시 형식</label>
            <select class="form-select field-opt" data-field-id="${field.id}" data-opt="displayFormat">
              <option value="current/max" ${field.displayFormat === 'current/max' ? 'selected' : ''}>현재/최대</option>
              <option value="percent" ${field.displayFormat === 'percent' ? 'selected' : ''}>퍼센트 %</option>
              <option value="signed" ${field.displayFormat === 'signed' ? 'selected' : ''}>+/- 부호</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">레이아웃</label>
          <select class="form-select field-opt" data-field-id="${field.id}" data-opt="layout">
            <option value="stacked" ${(field.layout || 'stacked') === 'stacked' ? 'selected' : ''}>2줄 (라벨 위, 바 아래)</option>
            <option value="inline" ${field.layout === 'inline' ? 'selected' : ''}>1줄 (라벨-바-값 한 줄)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-check">
            <input type="checkbox" class="field-opt" data-field-id="${field.id}" data-opt="useGradient"
                   ${field.useGradient ? 'checked' : ''}>
            그라데이션 사용
          </label>
        </div>
        ${field.useGradient ? `
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">그라데이션 시작</label>
            <div class="form-color-row">
              <input class="form-color field-opt" type="color" data-field-id="${field.id}" data-opt="barGradientStart"
                     value="${field.barGradientStart || '#ef4444'}">
              <input class="form-input field-opt" data-field-id="${field.id}" data-opt="barGradientStart"
                     value="${field.barGradientStart || '#ef4444'}" style="flex:1">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">그라데이션 끝</label>
            <div class="form-color-row">
              <input class="form-color field-opt" type="color" data-field-id="${field.id}" data-opt="barGradientEnd"
                     value="${field.barGradientEnd || '#f59e0b'}">
              <input class="form-input field-opt" data-field-id="${field.id}" data-opt="barGradientEnd"
                     value="${field.barGradientEnd || '#f59e0b'}" style="flex:1">
            </div>
          </div>
        </div>
        ` : `
        <div class="form-group">
          <label class="form-label">바 색상</label>
          <div class="form-color-row">
            <input class="form-color field-opt" type="color" data-field-id="${field.id}" data-opt="barColor"
                   value="${field.barColor || '#ef4444'}">
            <input class="form-input field-opt" data-field-id="${field.id}" data-opt="barColor"
                   value="${field.barColor || '#ef4444'}" placeholder="#ef4444" style="flex:1">
          </div>
        </div>
        `}
      `;
      break;

    case 'badge':
      bodyHtml += `
        <div class="form-group">
          <label class="form-label">샘플 값</label>
          <input class="form-input field-opt" data-field-id="${field.id}" data-opt="sampleValue"
                 value="${escapeHtml(field.sampleValue || '')}" placeholder="아이템1,아이템2,아이템3">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">항목 구분자</label>
            <select class="form-select field-opt" data-field-id="${field.id}" data-opt="separator">
              <option value="," ${field.separator === ',' ? 'selected' : ''}>, (쉼표)</option>
              <option value="¶" ${field.separator === '¶' ? 'selected' : ''}>¶</option>
              <option value="§" ${field.separator === '§' ? 'selected' : ''}>§</option>
              <option value="|" ${field.separator === '|' ? 'selected' : ''}>| (파이프)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">희귀도 표시</label>
            <label class="form-check">
              <input type="checkbox" class="field-opt" data-field-id="${field.id}" data-opt="showRarity"
                     ${field.showRarity ? 'checked' : ''}>
              희귀도 색상 사용
            </label>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">레이아웃</label>
          <select class="form-select field-opt" data-field-id="${field.id}" data-opt="layout">
            <option value="stacked" ${(field.layout || 'stacked') === 'stacked' ? 'selected' : ''}>2줄 (라벨 위, 뱃지 아래)</option>
            <option value="inline" ${field.layout === 'inline' ? 'selected' : ''}>1줄 (라벨-뱃지 한 줄)</option>
          </select>
        </div>
      `;
      break;

    case 'grid':
      bodyHtml += `
        <div class="form-group">
          <label class="form-label">스탯 목록</label>
          <div class="grid-stats-editor" data-field-id="${field.id}">
            ${(field.stats || []).map((s, i) => `
              <div class="form-row" style="margin-bottom:4px" data-stat-idx="${i}">
                <input class="form-input grid-stat-opt" data-field-id="${field.id}" data-stat-idx="${i}" data-opt="key"
                       value="${escapeHtml(s.key)}" placeholder="키" style="flex:0.7">
                <input class="form-input grid-stat-opt" data-field-id="${field.id}" data-stat-idx="${i}" data-opt="label"
                       value="${escapeHtml(s.label)}" placeholder="라벨" style="flex:0.7">
                <input class="form-input grid-stat-opt" data-field-id="${field.id}" data-stat-idx="${i}" data-opt="sampleValue"
                       value="${escapeHtml(s.sampleValue)}" placeholder="값" style="flex:0.5">
                <button class="btn btn-sm btn-danger remove-stat-btn" data-field-id="${field.id}" data-stat-idx="${i}">✕</button>
              </div>
            `).join('')}
          </div>
          <button class="btn btn-sm add-stat-btn" data-field-id="${field.id}" style="margin-top:6px">+ 스탯 추가</button>
        </div>
      `;
      break;

    case 'section':
      bodyHtml += `
        <div class="form-group">
          <label class="form-check">
            <input type="checkbox" class="field-opt" data-field-id="${field.id}" data-opt="collapsed"
                   ${field.collapsed ? 'checked' : ''}>
            기본 접힘 상태
          </label>
        </div>
        <div class="form-group">
          <label class="form-label">섹션 내 필드 추가</label>
          <div class="section-child-add-grid">
            ${Object.entries(FIELD_TYPES).filter(([k]) => k !== 'section').map(([key, def]) =>
              `<button class="btn btn-sm add-child-field-btn" data-section-id="${field.id}" data-child-type="${key}">${def.icon} ${def.label}</button>`
            ).join('')}
          </div>
        </div>
        ${(field.children || []).length > 0 ? `
        <div class="form-group">
          <label class="form-label">섹션 내 필드 (${(field.children || []).length}개)</label>
          <div class="section-children-list">
            ${(field.children || []).map(childId => `
              <div class="section-child-item" style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid var(--border)">
                <span style="flex:1;font-size:12px;color:var(--text-muted)">🔗 ${childId.substring(0, 8)}...</span>
                <button class="btn btn-sm btn-danger remove-child-field-btn" data-section-id="${field.id}" data-child-id="${childId}">✕ 제거</button>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
      `;
      break;

    case 'keyvalue':
      bodyHtml += `
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">열 수</label>
            <select class="form-select field-opt" data-field-id="${field.id}" data-opt="columns">
              <option value="1" ${(field.columns || 2) == 1 ? 'selected' : ''}>1열</option>
              <option value="2" ${(field.columns || 2) == 2 ? 'selected' : ''}>2열</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">보너스 표시</label>
            <label class="form-check">
              <input type="checkbox" class="field-opt" data-field-id="${field.id}" data-opt="showBonus"
                     ${field.showBonus ? 'checked' : ''}>
              보너스 값 표시
            </label>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">항목 목록</label>
          <div class="kv-items-editor" data-field-id="${field.id}">
            ${(field.items || []).map((item, i) => `
              <div class="form-row" style="margin-bottom:4px">
                <input class="form-input kv-item-opt" data-field-id="${field.id}" data-item-idx="${i}" data-opt="key"
                       value="${escapeHtml(item.key)}" placeholder="키" style="flex:0.6">
                <input class="form-input kv-item-opt" data-field-id="${field.id}" data-item-idx="${i}" data-opt="label"
                       value="${escapeHtml(item.label)}" placeholder="라벨" style="flex:0.8">
                <input class="form-input kv-item-opt" data-field-id="${field.id}" data-item-idx="${i}" data-opt="sampleValue"
                       value="${escapeHtml(item.sampleValue)}" placeholder="값" style="flex:0.6">
                <input class="form-input kv-item-opt" data-field-id="${field.id}" data-item-idx="${i}" data-opt="bonus"
                       value="${escapeHtml(item.bonus || '')}" placeholder="+0" style="flex:0.5">
                <button class="btn btn-sm btn-danger remove-kv-btn" data-field-id="${field.id}" data-item-idx="${i}">✕</button>
              </div>
            `).join('')}
          </div>
          <button class="btn btn-sm add-kv-btn" data-field-id="${field.id}" style="margin-top:6px">+ 항목 추가</button>
        </div>
      `;
      break;

    case 'card':
      bodyHtml += `
        <div class="form-group">
          <label class="form-label">열 수</label>
          <select class="form-select field-opt" data-field-id="${field.id}" data-opt="columns">
            <option value="1" ${(field.columns || 2) == 1 ? 'selected' : ''}>1열</option>
            <option value="2" ${(field.columns || 2) == 2 ? 'selected' : ''}>2열</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">카드 목록</label>
          <div class="card-items-editor" data-field-id="${field.id}">
            ${(field.items || []).map((item, i) => `
              <div class="field-subcard" data-item-idx="${i}">
                <div class="form-row" style="margin-bottom:4px">
                  <input class="form-input card-item-opt" data-field-id="${field.id}" data-item-idx="${i}" data-opt="key"
                         value="${escapeHtml(item.key)}" placeholder="키" style="flex:0.7">
                  <input class="form-input card-item-opt" data-field-id="${field.id}" data-item-idx="${i}" data-opt="title"
                         value="${escapeHtml(item.title)}" placeholder="제목" style="flex:1">
                  <button class="btn btn-sm btn-danger remove-card-item-btn" data-field-id="${field.id}" data-item-idx="${i}">✕</button>
                </div>
                <input class="form-input card-item-opt" data-field-id="${field.id}" data-item-idx="${i}" data-opt="description"
                       value="${escapeHtml(item.description)}" placeholder="설명" style="margin-bottom:4px">
                <div class="form-row">
                  <input class="form-input card-item-opt" data-field-id="${field.id}" data-item-idx="${i}" data-opt="tag"
                         value="${escapeHtml(item.tag || '')}" placeholder="태그">
                  <div class="form-color-row">
                    <input class="form-color card-item-opt" type="color" data-field-id="${field.id}" data-item-idx="${i}" data-opt="tagColor"
                           value="${item.tagColor || '#6366f1'}">
                    <input class="form-input card-item-opt" data-field-id="${field.id}" data-item-idx="${i}" data-opt="tagColor"
                           value="${item.tagColor || '#6366f1'}" placeholder="#6366f1" style="flex:1">
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          <button class="btn btn-sm add-card-item-btn" data-field-id="${field.id}" style="margin-top:6px">+ 카드 추가</button>
        </div>
      `;
      break;

    case 'buff':
      bodyHtml += `
        <div class="form-group">
          <label class="form-label">열 수</label>
          <select class="form-select field-opt" data-field-id="${field.id}" data-opt="columns">
            <option value="1" ${(field.columns || 2) == 1 ? 'selected' : ''}>1열</option>
            <option value="2" ${(field.columns || 2) == 2 ? 'selected' : ''}>2열</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">버프/디버프 목록</label>
          <div class="buff-items-editor" data-field-id="${field.id}">
            ${(field.items || []).map((item, i) => `
              <div class="field-subcard" data-item-idx="${i}">
                <div class="form-row" style="margin-bottom:4px">
                  <input class="form-input buff-item-opt" data-field-id="${field.id}" data-item-idx="${i}" data-opt="key"
                         value="${escapeHtml(item.key)}" placeholder="키" style="flex:0.7">
                  <input class="form-input buff-item-opt" data-field-id="${field.id}" data-item-idx="${i}" data-opt="name"
                         value="${escapeHtml(item.name)}" placeholder="이름" style="flex:1">
                  <select class="form-select buff-item-opt" data-field-id="${field.id}" data-item-idx="${i}" data-opt="type" style="flex:0.8">
                    <option value="buff" ${item.type === 'buff' ? 'selected' : ''}>버프</option>
                    <option value="debuff" ${item.type === 'debuff' ? 'selected' : ''}>디버프</option>
                  </select>
                  <button class="btn btn-sm btn-danger remove-buff-item-btn" data-field-id="${field.id}" data-item-idx="${i}">✕</button>
                </div>
                <input class="form-input buff-item-opt" data-field-id="${field.id}" data-item-idx="${i}" data-opt="effect"
                       value="${escapeHtml(item.effect)}" placeholder="효과 설명">
              </div>
            `).join('')}
          </div>
          <button class="btn btn-sm add-buff-item-btn" data-field-id="${field.id}" style="margin-top:6px">+ 항목 추가</button>
        </div>
      `;
      break;

    case 'separator':
      bodyHtml += `
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">스타일</label>
            <select class="form-select field-opt" data-field-id="${field.id}" data-opt="style">
              <option value="line" ${(field.style || 'line') === 'line' ? 'selected' : ''}>단순 가로선</option>
              <option value="labeled" ${field.style === 'labeled' ? 'selected' : ''}>라벨 있는 구분선</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">라벨 텍스트</label>
            <input class="form-input field-opt" data-field-id="${field.id}" data-opt="separatorLabel"
                   value="${escapeHtml(field.separatorLabel || '')}" placeholder="── 장착 무기 ──">
          </div>
        </div>
      `;
      break;

    case 'itemlist':
      bodyHtml += `
        <div class="form-group">
          <label class="form-label">샘플 값</label>
          <input class="form-input field-opt" data-field-id="${field.id}" data-opt="sampleValue"
                 value="${escapeHtml(field.sampleValue || '')}" placeholder="아이템1,아이템2,아이템3">
        </div>
        <div class="form-group">
          <label class="form-label">항목 구분자</label>
          <select class="form-select field-opt" data-field-id="${field.id}" data-opt="separator">
            <option value="," ${field.separator === ',' ? 'selected' : ''}>, (쉼표)</option>
            <option value="¶" ${field.separator === '¶' ? 'selected' : ''}>¶</option>
            <option value="§" ${field.separator === '§' ? 'selected' : ''}>§</option>
            <option value="|" ${field.separator === '|' ? 'selected' : ''}>| (파이프)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">레이아웃</label>
          <select class="form-select field-opt" data-field-id="${field.id}" data-opt="layout">
            <option value="stacked" ${(field.layout || 'stacked') === 'stacked' ? 'selected' : ''}>2줄 (라벨 위, 목록 아래)</option>
            <option value="inline" ${field.layout === 'inline' ? 'selected' : ''}>1줄 (라벨-목록 한 줄)</option>
          </select>
        </div>
      `;
      break;
  }

  // ── 공통 커스텀 스타일 옵션 ──
  bodyHtml += `
    <details class="custom-style-details">
      <summary class="custom-style-summary">🎨 커스텀 스타일 (선택)</summary>
      <div class="custom-style-body">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">배경색</label>
            <div class="form-color-row">
              <input class="form-color field-opt" type="color" data-field-id="${field.id}" data-opt="customBg"
                     value="${field.customBg || '#ffffff'}">
              <input class="form-input field-opt" data-field-id="${field.id}" data-opt="customBg"
                     value="${escapeHtml(field.customBg || '')}" placeholder="테마 기본값" style="flex:1">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">텍스트 색상</label>
            <div class="form-color-row">
              <input class="form-color field-opt" type="color" data-field-id="${field.id}" data-opt="customTextColor"
                     value="${field.customTextColor || '#1a1a2e'}">
              <input class="form-input field-opt" data-field-id="${field.id}" data-opt="customTextColor"
                     value="${escapeHtml(field.customTextColor || '')}" placeholder="테마 기본값" style="flex:1">
            </div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">테두리 색상</label>
            <div class="form-color-row">
              <input class="form-color field-opt" type="color" data-field-id="${field.id}" data-opt="customBorderColor"
                     value="${field.customBorderColor || '#e2e4ea'}">
              <input class="form-input field-opt" data-field-id="${field.id}" data-opt="customBorderColor"
                     value="${escapeHtml(field.customBorderColor || '')}" placeholder="테마 기본값" style="flex:1">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">폰트 크기</label>
            <select class="form-select field-opt" data-field-id="${field.id}" data-opt="customFontSize">
              <option value="" ${!field.customFontSize ? 'selected' : ''}>기본</option>
              <option value="small" ${field.customFontSize === 'small' ? 'selected' : ''}>작게</option>
              <option value="normal" ${field.customFontSize === 'normal' ? 'selected' : ''}>보통</option>
              <option value="large" ${field.customFontSize === 'large' ? 'selected' : ''}>크게</option>
            </select>
          </div>
        </div>
        <div class="form-hint">비워두면 테마 기본값을 사용합니다.</div>
      </div>
    </details>
  `;

  return bodyHtml;
}

/**
 * 필드 카드 전체 HTML
 */
function renderFieldCard(field) {
  const typeDef = FIELD_TYPES[field.type];
  return `
    <div class="field-card anim-fade-in-up" draggable="true" data-field-id="${field.id}">
      <div class="field-card-header">
        <span class="field-drag-handle" title="드래그하여 순서 변경">⠿</span>
        <span class="field-type-badge">${typeDef ? typeDef.icon + ' ' + typeDef.label : field.type}</span>
        <input class="field-name-input field-opt" data-field-id="${field.id}" data-opt="label"
               value="${escapeHtml(field.label)}" placeholder="필드 이름">
        <div class="field-actions">
          <button class="btn btn-icon btn-sm toggle-field-btn" data-field-id="${field.id}" title="설정 열기/닫기">⚙️</button>
          <button class="btn btn-icon btn-sm btn-danger delete-field-btn" data-field-id="${field.id}" title="삭제">🗑️</button>
        </div>
      </div>
      <div class="field-card-body">
        ${renderFieldEditor(field)}
      </div>
    </div>
  `;
}

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
      displayFormat: 'current/max', // 'current/max' | 'percent' | 'signed'
      width: 'full',
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
      width: 'full',
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
    }
  }
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

  // 아이콘 설정 (섹션/그리드에도 적용)
  if (field.type !== 'grid') {
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
        <div class="form-group">
          <label class="form-label">샘플 값</label>
          <input class="form-input field-opt" data-field-id="${field.id}" data-opt="sampleValue"
                 value="${escapeHtml(field.sampleValue || '')}" placeholder="80">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">바 색상</label>
            <div class="form-color-row">
              <input class="form-color field-opt" type="color" data-field-id="${field.id}" data-opt="barColor"
                     value="${field.barColor || '#ef4444'}">
              <input class="form-input field-opt" data-field-id="${field.id}" data-opt="barColor"
                     value="${field.barColor || '#ef4444'}" placeholder="#ef4444" style="flex:1">
            </div>
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
        <div class="form-hint">이 섹션 아래에 필드를 추가하면 접이식으로 표시됩니다.</div>
      `;
      break;
  }

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

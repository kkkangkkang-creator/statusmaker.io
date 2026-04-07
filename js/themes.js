/* ============================================================
   themes.js — 테마 프리셋 및 커스텀 테마 관리
   ============================================================ */

/**
 * 상태창 출력용 테마 프리셋
 * (빌더 UI의 라이트/다크 모드와는 별개)
 */
const THEME_PRESETS = {
  game: {
    name: '🎮 게임풍',
    description: '다크 네온 스타일',
    vars: {
      '--sw-bg': '#1a1a2e',
      '--sw-surface': '#16213e',
      '--sw-surface-alt': '#0f3460',
      '--sw-border': '#1a3a6a',
      '--sw-text': '#e8e8e8',
      '--sw-text-secondary': '#8899aa',
      '--sw-primary': '#e94560',
      '--sw-primary-light': 'rgba(233,69,96,0.15)',
      '--sw-accent': '#f59e0b',
      '--sw-header-bg': '#0f3460',
      '--sw-header-text': '#ffffff',
      '--sw-radius': '8px',
      '--sw-font': "'Segoe UI', Arial, sans-serif",
    }
  },
  school: {
    name: '🏫 학원풍',
    description: '보라+흰색 깔끔',
    vars: {
      '--sw-bg': '#F3F4F6',
      '--sw-surface': '#ffffff',
      '--sw-surface-alt': '#E5E7EB',
      '--sw-border': '#D1D5DB',
      '--sw-text': '#1A1A2E',
      '--sw-text-secondary': '#6B7A90',
      '--sw-primary': '#6a4fd7',
      '--sw-primary-light': 'rgba(106,79,215,0.1)',
      '--sw-accent': '#6a4fd7',
      '--sw-header-bg': '#6a4fd7',
      '--sw-header-text': '#ffffff',
      '--sw-radius': '12px',
      '--sw-font': "'Pretendard', -apple-system, sans-serif",
    }
  },
  youtube: {
    name: '📺 유튜브풍',
    description: '파스텔+라운드',
    vars: {
      '--sw-bg': '#f5f0ff',
      '--sw-surface': '#ffffff',
      '--sw-surface-alt': '#fefcf9',
      '--sw-border': '#e8e4f0',
      '--sw-text': '#3d3d3d',
      '--sw-text-secondary': '#6b6b6b',
      '--sw-primary': '#c9b8e8',
      '--sw-primary-light': 'rgba(201,184,232,0.2)',
      '--sw-accent': '#9d7fc7',
      '--sw-header-bg': '#ffffff',
      '--sw-header-text': '#3d3d3d',
      '--sw-radius': '24px',
      '--sw-font': "'Quicksand', 'Nunito', sans-serif",
    }
  },
  fantasy: {
    name: '🏰 판타지풍',
    description: '골드+다크',
    vars: {
      '--sw-bg': '#1c1410',
      '--sw-surface': '#2a1f17',
      '--sw-surface-alt': '#3d2e22',
      '--sw-border': '#5a4030',
      '--sw-text': '#e8d5c0',
      '--sw-text-secondary': '#a08870',
      '--sw-primary': '#d4a017',
      '--sw-primary-light': 'rgba(212,160,23,0.15)',
      '--sw-accent': '#d4a017',
      '--sw-header-bg': 'linear-gradient(135deg, #3d2e22, #1c1410)',
      '--sw-header-text': '#d4a017',
      '--sw-radius': '6px',
      '--sw-font': "'Georgia', 'Noto Serif KR', serif",
    }
  },
  pastel: {
    name: '🌸 파스텔풍',
    description: '핑크+민트',
    vars: {
      '--sw-bg': '#fdf2f8',
      '--sw-surface': '#ffffff',
      '--sw-surface-alt': '#fce7f3',
      '--sw-border': '#f9a8d4',
      '--sw-text': '#4a2040',
      '--sw-text-secondary': '#9f7aea',
      '--sw-primary': '#ec4899',
      '--sw-primary-light': 'rgba(236,72,153,0.1)',
      '--sw-accent': '#06b6d4',
      '--sw-header-bg': 'linear-gradient(135deg, #ec4899, #8b5cf6)',
      '--sw-header-text': '#ffffff',
      '--sw-radius': '20px',
      '--sw-font': "'Nunito', 'Pretendard', sans-serif",
    }
  },
};

/** 현재 선택된 테마 키 */
let currentThemeKey = 'school';

/** 커스텀 테마 값 (사용자가 직접 색상 지정할 때) */
let customThemeVars = deepClone(THEME_PRESETS.school.vars);

/**
 * 테마 프리셋 선택
 */
function selectTheme(key) {
  if (THEME_PRESETS[key]) {
    currentThemeKey = key;
    customThemeVars = deepClone(THEME_PRESETS[key].vars);
  }
}

/**
 * 커스텀 변수 업데이트
 */
function updateCustomVar(varName, value) {
  customThemeVars[varName] = value;
  currentThemeKey = 'custom';
}

/**
 * 현재 테마 변수 반환
 */
function getCurrentThemeVars() {
  if (currentThemeKey === 'custom') return customThemeVars;
  return THEME_PRESETS[currentThemeKey]?.vars || THEME_PRESETS.school.vars;
}

/**
 * 테마 프리셋 선택기 HTML
 */
function renderThemeSelector() {
  let html = '<div class="theme-grid">';
  for (const [key, preset] of Object.entries(THEME_PRESETS)) {
    html += `
      <div class="theme-card ${currentThemeKey === key ? 'active' : ''}" data-theme-key="${key}">
        <span class="theme-emoji">${preset.name.split(' ')[0]}</span>
        <span>${preset.name.split(' ').slice(1).join(' ')}</span>
      </div>
    `;
  }
  html += '</div>';
  return html;
}

/**
 * 커스텀 색상 에디터 HTML
 */
function renderCustomColorEditor() {
  const vars = getCurrentThemeVars();
  const colorFields = [
    { key: '--sw-bg', label: '배경색' },
    { key: '--sw-surface', label: '카드 배경' },
    { key: '--sw-border', label: '테두리' },
    { key: '--sw-text', label: '텍스트' },
    { key: '--sw-text-secondary', label: '보조 텍스트' },
    { key: '--sw-primary', label: '기본 색상' },
    { key: '--sw-accent', label: '강조 색상' },
    { key: '--sw-header-bg', label: '헤더 배경' },
    { key: '--sw-header-text', label: '헤더 텍스트' },
  ];

  let html = '';
  colorFields.forEach(f => {
    const val = vars[f.key] || '#000000';
    // gradient인 경우 color picker 비활성
    const isGradient = val.includes('gradient');
    html += `
      <div class="form-group">
        <label class="form-label">${f.label}</label>
        <div class="form-color-row">
          ${isGradient
            ? `<div style="width:36px;height:30px;border-radius:4px;background:${val};border:1px solid var(--c-border)"></div>`
            : `<input class="form-color custom-color-input" type="color" data-var="${f.key}" value="${val}">`
          }
          <input class="form-input custom-color-text" data-var="${f.key}" value="${escapeHtml(val)}" placeholder="${f.key}">
        </div>
      </div>
    `;
  });

  // 보더 라디우스
  const radius = parseInt(vars['--sw-radius']) || 12;
  html += `
    <div class="form-group">
      <label class="form-label">둥글기 (border-radius): ${radius}px</label>
      <input class="form-range custom-radius-input" type="range" min="0" max="30" value="${radius}">
    </div>
  `;

  // 폰트
  html += `
    <div class="form-group">
      <label class="form-label">폰트</label>
      <select class="form-select custom-font-input">
        <option value="'Pretendard', -apple-system, sans-serif" ${vars['--sw-font']?.includes('Pretendard') ? 'selected' : ''}>Pretendard</option>
        <option value="'Nunito', sans-serif" ${vars['--sw-font']?.includes('Nunito') && !vars['--sw-font']?.includes('Pretendard') ? 'selected' : ''}>Nunito</option>
        <option value="'Quicksand', sans-serif" ${vars['--sw-font']?.includes('Quicksand') ? 'selected' : ''}>Quicksand</option>
        <option value="'Segoe UI', Arial, sans-serif" ${vars['--sw-font']?.includes('Segoe') ? 'selected' : ''}>Segoe UI</option>
        <option value="'Georgia', serif" ${vars['--sw-font']?.includes('Georgia') ? 'selected' : ''}>Georgia (세리프)</option>
      </select>
    </div>
  `;

  return html;
}

/**
 * 테마 설정을 직렬화 가능한 객체로
 */
function serializeThemeConfig() {
  return {
    themeKey: currentThemeKey,
    customVars: deepClone(customThemeVars),
  };
}

/**
 * 테마 설정 복원
 */
function restoreThemeConfig(config) {
  if (config.themeKey && THEME_PRESETS[config.themeKey]) {
    currentThemeKey = config.themeKey;
    customThemeVars = deepClone(THEME_PRESETS[config.themeKey].vars);
  }
  if (config.customVars) {
    customThemeVars = deepClone(config.customVars);
    if (config.themeKey === 'custom') {
      currentThemeKey = 'custom';
    }
  }
}

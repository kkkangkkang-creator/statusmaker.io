/* ============================================================
   app.js — 메인 앱 로직 (이벤트 바인딩, 상태 관리)
   ============================================================ */

(function () {
  'use strict';

  /* ── 앱 상태 ── */
  const state = {
    fields: [],
    config: {
      header: {
        charName: '{{user}}',
        showProfile: true,
      },
      scriptName: '⚙️ 상태창',
      separator: '|',
      placeAI: true,
      placeUser: false,
    },
  };

  /* ── DOM 참조 ── */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const fieldListEl = $('#fieldList');
  const previewEl = $('#previewHtml');
  const addFieldGridEl = $('#addFieldGrid');
  const toastContainer = $('#toastContainer');

  /* ══════════════════════════════════════════════════════════
     초기화
     ══════════════════════════════════════════════════════════ */
  function init() {
    loadSavedState();
    renderAddFieldButtons();
    renderFieldList();
    refreshPreview();

    bindHeaderConfig();
    bindThemeToggle();
    bindSectionAccordions();
    bindMobileTabs();
    bindExportButtons();
    bindProjectSaveLoad();

    // 드래그 앤 드롭
    initDragAndDrop(fieldListEl, (fromIdx, toIdx) => {
      const item = state.fields.splice(fromIdx, 1)[0];
      state.fields.splice(toIdx, 0, item);
      saveState();
      refreshPreview();
    });
  }

  /* ══════════════════════════════════════════════════════════
     필드 추가 버튼
     ══════════════════════════════════════════════════════════ */
  function renderAddFieldButtons() {
    let html = '';
    for (const [key, def] of Object.entries(FIELD_TYPES)) {
      html += `
        <button class="add-field-btn" data-type="${key}">
          <span class="add-icon">${def.icon}</span>
          ${def.label}
        </button>
      `;
    }
    addFieldGridEl.innerHTML = html;

    addFieldGridEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.add-field-btn');
      if (!btn) return;
      const type = btn.dataset.type;
      const field = createField(type);
      if (!field) return;
      state.fields.push(field);
      renderFieldList();
      refreshPreview();
      saveState();
      showToast(`${FIELD_TYPES[type].icon} ${FIELD_TYPES[type].label} 필드 추가됨`, 'success');
    });
  }

  /* ══════════════════════════════════════════════════════════
     필드 목록 렌더링
     ══════════════════════════════════════════════════════════ */
  function renderFieldList() {
    if (state.fields.length === 0) {
      fieldListEl.innerHTML = `
        <div class="empty-state" id="emptyFields">
          <div class="empty-icon">📭</div>
          <div class="empty-text">필드가 없습니다</div>
          <div class="empty-hint">위 버튼으로 필드를 추가하세요</div>
        </div>
      `;
      return;
    }

    fieldListEl.innerHTML = state.fields.map(f => renderFieldCard(f)).join('');
    bindFieldEvents();
  }

  /* ══════════════════════════════════════════════════════════
     필드 이벤트 바인딩
     ══════════════════════════════════════════════════════════ */
  function bindFieldEvents() {
    // 토글 (설정 열기/닫기)
    fieldListEl.querySelectorAll('.toggle-field-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.field-card');
        card.classList.toggle('expanded');
      });
    });

    // 삭제
    fieldListEl.querySelectorAll('.delete-field-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.fieldId;
        state.fields = state.fields.filter(f => f.id !== id);
        renderFieldList();
        refreshPreview();
        saveState();
        showToast('필드 삭제됨', 'info');
      });
    });

    // 필드 옵션 변경 (공통)
    fieldListEl.querySelectorAll('.field-opt').forEach(input => {
      const handler = () => {
        const id = input.dataset.fieldId;
        const opt = input.dataset.opt;
        const field = state.fields.find(f => f.id === id);
        if (!field || !opt) return;

        if (input.type === 'checkbox') {
          field[opt] = input.checked;
        } else if (input.type === 'number') {
          field[opt] = parseFloat(input.value) || 0;
        } else {
          field[opt] = input.value;
        }

        // 아이콘 타입 변경 시 에디터 새로 그리기
        if (opt === 'iconType') {
          renderFieldList();
        }

        refreshPreview();
        saveState();
      };

      input.addEventListener('input', debounce(handler, 200));
      input.addEventListener('change', handler);
    });

    // 그리드 스탯 옵션 변경
    fieldListEl.querySelectorAll('.grid-stat-opt').forEach(input => {
      const handler = () => {
        const fieldId = input.dataset.fieldId;
        const statIdx = parseInt(input.dataset.statIdx);
        const opt = input.dataset.opt;
        const field = state.fields.find(f => f.id === fieldId);
        if (!field || !field.stats || !field.stats[statIdx]) return;

        field.stats[statIdx][opt] = input.value;
        refreshPreview();
        saveState();
      };

      input.addEventListener('input', debounce(handler, 200));
      input.addEventListener('change', handler);
    });

    // 그리드 스탯 추가
    fieldListEl.querySelectorAll('.add-stat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const field = state.fields.find(f => f.id === btn.dataset.fieldId);
        if (!field) return;
        if (!field.stats) field.stats = [];
        field.stats.push({ key: 'NEW', label: 'NEW', sampleValue: '0' });
        renderFieldList();
        refreshPreview();
        saveState();
      });
    });

    // 그리드 스탯 삭제
    fieldListEl.querySelectorAll('.remove-stat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const field = state.fields.find(f => f.id === btn.dataset.fieldId);
        const idx = parseInt(btn.dataset.statIdx);
        if (!field || !field.stats) return;
        field.stats.splice(idx, 1);
        renderFieldList();
        refreshPreview();
        saveState();
      });
    });

    // 색상 input 동기화 (color ↔ text)
    fieldListEl.querySelectorAll('.form-color').forEach(colorInput => {
      colorInput.addEventListener('input', () => {
        const row = colorInput.closest('.form-color-row');
        if (!row) return;
        const textInput = row.querySelector('.form-input');
        if (textInput && textInput.dataset.opt === colorInput.dataset.opt) {
          textInput.value = colorInput.value;
          textInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     미리보기 갱신
     ══════════════════════════════════════════════════════════ */
  const refreshPreview = debounce(() => {
    const html = renderPreview(state.fields, state.config);
    previewEl.innerHTML = html;
  }, 150);

  /* ══════════════════════════════════════════════════════════
     헤더 설정 바인딩
     ══════════════════════════════════════════════════════════ */
  function bindHeaderConfig() {
    const charNameInput = $('#cfgCharName');
    const showProfileInput = $('#cfgShowProfile');

    charNameInput.value = state.config.header.charName;
    showProfileInput.checked = state.config.header.showProfile;

    charNameInput.addEventListener('input', debounce(() => {
      state.config.header.charName = charNameInput.value;
      refreshPreview();
      saveState();
    }, 300));

    showProfileInput.addEventListener('change', () => {
      state.config.header.showProfile = showProfileInput.checked;
      refreshPreview();
      saveState();
    });
  }

  /* ══════════════════════════════════════════════════════════
     빌더 UI 다크/라이트 토글
     ══════════════════════════════════════════════════════════ */
  function bindThemeToggle() {
    const toggle = $('#themeToggle');
    const thumb = toggle.querySelector('.toggle-thumb');

    // 저장된 테마 불러오기
    const saved = Storage.get('statusmaker_ui_theme', 'light');
    document.documentElement.setAttribute('data-theme', saved);
    thumb.textContent = saved === 'dark' ? '☀️' : '🌙';

    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      thumb.textContent = next === 'dark' ? '☀️' : '🌙';
      Storage.set('statusmaker_ui_theme', next);
    });
  }

  /* ══════════════════════════════════════════════════════════
     에디터 섹션 아코디언
     ══════════════════════════════════════════════════════════ */
  function bindSectionAccordions() {
    $$('.editor-section-header').forEach(header => {
      header.addEventListener('click', () => {
        header.parentElement.classList.toggle('open');
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     모바일 탭 전환
     ══════════════════════════════════════════════════════════ */
  function bindMobileTabs() {
    $$('.mobile-tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.mobile-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        $('.app-main').setAttribute('data-active-tab', btn.dataset.tab);
        if (btn.dataset.tab === 'preview') {
          refreshPreview();
        }
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     내보내기 버튼
     ══════════════════════════════════════════════════════════ */
  function bindExportButtons() {
    // 설정값 동기화
    const cfgScriptName = $('#cfgScriptName');
    const cfgSeparator = $('#cfgSeparator');
    const cfgPlaceAI = $('#cfgPlaceAI');
    const cfgPlaceUser = $('#cfgPlaceUser');

    cfgScriptName.value = state.config.scriptName;
    cfgSeparator.value = state.config.separator;
    cfgPlaceAI.checked = state.config.placeAI;
    cfgPlaceUser.checked = state.config.placeUser;

    cfgScriptName.addEventListener('input', debounce(() => {
      state.config.scriptName = cfgScriptName.value;
      saveState();
    }, 300));

    cfgSeparator.addEventListener('change', () => {
      state.config.separator = cfgSeparator.value;
      saveState();
    });

    cfgPlaceAI.addEventListener('change', () => {
      state.config.placeAI = cfgPlaceAI.checked;
      saveState();
    });

    cfgPlaceUser.addEventListener('change', () => {
      state.config.placeUser = cfgPlaceUser.checked;
      saveState();
    });

    // JSON 다운로드
    $('#btnExportJSON').addEventListener('click', () => {
      if (state.fields.length === 0) {
        showToast('내보낼 필드가 없습니다!', 'error');
        return;
      }
      syncExportConfig();
      const json = buildExportJSON(state.fields, state.config);
      const safeName = state.config.scriptName.replace(/[^a-zA-Z0-9가-힣_\-\s]/g, '').trim() || 'status';
      downloadJSON(json, `regex-${safeName}.json`);
      showToast('JSON 파일 다운로드 완료!', 'success');
    });

    // Regex 복사
    $('#btnCopyRegex').addEventListener('click', () => {
      if (state.fields.length === 0) {
        showToast('필드가 없습니다!', 'error');
        return;
      }
      syncExportConfig();
      const regex = getRegexString(state.fields, state.config);
      copyToClipboard(regex);
      showToast('Regex가 클립보드에 복사되었습니다!', 'success');
    });

    // HTML 복사
    $('#btnCopyHTML').addEventListener('click', () => {
      if (state.fields.length === 0) {
        showToast('필드가 없습니다!', 'error');
        return;
      }
      const html = getPreviewHTML(state.fields, state.config);
      copyToClipboard(html);
      showToast('HTML이 클립보드에 복사되었습니다!', 'success');
    });
  }

  function syncExportConfig() {
    state.config.scriptName = $('#cfgScriptName').value;
    state.config.separator = $('#cfgSeparator').value;
    state.config.placeAI = $('#cfgPlaceAI').checked;
    state.config.placeUser = $('#cfgPlaceUser').checked;
  }

  /* ══════════════════════════════════════════════════════════
     프로젝트 저장/불러오기
     ══════════════════════════════════════════════════════════ */
  function bindProjectSaveLoad() {
    const loadInput = $('#loadProjectInput');

    $('#btnSaveProject').addEventListener('click', () => {
      const project = {
        version: 1,
        fields: deepClone(state.fields),
        config: deepClone(state.config),
        theme: serializeThemeConfig(),
      };
      downloadJSON(project, 'statusmaker-project.json');
      showToast('프로젝트 저장 완료!', 'success');
    });

    $('#btnLoadProject').addEventListener('click', () => {
      loadInput.click();
    });

    loadInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const data = await readJSONFile(file);
        if (!data.fields || !data.config) {
          throw new Error('올바른 프로젝트 파일이 아닙니다.');
        }
        state.fields = data.fields;
        state.config = { ...state.config, ...data.config };
        if (data.theme) {
          restoreThemeConfig(data.theme);
        }

        // UI 반영
        $('#cfgCharName').value = state.config.header?.charName || '{{user}}';
        $('#cfgShowProfile').checked = state.config.header?.showProfile !== false;
        $('#cfgScriptName').value = state.config.scriptName || '⚙️ 상태창';
        $('#cfgSeparator').value = state.config.separator || '|';
        $('#cfgPlaceAI').checked = state.config.placeAI !== false;
        $('#cfgPlaceUser').checked = !!state.config.placeUser;

        renderFieldList();
        refreshPreview();
        saveState();
        showToast('프로젝트 불러오기 완료!', 'success');
      } catch (err) {
        showToast(err.message || '파일 로드 실패', 'error');
      }
      loadInput.value = '';
    });
  }

  /* ══════════════════════════════════════════════════════════
     localStorage 상태 저장/복원
     ══════════════════════════════════════════════════════════ */
  const STORAGE_KEY = 'statusmaker_state';

  function saveState() {
    Storage.set(STORAGE_KEY, {
      fields: state.fields,
      config: state.config,
      theme: serializeThemeConfig(),
    });
  }

  function loadSavedState() {
    const saved = Storage.get(STORAGE_KEY);
    if (!saved) return;
    if (saved.fields) state.fields = saved.fields;
    if (saved.config) state.config = { ...state.config, ...saved.config };
    if (saved.theme) restoreThemeConfig(saved.theme);
  }

  /* ══════════════════════════════════════════════════════════
     클립보드 복사
     ══════════════════════════════════════════════════════════ */
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }

  /* ── 시작! ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

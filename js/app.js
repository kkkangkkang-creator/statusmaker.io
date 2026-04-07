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
        collapsible: true,
        subText: '',
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
    bindCustomColorEditor();

    // 드래그 앤 드롭
    initDragAndDrop(fieldListEl, (fromIdx, toIdx) => {
      const childFieldIds = new Set();
      state.fields.forEach(f => {
        if (f.type === 'section' && Array.isArray(f.children)) {
          f.children.forEach(id => childFieldIds.add(id));
        }
      });

      // Get top-level fields in order and reorder them
      const topLevel = state.fields.filter(f => !childFieldIds.has(f.id));
      const [moved] = topLevel.splice(fromIdx, 1);
      topLevel.splice(toIdx, 0, moved);

      // Rebuild state.fields: topLevel order, with children inserted right after their parent section
      const newFields = [];
      topLevel.forEach(field => {
        newFields.push(field);
        if (field.type === 'section' && Array.isArray(field.children)) {
          field.children.forEach(childId => {
            const childField = state.fields.find(f => f.id === childId);
            if (childField) newFields.push(childField);
          });
        }
      });
      state.fields = newFields;
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
    // Collect child field IDs so we don't render them as top-level cards
    const childFieldIds = new Set();
    state.fields.forEach(f => {
      if (f.type === 'section' && Array.isArray(f.children)) {
        f.children.forEach(id => childFieldIds.add(id));
      }
    });

    const topLevelFields = state.fields.filter(f => !childFieldIds.has(f.id));

    if (topLevelFields.length === 0) {
      fieldListEl.innerHTML = `
        <div class="empty-state" id="emptyFields">
          <div class="empty-icon">📭</div>
          <div class="empty-text">필드가 없습니다</div>
          <div class="empty-hint">위 버튼으로 필드를 추가하세요</div>
        </div>
      `;
      return;
    }

    fieldListEl.innerHTML = topLevelFields.map(f => renderFieldCard(f)).join('');
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
        // Also delete all children if it's a section
        const field = state.fields.find(f => f.id === id);
        if (field && field.type === 'section' && Array.isArray(field.children)) {
          state.fields = state.fields.filter(f => !field.children.includes(f.id));
        }
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

        // 아이콘 타입 변경 또는 그라데이션 옵션 변경 시 에디터 새로 그리기
        if (opt === 'iconType' || opt === 'useGradient') {
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

    // keyvalue 항목 변경
    fieldListEl.querySelectorAll('.kv-item-opt').forEach(input => {
      const handler = () => {
        const fieldId = input.dataset.fieldId;
        const itemIdx = parseInt(input.dataset.itemIdx);
        const opt = input.dataset.opt;
        const field = state.fields.find(f => f.id === fieldId);
        if (!field || !field.items || !field.items[itemIdx]) return;
        field.items[itemIdx][opt] = input.value;
        refreshPreview();
        saveState();
      };
      input.addEventListener('input', debounce(handler, 200));
      input.addEventListener('change', handler);
    });

    // keyvalue 항목 추가
    fieldListEl.querySelectorAll('.add-kv-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const field = state.fields.find(f => f.id === btn.dataset.fieldId);
        if (!field) return;
        if (!field.items) field.items = [];
        field.items.push({ key: 'NEW', label: '새 항목', sampleValue: '0', bonus: '' });
        renderFieldList();
        refreshPreview();
        saveState();
      });
    });

    // keyvalue 항목 삭제
    fieldListEl.querySelectorAll('.remove-kv-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const field = state.fields.find(f => f.id === btn.dataset.fieldId);
        const idx = parseInt(btn.dataset.itemIdx);
        if (!field || !field.items) return;
        field.items.splice(idx, 1);
        renderFieldList();
        refreshPreview();
        saveState();
      });
    });

    // card 항목 변경
    fieldListEl.querySelectorAll('.card-item-opt').forEach(input => {
      const handler = () => {
        const fieldId = input.dataset.fieldId;
        const itemIdx = parseInt(input.dataset.itemIdx);
        const opt = input.dataset.opt;
        const field = state.fields.find(f => f.id === fieldId);
        if (!field || !field.items || !field.items[itemIdx]) return;
        field.items[itemIdx][opt] = input.value;
        refreshPreview();
        saveState();
      };
      input.addEventListener('input', debounce(handler, 200));
      input.addEventListener('change', handler);
    });

    // card 항목 추가
    fieldListEl.querySelectorAll('.add-card-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const field = state.fields.find(f => f.id === btn.dataset.fieldId);
        if (!field) return;
        if (!field.items) field.items = [];
        field.items.push({ key: 'Card' + (field.items.length + 1), title: '새 카드', description: '설명', tag: '', tagColor: '#6366f1' });
        renderFieldList();
        refreshPreview();
        saveState();
      });
    });

    // card 항목 삭제
    fieldListEl.querySelectorAll('.remove-card-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const field = state.fields.find(f => f.id === btn.dataset.fieldId);
        const idx = parseInt(btn.dataset.itemIdx);
        if (!field || !field.items) return;
        field.items.splice(idx, 1);
        renderFieldList();
        refreshPreview();
        saveState();
      });
    });

    // card 색상 input 동기화
    fieldListEl.querySelectorAll('.card-items-editor .form-color').forEach(colorInput => {
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

    // buff 항목 변경
    fieldListEl.querySelectorAll('.buff-item-opt').forEach(input => {
      const handler = () => {
        const fieldId = input.dataset.fieldId;
        const itemIdx = parseInt(input.dataset.itemIdx);
        const opt = input.dataset.opt;
        const field = state.fields.find(f => f.id === fieldId);
        if (!field || !field.items || !field.items[itemIdx]) return;
        if (input.type === 'checkbox') {
          field.items[itemIdx][opt] = input.checked;
        } else {
          field.items[itemIdx][opt] = input.value;
        }
        refreshPreview();
        saveState();
      };
      input.addEventListener('input', debounce(handler, 200));
      input.addEventListener('change', handler);
    });

    // buff 항목 추가
    fieldListEl.querySelectorAll('.add-buff-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const field = state.fields.find(f => f.id === btn.dataset.fieldId);
        if (!field) return;
        if (!field.items) field.items = [];
        field.items.push({ key: 'Buff' + (field.items.length + 1), name: '새 효과', effect: '효과 설명', type: 'buff' });
        renderFieldList();
        refreshPreview();
        saveState();
      });
    });

    // buff 항목 삭제
    fieldListEl.querySelectorAll('.remove-buff-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const field = state.fields.find(f => f.id === btn.dataset.fieldId);
        const idx = parseInt(btn.dataset.itemIdx);
        if (!field || !field.items) return;
        field.items.splice(idx, 1);
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

    // 섹션 내 필드 추가
    fieldListEl.querySelectorAll('.add-child-field-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sectionField = state.fields.find(f => f.id === btn.dataset.sectionId);
        if (!sectionField) return;
        const type = btn.dataset.childType;
        const newField = createField(type);
        if (!newField) return;
        state.fields.push(newField);
        if (!sectionField.children) sectionField.children = [];
        sectionField.children.push(newField.id);
        renderFieldList();
        refreshPreview();
        saveState();
        showToast(`${FIELD_TYPES[type]?.icon || ''} ${FIELD_TYPES[type]?.label || type} 필드 추가됨 (섹션 내)`, 'success');
      });
    });

    // 섹션 내 필드 제거 (섹션에서만 제거, 필드 자체 삭제는 기존 delete 버튼 사용)
    fieldListEl.querySelectorAll('.remove-child-field-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sectionField = state.fields.find(f => f.id === btn.dataset.sectionId);
        const childId = btn.dataset.childId;
        if (!sectionField || !childId) return;
        sectionField.children = (sectionField.children || []).filter(id => id !== childId);
        state.fields = state.fields.filter(f => f.id !== childId);
        renderFieldList();
        refreshPreview();
        saveState();
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     커스텀 색상 편집기
     ══════════════════════════════════════════════════════════ */
  function bindCustomColorEditor() {
    const editorEl = $('#customColorEditor');
    if (!editorEl) return;

    function renderEditor() {
      editorEl.innerHTML = renderCustomColorEditor();
      attachColorEditorEvents();
    }

    function attachColorEditorEvents() {
      // 색상 color input ↔ text input 동기화 및 변수 업데이트
      editorEl.querySelectorAll('.custom-var-color').forEach(colorInput => {
        colorInput.addEventListener('input', () => {
          const varName = colorInput.dataset.var;
          const row = colorInput.closest('.form-color-row');
          const textInput = row ? row.querySelector('.custom-var-text') : null;
          if (textInput) textInput.value = colorInput.value;
          updateCustomVar(varName, colorInput.value);
          refreshPreview();
          saveState();
        });
      });

      // 텍스트 input에서 직접 입력
      editorEl.querySelectorAll('.custom-var-text').forEach(textInput => {
        const handler = debounce(() => {
          const varName = textInput.dataset.var;
          const val = textInput.value.trim();
          if (!val) return;
          const row = textInput.closest('.form-color-row');
          const colorInput = row ? row.querySelector('.custom-var-color') : null;
          if (colorInput && /^#[0-9a-fA-F]{3,8}$/.test(val)) {
            colorInput.value = val;
          }
          updateCustomVar(varName, val);
          refreshPreview();
          saveState();
        }, 300);
        textInput.addEventListener('input', handler);
      });

      // 둥글기 슬라이더
      const rangeInput = editorEl.querySelector('.custom-var-range');
      const radiusLabel = editorEl.querySelector('#radiusValueLabel');
      if (rangeInput) {
        rangeInput.addEventListener('input', () => {
          const val = rangeInput.value + 'px';
          if (radiusLabel) radiusLabel.textContent = val;
          updateCustomVar('--sw-radius', val);
          refreshPreview();
          saveState();
        });
      }

      // 폰트 선택
      const fontSelect = editorEl.querySelector('.custom-var-font');
      if (fontSelect) {
        fontSelect.addEventListener('change', () => {
          updateCustomVar('--sw-font', fontSelect.value);
          refreshPreview();
          saveState();
        });
      }

      // 모서리 모양 버튼
      editorEl.querySelectorAll('.corner-shape-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const radius = btn.dataset.radius;
          updateCustomVar('--sw-radius', radius + 'px');
          const rangeEl = editorEl.querySelector('#radiusRange');
          if (rangeEl) rangeEl.value = radius;
          const labelEl = editorEl.querySelector('#radiusValueLabel');
          if (labelEl) labelEl.textContent = radius + 'px';
          refreshPreview();
          saveState();
          renderEditor();
        });
      });

      // 프리셋 내보내기
      const btnExport = editorEl.querySelector('#btnExportPreset');
      if (btnExport) {
        btnExport.addEventListener('click', () => {
          const preset = {
            type: 'statusmaker-preset',
            version: 1,
            name: '내 프리셋',
            vars: deepClone(getCurrentThemeVars()),
          };
          downloadJSON(preset, 'statusmaker-preset.json');
          showToast('프리셋이 저장되었습니다!', 'success');
        });
      }

      // 프리셋 불러오기
      const btnImport = editorEl.querySelector('#btnImportPreset');
      const importInput = editorEl.querySelector('#importPresetInput');
      if (btnImport && importInput) {
        btnImport.addEventListener('click', () => {
          importInput.click();
        });

        importInput.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          try {
            const data = await readJSONFile(file);
            if (data.type !== 'statusmaker-preset' || !data.vars) {
              throw new Error('올바른 프리셋 파일이 아닙니다.');
            }
            Object.entries(data.vars).forEach(([key, val]) => {
              updateCustomVar(key, val);
            });
            renderEditor();
            refreshPreview();
            saveState();
            showToast('프리셋을 불러왔습니다!', 'success');
          } catch (err) {
            showToast(err.message || '프리셋 로드 실패', 'error');
          }
          e.target.value = '';
        });
      }
    }

    renderEditor();
  }


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
    const collapsibleInput = $('#cfgCollapsible');
    const subTextInput = $('#cfgSubText');

    charNameInput.value = state.config.header.charName;
    showProfileInput.checked = state.config.header.showProfile;
    if (collapsibleInput) collapsibleInput.checked = state.config.header.collapsible !== false;
    if (subTextInput) subTextInput.value = state.config.header.subText || '';

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

    if (collapsibleInput) {
      collapsibleInput.addEventListener('change', () => {
        state.config.header.collapsible = collapsibleInput.checked;
        refreshPreview();
        saveState();
      });
    }

    if (subTextInput) {
      subTextInput.addEventListener('input', debounce(() => {
        state.config.header.subText = subTextInput.value;
        refreshPreview();
        saveState();
      }, 300));
    }
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
        const cfgCollapsible = $('#cfgCollapsible');
        if (cfgCollapsible) cfgCollapsible.checked = state.config.header?.collapsible !== false;
        const cfgSubText = $('#cfgSubText');
        if (cfgSubText) cfgSubText.value = state.config.header?.subText || '';
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
    if (saved.config) {
      state.config = { ...state.config, ...saved.config };
      // Deep merge header to preserve new defaults
      state.config.header = { ...state.config.header, ...(saved.config.header || {}) };
    }
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

/* ============================================================
   export.js — SillyTavern Regex JSON 내보내기
   ============================================================ */

/**
 * 필드 배열 → findRegex 문자열 생성
 * SillyTavern의 <status>...</status> 태그를 매칭
 *
 * separator: '|' → Key=Value|Key=Value
 *            'newline' → Key:Value\nKey:Value
 */
function buildFindRegex(fields, separator) {
  if (separator === 'newline') {
    // 줄바꿈 형식: <status>\nKey:...\nKey:...\n</status>
    // 각 필드를 (.*?) 로 캡처
    let inner = '';
    flattenFieldKeys(fields).forEach((key, i) => {
      if (i > 0) inner += '\\n';
      inner += escapeRegex(key) + ':([^\\n]*)';
    });
    return `/<status>\\n${inner}\\n<\\/status>/g`;
  }

  // 파이프 형식: <status>Key=Value|Key=Value</status>
  const parts = flattenFieldKeys(fields).map(key => {
    return escapeRegex(key) + '=([^|]*)';
  });
  return `/<status>${parts.join('\\|')}<\\/status>/g`;
}

/**
 * 필드 배열에서 모든 키를 평탄화하여 추출
 * (grid 타입은 내부 stats의 키를 사용, keyvalue/card/buff는 items 키 사용)
 */
function flattenFieldKeys(fields) {
  const keys = [];
  const childFieldIds = new Set();

  // First collect all child field IDs from sections
  fields.forEach(field => {
    if (field.type === 'section' && Array.isArray(field.children)) {
      field.children.forEach(id => childFieldIds.add(id));
    }
  });

  fields.forEach(field => {
    if (field.type === 'section' || field.type === 'separator') {
      // Process section children
      if (field.type === 'section' && Array.isArray(field.children)) {
        field.children.forEach(childId => {
          const childField = fields.find(f => f.id === childId);
          if (!childField || childField.type === 'section' || childField.type === 'separator') return;
          if (childField.type === 'grid') {
            (childField.stats || []).forEach(s => keys.push(s.key));
          } else if (['keyvalue', 'card', 'buff'].includes(childField.type)) {
            (childField.items || []).forEach(item => keys.push(item.key));
          } else {
            keys.push(childField.key);
          }
        });
      }
      return;
    }
    // Skip fields that are children of a section (already processed above)
    if (childFieldIds.has(field.id)) return;

    if (field.type === 'grid') {
      (field.stats || []).forEach(s => keys.push(s.key));
    } else if (field.type === 'keyvalue') {
      (field.items || []).forEach(item => keys.push(item.key));
    } else if (field.type === 'card') {
      (field.items || []).forEach(item => keys.push(item.key));
    } else if (field.type === 'buff') {
      (field.items || []).forEach(item => keys.push(item.key));
    } else {
      keys.push(field.key);
    }
  });
  return keys;
}

/**
 * 필드 배열 + 설정 → replaceString (상태창 HTML) 생성
 * preview.js의 renderPreview를 재활용
 */
function buildReplaceString(fields, config) {
  const html = renderPreview(fields, config);

  // SillyTavern replaceString에서 캡처그룹 $1, $2... 로 치환
  // 미리보기의 샘플값을 $n 으로 교체
  let result = html;
  let captureIdx = 1;

  fields.forEach(field => {
    if (field.type === 'section' || field.type === 'separator') return;

    if (field.type === 'grid') {
      (field.stats || []).forEach(s => {
        const sample = escapeHtml(s.sampleValue || '0');
        // 그리드 값 치환 — HTML 내에서 해당 샘플값을 $n으로
        result = replaceFirstOccurrence(result, sample, `$${captureIdx}`);
        captureIdx++;
      });
    } else if (field.type === 'keyvalue') {
      (field.items || []).forEach(item => {
        const sample = escapeHtml(item.sampleValue || '0');
        result = replaceFirstOccurrence(result, sample, `$${captureIdx}`);
        captureIdx++;
      });
    } else if (field.type === 'card') {
      (field.items || []).forEach(item => {
        const sample = escapeHtml(item.title || '');
        if (sample) result = replaceFirstOccurrence(result, sample, `$${captureIdx}`);
        captureIdx++;
      });
    } else if (field.type === 'buff') {
      (field.items || []).forEach(item => {
        const sample = escapeHtml(item.name || '');
        if (sample) result = replaceFirstOccurrence(result, sample, `$${captureIdx}`);
        captureIdx++;
      });
    } else {
      const sample = escapeHtml(field.sampleValue || '-');
      if (field.type === 'badge') {
        // 뱃지는 원본 문자열 전체를 $n으로 (JS에서 분할 처리)
        result = replaceBadgeSample(result, field, `$${captureIdx}`);
        captureIdx++;
      } else if (field.type === 'itemlist') {
        // 아이템목록도 뱃지와 동일하게 처리
        result = replaceItemListSample(result, field, `$${captureIdx}`);
        captureIdx++;
      } else if (field.type === 'bar') {
        // 바: 값 부분 + 퍼센트 너비 부분 모두 동적
        result = replaceBarSample(result, field, captureIdx);
        captureIdx++;
      } else {
        // text
        result = replaceFirstOccurrence(result, sample, `$${captureIdx}`);
        captureIdx++;
      }
    }
  });

  // 코드블록으로 감싸기 (SillyTavern markdownOnly 용)
  return '```\n<!DOCTYPE html>\n<html lang="ko">\n<head>\n<meta charset="UTF-8">\n' + extractAfterDoctype(result) + '\n```';
}

/** 첫 번째 등장만 치환 */
function replaceFirstOccurrence(str, search, replacement) {
  const idx = str.indexOf(search);
  if (idx === -1) return str;
  return str.substring(0, idx) + replacement + str.substring(idx + search.length);
}

/** 뱃지 샘플값을 $n으로 치환 */
function replaceBadgeSample(html, field, capture) {
  // 뱃지 HTML에서 개별 badge 태그들을 capture 그룹 참조로 교체
  // 런타임 JS로 분리하도록 원본 문자열을 $n으로 세팅
  const sampleEscaped = escapeHtml(field.sampleValue || '');
  // 우선 전체 badge-list 내용을 캡처그룹 + JS 분할 코드로 교체
  const badgeListRegex = new RegExp(
    '<div class="sw-badge-list">([\\s\\S]*?)</div>',
    ''
  );
  const match = html.match(badgeListRegex);
  if (match) {
    const replacement = `<div class="sw-badge-list"><span class="sw-badge-raw" data-sep="${escapeHtml(field.separator || ',')}" data-val="${capture}">${capture}</span></div>`;
    html = html.replace(match[0], replacement);
  }
  return html;
}

/** 아이템 목록 샘플값을 $n으로 치환 */
function replaceItemListSample(html, field, capture) {
  const itemListRegex = new RegExp(
    '<div class="sw-itemlist">([\\s\\S]*?)</div>',
    ''
  );
  const match = html.match(itemListRegex);
  if (match) {
    const replacement = `<div class="sw-itemlist"><span class="sw-itemlist-raw" data-sep="${escapeHtml(field.separator || ',')}" data-val="${capture}">${capture}</span></div>`;
    html = html.replace(match[0], replacement);
  }
  return html;
}

/** 바 샘플값을 $n으로 치환 (값 표시 + width) */
function replaceBarSample(html, field, captureIdx) {
  const capture = `$${captureIdx}`;
  const val = parseFloat(field.sampleValue) || 0;
  const max = parseFloat(field.max) || 100;
  const min = parseFloat(field.min) || 0;
  const range = max - min || 1;
  const pct = Math.max(0, Math.min(100, ((val - min) / range) * 100));

  // 표시값 치환
  let displayVal = '';
  switch (field.displayFormat) {
    case 'current/max': displayVal = `${val}/${max}`; break;
    case 'percent': displayVal = `${Math.round(pct)}%`; break;
    case 'signed': displayVal = (val >= 0 ? '+' : '') + val; break;
    default: displayVal = `${val}/${max}`;
  }

  html = replaceFirstOccurrence(html, `>${displayVal}<`, `><span class="sw-bar-dynamic" data-format="${field.displayFormat}" data-min="${min}" data-max="${max}" data-val="${capture}">${capture}</span><`);

  // width 퍼센트 치환 — 런타임 JS에서 계산하도록 data 속성 추가
  const widthStr = `width:${pct}%`;
  html = replaceFirstOccurrence(html, widthStr, `width:0%" data-bar-val="${capture}" data-bar-min="${min}" data-bar-max="${max}`);

  return html;
}

/** DOCTYPE 이후 부분 추출 (replaceString 조립용) */
function extractAfterDoctype(html) {
  const idx = html.indexOf('<style>');
  if (idx === -1) return html;
  return html.substring(idx);
}

/**
 * 런타임 스크립트 생성
 * (SillyTavern 안에서 실행될 <script> 태그)
 */
function buildRuntimeScript(fields, config) {
  const headerConfig = config.header || {};
  const charName = headerConfig.charName || '{{user}}';

  let script = `
<script>
(function() {
  // 프로필 이미지 클릭 업로드
  var profileImg = document.querySelector('.sw-profile-img');
  if (profileImg) {
    var STORAGE_KEY = 'statusmaker_profile_' + '${charName}'.replace(/[{}]/g,'');
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) profileImg.src = saved;
    
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    profileImg.style.cursor = 'pointer';
    profileImg.addEventListener('click', function(e) {
      e.stopPropagation();
      fileInput.click();
    });
    
    fileInput.addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (!file || !file.type.startsWith('image/')) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        var img = new Image();
        img.onload = function() {
          var c = document.createElement('canvas');
          var w = img.width, h = img.height, max = 300;
          if (w > h) { if(w>max){h=Math.round(h*max/w);w=max;} }
          else { if(h>max){w=Math.round(w*max/h);h=max;} }
          c.width=w; c.height=h;
          c.getContext('2d').drawImage(img,0,0,w,h);
          var url = c.toDataURL('image/jpeg',0.7);
          profileImg.src = url;
          try{localStorage.setItem(STORAGE_KEY,url);}catch(err){}
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // 동적 바 계산
  document.querySelectorAll('[data-bar-val]').forEach(function(el) {
    var val = parseFloat(el.dataset.barVal) || 0;
    var min = parseFloat(el.dataset.barMin) || 0;
    var max = parseFloat(el.dataset.barMax) || 100;
    var pct = Math.max(0, Math.min(100, ((val - min) / (max - min || 1)) * 100));
    el.style.width = pct + '%';
  });

  // 동적 바 값 표시
  document.querySelectorAll('.sw-bar-dynamic').forEach(function(el) {
    var val = parseFloat(el.dataset.val) || 0;
    var min = parseFloat(el.dataset.min) || 0;
    var max = parseFloat(el.dataset.max) || 100;
    var fmt = el.dataset.format;
    var pct = Math.max(0, Math.min(100, ((val - min) / (max - min || 1)) * 100));
    if (fmt === 'percent') el.textContent = Math.round(pct) + '%';
    else if (fmt === 'signed') el.textContent = (val >= 0 ? '+' : '') + val;
    else el.textContent = val + '/' + max;
  });

  // 뱃지 분할
  document.querySelectorAll('.sw-badge-raw').forEach(function(el) {
    var raw = el.dataset.val || el.textContent;
    var sep = el.dataset.sep || ',';
    if (raw && raw.trim() && raw.trim() !== 'None') {
      var items = raw.split(sep).map(function(s){return s.trim();}).filter(Boolean);
      el.innerHTML = items.map(function(i){return '<span class=\"sw-badge\">'+i+'</span>';}).join('');
      el.className = 'sw-badge-list';
    }
  });

  // 아이템 목록 분할
  document.querySelectorAll('.sw-itemlist-raw').forEach(function(el) {
    var raw = el.dataset.val || el.textContent;
    var sep = el.dataset.sep || ',';
    if (raw && raw.trim() && raw.trim() !== 'None') {
      var items = raw.split(sep).map(function(s){return s.trim();}).filter(Boolean);
      el.innerHTML = items.map(function(i){return '<span class=\"sw-itemlist-item\">'+i+'</span>';}).join('');
      el.className = 'sw-itemlist';
    }
  });
})();
<\\/script>`;

  return script;
}

/**
 * 전체 SillyTavern Regex JSON 생성
 */
function buildExportJSON(fields, config) {
  const separator = config.separator || '|';
  const scriptName = config.scriptName || '⚙️ 상태창';
  const placement = [];
  if (config.placeAI) placement.push(2);
  if (config.placeUser) placement.push(1);

  const findRegex = buildFindRegex(fields, separator);
  const replaceString = buildReplaceString(fields, config);

  return {
    id: generateUUID(),
    scriptName: scriptName,
    findRegex: findRegex,
    replaceString: replaceString,
    trimStrings: [],
    placement: placement.length > 0 ? placement : [2],
    disabled: false,
    markdownOnly: true,
    promptOnly: false,
    runOnEdit: true,
    substituteRegex: separator === '|' ? 1 : 0,
    minDepth: null,
    maxDepth: 3
  };
}

/**
 * findRegex만 텍스트로 추출 (복사용)
 */
function getRegexString(fields, config) {
  return buildFindRegex(fields, config.separator || '|');
}

/**
 * 미리보기 HTML만 추출 (복사용)
 */
function getPreviewHTML(fields, config) {
  return renderPreview(fields, config);
}

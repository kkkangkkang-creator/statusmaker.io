/* ============================================================
   utils.js — 유틸리티 함수
   ============================================================ */

/** UUID v4 생성 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/** HTML 이스케이프 */
function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(str).replace(/[&<>"']/g, m => map[m]);
}

/** 정규식 특수문자 이스케이프 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 디바운스 */
function debounce(fn, ms = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

/** 딥 클론 (JSON 직렬화 가능 객체) */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/** 토스트 알림 */
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/** Ripple 이펙트 — 버튼에 사용 */
function addRipple(e) {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'ripple-effect';
  ripple.style.left = (e.clientX - rect.left) + 'px';
  ripple.style.top = (e.clientY - rect.top) + 'px';
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 500);
}

/** JSON 파일 다운로드 */
function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** JSON 파일 읽기 */
function readJSONFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        resolve(JSON.parse(e.target.result));
      } catch (err) {
        reject(new Error('잘못된 JSON 파일입니다.'));
      }
    };
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
    reader.readAsText(file);
  });
}

/** 드래그 앤 드롭 (필드 목록) */
function initDragAndDrop(listEl, onReorder) {
  let draggedEl = null;
  let draggedIdx = -1;

  listEl.addEventListener('dragstart', e => {
    const card = e.target.closest('.field-card');
    if (!card) return;
    draggedEl = card;
    draggedIdx = [...listEl.children].indexOf(card);
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  listEl.addEventListener('dragend', e => {
    if (draggedEl) {
      draggedEl.classList.remove('dragging');
      draggedEl = null;
    }
  });

  listEl.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const card = e.target.closest('.field-card');
    if (!card || card === draggedEl) return;

    const rect = card.getBoundingClientRect();
    const mid = rect.top + rect.height / 2;
    if (e.clientY < mid) {
      listEl.insertBefore(draggedEl, card);
    } else {
      listEl.insertBefore(draggedEl, card.nextSibling);
    }
  });

  listEl.addEventListener('drop', e => {
    e.preventDefault();
    if (!draggedEl) return;
    const newIdx = [...listEl.children].indexOf(draggedEl);
    if (draggedIdx !== newIdx && onReorder) {
      onReorder(draggedIdx, newIdx);
    }
  });
}

/** localStorage 저장/불러오기 (안전) */
const Storage = {
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { /* quota exceeded 등 무시 */ }
  },
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch {}
  }
};

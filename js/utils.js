// ============================================================
// utils.js — Shared Utilities
// ============================================================

// ── Toast Notifications ──────────────────────────────────────
const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 3500) {
    this.init();
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${message}</span>`;
    this.container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-show'));
    setTimeout(() => {
      toast.classList.remove('toast-show');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, duration);
  },

  success: (msg) => Toast.show(msg, 'success'),
  error:   (msg) => Toast.show(msg, 'error'),
  warning: (msg) => Toast.show(msg, 'warning'),
  info:    (msg) => Toast.show(msg, 'info'),
};

// ── Modal Dialog ──────────────────────────────────────────────
const Modal = {
  _el: null,

  _getEl() {
    if (!this._el) this._el = document.getElementById('global-modal');
    return this._el;
  },

  show({ title = '', body = '', onConfirm = null, confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) {
    const el = this._getEl();
    if (!el) return;
    el.querySelector('.modal-title').textContent = title;
    el.querySelector('.modal-body').innerHTML = body;

    const confirmBtn = el.querySelector('.modal-confirm');
    const cancelBtn = el.querySelector('.modal-cancel');

    confirmBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;
    confirmBtn.className = 'btn ' + (danger ? 'btn-danger' : 'btn-primary');

    // Clone buttons to remove old listeners
    const newConfirm = confirmBtn.cloneNode(true);
    const newCancel = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

    newConfirm.addEventListener('click', () => {
      this.hide();
      if (onConfirm) onConfirm();
    });
    newCancel.addEventListener('click', () => this.hide());

    el.classList.add('modal-open');
    el.addEventListener('click', (e) => { if (e.target === el) this.hide(); }, { once: true });
  },

  hide() {
    const el = this._getEl();
    if (el) el.classList.remove('modal-open');
  },

  form({ title = '', fields = [], onSubmit = null, confirmText = 'Save' }) {
    const formHtml = `
      <form id="modal-form" class="modal-form" autocomplete="off">
        ${fields.map(f => `
          <div class="form-group">
            <label for="mf_${f.name}">${f.label}${f.required ? ' *' : ''}</label>
            ${f.type === 'select'
              ? `<select id="mf_${f.name}" name="${f.name}" ${f.required ? 'required' : ''}>
                  ${f.placeholder ? `<option value="">${f.placeholder}</option>` : ''}
                  ${(f.options || []).map(o => `<option value="${o.value}" ${o.value == f.value ? 'selected' : ''}>${o.label}</option>`).join('')}
                </select>`
              : f.type === 'textarea'
                ? `<textarea id="mf_${f.name}" name="${f.name}" placeholder="${f.placeholder || ''}" rows="3" ${f.required ? 'required' : ''}>${f.value || ''}</textarea>`
                : `<input id="mf_${f.name}" type="${f.type || 'text'}" name="${f.name}" placeholder="${f.placeholder || ''}" value="${f.value || ''}" ${f.required ? 'required' : ''} ${f.min ? 'min="' + f.min + '"' : ''} ${f.max ? 'max="' + f.max + '"' : ''}>`
            }
          </div>
        `).join('')}
      </form>`;

    this.show({
      title,
      body: formHtml,
      confirmText,
      onConfirm: () => {
        const formEl = document.getElementById('modal-form');
        if (!formEl) return;
        if (!formEl.checkValidity()) { formEl.reportValidity(); return; }
        const data = Object.fromEntries(new FormData(formEl));
        if (onSubmit) onSubmit(data);
      },
    });

    // Re-attach confirm to validate form first
    const confirmBtn = this._getEl().querySelector('.modal-confirm');
    confirmBtn.addEventListener('click', (e) => {
      e.stopImmediatePropagation();
      const formEl = document.getElementById('modal-form');
      if (formEl && !formEl.checkValidity()) {
        formEl.reportValidity();
        return;
      }
      this.hide();
      if (onSubmit) {
        const data = formEl ? Object.fromEntries(new FormData(formEl)) : {};
        onSubmit(data);
      }
    }, { once: true });
  },
};

// ── Date / Time Helpers ───────────────────────────────────────
const Fmt = {
  date(str) {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  },
  dateTime(str) {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  },
  currency(n) {
    return '₹' + Number(n || 0).toLocaleString('en-IN');
  },
  today() {
    return new Date().toISOString().slice(0, 10);
  },
  minDate() {
    return Fmt.today();
  },
  relativeTime(str) {
    if (!str) return '';
    const diff = Date.now() - new Date(str).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return Fmt.date(str);
  },
};

// ── Simple Bar Chart ──────────────────────────────────────────
function drawBarChart(canvasId, labels, values, color = '#3b82f6') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const pad = { top: 20, bottom: 40, left: 40, right: 10 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;
  const max = Math.max(...values, 1);

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fillRect(0, 0, W, H);

  const barW = (chartW / labels.length) * 0.6;
  const gap = chartW / labels.length;

  // Grid lines
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + chartH - (chartH * i / 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(Math.round(max * i / 4), 2, y + 3);
  }

  labels.forEach((label, i) => {
    const x = pad.left + gap * i + (gap - barW) / 2;
    const barH = (values[i] / max) * chartH;
    const y = pad.top + chartH - barH;

    // Gradient bar
    const grad = ctx.createLinearGradient(0, y, 0, y + barH);
    grad.addColorStop(0, color);
    grad.addColorStop(1, color + '44');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
    ctx.fill();

    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + barW / 2, H - 10);
    ctx.textAlign = 'left';
  });
}

// ── Simple Donut Chart ────────────────────────────────────────
function drawDonutChart(canvasId, segments, colors) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const R = Math.min(W, H) / 2 - 10;
  const total = segments.reduce((s, v) => s + v.value, 0) || 1;

  ctx.clearRect(0, 0, W, H);
  let angle = -Math.PI / 2;

  segments.forEach((seg, i) => {
    const slice = (seg.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    angle += slice;
  });

  // Donut hole
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.6, 0, Math.PI * 2);
  ctx.fillStyle = '#111827';
  ctx.fill();

  // Center text
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(total, cx, cy + 6);
  ctx.font = '11px Inter, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('Total', cx, cy + 20);
  ctx.textAlign = 'left';
}

// ── Status Badges ─────────────────────────────────────────────
function statusBadge(status) {
  const map = {
    active: ['badge-success', 'Active'],
    admitted: ['badge-info', 'Admitted'],
    outpatient: ['badge-warning', 'Outpatient'],
    confirmed: ['badge-success', 'Confirmed'],
    pending: ['badge-warning', 'Pending'],
    completed: ['badge-muted', 'Completed'],
    cancelled: ['badge-danger', 'Cancelled'],
    available: ['badge-success', 'Available'],
    occupied: ['badge-danger', 'Occupied'],
    paid: ['badge-success', 'Paid'],
    partial: ['badge-warning', 'Partial'],
    normal: ['badge-success', 'Normal'],
    abnormal: ['badge-danger', 'Abnormal'],
    review: ['badge-warning', 'Review'],
    maintenance: ['badge-muted', 'Maintenance'],
    inactive: ['badge-muted', 'Inactive'],
  };
  const [cls, label] = map[status] || ['badge-muted', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

// ── Pagination ────────────────────────────────────────────────
function paginate(items, page, perPage = 8) {
  const total = Math.ceil(items.length / perPage);
  const slice = items.slice((page - 1) * perPage, page * perPage);
  return { items: slice, total, page };
}

function paginationHtml(page, total, onPageClick) {
  if (total <= 1) return '';
  let html = '<div class="pagination">';
  html += `<button onclick="${onPageClick}(${page - 1})" ${page <= 1 ? 'disabled' : ''}>‹</button>`;
  for (let i = 1; i <= total; i++) {
    html += `<button class="${i === page ? 'active' : ''}" onclick="${onPageClick}(${i})">${i}</button>`;
  }
  html += `<button onclick="${onPageClick}(${page + 1})" ${page >= total ? 'disabled' : ''}>›</button>`;
  html += '</div>';
  return html;
}

// ── Search Filter ─────────────────────────────────────────────
function filterItems(items, query, fields) {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(item => fields.some(f => (item[f] || '').toString().toLowerCase().includes(q)));
}

// ── Confirm Dialog ────────────────────────────────────────────
function confirmDelete(name, onConfirm) {
  Modal.show({
    title: 'Confirm Delete',
    body: `<p>Are you sure you want to delete <strong>${name}</strong>? This action cannot be undone.</p>`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    danger: true,
    onConfirm,
  });
}

// ── Avatar Initials ───────────────────────────────────────────
function avatarInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

// ── Empty State ───────────────────────────────────────────────
function emptyState(icon, title, subtitle = '') {
  return `<div class="empty-state">
    <div class="empty-icon">${icon}</div>
    <h3>${title}</h3>
    ${subtitle ? `<p>${subtitle}</p>` : ''}
  </div>`;
}

window.Toast = Toast;
window.Modal = Modal;
window.Fmt = Fmt;
window.drawBarChart = drawBarChart;
window.drawDonutChart = drawDonutChart;
window.statusBadge = statusBadge;
window.paginate = paginate;
window.paginationHtml = paginationHtml;
window.filterItems = filterItems;
window.confirmDelete = confirmDelete;
window.avatarInitials = avatarInitials;
window.emptyState = emptyState;

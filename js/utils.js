/* =============================================================================
   ALIRIN — js/utils.js
   Shared utility functions used across all pages
   ============================================================================= */

'use strict';

/**
 * Selects a single DOM element.
 * @param {string} selector
 * @param {Element} [context=document]
 * @returns {Element|null}
 */
export const qs  = (selector, context = document) => context.querySelector(selector);

/**
 * Selects all matching DOM elements.
 * @param {string} selector
 * @param {Element} [context=document]
 * @returns {NodeList}
 */
export const qsa = (selector, context = document) => context.querySelectorAll(selector);

/**
 * Adds event listeners to one or many elements.
 * @param {Element|NodeList|Array} target
 * @param {string} event
 * @param {Function} handler
 * @param {object} [options]
 */
export function on(target, event, handler, options) {
  const els = target instanceof NodeList || Array.isArray(target) ? target : [target];
  els.forEach(el => el?.addEventListener(event, handler, options));
}

/**
 * Removes event listeners.
 */
export function off(target, event, handler) {
  const els = target instanceof NodeList || Array.isArray(target) ? target : [target];
  els.forEach(el => el?.removeEventListener(event, handler));
}

/**
 * Returns a debounced version of a function.
 * @param {Function} fn
 * @param {number} delay — ms
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Returns a throttled version of a function.
 * @param {Function} fn
 * @param {number} limit — ms
 */
export function throttle(fn, limit = 200) {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= limit) { lastCall = now; fn(...args); }
  };
}

/**
 * Adds one or more classes to an element.
 */
export const addClass    = (el, ...cls) => el?.classList.add(...cls);

/**
 * Removes one or more classes from an element.
 */
export const removeClass = (el, ...cls) => el?.classList.remove(...cls);

/**
 * Toggles a class on an element.
 */
export const toggleClass = (el, cls) => el?.classList.toggle(cls);

/**
 * Checks if an element has a class.
 */
export const hasClass    = (el, cls) => el?.classList.contains(cls);

/**
 * Formats a date string in Indonesian locale.
 * @param {string|Date} dateInput
 * @param {string} [style='medium'] — 'short' | 'medium' | 'long'
 * @returns {string}
 */
export function formatDate(dateInput, style = 'medium') {
  const date = new Date(dateInput);
  const opts = {
    short:  { day: 'numeric', month: 'short', year: 'numeric' },
    medium: { day: 'numeric', month: 'long',  year: 'numeric' },
    long:   { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  };
  return new Intl.DateTimeFormat('id-ID', opts[style]).format(date);
}

/**
 * Formats a date+time in Indonesian locale.
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function formatDateTime(dateInput) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateInput));
}

/**
 * Formats a relative time (e.g. "3 hari lalu").
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function formatRelativeTime(dateInput) {
  const rtf  = new Intl.RelativeTimeFormat('id', { numeric: 'auto' });
  const diff  = (new Date(dateInput) - Date.now()) / 1000;
  const units = [
    { unit: 'year',   sec: 31536000 },
    { unit: 'month',  sec: 2592000  },
    { unit: 'week',   sec: 604800   },
    { unit: 'day',    sec: 86400    },
    { unit: 'hour',   sec: 3600     },
    { unit: 'minute', sec: 60       },
    { unit: 'second', sec: 1        },
  ];
  for (const { unit, sec } of units) {
    if (Math.abs(diff) >= sec) return rtf.format(Math.round(diff / sec), unit);
  }
  return 'baru saja';
}

/**
 * Truncates a string to a maximum length.
 * @param {string} str
 * @param {number} maxLen
 * @param {string} [ellipsis='…']
 */
export function truncate(str, maxLen, ellipsis = '…') {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + ellipsis;
}

/**
 * Generates a risk badge HTML string.
 * @param {'normal'|'waspada'|'tinggi'|'kritis'} level
 * @returns {string}
 */
export function riskBadge(level) {
  const map = {
    normal:  { cls: 'badge--normal',  label: 'Normal' },
    waspada: { cls: 'badge--waspada', label: 'Waspada' },
    tinggi:  { cls: 'badge--tinggi',  label: 'Tinggi' },
    kritis:  { cls: 'badge--kritis',  label: 'Kritis' },
  };
  const b = map[level] || map.normal;
  return `<span class="badge ${b.cls}" aria-label="Level risiko: ${b.label}">${b.label}</span>`;
}

/**
 * Generates a status badge HTML string.
 */
export function statusBadge(status) {
  const map = {
    pending:   { cls: 'badge--pending',   label: 'Menunggu Verifikasi' },
    verified:  { cls: 'badge--verified',  label: 'Sudah Diverifikasi' },
    scheduled: { cls: 'badge--scheduled', label: 'Dijadwalkan' },
    progress:  { cls: 'badge--progress',  label: 'Sedang Ditangani' },
    completed: { cls: 'badge--completed', label: 'Selesai' },
    rejected:  { cls: 'badge--rejected',  label: 'Ditolak/Duplikat' },
  };
  const b = map[status] || map.pending;
  return `<span class="badge ${b.cls}" aria-label="Status: ${b.label}">${b.label}</span>`;
}

/**
 * Returns risk level key from a numeric score (0–100).
 * @param {number} score
 * @returns {'normal'|'waspada'|'tinggi'|'kritis'}
 */
export function scoreToLevel(score) {
  if (score >= 80) return 'kritis';
  if (score >= 60) return 'tinggi';
  if (score >= 40) return 'waspada';
  return 'normal';
}

/**
 * Returns CSS color variable for a risk level.
 */
export function riskColor(level) {
  const map = {
    normal:  'var(--clr-risk-normal)',
    waspada: 'var(--clr-risk-waspada)',
    tinggi:  'var(--clr-risk-tinggi)',
    kritis:  'var(--clr-risk-kritis)',
  };
  return map[level] || map.normal;
}

/**
 * Shows a toast notification.
 * @param {string} message
 * @param {'success'|'warning'|'error'|'info'} [type='info']
 * @param {number} [duration=4000]
 */
export function showToast(message, type = 'info', duration = 4000) {
  let container = qs('#toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed; bottom: 24px; right: 24px;
      display: flex; flex-direction: column; gap: 10px;
      z-index: var(--z-toast, 120); pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const icons = { success: '✓', warning: '⚠', error: '✕', info: 'ℹ' };
  const colors = {
    success: '#E6F4EA', warning: '#FFF4D6',
    error:   '#FFE3E3', info:    '#E3FAFC',
  };
  const textColors = {
    success: '#1B6B32', warning: '#7A4F00',
    error:   '#A61E1E', info:    '#0B7285',
  };

  const toast = document.createElement('div');
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.style.cssText = `
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; border-radius: 12px;
    background: ${colors[type]}; color: ${textColors[type]};
    font-size: 14px; font-weight: 500; font-family: 'Inter', sans-serif;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    transform: translateX(120%); opacity: 0;
    transition: transform 300ms cubic-bezier(0.22,1,0.36,1), opacity 300ms ease;
    pointer-events: all; max-width: 320px;
  `;
  toast.innerHTML = `<span aria-hidden="true">${icons[type]}</span> ${message}`;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)';
    toast.style.opacity   = '1';
  });

  setTimeout(() => {
    toast.style.transform = 'translateX(120%)';
    toast.style.opacity   = '0';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Copies text to clipboard and optionally shows a toast.
 * @param {string} text
 * @param {string} [successMsg]
 */
export async function copyToClipboard(text, successMsg = 'Disalin!') {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMsg, 'success');
  } catch {
    showToast('Gagal menyalin.', 'error');
  }
}

/**
 * Traps focus within a container (for modals/drawers).
 * @param {Element} container
 * @param {KeyboardEvent} e
 */
export function trapFocus(container, e) {
  const focusable = Array.from(container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  ));
  if (!focusable.length) return;
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];
  if (e.key === 'Tab') {
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  if (e.key === 'Escape') container.dispatchEvent(new CustomEvent('close-request'));
}

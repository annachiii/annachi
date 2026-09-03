/* 写作助手 - 通用工具函数 */
var WA = window.WA || {};
WA.utils = {};

(function () {
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (key) {
      var value = attrs[key];
      if (key === 'class') node.className = value;
      else if (key === 'html') node.innerHTML = value;
      else if (key.indexOf('on') === 0 && typeof value === 'function') {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (value !== undefined && value !== null) {
        node.setAttribute(key, value);
      }
    });
    (children || []).forEach(function (child) {
      if (child === null || child === undefined) return;
      if (typeof child === 'string') node.appendChild(document.createTextNode(child));
      else node.appendChild(child);
    });
    return node;
  }

  function debounce(fn, delay) {
    var timer = null;
    return function () {
      var args = arguments;
      var ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, delay || 400);
    };
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function countWords(text) {
    if (!text) return 0;
    var cjk = (text.match(/[一-龥]/g) || []).length;
    var nonCjk = text.replace(/[一-龥]/g, ' ').split(/\s+/).filter(Boolean).length;
    return cjk + nonCjk;
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' ' +
      String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function downloadText(filename, content) {
    var blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function pickRandom(arr, n) {
    var pool = arr.slice();
    var result = [];
    n = Math.min(n, pool.length);
    for (var i = 0; i < n; i++) {
      var idx = Math.floor(Math.random() * pool.length);
      result.push(pool.splice(idx, 1)[0]);
    }
    return result;
  }

  function textTypeName(id) {
    var t = WA.data.TEXT_TYPES.find(function (x) { return x.id === id; });
    return t ? t.name : id;
  }

  WA.utils.el = el;
  WA.utils.debounce = debounce;
  WA.utils.escapeHtml = escapeHtml;
  WA.utils.countWords = countWords;
  WA.utils.todayKey = todayKey;
  WA.utils.formatDate = formatDate;
  WA.utils.downloadText = downloadText;
  WA.utils.pickRandom = pickRandom;
  WA.utils.textTypeName = textTypeName;
})();

window.WA = WA;

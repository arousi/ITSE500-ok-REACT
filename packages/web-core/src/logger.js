// Minimal SSR-safe logger for web-core
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
let buffer = [];
let subscribers = [];
let config = {
  console: true,
  remote: { enabled: false, bases: [], path: '/api/v1/applogs/' },
  bufferSize: 100,
  beforeSend: null,
};
function push(entry) {
  buffer.push(entry);
  if (buffer.length > config.bufferSize) buffer.shift();
  if (config.console) {
    const fn = entry.level === 'error' ? console.error : entry.level === 'warn' ? console.warn : console.info;
    fn(`[${entry.level}]`, entry.scope, entry.message, entry.meta || '', entry.error || '');
  }
  if (config.remote?.enabled && isBrowser) {
    config.remote.bases.forEach(base => {
      const url = base + config.remote.path;
      const payload = config.beforeSend ? config.beforeSend(entry) : entry;
      if (!payload) return;
      if (navigator.sendBeacon) {
        try { navigator.sendBeacon(url, JSON.stringify(payload)); } catch {}
      } else {
        fetch(url, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } }).catch(() => {});
      }
    });
  }
  subscribers.forEach(fn => fn(entry));
  if (isBrowser) {
    try { window.localStorage.setItem('webcore.logger', JSON.stringify(buffer)); } catch {}
  }
}
function info(scope, message, meta) { push({ level: 'info', scope, message, meta, ts: Date.now() }); }
function warn(scope, message, error, meta) { push({ level: 'warn', scope, message, error, meta, ts: Date.now() }); }
function error(scope, message, error, meta) { push({ level: 'error', scope, message, error, meta, ts: Date.now() }); }
function subscribe(fn) { subscribers.push(fn); }
function clear() { buffer = []; if (isBrowser) window.localStorage.removeItem('webcore.logger'); }
function getBuffer() { return buffer.slice(); }
function configure(opts) { config = { ...config, ...opts }; }
module.exports = { info, warn, error, subscribe, clear, getBuffer, configure };

// Local console-based logger used when `web-core` is not available.
// info/debug are silenced in production to avoid log noise and accidental
// leakage of request/response payloads; warn/error always pass through.
const isProd = process.env.NODE_ENV === 'production';
const noop = () => {};

const logger = {
	info: isProd ? noop : (...args) => console.info('[app]', ...args),
	warn: (...args) => console.warn('[app]', ...args),
	error: (...args) => console.error('[app]', ...args),
	debug: isProd ? noop : (...args) => console.debug('[app]', ...args),
};

export default logger;

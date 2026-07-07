const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/openrouter',
    createProxyMiddleware({
      target: 'https://openrouter.ai',
      changeOrigin: true,
      secure: true,
      pathRewrite: { '^/openrouter': '' },
      onError(err, req, res) {
        try { res.writeHead(502).end('Proxy error'); } catch (_) {}
      }
    })
  );
};

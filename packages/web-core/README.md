# web-core

Reusable logger and API client for React/web apps.

## Usage

```js
const { logger, createApiClient } = require('web-core');

logger.configure({ console: true, remote: { enabled: false } });
logger.info('demo', 'Hello world');

const api = createApiClient({
  baseUrls: ['https://itse500-ok.ly', 'http://127.0.0.1:8000'],
  versionPrefix: '/api/v1',
  getAuthToken: () => localStorage.getItem('accessToken'),
});

api.get('/user_mang/me/').then(r => console.log(r.data));
```

## SSR/browser safety
- All localStorage and sendBeacon usage is guarded for browser only.
- Remote logging can be disabled or pointed to your own endpoint.

## License
MIT

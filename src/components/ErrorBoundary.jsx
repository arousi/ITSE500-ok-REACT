import React from 'react';
import logger from '../core/logger';

// App-level error boundary: shows a minimal recovery UI instead of a blank
// white screen when a render throws. Logs via the gated logger (no PII).
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    try { logger.error('errorBoundary', error?.message || String(error), info?.componentStack); } catch (_) {}
  }

  handleReload = () => {
    try { window.location.reload(); } catch (_) {}
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div role="alert" style={{ fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.25rem' }}>Something went wrong.</h1>
          <p>Please reload the page. If the problem persists, contact support.</p>
          <button type="button" onClick={this.handleReload} style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

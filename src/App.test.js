import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// NOTE: App.js is a static/presentational scaffold (the unmodified
// DigitalOcean `sample-react` template) — it renders no dynamic state and
// makes no API calls, so its test coverage is intentionally proportionate:
// assert the two real links it renders and their href targets. When the app
// grows real pages/data-fetching, extend this suite (and add MSW handlers in
// src/mocks/handlers.js) rather than testing DigitalOcean's static markup
// further.

test('renders digitalocean docs', () => {
  render(<App />);
  const linkElement = screen.getByText(/DigitalOcean Docs/i);
  expect(linkElement).toBeInTheDocument();
});

test('renders a link to the DigitalOcean App Platform docs', () => {
  render(<App />);
  const link = screen.getByRole('link', { name: /DigitalOcean Docs/i });
  expect(link).toHaveAttribute(
    'href',
    'https://www.digitalocean.com/docs/app-platform'
  );
});

test('renders a link to the DigitalOcean dashboard', () => {
  render(<App />);
  const link = screen.getByRole('link', { name: /DigitalOcean Dashboard/i });
  expect(link).toHaveAttribute('href', 'https://cloud.digitalocean.com/apps');
});

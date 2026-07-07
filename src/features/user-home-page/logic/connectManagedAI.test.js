// axios is ESM and CRA's bundled Jest can't parse it; mock it (the dark-seam
// path returns before any request anyway).
jest.mock('axios', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));

import { getManagedModelsData, MANAGED_PROVIDER_NAME } from './connectManagedAI';

describe('connectManagedAI (managed LLM seam)', () => {
  test('exposes the managed provider name', () => {
    expect(MANAGED_PROVIDER_NAME).toBe('Ozma Kapa');
  });

  test('getManagedModelsData is dark (returns []) while the flag is off', async () => {
    // REACT_APP_ENABLE_MANAGED_LLM is unset in the test env -> flag defaults off.
    // If the flag guard were missing this would attempt a real network call and hang.
    await expect(getManagedModelsData()).resolves.toEqual([]);
  });
});

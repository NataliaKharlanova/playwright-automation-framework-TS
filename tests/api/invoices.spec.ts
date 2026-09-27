import { test, expect } from '../../src/fixtures/fixtures';

test.describe('Invoices API', () => {
  test('returns 401 without token', async ({ apiClient }) => {
    const res = await apiClient.get('/invoices');
    expect(res.status()).toBe(401);
  });

  test('returns 200 with customer token', async ({ apiClient, customerToken }) => {
    const res = await apiClient.get('/invoices', { token: customerToken });
    expect(res.status()).toBe(200);
  });
});
import { test, expect } from '../../src/fixtures/fixtures';
import { Brand } from '../../src/types/toolshop';

test.describe('Brands API', () => {
  test('GET /brands returns a list of brands', async ({ apiClient }) => {
    const res = await apiClient.get('/brands');
    expect(res.status()).toBe(200);

    const brands: Brand[] = await res.json();
    expect(brands.length).toBeGreaterThanOrEqual(2);

    for (const brand of brands) {
      expect(brand.name).toBeTruthy();
    }
  });
});
import { test, expect } from '../../src/fixtures/fixtures';
import { z } from 'zod';
import { BrandSchema } from '../../src/schemas/toolshop.schemas';
import { expectToMatchSchema } from '../../src/utils/schema';

test.describe('Brands API', () => {
  test('GET /brands returns a list of brands', async ({ apiClient }) => {
    const res = await apiClient.get('/brands');
    expect(res.status()).toBe(200);

    const brands = expectToMatchSchema(z.array(BrandSchema), await res.json());
    expect(brands.length).toBeGreaterThanOrEqual(2);
  });
});
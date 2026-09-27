import { test, expect } from '../../src/fixtures/fixtures';
import { Paginated, Product } from '../../src/types/toolshop';

test.describe('Products API', () => {
  test('GET /products returns first page', async ({ apiClient }) => {
    const res = await apiClient.get('/products');
    expect(res.status()).toBe(200);

    const page: Paginated<Product> = await res.json();
    expect(page.current_page).toBe(1);
    expect(page.data.length).toBeGreaterThan(0);
    expect(page.data.length).toBeLessThanOrEqual(page.per_page);
  });

  test('GET /products/{id} returns the same product as in the list', async ({ apiClient }) => {
    const listRes = await apiClient.get('/products');
    const list: Paginated<Product> = await listRes.json();
    const first = list.data[0];

    const res = await apiClient.get(`/products/${first.id}`);
    expect(res.status()).toBe(200);

    const product: Product = await res.json();
    expect(product).toMatchObject({ id: first.id, name: first.name, price: first.price });
  });

  test('GET /products/{id} returns 404 for unknown id', async ({ apiClient }) => {
    const res = await apiClient.get('/products/does-not-exist');
    expect(res.status()).toBe(404);
  });

  test('GET /products/search finds products by name', async ({ apiClient }) => {
    const res = await apiClient.get('/products/search?q=hammer');
    expect(res.status()).toBe(200);

    const page: Paginated<Product> = await res.json();
    expect(page.data.length).toBeGreaterThan(0);

    for (const product of page.data) {
      expect(product.name.toLowerCase()).toContain('hammer');
    }
  });
});
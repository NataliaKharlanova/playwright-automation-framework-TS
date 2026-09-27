import { test, expect } from '../../src/fixtures/fixtures';
import { env } from '../../src/config/env';
import { UserSchema } from '../../src/schemas/toolshop.schemas';
import { expectToMatchSchema } from '../../src/utils/schema';

test.describe('Users API', () => {
  test('GET /users/me returns the logged-in customer', async ({ apiClient, customerToken }) => {
    const res = await apiClient.get('/users/me', { token: customerToken });
    expect(res.status()).toBe(200);

    const me = expectToMatchSchema(UserSchema, await res.json());
    expect(me.email).toBe(env.user.username);
  });

  test('GET /users/me returns 401 without token', async ({ apiClient }) => {
    const res = await apiClient.get('/users/me');
    expect(res.status()).toBe(401);
  });
});
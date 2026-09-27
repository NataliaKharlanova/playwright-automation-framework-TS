import { test, expect } from '../../src/fixtures/fixtures';
import { env } from '../../src/config/env';
import { LoginResponse } from '../../src/types/toolshop';

test.describe('Auth API', () => {
  test('valid credentials return access_token', async ({ apiClient }) => {
    const res = await apiClient.post('/users/login', env.user);
    expect(res.status()).toBe(200);

    const body: LoginResponse = await res.json();
    expect(body.access_token).toBeTruthy();
  });

  test('wrong password returns 401', async ({ apiClient }) => {
    const res = await apiClient.post('/users/login', {
      email: env.user.username,
      password: 'wrong_password',
    });
    expect(res.status()).toBe(401);
  });
});
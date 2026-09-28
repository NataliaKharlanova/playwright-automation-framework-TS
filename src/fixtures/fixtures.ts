import { test as base, expect } from '@playwright/test';
import { ApiClient } from '../api/ApiClient';
import { env } from '../config/env';
import { LoginResponse } from '../types/toolshop';

type Fixtures = {
    /** `ApiClient` bound to the per-test request context. */
    apiClient: ApiClient;
    /** Access token for the `.env` customer, obtained via `POST /users/login`. */
    customerToken: string;
};

/** Playwright `test` extended with the project's API fixtures. Import `test`/`expect` from here. */
export const test = base.extend<Fixtures>({
    apiClient: async ({ request }, use) => {
        await use(new ApiClient(request));
    },

    customerToken: async ({ apiClient }, use) => {
        const res = await apiClient.post('/users/login', {
            email: env.user.username,
            password: env.user.password,
        });
        expect(res.status(), 'Login in fixture failed').toBe(200);

        const body: LoginResponse = await res.json();
        await use(body.access_token);
    },
});

export { expect };
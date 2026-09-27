import { test as base, expect } from '@playwright/test';
import { ApiClient } from '../api/ApiClient';
import { env } from '../config/env';
import { LoginResponse } from '../types/toolshop';

type Fixtures = {
    apiClient: ApiClient;
    customerToken: string;
};

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
import { APIRequestContext, APIResponse } from '@playwright/test';

type RequestOptions = { token?: string };

/**
 * Thin HTTP wrapper over Playwright's `APIRequestContext`.
 * Paths are resolved against the project's `baseURL`; responses are returned raw so tests assert status themselves.
 */
export class ApiClient {
    /** @param request - Playwright request context, usually the per-test `request` fixture. */
    constructor(private readonly request: APIRequestContext) { }

    private headers(token?: string): Record<string, string> {
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    /** Sends a GET request, adding a Bearer header when `token` is given. */
    get(path: string, { token }: RequestOptions = {}): Promise<APIResponse> {
        return this.request.get(path, { headers: this.headers(token) });
    }

    /** Sends a POST request with a JSON body, adding a Bearer header when `token` is given. */
    post(path: string, data: object, { token }: RequestOptions = {}): Promise<APIResponse> {
        return this.request.post(path, { data, headers: this.headers(token) });
    }

    /** Sends a PUT request with a JSON body, adding a Bearer header when `token` is given. */
    put(path: string, data: object, { token }: RequestOptions = {}): Promise<APIResponse> {
        return this.request.put(path, { data, headers: this.headers(token) });
    }

    /** Sends a DELETE request, adding a Bearer header when `token` is given. */
    delete(path: string, { token }: RequestOptions = {}): Promise<APIResponse> {
        return this.request.delete(path, { headers: this.headers(token) });
    }
}
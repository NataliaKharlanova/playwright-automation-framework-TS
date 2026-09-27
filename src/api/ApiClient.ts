import { APIRequestContext, APIResponse } from '@playwright/test';

type RequestOptions = { token?: string };

export class ApiClient {
    constructor(private readonly request: APIRequestContext) { }

    private headers(token?: string): Record<string, string> {
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    get(path: string, { token }: RequestOptions = {}): Promise<APIResponse> {
        return this.request.get(path, { headers: this.headers(token) });
    }

    post(path: string, data: object, { token }: RequestOptions = {}): Promise<APIResponse> {
        return this.request.post(path, { data, headers: this.headers(token) });
    }

    put(path: string, data: object, { token }: RequestOptions = {}): Promise<APIResponse> {
        return this.request.put(path, { data, headers: this.headers(token) });
    }

    delete(path: string, { token }: RequestOptions = {}): Promise<APIResponse> {
        return this.request.delete(path, { headers: this.headers(token) });
    }
}
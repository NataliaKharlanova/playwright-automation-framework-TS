export interface Brand {
    id: string;
    name: string;
    slug: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}
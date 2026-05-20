import { apiFetch } from "./client";

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface AuthResponse {
  token: string;
  expiresIn: number;
}

/** @deprecated Use AuthResponse */
export type LoginResponse = AuthResponse;

export interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
}

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Revoke the current JWT on the server (server-side logout) */
export async function logout(token: string): Promise<void> {
  await apiFetch<unknown>("/api/v1/auth/session", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

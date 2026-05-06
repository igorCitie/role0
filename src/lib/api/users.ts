import { apiFetch } from "./client";

export interface UserProfile {
  id: string;
  nome: string;
  email: string;
  vibes: string[];
  biometriaValidada: boolean;
  trustScore: number;
}

export async function getMyProfile(token: string): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/v1/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

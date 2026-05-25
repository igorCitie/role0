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

export interface UpdateProfileRequest {
  nome: string;
  vibes?: string[];
}

export interface PublicUserProfile {
  id: string;
  nomeDisplay: string;
  vibes: string[];
  isProvedIdentityToken: boolean;
  trustScore: number;
  qtdAvaliacoes: number;
}

export async function updateProfile(
  data: UpdateProfileRequest,
  token: string,
): Promise<void> {
  await apiFetch<unknown>("/api/v1/users/me", {
    method: "PATCH",
    body: JSON.stringify(data),
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getPublicProfile(
  userId: string,
  token: string,
): Promise<PublicUserProfile> {
  return apiFetch<PublicUserProfile>(`/api/v1/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function validateBiometrics(token: string): Promise<void> {
  await apiFetch<unknown>("/api/v1/users/me/biometria", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export interface AvaliacaoResponse {
  id: string;
  avaliadorId: string;
  avaliadorNome: string;
  nota: number;
  comentario?: string;
  criadoEm: string;
}

export interface PerfilReviewsResponse {
  trustScore: number;
  totalAvaliacoes: number;
  avaliacoes: AvaliacaoResponse[];
}

export interface AvaliarUsuarioRequest {
  eventoId: string;
  nota: number;
  comentario?: string;
}

export async function getUserReviews(
  userId: string,
  token: string,
  limit = 20,
): Promise<PerfilReviewsResponse> {
  return apiFetch<PerfilReviewsResponse>(
    `/api/v1/users/${userId}/reviews?limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
}

export async function submitReview(
  userId: string,
  data: AvaliarUsuarioRequest,
  token: string,
): Promise<void> {
  await apiFetch<unknown>(`/api/v1/users/${userId}/reviews`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: { Authorization: `Bearer ${token}` },
  });
}

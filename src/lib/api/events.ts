import { apiFetch } from "./client";
import type { VibeTag } from "@/types";

export interface CreateEventRequest {
  titulo: string;
  descricao: string;
  capacidadeMaxima: number;
  latitude: number;
  longitude: number;
  horarioInicio: string;
  vibeTags: VibeTag[];
}

export type EventStatus =
  | "CRIADO"
  | "ABERTO_PARA_VAGAS"
  | "FECHADO_PREGAME"
  | "EM_ANDAMENTO"
  | "EXPIRADO";

export interface NearbyEvent {
  id: string;
  titulo: string;
  nomeHost: string;
  trustScoreHost: number;
  vagasRestantes: number;
  ocupacao: string;
  status: EventStatus;
  horarioInicio: string;
  distanciaEmMetros: number;
  enderecoLegivel: string;
  /** Coordinates are not in the official Swagger schema — guard before use */
  latitude?: number;
  longitude?: number;
}

export interface EventDetail {
  id: string;
  titulo: string;
  descricao: string;
  status: EventStatus;
  capacidadeMaxima: number;
  totalAprovados: number;
  inicioEm: string;
  enderecoLegivel: string;
  /** Not in the official Swagger schema — treat as optional */
  isParticipant?: boolean;
  host: {
    id: string;
    nomeDisplay: string;
    trustScore: number;
  };
  clima: {
    temp: number;
    condition: string;
    icon: string;
  } | null;
}

export async function createEvent(
  data: CreateEventRequest,
  token: string,
): Promise<void> {
  await apiFetch<unknown>("/api/v1/events", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getNearbyEvents(
  latitude: number,
  longitude: number,
  raioKm = 10,
  vibeTags?: VibeTag[],
): Promise<NearbyEvent[]> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    raioKm: String(raioKm),
  });
  if (vibeTags?.length) vibeTags.forEach((v) => params.append("vibeTags", v));
  return apiFetch<NearbyEvent[]>(`/api/v1/events/nearby?${params}`);
}

export async function getEventDetail(
  eventId: string,
  token: string,
): Promise<EventDetail> {
  return apiFetch<EventDetail>(`/api/v1/events/${eventId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function checkInEvent(
  eventId: string,
  latitude: number,
  longitude: number,
  token: string,
): Promise<void> {
  await apiFetch<unknown>(`/api/v1/events/${eventId}/check-in`, {
    method: "POST",
    body: JSON.stringify({ latitude, longitude }),
    headers: { Authorization: `Bearer ${token}` },
  });
}

export interface EditEventRequest {
  titulo?: string;
  descricao?: string;
  maxCapacity?: number;
}

export async function editEvent(
  eventId: string,
  data: EditEventRequest,
  token: string,
): Promise<void> {
  await apiFetch<unknown>(`/api/v1/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function cancelEvent(
  eventId: string,
  token: string,
): Promise<void> {
  await apiFetch<unknown>(`/api/v1/events/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Participation flow ────────────────────────────────────────────────────────

export interface JoinRequest {
  solicitacaoId: string;
  usuarioId: string;
  trustScore: number;
}

export interface Participant {
  usuarioId: string;
  nomeDisplay: string;
  trustScore: number;
  vibes: string[];
}

/** Guest: send join request (adds user to pending queue) */
export async function joinEvent(eventId: string, token: string): Promise<void> {
  await apiFetch<unknown>(`/api/v1/events/${eventId}/join-requests`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

/** Host: list all pending join requests */
export async function listRequests(
  eventId: string,
  token: string,
): Promise<JoinRequest[]> {
  return apiFetch<JoinRequest[]>(`/api/v1/events/${eventId}/requests`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/** Host: approve or reject a pending request */
export async function judgeRequest(
  eventId: string,
  reqId: string,
  aprovada: boolean,
  token: string,
): Promise<void> {
  await apiFetch<unknown>(`/api/v1/events/${eventId}/requests/${reqId}`, {
    method: "PUT",
    body: JSON.stringify({ aprovada }),
    headers: { Authorization: `Bearer ${token}` },
  });
}

/** Host + approved participants: list approved participants */
export async function listParticipants(
  eventId: string,
  token: string,
): Promise<Participant[]> {
  return apiFetch<Participant[]>(`/api/v1/events/${eventId}/participants`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export interface MyEvent {
  id: string;
  titulo: string;
  horarioInicio: string;
  status: EventStatus;
  isHost: boolean;
}

/** List all events the authenticated user is hosting or attending */
export async function getMyEvents(token: string): Promise<MyEvent[]> {
  return apiFetch<MyEvent[]>("/api/v1/events/my", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/** Trigger SOS / panic mode for an event (server always returns 202) */
export async function triggerPanic(eventId: string, token: string): Promise<void> {
  await apiFetch<unknown>(`/api/v1/events/${eventId}/panic`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

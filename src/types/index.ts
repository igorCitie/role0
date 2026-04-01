export type VibeTag = "chill" | "energia" | "cultural" | "noturno";

export interface RoleEvent {
  id: string;
  title: string;
  description?: string;
  startsAt?: string;
  latitude?: number;
  longitude?: number;
}

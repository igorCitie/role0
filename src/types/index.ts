export type VibeTag =
  | "CRAFT_BEER"
  | "BOARDGAMES"
  | "MUSICA_AO_VIVO"
  | "PAGODE"
  | "SERTANEJO"
  | "FUNK"
  | "ROCK"
  | "ELETRONICA"
  | "ESPORTES"
  | "CULTURA"
  | "CHILL"
  | "FESTA";

export interface RoleEvent {
  id: string;
  titulo: string;
  descricao?: string;
  capacidadeMaxima: number;
  latitude: number;
  longitude: number;
  horarioInicio: string;
  vibeTags: VibeTag[];
}

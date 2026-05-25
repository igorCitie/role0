"use client";

/// <reference types="@types/google.maps" />
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@chakra-ui/react";
import AuthGuard from "@/components/auth/AuthGuard";
import { createEvent } from "@/lib/api/events";
import type { VibeTag } from "@/types";
import {
  BackIcon,
  BeerIcon,
  DiceIcon,
  CoffeeIcon,
  PartyIcon,
  SportsIcon,
  GuitarIcon,
  MicIcon,
  HeadphonesIcon,
  TheaterIcon,
  CheckCircleIcon,
  PinIcon,
  CalendarIcon,
  UsersIcon,
} from "@/components/icons";

// ─── Data ───────────────────────────────────────────────────────────────────

const ALL_VIBE_TAGS: { value: VibeTag; label: string; icon: React.FC<any>; desc: string }[] = [
  { value: "CRAFT_BEER",    label: "#CervejaGelada", icon: BeerIcon,       desc: "" },
  { value: "CHILL",         label: "#PapoCabeça",    icon: CoffeeIcon,     desc: "" },
  { value: "MUSICA_AO_VIVO",label: "#MúsicaAoVivo",  icon: GuitarIcon,     desc: "" },
  { value: "CULTURA",       label: "#StreetArt",     icon: TheaterIcon,    desc: "" },
  { value: "BOARDGAMES",    label: "#Games",         icon: DiceIcon,       desc: "" },
  { value: "FESTA",         label: "#Gastronomia",   icon: PartyIcon,      desc: "" }, // using PartyIcon as a placeholder
  { value: "ROCK",          label: "#Noitada",       icon: MicIcon,        desc: "" },
  { value: "ELETRONICA",    label: "#Underground",   icon: HeadphonesIcon, desc: "" },
  { value: "ESPORTES",      label: "#OpenAir",       icon: SportsIcon,     desc: "" },
];

const STEP_META = [
  { number: 1, question: "Qual a vibe de", italic: "hoje?", sub: "Selecione o que você está procurando" },
  { number: 2, question: "Como vai", italic: "chamar?", sub: "Dê um nome ao rolê." },
  { number: 3, question: "Quando vai", italic: "rolar?", sub: "Defina a data e o horário." },
  { number: 4, question: "Onde", italic: "fica?", sub: "Arraste o mapa para marcar o local exato." },
  { number: 5, question: "Quantas", italic: "pessoas?", sub: "Limite máximo de participantes." },
];

// ─── Map dark style ──────────────────────────────────────────────────────────

const DARK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry",             stylers: [{ color: "#0c0c12" }] },
  { elementType: "labels.text.stroke",   stylers: [{ color: "#0c0c12" }] },
  { elementType: "labels.text.fill",     stylers: [{ color: "#55556a" }] },
  { featureType: "road", elementType: "geometry",        stylers: [{ color: "#1a1a26" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#111118" }] },
  { featureType: "road.highway", elementType: "geometry",stylers: [{ color: "#1e1e2e" }] },
  { featureType: "water", elementType: "geometry",       stylers: [{ color: "#050508" }] },
  { featureType: "poi",   elementType: "geometry",       stylers: [{ color: "#111118" }] },
  { featureType: "poi.park", elementType: "geometry",    stylers: [{ color: "#0d170d" }] },
  { featureType: "poi",   elementType: "labels",         stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "geometry",     stylers: [{ color: "#111118" }] },
  { featureType: "transit", elementType: "labels",       stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#1a1a26" }] },
];

// ─── Utils for Date ──────────────────────────────────────────────────────────

function generateDays() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      date: d,
      dayStr: d.getDate().toString().padStart(2, "0"),
      weekStr: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
      monthStr: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
    });
  }
  return days;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

// ─── Inline styles: hardware-accelerated, zero Chakra overhead ──────────────

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,700;1,800&display=swap');

  .wizard-root {
    font-family: 'Outfit', sans-serif;
    background: #0a0a0d;
    min-height: 100dvh;
    overflow: hidden;
    position: relative;
  }

  .wizard-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 1;
  }

  .wizard-track {
    display: flex;
    width: 500%;
    height: 100%;
    will-change: transform;
    transition: transform 0.42s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .wizard-slide {
    width: 20%;
    flex-shrink: 0;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
    padding-bottom: 140px;
    display: flex;
    flex-direction: column;
  }

  .wizard-slide::-webkit-scrollbar { display: none; }

  .progress-fill {
    height: 3px;
    background: #e03800;
    transition: width 0.42s cubic-bezier(0.16, 1, 0.3, 1);
    border-radius: 0 2px 2px 0;
  }

  /* Vibe pills (asymmetric) */
  .vibe-pill-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    padding: 10px;
  }

  .vibe-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 22px;
    border-radius: 999px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.7);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  .vibe-pill:active {
    transform: scale(0.95);
  }

  .vibe-pill.active {
    background: #e03800;
    border-color: #ff5e29;
    color: white;
    box-shadow: 0 0 24px rgba(224, 56, 0, 0.4);
    transform: scale(1.05);
  }

  /* Editorial input */
  .editorial-input {
    background: transparent;
    border: none;
    outline: none;
    color: white;
    font-family: 'Outfit', sans-serif;
    font-size: 28px;
    font-weight: 600;
    width: 100%;
    padding: 0;
    caret-color: #e03800;
  }
  .editorial-input::placeholder { color: rgba(255,255,255,0.2); }

  .editorial-textarea {
    background: transparent;
    border: none;
    outline: none;
    color: rgba(255,255,255,0.75);
    font-family: 'Outfit', sans-serif;
    font-size: 17px;
    font-weight: 400;
    width: 100%;
    resize: none;
    line-height: 1.6;
    caret-color: #e03800;
    min-height: 100px;
  }
  .editorial-textarea::placeholder { color: rgba(255,255,255,0.2); }

  .field-divider {
    height: 1.5px;
    background: rgba(255,255,255,0.08);
    width: 100%;
    margin: 8px 0;
    transition: background 0.25s ease;
  }
  .field-focused .field-divider { background: #e03800; }

  /* Date/Time Pickers */
  .dt-scroller {
    display: flex;
    overflow-x: auto;
    gap: 12px;
    padding: 10px 20px;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    margin: 0 -20px;
  }
  .dt-scroller::-webkit-scrollbar { display: none; }

  .dt-day-card {
    flex: 0 0 auto;
    width: 72px;
    height: 90px;
    border-radius: 16px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    scroll-snap-align: center;
    transition: all 0.2s ease;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .dt-day-card.active {
    background: #e03800;
    border-color: #ff5e29;
    box-shadow: 0 8px 20px rgba(224, 56, 0, 0.3);
    transform: scale(1.05);
  }

  .time-grid-hours {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 8px;
  }

  .time-grid-minutes {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .time-grid-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 44px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.7);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  .time-grid-btn:active {
    transform: scale(0.93);
  }

  .time-grid-btn.active {
    background: #e03800;
    border-color: #ff5e29;
    color: white;
    box-shadow: 0 0 16px rgba(224, 56, 0, 0.35);
  }

  .period-badge {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 4px 8px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.45);
    margin-bottom: 10px;
    display: inline-block;
  }

  /* Map Crosshair */
  .map-crosshair {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 48px;
    height: 48px;
    pointer-events: none;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .map-crosshair::before, .map-crosshair::after {
    content: '';
    position: absolute;
    background: #e03800;
    border-radius: 2px;
    box-shadow: 0 0 4px rgba(0,0,0,0.5);
  }
  .map-crosshair::before { width: 2px; height: 16px; }
  .map-crosshair::after { width: 16px; height: 2px; }

  /* Capacity stepper */
  .cap-btn {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: 1.5px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.04);
    color: white;
    font-size: 28px;
    font-weight: 300;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.18s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .cap-btn:active {
    background: rgba(224, 56, 0, 0.15);
    border-color: rgba(224, 56, 0, 0.5);
    transform: scale(0.94);
  }

  /* Bottom CTA */
  .cta-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 20px 24px;
    padding-bottom: calc(20px + env(safe-area-inset-bottom));
    background: linear-gradient(to top, #0a0a0d 60%, rgba(10,10,13,0));
    z-index: 100;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .cta-btn {
    width: 100%;
    height: 58px;
    background: #e03800;
    border: none;
    border-radius: 18px;
    color: white;
    font-family: 'Outfit', sans-serif;
    font-size: 17px;
    font-weight: 700;
    letter-spacing: 0.01em;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    -webkit-tap-highlight-color: transparent;
    box-shadow: 0 8px 32px rgba(224, 56, 0, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .cta-btn:active {
    transform: scale(0.97);
    box-shadow: 0 4px 16px rgba(224, 56, 0, 0.25);
  }
  .cta-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Review row */
  .review-row {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 18px 0;
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }
  .review-icon-wrap {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(224, 56, 0, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #e03800;
  }

  /* Header pill */
  .step-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 999px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    font-size: 12px;
    font-weight: 600;
    color: rgba(255,255,255,0.5);
    letter-spacing: 0.04em;
  }
`;

// ─── Component ───────────────────────────────────────────────────────────────

export default function CreateEventPage() {
  const router = useRouter();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 5;

  // Form state
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [capacidadeMaxima, setCapacidadeMaxima] = useState(10);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [pickedAddress, setPickedAddress] = useState("Procurando...");
  const [vibeTags, setVibeTags] = useState<VibeTag[]>([]);
  const [loading, setLoading] = useState(false);

  // Date/Time picker state
  const [availableDays] = useState(generateDays());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  const [selectedMinute, setSelectedMinute] = useState<string | null>(null);

  // Focus tracking
  const [titleFocused, setTitleFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const gMapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // Computed Date
  let finalHorario = "";
  if (selectedDate && selectedHour && selectedMinute) {
    const d = new Date(selectedDate);
    d.setHours(parseInt(selectedHour, 10));
    d.setMinutes(parseInt(selectedMinute, 10));
    finalHorario = d.toISOString().replace("Z", "");
  }

  const displayDateStr = finalHorario
    ? new Date(finalHorario).toLocaleString("pt-BR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : "Selecione a data e horário";

  // Init Map Step 4
  function initMap() {
    if (!mapContainerRef.current || typeof google === "undefined") return;
    if (gMapRef.current) return;

    const map = new google.maps.Map(mapContainerRef.current, {
      center: { lat: -2.5307, lng: -44.3068 },
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: false,
      gestureHandling: "greedy", // Mobile friendly for dragging
      styles: DARK_STYLE,
    });
    gMapRef.current = map;
    geocoderRef.current = new google.maps.Geocoder();

    // Map drag listener
    map.addListener("idle", () => {
      const center = map.getCenter();
      if (center) {
        setLatitude(center.lat());
        setLongitude(center.lng());
        geocodeLatLng(center.lat(), center.lng());
      }
    });

    navigator.geolocation?.getCurrentPosition((pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      map.setCenter({ lat, lng });
      map.setZoom(16);
    });
  }

  function geocodeLatLng(lat: number, lng: number) {
    if (!geocoderRef.current) return;
    geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        // Find a short formatted address
        const addr = results[0].formatted_address.split(",").slice(0, 2).join(",");
        setPickedAddress(addr);
      } else {
        setPickedAddress("Local selecionado");
      }
    });
  }

  useEffect(() => {
    if (step !== 4) return;
    const tryInit = () => {
      if (mapContainerRef.current && typeof google !== "undefined" && !gMapRef.current) {
        initMap();
        return true;
      }
      return false;
    };
    if (tryInit()) return;
    const id = setInterval(() => { if (tryInit()) clearInterval(id); }, 100);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function handleUseMyLocation() {
    setPickedAddress("Localizando...");
    navigator.geolocation?.getCurrentPosition((pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      gMapRef.current?.panTo({ lat, lng });
      gMapRef.current?.setZoom(17);
    }, () => {
      setPickedAddress("Erro ao buscar local");
    });
  }

  function toggleTag(tag: VibeTag) {
    setVibeTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function handleSubmit() {
    const token = localStorage.getItem("token") ?? "";
    setLoading(true);
    try {
      await createEvent({
        titulo,
        descricao,
        capacidadeMaxima,
        latitude: latitude!,
        longitude: longitude!,
        horarioInicio: finalHorario,
        vibeTags,
      }, token);
      toast({ title: "Rolê criado!", status: "success", duration: 2500, isClosable: true });
      router.push("/home");
    } catch (err) {
      toast({
        title: "Erro ao criar rolê",
        description: err instanceof Error ? err.message : "Tente novamente.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    if (step === 1 && vibeTags.length === 0) {
      toast({ title: "Escolha pelo menos uma vibe", status: "warning", duration: 2000, isClosable: true });
      return;
    }
    if (step === 2 && !titulo.trim()) {
      toast({ title: "Dê um nome ao rolê", status: "warning", duration: 2000, isClosable: true });
      return;
    }
    if (step === 3 && (!selectedDate || !selectedHour || !selectedMinute)) {
      toast({ title: "Defina a data e horário completo", status: "warning", duration: 2000, isClosable: true });
      return;
    }
    if (step === 4 && latitude === null) {
      toast({ title: "Marque o local no mapa", status: "warning", duration: 2000, isClosable: true });
      return;
    }
    if (step < TOTAL_STEPS) {
      setStep(s => s + 1);
    } else {
      handleSubmit();
    }
  }

  function handleBack() {
    if (step > 1) setStep(s => s - 1);
    else router.back();
  }

  const ctaLabel = step === TOTAL_STEPS ? "Publicar rolê" : (step === 4 ? "Explorar Mapa" : "Avançar");

  return (
    <AuthGuard>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />

      <div className="wizard-root" style={{ position: "relative", height: "100dvh", display: "flex", flexDirection: "column" }}>

        {/* ── Progress bar ── */}
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, height: "3px",
          background: "rgba(255,255,255,0.07)", zIndex: 200,
        }}>
          <div className="progress-fill" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
        </div>

        {/* ── Header ── */}
        <div style={{
          position: "fixed", top: "3px", left: 0, right: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", zIndex: 150,
        }}>
          <button
            onClick={handleBack}
            aria-label="Voltar"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              width: "44px", height: "44px",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "white",
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
              transition: "background 0.18s ease",
            }}
          >
            <BackIcon size={20} />
          </button>
          <div className="step-pill">
            <span>{step}</span>
            <span style={{ opacity: 0.4 }}>/</span>
            <span style={{ opacity: 0.4 }}>{TOTAL_STEPS}</span>
          </div>
        </div>

        {/* ── Sliding track ── */}
        <div style={{ flex: 1, overflow: "hidden", marginTop: "75px", position: "relative" }}>
          <div
            className="wizard-track"
            style={{ transform: `translateX(-${(step - 1) * 20}%)` }}
          >

            {/* ═══ STEP 1: Vibe ═══ */}
            <div className="wizard-slide" style={{ padding: "0 10px" }}>
              <div style={{ textAlign: "center", paddingTop: "20px", marginBottom: "40px" }}>
                <h1 style={{
                  fontSize: "38px", fontWeight: 800, color: "white", lineHeight: 1.1,
                  fontFamily: "'Outfit', sans-serif",
                }}>
                  {STEP_META[0].question} <br/>
                  <span style={{ fontStyle: "italic", color: "#e03800" }}>{STEP_META[0].italic}</span>
                </h1>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "15px", marginTop: "12px", fontFamily: "'Outfit', sans-serif" }}>
                  {STEP_META[0].sub}
                </p>
              </div>

              <div className="vibe-pill-container">
                {ALL_VIBE_TAGS.map(({ value, label, icon: Icon }) => {
                  const active = vibeTags.includes(value);
                  return (
                    <button
                      key={value}
                      className={`vibe-pill${active ? " active" : ""}`}
                      onClick={() => toggleTag(value)}
                      type="button"
                    >
                      <Icon size={18} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ═══ STEP 2: Details ═══ */}
            <div className="wizard-slide" style={{ padding: "0 20px" }}>
              <div style={{ paddingTop: "20px", marginBottom: "40px" }}>
                <h1 style={{
                  fontSize: "38px", fontWeight: 800, color: "white", lineHeight: 1.1,
                  fontFamily: "'Outfit', sans-serif",
                }}>
                  {STEP_META[1].question} <span style={{ fontStyle: "italic", color: "#e03800" }}>{STEP_META[1].italic}</span>
                </h1>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "15px", marginTop: "12px", fontFamily: "'Outfit', sans-serif" }}>
                  {STEP_META[1].sub}
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                <div className={`field-focused-wrap${titleFocused ? " field-focused" : ""}`}>
                  <label style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Outfit', sans-serif", display: "block", marginBottom: "10px" }}>
                    Título *
                  </label>
                  <input
                    className="editorial-input"
                    placeholder="Ex: Resenha do Japa"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    onFocus={() => setTitleFocused(true)}
                    onBlur={() => setTitleFocused(false)}
                    autoCapitalize="sentences"
                    maxLength={80}
                  />
                  <div className="field-divider" style={{ background: titleFocused ? "#e03800" : "rgba(255,255,255,0.08)" }} />
                </div>

                <div>
                  <label style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Outfit', sans-serif", display: "block", marginBottom: "10px" }}>
                    Descrição <span style={{ opacity: 0.5, textTransform: "none", fontSize: "10px" }}>(opcional)</span>
                  </label>
                  <textarea
                    className="editorial-textarea"
                    placeholder="Conta mais sobre o rolê..."
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    onFocus={() => setDescFocused(true)}
                    onBlur={() => setDescFocused(false)}
                    rows={4}
                  />
                  <div className="field-divider" style={{ background: descFocused ? "#e03800" : "rgba(255,255,255,0.08)" }} />
                </div>
              </div>
            </div>

            {/* ═══ STEP 3: When (Custom Picker) ═══ */}
            <div className="wizard-slide" style={{ padding: "0 20px" }}>
              <div style={{ paddingTop: "20px", marginBottom: "30px" }}>
                <h1 style={{
                  fontSize: "38px", fontWeight: 800, color: "white", lineHeight: 1.1,
                  fontFamily: "'Outfit', sans-serif",
                }}>
                  {STEP_META[2].question} <span style={{ fontStyle: "italic", color: "#e03800" }}>{STEP_META[2].italic}</span>
                </h1>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "15px", marginTop: "12px", fontFamily: "'Outfit', sans-serif" }}>
                  {STEP_META[2].sub}
                </p>
              </div>

              {/* Live Preview */}
              <div style={{
                background: (selectedDate && selectedHour && selectedMinute) ? "rgba(224, 56, 0, 0.12)" : "rgba(255,255,255,0.04)",
                border: "1px solid",
                borderColor: (selectedDate && selectedHour && selectedMinute) ? "rgba(224, 56, 0, 0.3)" : "rgba(255,255,255,0.08)",
                borderRadius: "16px", padding: "16px", marginBottom: "30px",
                display: "flex", alignItems: "center", gap: "12px",
                transition: "all 0.3s ease"
              }}>
                <span style={{ color: (selectedDate && selectedHour && selectedMinute) ? "#e03800" : "white", display: "flex" }}>
                  <CalendarIcon size={20} />
                </span>
                <span style={{ 
                  color: (selectedDate && selectedHour && selectedMinute) ? "white" : "rgba(255,255,255,0.4)", 
                  fontSize: "16px", fontWeight: 600, fontFamily: "'Outfit', sans-serif" 
                }}>
                  {displayDateStr}
                </span>
              </div>

              {/* Date strip */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "12px" }}>Dia</label>
                <div className="dt-scroller">
                  {availableDays.map((d, i) => {
                    const active = selectedDate?.toDateString() === d.date.toDateString();
                    return (
                      <div key={i} className={`dt-day-card${active ? " active" : ""}`} onClick={() => setSelectedDate(d.date)}>
                        <span style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", opacity: active ? 1 : 0.4 }}>{d.weekStr}</span>
                        <span style={{ fontSize: "28px", fontWeight: 800, margin: "2px 0" }}>{d.dayStr}</span>
                        <span style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", opacity: active ? 1 : 0.4 }}>{d.monthStr}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Time grids (Option A: Quick-Tap Grid) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "12px" }}>Hora</label>
                  
                  {/* Hours AM */}
                  <div style={{ marginBottom: "16px" }}>
                    <div className="period-badge">Manhã / Madrugada</div>
                    <div className="time-grid-hours">
                      {HOURS.slice(0, 12).map(h => (
                        <button
                          key={h}
                          className={`time-grid-btn${selectedHour === h ? " active" : ""}`}
                          onClick={() => setSelectedHour(h)}
                          type="button"
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hours PM */}
                  <div>
                    <div className="period-badge">Tarde / Noite</div>
                    <div className="time-grid-hours">
                      {HOURS.slice(12, 24).map(h => (
                        <button
                          key={h}
                          className={`time-grid-btn${selectedHour === h ? " active" : ""}`}
                          onClick={() => setSelectedHour(h)}
                          type="button"
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "12px" }}>Minuto</label>
                  <div className="time-grid-minutes">
                    {MINUTES.map(m => (
                      <button
                        key={m}
                        className={`time-grid-btn${selectedMinute === m ? " active" : ""}`}
                        onClick={() => setSelectedMinute(m)}
                        type="button"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ STEP 4: Location (Drag Map) ═══ */}
            <div className="wizard-slide" style={{ padding: "0" }}>
              <div style={{ padding: "0 20px", paddingTop: "20px", paddingBottom: "16px", zIndex: 20, position: "relative", background: "linear-gradient(to bottom, #0a0a0d 80%, transparent)" }}>
                <h1 style={{
                  fontSize: "38px", fontWeight: 800, color: "white", lineHeight: 1.1,
                  fontFamily: "'Outfit', sans-serif",
                }}>
                  {STEP_META[3].question} <span style={{ fontStyle: "italic", color: "#e03800" }}>{STEP_META[3].italic}</span>
                </h1>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "15px", marginTop: "12px", fontFamily: "'Outfit', sans-serif" }}>
                  {STEP_META[3].sub}
                </p>
              </div>

              {/* Map - full height of slide */}
              <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column" }}>
                <div
                  ref={mapContainerRef}
                  style={{ width: "100%", flex: 1 }}
                />
                
                {/* Fixed Crosshair */}
                <div className="map-crosshair" />

                {/* Overlays */}
                <div style={{
                  position: "absolute", bottom: "16px", left: "16px", right: "16px",
                  display: "flex", flexDirection: "column", gap: "10px", pointerEvents: "none"
                }}>
                  
                  <div style={{ alignSelf: "flex-end", pointerEvents: "auto" }}>
                    <button
                      onClick={handleUseMyLocation}
                      style={{
                        background: "rgba(10,10,13,0.8)", backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%",
                        width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center",
                        color: "white", cursor: "pointer", transition: "all 0.2s"
                      }}
                    >
                      <PinIcon size={20} />
                    </button>
                  </div>

                  <div style={{
                    background: "rgba(10,10,13,0.9)", backdropFilter: "blur(12px)",
                    padding: "16px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex", alignItems: "center", gap: "12px", pointerEvents: "auto"
                  }}>
                    <div style={{ color: "#e03800" }}><PinIcon size={24} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "white", fontSize: "15px", fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
                        {pickedAddress}
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginTop: "2px" }}>
                        Arraste o mapa para ajustar
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ STEP 5: Capacity + Review ═══ */}
            <div className="wizard-slide" style={{ padding: "0 20px" }}>
              <div style={{ paddingTop: "20px", marginBottom: "40px" }}>
                <h1 style={{
                  fontSize: "38px", fontWeight: 800, color: "white", lineHeight: 1.1,
                  fontFamily: "'Outfit', sans-serif",
                }}>
                  {STEP_META[4].question} <span style={{ fontStyle: "italic", color: "#e03800" }}>{STEP_META[4].italic}</span>
                </h1>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "15px", marginTop: "12px", fontFamily: "'Outfit', sans-serif" }}>
                  {STEP_META[4].sub}
                </p>
              </div>

              {/* Stepper */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "32px", marginBottom: "48px" }}>
                <button className="cap-btn" onClick={() => setCapacidadeMaxima(c => Math.max(2, c - 1))} type="button">−</button>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "72px", fontWeight: 700, color: "white", lineHeight: 1, fontFamily: "'Outfit', sans-serif", minWidth: "100px", textAlign: "center" }}>
                    {capacidadeMaxima}
                  </div>
                  <div style={{ color: "#e03800", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "4px" }}>
                    pessoas
                  </div>
                </div>
                <button className="cap-btn" onClick={() => setCapacidadeMaxima(c => Math.min(500, c + 1))} type="button">+</button>
              </div>

              {/* Review summary */}
              <h2 style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>
                Resumo do rolê
              </h2>

              <div className="review-row">
                <div className="review-icon-wrap"><UsersIcon size={16} /></div>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginBottom: "2px" }}>Título</div>
                  <div style={{ color: "white", fontSize: "15px", fontWeight: 600 }}>{titulo || "—"}</div>
                </div>
              </div>

              <div className="review-row">
                <div className="review-icon-wrap"><CalendarIcon size={16} /></div>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginBottom: "2px" }}>Quando</div>
                  <div style={{ color: "white", fontSize: "15px", fontWeight: 600 }}>{displayDateStr || "—"}</div>
                </div>
              </div>

              <div className="review-row">
                <div className="review-icon-wrap"><PinIcon size={16} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginBottom: "2px" }}>Local</div>
                  <div style={{ color: "white", fontSize: "14px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {pickedAddress || "—"}
                  </div>
                </div>
              </div>

              <div className="review-row" style={{ borderBottom: "none" }}>
                <div className="review-icon-wrap">
                  {vibeTags.length > 0 ? <CheckCircleIcon size={16} /> : <UsersIcon size={16} />}
                </div>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginBottom: "4px" }}>Vibes</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {vibeTags.map(tag => (
                      <span key={tag} style={{
                        background: "rgba(224,56,0,0.12)", border: "1px solid rgba(224,56,0,0.3)",
                        borderRadius: "8px", padding: "3px 10px", fontSize: "12px", color: "#e03800", fontWeight: 600,
                      }}>
                        {ALL_VIBE_TAGS.find(v => v.value === tag)?.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── Fixed bottom CTA ── */}
        <div className="cta-bar">
          <button
            className="cta-btn"
            onClick={handleNext}
            disabled={loading}
            type="button"
          >
            {loading ? (
              <span style={{ display: "inline-block", width: "20px", height: "20px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            ) : ctaLabel}
          </button>
          
          {step === 1 && (
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginTop: "12px", fontWeight: 500 }}>
              Você selecionou <span style={{ color: "#e03800", fontWeight: 700 }}>{vibeTags.length} vibes</span>
            </div>
          )}
        </div>

        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
      </div>
    </AuthGuard>
  );
}

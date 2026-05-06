"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { Box } from "@chakra-ui/react";
import type { NearbyEvent } from "@/lib/api/events";
import type { GeoPosition } from "@/hooks/useGeolocation";

const DARK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0b0b0f" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b0b0f" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b6b80" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a1a24" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#12121a" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#1f1f2e" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#06060a" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#12121a" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0e1a0e" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#12121a" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#1a1a24" }] },
];

/** SVG pin for event markers — color driven by vacancy ratio */
function makeEventPin(vagasRestantes: number, capacidadeMaxima: number): string {
  const ratio = capacidadeMaxima > 0 ? vagasRestantes / capacidadeMaxima : 0;
  const color = ratio > 0.4 ? "#e03800" : ratio > 0.1 ? "#e07800" : "#555566";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
      <ellipse cx="20" cy="44" rx="6" ry="3" fill="rgba(0,0,0,0.35)"/>
      <path d="M20 2C11.2 2 4 9.2 4 18c0 10.5 16 28 16 28S36 28.5 36 18C36 9.2 28.8 2 20 2z" fill="${color}" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
      <circle cx="20" cy="18" r="7" fill="rgba(0,0,0,0.3)"/>
      <text x="20" y="22" text-anchor="middle" font-size="9" fill="white" font-family="sans-serif" font-weight="bold">${vagasRestantes}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/** Blue dot for user position */
const USER_PIN = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
    <circle cx="10" cy="10" r="9" fill="#4285F4" stroke="white" stroke-width="2"/>
    <circle cx="10" cy="10" r="4" fill="white"/>
  </svg>`)}`;

interface MapViewProps {
  events?: NearbyEvent[];
  userPosition?: GeoPosition | null;
  onEventClick?: (eventId: string) => void;
}

export default function MapView({ events = [], userPosition, onEventClick }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);

  function initMap() {
    if (!containerRef.current || mapRef.current) return;
    const center = userPosition ?? { lat: -23.5505, lng: -46.6333 };
    mapRef.current = new google.maps.Map(containerRef.current, {
      center,
      zoom: 14,
      disableDefaultUI: true,
      styles: DARK_STYLE,
      backgroundColor: "#0b0b0f",
    });
    renderOverlays();
  }

  function renderOverlays() {
    const map = mapRef.current;
    if (!map) return;

    // Clear old event markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    heatmapRef.current?.setMap(null);

    // Heatmap — weight by inverse of remaining vacancies (fuller = hotter)
    if (events.length > 0 && google.maps.visualization) {
      const heatData = events.map((ev) => ({
        location: new google.maps.LatLng(ev.latitude, ev.longitude),
        weight: Math.max(1, 10 - ev.vagasRestantes),
      }));
      heatmapRef.current = new google.maps.visualization.HeatmapLayer({
        data: heatData,
        map,
        radius: 60,
        opacity: 0.55,
        gradient: [
          "rgba(0,0,0,0)",
          "rgba(224,56,0,0.4)",
          "rgba(224,56,0,0.7)",
          "rgba(224,56,0,1)",
        ],
      });
    }

    // Event pin markers
    events.forEach((ev) => {
      const marker = new google.maps.Marker({
        map,
        position: { lat: ev.latitude, lng: ev.longitude },
        icon: {
          url: makeEventPin(ev.vagasRestantes, parseInt(ev.ocupacao.split("/")[1] ?? "1")),
          scaledSize: new google.maps.Size(40, 48),
          anchor: new google.maps.Point(20, 48),
        },
        title: ev.titulo,
      });
      marker.addListener("click", () => onEventClick?.(ev.id));
      markersRef.current.push(marker);
    });

    // User position dot
    if (userPosition) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setPosition(userPosition);
      } else {
        userMarkerRef.current = new google.maps.Marker({
          map,
          position: userPosition,
          icon: {
            url: USER_PIN,
            scaledSize: new google.maps.Size(20, 20),
            anchor: new google.maps.Point(10, 10),
          },
          zIndex: 999,
        });
      }
      map.panTo(userPosition);
    }
  }

  // Re-render whenever events or position changes
  useEffect(() => {
    if (typeof google !== "undefined" && mapRef.current) renderOverlays();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, userPosition]);

  // Hot-reload init
  useEffect(() => {
    if (typeof google !== "undefined") initMap();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=visualization`}
        strategy="afterInteractive"
        onLoad={initMap}
      />
      <Box ref={containerRef} w="full" h="full" />
    </>
  );
}

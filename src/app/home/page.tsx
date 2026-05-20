"use client";

import { useCallback, useEffect, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import BottomNav from "@/components/layout/BottomNav";
import MapView from "@/components/map/MapView";
import EventBottomSheet from "@/components/map/EventBottomSheet";
import { useGeolocation } from "@/hooks/useGeolocation";
import { getNearbyEvents, type NearbyEvent } from "@/lib/api/events";
import type { VibeTag } from "@/types";
import { getMyProfile } from "@/lib/api/users";
import { Box, Flex, Input, InputGroup, InputLeftElement, HStack, Tag, TagLabel, Avatar, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="11" y1="18" x2="13" y2="18" />
    </svg>
  );
}

const VIBE_CHIPS: { value: VibeTag; label: string }[] = [
  { value: "CRAFT_BEER", label: "🍺 Beer" },
  { value: "MUSICA_AO_VIVO", label: "🎵 Música" },
  { value: "BOARDGAMES", label: "🎲 Jogos" },
  { value: "CHILL", label: "😌 Chill" },
  { value: "FESTA", label: "🎉 Festa" },
  { value: "ESPORTES", label: "⚽ Esportes" },
];

export default function HomeMapPage() {
  const router = useRouter();
  const { position, error: geoError } = useGeolocation();
  const [events, setEvents] = useState<NearbyEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("userId") : null
  );
  const [activeVibes, setActiveVibes] = useState<VibeTag[]>([]);

  // Keep userId in sync with localStorage (handles token refresh / account switch)
  useEffect(() => {
    const token = localStorage.getItem("token") ?? "";
    if (!token) return;
    getMyProfile(token)
      .then((p) => {
        localStorage.setItem("userId", p.id);
        setUserId(p.id);
      })
      .catch(() => {});
  }, []);

  function fetchEvents() {
    if (!position) return;
    getNearbyEvents(position.lat, position.lng, 10, activeVibes.length ? activeVibes : undefined)
      .then(setEvents)
      .catch(() => { /* silently ignore — radar may be rate-limited */ });
  }

  // Fetch nearby events whenever GPS position or vibe filter changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchEvents(); }, [position?.lat, position?.lng, activeVibes]);

  const handleEventClick = useCallback((id: string) => {
    setSelectedEventId(id);
  }, []);

  return (
    <AuthGuard>
      <Box position="relative" w="100%" h="100dvh" bg="surface.bg" overflow="hidden">

        {/* Overlay HUD */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          zIndex={10}
          px={4}
          pt={4}
          pb={3}
          bgGradient="linear(to-b, blackAlpha.800 50%, transparent)"
        >
          <Flex gap={2} align="center">
            <Avatar
              size="sm"
              bg="surface.card"
              border="2px solid"
              borderColor="brand.500"
              flexShrink={0}
              cursor="pointer"
              onClick={() => router.push("/profile")}
            />
            <InputGroup flex={1}>
              <InputLeftElement pointerEvents="none" color="gray.500" h="full">
                <SearchIcon />
              </InputLeftElement>
              <Input
                placeholder="Buscar rolês, vibes, locais..."
                bg="blackAlpha.700"
                backdropFilter="blur(8px)"
                border="1px solid"
                borderColor="whiteAlpha.100"
                borderRadius="full"
                fontSize="sm"
                color="gray.100"
                _placeholder={{ color: "gray.600" }}
                _focus={{ borderColor: "brand.500", boxShadow: "none" }}
                pl={10}
                h="42px"
                variant="unstyled"
                px={4}
              />
            </InputGroup>
          </Flex>

          <HStack spacing={2} mt={3} overflowX="auto" pb={1} sx={{ scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
            <Tag
              as="button"
              borderRadius="full"
              bg={activeVibes.length === 0 ? "brand.500" : "blackAlpha.700"}
              backdropFilter="blur(8px)"
              border="1px solid"
              borderColor={activeVibes.length === 0 ? "brand.500" : "whiteAlpha.200"}
              color={activeVibes.length === 0 ? "white" : "gray.300"}
              size="sm"
              px={3}
              py={1}
              fontWeight="semibold"
              fontSize="xs"
              flexShrink={0}
              _hover={{ bg: "brand.400" }}
              transition="all 0.15s"
              onClick={() => setActiveVibes([])}
            >
              <TagLabel>Todos</TagLabel>
            </Tag>
            {VIBE_CHIPS.map(({ value, label }) => {
              const active = activeVibes.includes(value);
              return (
                <Tag
                  key={value}
                  as="button"
                  borderRadius="full"
                  bg={active ? "brand.500" : "blackAlpha.700"}
                  backdropFilter="blur(8px)"
                  border="1px solid"
                  borderColor={active ? "brand.500" : "whiteAlpha.200"}
                  color={active ? "white" : "gray.300"}
                  size="sm"
                  px={3}
                  py={1}
                  fontWeight="medium"
                  fontSize="xs"
                  flexShrink={0}
                  _hover={{ borderColor: "brand.500", color: "white" }}
                  transition="all 0.15s"
                  onClick={() =>
                    setActiveVibes((prev) =>
                      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
                    )
                  }
                >
                  <TagLabel>{label}</TagLabel>
                </Tag>
              );
            })}
            {events.length > 0 && (
              <Tag
                borderRadius="full"
                bg="whiteAlpha.100"
                border="1px solid"
                borderColor="whiteAlpha.200"
                color="gray.400"
                size="sm"
                px={3}
                py={1}
                fontSize="xs"
                flexShrink={0}
              >
                <TagLabel>{events.length} rolê{events.length !== 1 ? "s" : ""}</TagLabel>
              </Tag>
            )}
          </HStack>

          {/* Geolocation warning */}
          {geoError && (
            <Text fontSize="xs" color="red.400" mt={2} textAlign="center">
              Localização indisponível — {geoError}
            </Text>
          )}
        </Box>

        {/* Map */}
        <Box w="full" h="full">
          <MapView
            events={events}
            userPosition={position}
            onEventClick={handleEventClick}
          />
        </Box>

        {/* Event bottom sheet */}
        <EventBottomSheet
          eventId={selectedEventId}
          userId={userId}
          userPosition={position}
          onClose={() => setSelectedEventId(null)}
          onEventMutated={fetchEvents}
        />

        <BottomNav />
      </Box>
    </AuthGuard>
  );
}




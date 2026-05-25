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
import {
  SearchIcon,
  BeerIcon,
  MusicIcon,
  DiceIcon,
  CoffeeIcon,
  PartyIcon,
  SportsIcon,
} from "@/components/icons";

const VIBE_CHIPS: { value: VibeTag; label: string; icon: React.FC<any> }[] = [
  { value: "CRAFT_BEER", label: "Beer", icon: BeerIcon },
  { value: "MUSICA_AO_VIVO", label: "Música", icon: MusicIcon },
  { value: "BOARDGAMES", label: "Jogos", icon: DiceIcon },
  { value: "CHILL", label: "Chill", icon: CoffeeIcon },
  { value: "FESTA", label: "Festa", icon: PartyIcon },
  { value: "ESPORTES", label: "Esportes", icon: SportsIcon },
];

export default function HomeMapPage() {
  const router = useRouter();
  const { position, error: geoError } = useGeolocation();
  const [events, setEvents] = useState<NearbyEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeVibes, setActiveVibes] = useState<VibeTag[]>([]);

  // Safely initialize client-only values and keep userId in sync with localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserId(localStorage.getItem("userId"));
    }
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
    const token = localStorage.getItem("token") ?? "";
    getNearbyEvents(position.lat, position.lng, 10, activeVibes.length ? activeVibes : undefined, token)
      .then(setEvents)
      .catch(() => { /* silently ignore */ });
  }

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
          bgGradient="linear(to-b, surface.bg 10%, transparent)"
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
                <SearchIcon size={16} />
              </InputLeftElement>
              <Input
                placeholder="Buscar rolês, vibes, locais..."
                bg="surface.cardTranslucent"
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

          <HStack spacing={2} mt={3} overflowX="auto" pb={1} sx={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
            <Tag
              as="button"
              borderRadius="full"
              bg={activeVibes.length === 0 ? "brand.500" : "surface.card"}
              border="1px solid"
              borderColor={activeVibes.length === 0 ? "brand.500" : "whiteAlpha.200"}
              color={activeVibes.length === 0 ? "white" : "gray.300"}
              size="sm"
              px={3}
              py={1.5}
              fontWeight="semibold"
              fontSize="xs"
              flexShrink={0}
              _hover={{ bg: "brand.400" }}
              transition="all 0.15s"
              onClick={() => setActiveVibes([])}
            >
              <TagLabel>Todos</TagLabel>
            </Tag>
            {VIBE_CHIPS.map(({ value, label, icon: IconComponent }) => {
              const active = activeVibes.includes(value);
              return (
                <Tag
                  key={value}
                  as="button"
                  borderRadius="full"
                  bg={active ? "brand.500" : "surface.card"}
                  border="1px solid"
                  borderColor={active ? "brand.500" : "whiteAlpha.200"}
                  color={active ? "white" : "gray.300"}
                  size="sm"
                  px={3}
                  py={1.5}
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
                  <HStack spacing={1.5}>
                    <IconComponent size={14} />
                    <TagLabel>{label}</TagLabel>
                  </HStack>
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
                py={1.5}
                fontSize="xs"
                flexShrink={0}
              >
                <TagLabel>{events.length} rolê{events.length !== 1 ? "s" : ""}</TagLabel>
              </Tag>
            )}
          </HStack>

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

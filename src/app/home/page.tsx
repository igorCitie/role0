"use client";

import { useCallback, useEffect, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import BottomNav from "@/components/layout/BottomNav";
import MapView from "@/components/map/MapView";
import EventBottomSheet from "@/components/map/EventBottomSheet";
import { useGeolocation } from "@/hooks/useGeolocation";
import { getNearbyEvents, type NearbyEvent } from "@/lib/api/events";
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

function BoltIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" />
    </svg>
  );
}

function MusicIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

export default function HomeMapPage() {
  const router = useRouter();
  const { position, error: geoError } = useGeolocation();
  const [events, setEvents] = useState<NearbyEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Load current user ID for host detection
  useEffect(() => {
    const token = localStorage.getItem("token") ?? "";
    if (!token) return;
    getMyProfile(token).then((p) => setUserId(p.id)).catch(() => {});
  }, []);

  function fetchEvents() {
    if (!position) return;
    getNearbyEvents(position.lat, position.lng, 10)
      .then(setEvents)
      .catch(() => { /* silently ignore — radar may be rate-limited */ });
  }

  // Fetch nearby events whenever GPS position changes
  useEffect(() => { fetchEvents(); }, [position?.lat, position?.lng]);

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
            <Flex
              as="button"
              w="42px"
              h="42px"
              borderRadius="full"
              bg="blackAlpha.700"
              backdropFilter="blur(8px)"
              border="1px solid"
              borderColor="whiteAlpha.100"
              align="center"
              justify="center"
              color="gray.400"
              flexShrink={0}
              _hover={{ borderColor: "brand.500", color: "brand.400" }}
              transition="all 0.15s"
            >
              <FilterIcon />
            </Flex>
          </Flex>

          <HStack spacing={2} mt={3}>
            <Tag
              as="button"
              borderRadius="full"
              bg="brand.500"
              color="white"
              size="sm"
              px={3}
              py={1}
              gap={1}
              fontWeight="semibold"
              fontSize="xs"
              _hover={{ bg: "brand.400" }}
              transition="background 0.15s"
            >
              <BoltIcon />
              <TagLabel>Trending</TagLabel>
            </Tag>
            <Tag
              as="button"
              borderRadius="full"
              bg="blackAlpha.700"
              backdropFilter="blur(8px)"
              border="1px solid"
              borderColor="whiteAlpha.200"
              color="gray.300"
              size="sm"
              px={3}
              py={1}
              gap={1}
              fontWeight="medium"
              fontSize="xs"
              _hover={{ borderColor: "brand.500", color: "white" }}
              transition="all 0.15s"
            >
              <MusicIcon />
              <TagLabel>Música ao vivo</TagLabel>
            </Tag>

            {/* Live event count badge */}
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




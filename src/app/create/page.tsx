"use client";

/// <reference types="@types/google.maps" />
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Stack,
  Tag,
  Text,
  Textarea,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  useToast,
} from "@chakra-ui/react";
import AuthGuard from "@/components/auth/AuthGuard";
import { createEvent } from "@/lib/api/events";
import type { VibeTag } from "@/types";

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

const ALL_VIBE_TAGS: { value: VibeTag; label: string }[] = [
  { value: "CRAFT_BEER", label: "🍺 Craft Beer" },
  { value: "BOARDGAMES", label: "🎲 Board Games" },
  { value: "MUSICA_AO_VIVO", label: "🎵 Música ao vivo" },
  { value: "PAGODE", label: "🥁 Pagode" },
  { value: "SERTANEJO", label: "🤠 Sertanejo" },
  { value: "FUNK", label: "🎤 Funk" },
  { value: "ROCK", label: "🎸 Rock" },
  { value: "ELETRONICA", label: "🎧 Eletrônica" },
  { value: "ESPORTES", label: "⚽ Esportes" },
  { value: "CULTURA", label: "🎭 Cultura" },
  { value: "CHILL", label: "😌 Chill" },
  { value: "FESTA", label: "🎉 Festa" },
];

export default function CreateEventPage() {
  const router = useRouter();
  const toast = useToast();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [capacidadeMaxima, setCapacidadeMaxima] = useState(10);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [pickedAddress, setPickedAddress] = useState<string>("");
  const [horarioInicio, setHorarioInicio] = useState("");
  const [vibeTags, setVibeTags] = useState<VibeTag[]>([]);
  const [loading, setLoading] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const gMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);

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
    { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#1a1a24" }] },
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "poi.business", elementType: "labels.icon", stylers: [{ visibility: "on" }] },
    { featureType: "poi.business", elementType: "labels.text", stylers: [{ visibility: "on" }, { color: "#9999bb" }] },
    { featureType: "poi.attraction", elementType: "labels.icon", stylers: [{ visibility: "on" }] },
    { featureType: "poi.attraction", elementType: "labels.text", stylers: [{ visibility: "on" }, { color: "#9999bb" }] },
    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#12121a" }] },
    { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
  ];

  const USER_PIN = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="9" fill="#4285F4" stroke="white" stroke-width="2"/>
      <circle cx="10" cy="10" r="4" fill="white"/>
    </svg>`)}`;

  function placeUserDot(lat: number, lng: number) {
    if (!gMapRef.current) return;
    if (userMarkerRef.current) {
      userMarkerRef.current.setPosition({ lat, lng });
    } else {
      userMarkerRef.current = new google.maps.Marker({
        map: gMapRef.current,
        position: { lat, lng },
        icon: { url: USER_PIN, anchor: new google.maps.Point(10, 10) },
        title: "Sua localização",
        zIndex: 10,
      });
    }
  }

  function initMap() {
    if (!mapContainerRef.current || typeof google === "undefined") return;
    if (gMapRef.current) return; // already initialised

    const defaultCenter = { lat: -2.5307, lng: -44.3068 }; // São Luís, MA

    const map = new google.maps.Map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "cooperative",
      styles: DARK_STYLE,
    });

    gMapRef.current = map;

    map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      placePin(e.latLng.lat(), e.latLng.lng());
    });

    // Center on user's GPS and place the blue dot
    navigator.geolocation?.getCurrentPosition((pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      map.setCenter({ lat, lng });
      placeUserDot(lat, lng);
    });
  }

  // Wait for both the globally loaded Google Maps script (layout.tsx)
  // AND the map container to be in the DOM (AuthGuard delays rendering)
  useEffect(() => {
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
  }, []);

  function placePin(lat: number, lng: number) {
    setLatitude(lat);
    setLongitude(lng);

    if (markerRef.current) {
      markerRef.current.setPosition({ lat, lng });
    } else {
      markerRef.current = new google.maps.Marker({
        map: gMapRef.current!,
        position: { lat, lng },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#e03800",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
    }

    // Reverse geocode to show human-readable address
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        setPickedAddress(results[0].formatted_address);
      }
    });
  }

  function handleUseMyLocation() {
    navigator.geolocation?.getCurrentPosition((pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      gMapRef.current?.setCenter({ lat, lng });
      gMapRef.current?.setZoom(16);
      placeUserDot(lat, lng);
      placePin(lat, lng);
    });
  }

  function toggleTag(tag: VibeTag) {
    setVibeTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (latitude === null || longitude === null) {
      toast({ title: "Defina o local no mapa", status: "warning", duration: 3000, isClosable: true });
      return;
    }

    const token = localStorage.getItem("token") ?? "";

    setLoading(true);
    try {
      await createEvent(
        {
          titulo,
          descricao,
          capacidadeMaxima,
          latitude: latitude,
          longitude: longitude,
          horarioInicio: new Date(horarioInicio).toISOString().replace("Z", ""),
          vibeTags,
        },
        token,
      );
      toast({ title: "Rolê criado! 🎉", status: "success", duration: 2500, isClosable: true });
      router.push("/home");
    } catch (err) {
      toast({
        title: "Erro ao criar rolê",
        description: err instanceof Error && err.message.startsWith("API 400")
          ? "Verifique os campos e tente novamente."
          : err instanceof Error ? err.message : "Tente novamente.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthGuard>
      <Box
        w="100%"
        minH="100dvh"
        bg="surface.bg"
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        <Container maxW="390px" px={0} pb="32px">
          {/* Header */}
          <Flex
            align="center"
            gap={3}
            px={4}
            pt={5}
            pb={4}
            position="sticky"
            top={0}
            bg="surface.bg"
            zIndex={10}
            borderBottom="1px solid"
            borderColor="whiteAlpha.100"
          >
            <Box
              as="button"
              onClick={() => router.back()}
              color="gray.400"
              _hover={{ color: "white" }}
              transition="color 0.15s"
            >
              <BackIcon />
            </Box>
            <Heading size="sm" color="white">
              Criar Rolê
            </Heading>
          </Flex>

          {/* Form */}
          <Stack
            as="form"
            onSubmit={handleSubmit}
            spacing={5}
            px={4}
            pt={6}
          >
            {/* Título */}
            <FormControl isRequired>
              <FormLabel fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={1}>
                Título
              </FormLabel>
              <Input
                placeholder="Ex: Resenha do Japa"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                size="lg"
                borderRadius="xl"
              />
            </FormControl>

            {/* Descrição */}
            <FormControl>
              <FormLabel fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={1}>
                Descrição
              </FormLabel>
              <Textarea
                placeholder="Conta mais sobre o rolê..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                bg="surface.input"
                border="1px solid"
                borderColor="whiteAlpha.100"
                borderRadius="xl"
                fontSize="sm"
                color="gray.100"
                _placeholder={{ color: "gray.600" }}
                _focus={{ borderColor: "brand.500", boxShadow: "none" }}
                resize="none"
                rows={3}
              />
            </FormControl>

            {/* Data/hora */}
            <FormControl isRequired>
              <FormLabel fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={1}>
                Data e Horário
              </FormLabel>
              <Input
                type="datetime-local"
                value={horarioInicio}
                onChange={(e) => setHorarioInicio(e.target.value)}
                size="lg"
                borderRadius="xl"
                colorScheme="brand"
                css={{ colorScheme: "dark" }}
              />
            </FormControl>

            {/* Capacidade */}
            <FormControl isRequired>
              <FormLabel fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={1}>
                Capacidade máxima
              </FormLabel>
              <NumberInput
                min={2}
                max={500}
                value={capacidadeMaxima}
                onChange={(_, val) => setCapacidadeMaxima(val)}
              >
                <NumberInputField
                  bg="surface.input"
                  border="1px solid"
                  borderColor="whiteAlpha.100"
                  borderRadius="xl"
                  fontSize="sm"
                  h="48px"
                  _focus={{ borderColor: "brand.500", boxShadow: "none" }}
                />
                <NumberInputStepper>
                  <NumberIncrementStepper borderColor="whiteAlpha.100" color="gray.400" />
                  <NumberDecrementStepper borderColor="whiteAlpha.100" color="gray.400" />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            {/* Localização */}
            <FormControl isRequired>
              <FormLabel fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={1}>
                Localização
              </FormLabel>

              {/* Map picker */}
              <Box
                ref={mapContainerRef}
                h="260px"
                borderRadius="xl"
                overflow="hidden"
                border="1px solid"
                borderColor={latitude !== null ? "brand.500" : "whiteAlpha.100"}
                transition="border-color 0.2s"
                cursor="crosshair"
              />

              {/* Feedback */}
              {latitude !== null ? (
                <Text fontSize="xs" color="gray.400" mt={1} noOfLines={1}>
                  📍 {pickedAddress || `${latitude.toFixed(5)}, ${longitude?.toFixed(5)}`}
                </Text>
              ) : (
                <Text fontSize="xs" color="gray.600" mt={1}>
                  Toque no mapa para marcar o local do rolê
                </Text>
              )}

              <Button
                size="xs"
                variant="outline"
                colorScheme="brand"
                borderRadius="full"
                mt={2}
                onClick={handleUseMyLocation}
              >
                📍 Usar minha localização
              </Button>
            </FormControl>

            {/* Vibe Tags */}
            <FormControl>
              <FormLabel fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={2}>
                Vibes
              </FormLabel>
              <Flex gap={2} flexWrap="wrap">
                {ALL_VIBE_TAGS.map(({ value, label }) => {
                  const active = vibeTags.includes(value);
                  return (
                    <Tag
                      key={value}
                      as="button"
                      type="button"
                      onClick={() => toggleTag(value)}
                      borderRadius="full"
                      px={3}
                      py={1}
                      fontSize="xs"
                      fontWeight="medium"
                      cursor="pointer"
                      bg={active ? "brand.500" : "surface.input"}
                      color={active ? "white" : "gray.400"}
                      border="1px solid"
                      borderColor={active ? "brand.500" : "whiteAlpha.100"}
                      _hover={{ borderColor: "brand.500" }}
                      transition="all 0.15s"
                    >
                      {label}
                    </Tag>
                  );
                })}
              </Flex>
            </FormControl>

            <Button
              type="submit"
              size="lg"
              borderRadius="xl"
              isLoading={loading}
              fontWeight="bold"
              mt={2}
            >
              Publicar Rolê →
            </Button>
          </Stack>
        </Container>
      </Box>
    </AuthGuard>
  );
}

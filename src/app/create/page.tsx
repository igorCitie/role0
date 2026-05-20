"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Stack,
  Tag,
  Text,
  Textarea,
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
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [horarioInicio, setHorarioInicio] = useState("");
  const [vibeTags, setVibeTags] = useState<VibeTag[]>([]);
  const [loading, setLoading] = useState(false);

  function toggleTag(tag: VibeTag) {
    setVibeTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const token = localStorage.getItem("token") ?? "";

    setLoading(true);
    try {
      await createEvent(
        {
          titulo,
          descricao,
          capacidadeMaxima,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
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
              <HStack spacing={2}>
                <Input
                  placeholder="Latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  size="lg"
                  borderRadius="xl"
                  type="number"
                  step="any"
                />
                <Input
                  placeholder="Longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  size="lg"
                  borderRadius="xl"
                  type="number"
                  step="any"
                />
              </HStack>
              <Button
                size="xs"
                variant="outline"
                colorScheme="brand"
                borderRadius="full"
                mt={1}
                onClick={() => {
                  if (!navigator.geolocation) return;
                  navigator.geolocation.getCurrentPosition((pos) => {
                    setLatitude(String(pos.coords.latitude));
                    setLongitude(String(pos.coords.longitude));
                  });
                }}
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

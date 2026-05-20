"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Heading,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  SkeletonCircle,
  Stack,
  Tag,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import AuthGuard from "@/components/auth/AuthGuard";
import BottomNav from "@/components/layout/BottomNav";
import { getMyProfile, updateProfile, validateBiometrics, type UserProfile } from "@/lib/api/users";
import { logout } from "@/lib/api/auth";

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

function ShieldIcon({ validated }: { validated: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={validated ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      {validated && <polyline points="9 12 11 14 15 10" stroke="white" strokeWidth="2" fill="none" />}
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 1-2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

const PROFILE_VIBES: { value: string; label: string }[] = [
  { value: "CRAFT_BEER",  label: "🍺 Craft Beer"  },
  { value: "BOARD_GAMES", label: "🎲 Board Games" },
  { value: "INDIE_MUSIC", label: "🎸 Indie Music" },
  { value: "TECH_TALKS",  label: "💻 Tech Talks"  },
  { value: "SPORTS",      label: "⚽ Esportes"    },
  { value: "CAFE",        label: "☕ Café"         },
  { value: "NATURE",      label: "🌿 Natureza"    },
];

function TrustScoreBar({ score }: { score: number }) {
  const pct = Math.min(Math.max(score, 0), 100);
  const color = pct >= 75 ? "green.400" : pct >= 40 ? "brand.400" : "red.400";
  return (
    <Box>
      <Flex justify="space-between" mb={1}>
        <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider">
          Trust Score
        </Text>
        <Text fontSize="xs" fontWeight="bold" color={color}>
          {pct}
        </Text>
      </Flex>
      <Box bg="surface.input" borderRadius="full" h="6px" overflow="hidden">
        <Box bg={color} h="full" w={`${pct}%`} borderRadius="full" transition="width 0.6s ease" />
      </Box>
    </Box>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { isOpen: isEditOpen, onOpen: openEdit, onClose: closeEdit } = useDisclosure();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [biometricsLoading, setBiometricsLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editName, setEditName] = useState("");
  const [editVibes, setEditVibes] = useState<string[]>([]);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token") ?? "";
    getMyProfile(token)
      .then(setProfile)
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar perfil."));
  }, []);

  async function handleLogout() {
    const token = localStorage.getItem("token") ?? "";
    localStorage.removeItem("token");
    try { await logout(token); } catch { /* proceed even if server unreachable */ }
    router.replace("/login");
  }

  async function handleValidateBiometrics() {
    const token = localStorage.getItem("token") ?? "";
    setBiometricsLoading(true);
    try {
      await validateBiometrics(token);
      setProfile((p) => (p ? { ...p, biometriaValidada: true } : p));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao validar biometria.");
    } finally {
      setBiometricsLoading(false);
    }
  }

  function openEditModal() {
    if (!profile) return;
    setEditName(profile.nome);
    setEditVibes(profile.vibes ?? []);
    setEditError(null);
    openEdit();
  }

  async function handleSaveProfile() {
    if (!editName.trim()) { setEditError("Nome não pode ser vazio."); return; }
    const token = localStorage.getItem("token") ?? "";
    setEditLoading(true);
    setEditError(null);
    try {
      await updateProfile({ nomeDisplay: editName.trim(), vibeTags: editVibes }, token);
      setProfile((p) => p ? { ...p, nome: editName.trim(), vibes: editVibes } : p);
      closeEdit();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Erro ao salvar perfil.");
    } finally {
      setEditLoading(false);
    }
  }

  const loading = !profile && !error;

  return (
    <AuthGuard>
      <Box w="100%" minH="100dvh" bg="surface.bg" display="flex" flexDirection="column" alignItems="center">
        <Container maxW="390px" px={0} pb="80px">

          {/* Header */}
          <Flex
            align="center"
            justify="space-between"
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
            <Heading size="sm" color="white">Perfil</Heading>
            <HStack spacing={1}>
              {profile && (
                <Button
                  size="xs"
                  variant="ghost"
                  color="gray.500"
                  leftIcon={<EditIcon />}
                  onClick={openEditModal}
                  _hover={{ color: "brand.400" }}
                >
                  Editar
                </Button>
              )}
              <Button
                size="xs"
                variant="ghost"
                color="gray.500"
                leftIcon={<LogoutIcon />}
                onClick={handleLogout}
                _hover={{ color: "red.400" }}
              >
                Sair
              </Button>
            </HStack>
          </Flex>

          <Stack spacing={6} px={4} pt={6}>
            {/* Avatar + name block */}
            {loading ? (
              <Flex direction="column" align="center" gap={3}>
                <SkeletonCircle size="20" />
                <Skeleton h="20px" w="140px" borderRadius="md" />
                <Skeleton h="14px" w="180px" borderRadius="md" />
              </Flex>
            ) : error ? (
              <Text color="red.400" fontSize="sm" textAlign="center">{error}</Text>
            ) : (
              <Flex direction="column" align="center" gap={3}>
                <Box position="relative">
                  <Avatar
                    size="xl"
                    name={profile!.nome}
                    bg="surface.card"
                    border="3px solid"
                    borderColor="brand.500"
                  />
                  {profile!.biometriaValidada && (
                    <Flex
                      position="absolute"
                      bottom={0}
                      right={0}
                      bg="green.500"
                      borderRadius="full"
                      w="22px"
                      h="22px"
                      align="center"
                      justify="center"
                      border="2px solid"
                      borderColor="surface.bg"
                      color="white"
                    >
                      <ShieldIcon validated />
                    </Flex>
                  )}
                </Box>

                <Stack spacing={0} align="center">
                  <Heading size="md" color="white">{profile!.nome}</Heading>
                  <Text fontSize="sm" color="gray.500">{profile!.email}</Text>
                </Stack>
              </Flex>
            )}

            <Divider borderColor="whiteAlpha.100" />

            {/* Trust score */}
            {loading ? (
              <Skeleton h="40px" borderRadius="md" />
            ) : profile && (
              <Box bg="surface.card" borderRadius="xl" p={4} border="1px solid" borderColor="whiteAlpha.100">
                <TrustScoreBar score={profile.trustScore} />
              </Box>
            )}

            {/* Vibes */}
            {loading ? (
              <HStack flexWrap="wrap" spacing={2}>
                {[80, 100, 70, 90].map((w) => (
                  <Skeleton key={w} h="28px" w={`${w}px`} borderRadius="full" />
                ))}
              </HStack>
            ) : profile && profile.vibes.length > 0 && (
              <Box>
                <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={2}>
                  Vibes
                </Text>
                <Flex gap={2} flexWrap="wrap">
                  {profile.vibes.map((v) => (
                    <Tag
                      key={v}
                      borderRadius="full"
                      bg="surface.input"
                      border="1px solid"
                      borderColor="whiteAlpha.100"
                      color="gray.300"
                      fontSize="xs"
                      px={3}
                      py={1}
                    >
                      {v}
                    </Tag>
                  ))}
                </Flex>
              </Box>
            )}

            {/* Biometria badge */}
            {profile && (
              <Box>
                <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={2}>
                  Verificação
                </Text>
                <HStack>
                  <Badge
                    borderRadius="full"
                    px={3}
                    py={1}
                    colorScheme={profile.biometriaValidada ? "green" : "gray"}
                    fontSize="xs"
                    display="flex"
                    alignItems="center"
                    gap={1}
                  >
                    <ShieldIcon validated={profile.biometriaValidada} />
                    {profile.biometriaValidada ? "Biometria validada" : "Biometria pendente"}
                  </Badge>
                  {!profile.biometriaValidada && (
                    <Button
                      size="xs"
                      colorScheme="green"
                      variant="outline"
                      borderRadius="full"
                      isLoading={biometricsLoading}
                      onClick={handleValidateBiometrics}
                    >
                      Validar
                    </Button>
                  )}
                </HStack>
              </Box>
            )}
          </Stack>
        </Container>

        <BottomNav />

        {/* Edit profile modal */}
        <Modal isOpen={isEditOpen} onClose={closeEdit} isCentered size="sm">
          <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.700" />
          <ModalContent bg="surface.card" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" mx={4}>
            <ModalHeader color="white" fontSize="md">Editar Perfil</ModalHeader>
            <ModalCloseButton color="gray.400" />
            <ModalBody>
              <Stack spacing={5}>
                <Box>
                  <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={2}>
                    Nome de exibição
                  </Text>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    bg="surface.input"
                    border="1px solid"
                    borderColor="whiteAlpha.100"
                    borderRadius="xl"
                    color="gray.100"
                    _focus={{ borderColor: "brand.500", boxShadow: "none" }}
                    _placeholder={{ color: "gray.600" }}
                    placeholder="Seu nome..."
                  />
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={2}>
                    Vibes
                  </Text>
                  <Flex gap={2} flexWrap="wrap">
                    {PROFILE_VIBES.map(({ value, label }) => {
                      const active = editVibes.includes(value);
                      return (
                        <Tag
                          key={value}
                          as="button"
                          borderRadius="full"
                          bg={active ? "brand.500" : "surface.input"}
                          border="1px solid"
                          borderColor={active ? "brand.500" : "whiteAlpha.100"}
                          color={active ? "white" : "gray.400"}
                          fontSize="xs"
                          px={3}
                          py={1}
                          cursor="pointer"
                          transition="all 0.15s"
                          _hover={{ borderColor: "brand.500", color: "white" }}
                          onClick={() =>
                            setEditVibes((prev) =>
                              prev.includes(value)
                                ? prev.filter((v) => v !== value)
                                : [...prev, value],
                            )
                          }
                        >
                          {label}
                        </Tag>
                      );
                    })}
                  </Flex>
                </Box>
                {editError && (
                  <Text color="red.400" fontSize="xs">{editError}</Text>
                )}
              </Stack>
            </ModalBody>
            <ModalFooter gap={2}>
              <Button variant="ghost" color="gray.400" onClick={closeEdit} size="sm">Cancelar</Button>
              <Button size="sm" borderRadius="lg" isLoading={editLoading} onClick={handleSaveProfile}>
                Salvar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </AuthGuard>
  );
}

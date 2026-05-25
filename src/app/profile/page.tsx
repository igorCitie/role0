"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Button,
  Container,
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
  Text,
  useDisclosure,
  IconButton,
  useToast,
} from "@chakra-ui/react";
import AuthGuard from "@/components/auth/AuthGuard";
import BottomNav from "@/components/layout/BottomNav";
import { getMyProfile, updateProfile, validateBiometrics, type UserProfile } from "@/lib/api/users";
import { getMyEvents, type MyEvent } from "@/lib/api/events";
import { logout } from "@/lib/api/auth";
import { TrustScoreBar } from "@/components/shared/TrustScoreBar";
import {
  BackIcon,
  ShieldIcon,
  LogoutIcon,
  PencilIcon,
  BeerIcon,
  DiceIcon,
  GuitarIcon,
  CodeIcon,
  SportsIcon,
  CoffeeIcon,
  LeafIcon,
  UsersIcon,
  TicketIcon,
  CalendarIcon,
  StarFilledIcon,
} from "@/components/icons";

const PROFILE_VIBES: { value: string; label: string; icon: React.FC<any> }[] = [
  { value: "CRAFT_BEER", label: "Cerveja Artesanal", icon: BeerIcon },
  { value: "BOARD_GAMES", label: "Jogos de Tabuleiro", icon: DiceIcon },
  { value: "INDIE_MUSIC", label: "Indie Music", icon: GuitarIcon },
  { value: "CAFE", label: "Cafés e Encontros", icon: CoffeeIcon },
  { value: "NATURE", label: "Natureza & Trilhas", icon: LeafIcon },
  { value: "TECH_TALKS", label: "Tech Talks", icon: CodeIcon },
  { value: "SPORTS", label: "Esportes e Lazer", icon: SportsIcon },
];

function getVibeDetails(value: string) {
  const found = PROFILE_VIBES.find((v) => v.value === value);
  if (found) return found;
  return { value, label: value, icon: null };
}

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const { isOpen: isEditOpen, onOpen: openEdit, onClose: closeEdit } = useDisclosure();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [biometricsLoading, setBiometricsLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editName, setEditName] = useState("");
  const [editVibes, setEditVibes] = useState<string[]>([]);
  const [editError, setEditError] = useState<string | null>(null);

  // Futuristic Face Scanner Simulation
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token") ?? "";
    getMyProfile(token)
      .then(setProfile)
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar perfil."));

    getMyEvents(token)
      .then(setEvents)
      .catch(() => { /* fallback gracefully */ });
  }, []);

  async function handleLogout() {
    const token = localStorage.getItem("token") ?? "";
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    try { await logout(token); } catch { /* ignore */ }
    router.replace("/login");
  }

  async function handleValidateBiometrics() {
    const token = localStorage.getItem("token") ?? "";
    setIsScanning(true);
    setScanStep(0);

    setTimeout(() => setScanStep(1), 1000);
    setTimeout(() => setScanStep(2), 2000);

    setTimeout(async () => {
      try {
        await validateBiometrics(token);
        setProfile((p) => (p ? { ...p, biometriaValidada: true } : p));
        toast({
          title: "Identidade Verificada!",
          description: "Biometria validada com sucesso no Role0 Secure Passport.",
          status: "success",
          duration: 3500,
          isClosable: true,
        });
      } catch (err) {
        toast({
          title: "Falha na verificação",
          description: err instanceof Error ? err.message : "Não foi possível validar biometria.",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      } finally {
        setIsScanning(false);
      }
    }, 3200);
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
      // FIX: Changed from nomeDisplay to nome to match the backend contract (HTTP 500 fix)
      await updateProfile({ nome: editName.trim(), vibes: editVibes }, token);
      setProfile((p) => p ? { ...p, nome: editName.trim(), vibes: editVibes } : p);
      closeEdit();
      toast({ title: "Perfil atualizado!", status: "success", duration: 2000, isClosable: true });
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Erro ao salvar perfil.");
    } finally {
      setEditLoading(false);
    }
  }

  const loading = !profile && !error;

  const hostedEventsCount = events.filter(e => e.isHost).length;
  const attendedEventsCount = events.filter(e => !e.isHost && e.status === "EXPIRADO").length;
  const simulatedAttended = events.filter(e => !e.isHost).length || 2; 
  const computedConnections = ((hostedEventsCount + simulatedAttended) * 4) + 6;

  function getTrustLabel(score: number): { label: string; color: string; hex: string } {
    if (score >= 90) return { label: "LENDA", color: "orange.400", hex: "#dd6b20" };
    if (score >= 80) return { label: "PRIME", color: "green.400", hex: "#38a169" };
    if (score >= 60) return { label: "ATIVO", color: "cyan.400", hex: "#00b5d8" };
    return { label: "EXPLORER", color: "gray.400", hex: "#a0aec0" };
  }

  const trustLevel = profile ? getTrustLabel(profile.trustScore) : null;

  return (
    <AuthGuard>
      <Box w="100%" minH="100dvh" bg="#0a0a0d" display="flex" flexDirection="column" alignItems="center" overflowX="hidden">
        <Container maxW="390px" px={0} pb="100px" position="relative" zIndex={1}>

          {/* Minimalist Top Nav */}
          <Flex
            align="center"
            justify="space-between"
            px={5}
            pt={6}
            pb={4}
            position="sticky"
            top={0}
            backdropFilter="blur(20px)"
            bg="rgba(10, 10, 13, 0.85)"
            zIndex={10}
            borderBottom="1px solid"
            borderColor="whiteAlpha.50"
          >
            <IconButton
              aria-label="Voltar"
              icon={<BackIcon />}
              variant="unstyled"
              onClick={() => router.back()}
              color="whiteAlpha.700"
              _hover={{ color: "white" }}
              display="flex"
              alignItems="center"
              justifyContent="center"
              minW="auto"
              h="auto"
            />
            <Heading size="xs" color="white" fontWeight="700" letterSpacing="0.05em" textTransform="uppercase" fontFamily="var(--font-geist-sans), sans-serif">
              Perfil
            </Heading>
            <IconButton
              aria-label="Sair"
              icon={<LogoutIcon />}
              variant="unstyled"
              onClick={handleLogout}
              color="whiteAlpha.500"
              _hover={{ color: "red.400" }}
              display="flex"
              alignItems="center"
              justifyContent="center"
              minW="auto"
              h="auto"
            />
          </Flex>

          <Stack spacing={8} px={5} pt={8}>
            
            {/* 1. Identity Cockpit (Asymmetric & High Contrast) */}
            {loading ? (
              <Flex direction="column" gap={4}>
                <SkeletonCircle size="20" startColor="whiteAlpha.50" endColor="whiteAlpha.100" />
                <Skeleton h="32px" w="200px" startColor="whiteAlpha.50" endColor="whiteAlpha.100" />
              </Flex>
            ) : error ? (
              <Text color="red.400" fontSize="sm">{error}</Text>
            ) : profile && (
              <Flex align="flex-end" justify="space-between" w="full">
                <Stack spacing={4}>
                  <Box position="relative" w="80px" h="80px">
                    <Avatar
                      size="full"
                      name={profile.nome}
                      bg="#12121a"
                      border="1px solid"
                      borderColor={profile.biometriaValidada ? "green.500" : "whiteAlpha.200"}
                      color="white"
                    />
                    {profile.biometriaValidada && (
                      <Flex
                        position="absolute"
                        bottom="-4px"
                        right="-4px"
                        bg="#0a0a0d"
                        borderRadius="full"
                        p="2px"
                      >
                        <Flex w="20px" h="20px" bg="green.500" borderRadius="full" align="center" justify="center" color="black">
                          <ShieldIcon size={10} validated />
                        </Flex>
                      </Flex>
                    )}
                  </Box>
                  <Box>
                    <Heading size="xl" color="white" fontWeight="600" letterSpacing="-0.03em" fontFamily="var(--font-outfit), sans-serif" lineHeight="1.1">
                      {profile.nome}
                    </Heading>
                    <Text fontSize="13px" color="whiteAlpha.500" mt={1} fontFamily="monospace">{profile.email}</Text>
                  </Box>
                </Stack>

                <Button
                  size="sm"
                  variant="unstyled"
                  color="whiteAlpha.700"
                  display="flex"
                  alignItems="center"
                  gap={2}
                  onClick={openEditModal}
                  _hover={{ color: "white" }}
                  _active={{ transform: "scale(0.96)" }}
                  transition="all 0.2s"
                >
                  <PencilIcon size={14} />
                  <Text fontSize="11px" fontWeight="600" textTransform="uppercase" letterSpacing="0.05em">Editar</Text>
                </Button>
              </Flex>
            )}

            {/* 2. Secure Passport (Boarding Pass Style) */}
            {profile && (
              <Box
                border="1px solid"
                borderColor="whiteAlpha.100"
                borderRadius="2xl"
                position="relative"
                overflow="hidden"
                bg="transparent"
              >
                <Box p={5} borderBottom="1px dashed" borderColor="whiteAlpha.100">
                  <Flex justify="space-between" align="center" mb={4}>
                    <Text fontSize="10px" color="whiteAlpha.400" fontWeight="600" textTransform="uppercase" letterSpacing="0.1em" fontFamily="monospace">
                      ROLE0 SECURE ID
                    </Text>
                    <Flex align="center" gap={2}>
                      <Box w="6px" h="6px" borderRadius="full" bg={profile.biometriaValidada ? "green.500" : "brand.500"} />
                      <Text fontSize="10px" color={profile.biometriaValidada ? "green.500" : "brand.500"} fontWeight="700" textTransform="uppercase" letterSpacing="0.05em" fontFamily="monospace">
                        {profile.biometriaValidada ? "VERIFIED" : "PENDING"}
                      </Text>
                    </Flex>
                  </Flex>

                  <Text fontSize="13px" color="whiteAlpha.600" lineHeight="1.6" pr={4}>
                    {profile.biometriaValidada 
                      ? "Identidade autenticada biometricamente. Acesso total garantido aos encontros."
                      : "Passaporte inativo. Valide sua biometria para garantir a segurança da comunidade e sua vaga nas mesas."}
                  </Text>
                </Box>

                <Flex p={4} bg="whiteAlpha.50" justify="space-between" align="center">
                  <Stack spacing={1}>
                    <Text fontSize="9px" color="whiteAlpha.400" letterSpacing="0.08em" textTransform="uppercase">SIGNATURE</Text>
                    <Text fontSize="11px" fontFamily="monospace" color={profile.biometriaValidada ? "green.400" : "whiteAlpha.500"}>
                      {profile.biometriaValidada ? "0x" + profile.id.substring(0,8).toUpperCase() + "...SECURE" : "NULL_SIGNATURE"}
                    </Text>
                  </Stack>
                  
                  {!profile.biometriaValidada && (
                    <Button
                      size="sm"
                      h="32px"
                      bg="white"
                      color="black"
                      borderRadius="full"
                      px={4}
                      fontSize="11px"
                      fontWeight="700"
                      textTransform="uppercase"
                      letterSpacing="0.05em"
                      _hover={{ bg: "whiteAlpha.800" }}
                      _active={{ transform: "scale(0.98)" }}
                      isLoading={biometricsLoading}
                      onClick={handleValidateBiometrics}
                    >
                      Validar
                    </Button>
                  )}
                </Flex>
              </Box>
            )}

            {/* 3. High Contrast Stats Grid (Cockpit Mode) */}
            {profile && trustLevel && (
              <Box>
                <Text fontSize="11px" color="whiteAlpha.500" fontWeight="600" textTransform="uppercase" letterSpacing="0.08em" mb={4}>
                  Métricas de Engajamento
                </Text>
                <Stack spacing={0} border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" overflow="hidden">
                  
                  {/* Trust Score Row */}
                  <Flex p={5} justify="space-between" align="center" borderBottom="1px solid" borderColor="whiteAlpha.100" bg="transparent">
                    <Stack spacing={1}>
                      <Text fontSize="11px" color="whiteAlpha.500" fontWeight="600" textTransform="uppercase" letterSpacing="0.05em">Trust Score</Text>
                      <HStack align="center" spacing={2}>
                        <Heading size="md" color="white" fontWeight="500" fontFamily="monospace">{profile.trustScore}</Heading>
                        <Text fontSize="10px" color={trustLevel.color} fontWeight="700" letterSpacing="0.05em">{trustLevel.label}</Text>
                      </HStack>
                    </Stack>
                    <Box w="100px">
                      <TrustScoreBar score={profile.trustScore} />
                    </Box>
                  </Flex>

                  {/* Horizontal Stats Row */}
                  <Flex>
                    <Flex flex={1} p={5} direction="column" gap={1} borderRight="1px solid" borderColor="whiteAlpha.100">
                      <Text fontSize="10px" color="whiteAlpha.500" fontWeight="600" textTransform="uppercase" letterSpacing="0.05em">Organizou</Text>
                      <HStack align="baseline" spacing={1}>
                        <Heading size="md" color="white" fontWeight="500" fontFamily="monospace">{hostedEventsCount}</Heading>
                      </HStack>
                    </Flex>
                    <Flex flex={1} p={5} direction="column" gap={1} borderRight="1px solid" borderColor="whiteAlpha.100">
                      <Text fontSize="10px" color="whiteAlpha.500" fontWeight="600" textTransform="uppercase" letterSpacing="0.05em">Foi</Text>
                      <HStack align="baseline" spacing={1}>
                        <Heading size="md" color="white" fontWeight="500" fontFamily="monospace">{simulatedAttended}</Heading>
                      </HStack>
                    </Flex>
                    <Flex flex={1} p={5} direction="column" gap={1}>
                      <Text fontSize="10px" color="whiteAlpha.500" fontWeight="600" textTransform="uppercase" letterSpacing="0.05em">Network</Text>
                      <HStack align="baseline" spacing={1}>
                        <Heading size="md" color="white" fontWeight="500" fontFamily="monospace">+{computedConnections}</Heading>
                      </HStack>
                    </Flex>
                  </Flex>
                </Stack>
              </Box>
            )}

            {/* 4. Minimalist Vibes & Badges */}
            {profile && (
              <Stack spacing={8}>
                <Box>
                  <Text fontSize="11px" color="whiteAlpha.500" fontWeight="600" textTransform="uppercase" letterSpacing="0.08em" mb={4}>
                    Assinatura
                  </Text>
                  {profile.vibes.length > 0 ? (
                    <Flex gap={2} flexWrap="wrap">
                      {profile.vibes.map((v) => {
                        const details = getVibeDetails(v);
                        const Icon = details.icon;
                        return (
                          <Flex
                            key={v}
                            align="center"
                            gap={2}
                            px={4}
                            py={2}
                            borderRadius="full"
                            border="1px solid"
                            borderColor="whiteAlpha.200"
                            bg="transparent"
                            color="whiteAlpha.800"
                            transition="all 0.2s"
                          >
                            {Icon && <Icon size={14} />}
                            <Text fontSize="12px" fontWeight="500" letterSpacing="-0.01em">{details.label}</Text>
                          </Flex>
                        );
                      })}
                    </Flex>
                  ) : (
                    <Text fontSize="13px" color="whiteAlpha.400">Nenhuma assinatura definida.</Text>
                  )}
                </Box>

                <Box>
                  <Text fontSize="11px" color="whiteAlpha.500" fontWeight="600" textTransform="uppercase" letterSpacing="0.08em" mb={4}>
                    Conquistas
                  </Text>
                  <HStack spacing={4} overflowX="auto" pb={2} className="no-scrollbar">
                    
                    <Flex direction="column" align="center" gap={2} minW="64px" opacity={1}>
                      <Flex w="48px" h="48px" borderRadius="full" border="1px solid" borderColor="whiteAlpha.200" align="center" justify="center" color="white">
                        <StarFilledIcon size={16} />
                      </Flex>
                      <Text fontSize="10px" color="whiteAlpha.700" fontWeight="500">Pioneiro</Text>
                    </Flex>

                    <Flex direction="column" align="center" gap={2} minW="64px" opacity={profile.biometriaValidada ? 1 : 0.2}>
                      <Flex w="48px" h="48px" borderRadius="full" border="1px solid" borderColor={profile.biometriaValidada ? "green.500" : "whiteAlpha.200"} align="center" justify="center" color={profile.biometriaValidada ? "green.500" : "white"}>
                        <ShieldIcon size={16} validated={profile.biometriaValidada} />
                      </Flex>
                      <Text fontSize="10px" color={profile.biometriaValidada ? "white" : "whiteAlpha.500"} fontWeight="500">Verificado</Text>
                    </Flex>

                    <Flex direction="column" align="center" gap={2} minW="64px" opacity={hostedEventsCount >= 3 ? 1 : 0.2}>
                      <Flex w="48px" h="48px" borderRadius="full" border="1px solid" borderColor={hostedEventsCount >= 3 ? "brand.500" : "whiteAlpha.200"} align="center" justify="center" color={hostedEventsCount >= 3 ? "brand.500" : "white"}>
                        <CalendarIcon size={16} />
                      </Flex>
                      <Text fontSize="10px" color={hostedEventsCount >= 3 ? "white" : "whiteAlpha.500"} fontWeight="500">Super Host</Text>
                    </Flex>

                  </HStack>
                </Box>
              </Stack>
            )}
          </Stack>
        </Container>

        <BottomNav />

        {/* 5. Minimal Bottom Sheet Editor */}
        <Modal isOpen={isEditOpen} onClose={closeEdit} isCentered size="sm">
          <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.700" />
          <ModalContent
            bg="#0a0a0d"
            border="1px solid"
            borderColor="whiteAlpha.100"
            borderTopRadius="3xl"
            borderBottomRadius={{ base: "0", md: "3xl" }}
            mt="auto"
            mb={{ base: "0", md: "auto" }}
            maxW="390px"
            p={6}
            mx="auto"
          >
            <Flex justify="space-between" align="center" mb={8}>
              <Heading size="md" color="white" fontWeight="600" fontFamily="var(--font-outfit), sans-serif">Editar Perfil</Heading>
              <IconButton aria-label="Fechar" icon={<ModalCloseButton position="static" />} variant="unstyled" size="sm" color="whiteAlpha.500" onClick={closeEdit} display="flex" alignItems="center" justifyContent="center" />
            </Flex>

            <Stack spacing={6}>
              <Box>
                <Text fontSize="11px" color="whiteAlpha.500" fontWeight="600" textTransform="uppercase" letterSpacing="0.08em" mb={2}>Nome</Text>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  variant="unstyled"
                  borderBottom="1px solid"
                  borderColor="whiteAlpha.200"
                  borderRadius={0}
                  color="white"
                  fontSize="16px"
                  py={2}
                  px={0}
                  _focus={{ borderColor: "white" }}
                  _placeholder={{ color: "whiteAlpha.300" }}
                  placeholder="Seu nome"
                />
              </Box>

              <Box>
                <Text fontSize="11px" color="whiteAlpha.500" fontWeight="600" textTransform="uppercase" letterSpacing="0.08em" mb={3}>Assinatura (Vibes)</Text>
                <Flex gap={2} flexWrap="wrap">
                  {PROFILE_VIBES.map(({ value, label }) => {
                    const active = editVibes.includes(value);
                    return (
                      <Flex
                        key={value}
                        as="button"
                        align="center"
                        justify="center"
                        px={4}
                        py={2}
                        borderRadius="full"
                        border="1px solid"
                        borderColor={active ? "white" : "whiteAlpha.200"}
                        bg={active ? "white" : "transparent"}
                        color={active ? "black" : "whiteAlpha.600"}
                        fontSize="12px"
                        fontWeight="500"
                        transition="all 0.2s"
                        onClick={() =>
                          setEditVibes((prev) =>
                            prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
                          )
                        }
                      >
                        {label}
                      </Flex>
                    );
                  })}
                </Flex>
              </Box>

              {editError && <Text color="red.400" fontSize="12px">{editError}</Text>}

              <Button
                w="full"
                h="52px"
                bg="white"
                color="black"
                borderRadius="full"
                fontWeight="600"
                fontSize="14px"
                mt={4}
                _hover={{ bg: "whiteAlpha.800" }}
                _active={{ transform: "scale(0.98)" }}
                isLoading={editLoading}
                onClick={handleSaveProfile}
              >
                Salvar Alterações
              </Button>
            </Stack>
          </ModalContent>
        </Modal>

        {/* 6. Biometric Scanner Simulation (Minimalist) */}
        <Modal isOpen={isScanning} onClose={() => {}} size="full" closeOnOverlayClick={false}>
          <ModalOverlay bg="#0a0a0d" />
          <ModalContent bg="transparent" border="none" boxShadow="none" my={0} h="100dvh" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
            <Stack spacing={8} align="center">
              <Box position="relative" w="160px" h="160px" borderRadius="full" border="1px dashed" borderColor="whiteAlpha.200" display="flex" alignItems="center" justifyContent="center" overflow="hidden">
                <Box position="absolute" w="100%" h="2px" bg="green.500" style={{ animation: "scanline 2s infinite ease-in-out" }} zIndex={3} />
                {profile && <Avatar size="xl" name={profile.nome} filter="grayscale(100%)" opacity={0.5} />}
              </Box>
              <Text fontSize="12px" color="whiteAlpha.600" fontWeight="500" fontFamily="monospace" letterSpacing="0.05em" textTransform="uppercase">
                {scanStep === 0 && "Iniciando hardware..."}
                {scanStep === 1 && "Mapeando face..."}
                {scanStep === 2 && "Criptografando chave..."}
              </Text>
            </Stack>
          </ModalContent>
        </Modal>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes scanline { 0% { top: 0%; opacity: 0; } 50% { top: 50%; opacity: 1; } 100% { top: 100%; opacity: 0; } }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}} />
      </Box>
    </AuthGuard>
  );
}

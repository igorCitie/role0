"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Skeleton,
  Stack,
  Tag,
  Text,
  Textarea,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import {
  cancelEvent,
  checkInEvent,
  editEvent,
  getEventDetail,
  joinEvent,
  judgeRequest,
  listParticipants,
  listRequests,
  triggerPanic,
  type EventDetail,
  type EditEventRequest,
  type Participant,
} from "@/lib/api/events";
import type { GeoPosition } from "@/hooks/useGeolocation";
import { getPublicProfile } from "@/lib/api/users";

type JoinRequestWithName = {
  solicitacaoId: string;
  usuarioId: string;
  trustScore: number;
  nomeDisplay?: string;
};

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

interface EventBottomSheetProps {
  eventId: string | null;
  userId?: string | null;
  userPosition?: GeoPosition | null;
  onClose: () => void;
  onEventMutated?: () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function EventBottomSheet({
  eventId,
  userId,
  userPosition,
  onClose,
  onEventMutated,
}: EventBottomSheetProps) {
  const router = useRouter();
  const toast = useToast();
  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // which action is pending

  // Edit modal state
  const { isOpen: isEditOpen, onOpen: openEdit, onClose: closeEdit } = useDisclosure();
  const [editTitulo, setEditTitulo] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [editCapacity, setEditCapacity] = useState(10);
  const editRef = useRef<HTMLInputElement>(null);

  // Requests & participants modals
  const { isOpen: isReqOpen, onOpen: openReq, onClose: closeReq } = useDisclosure();
  const { isOpen: isPaxOpen, onOpen: openPax, onClose: closePax } = useDisclosure();
  // Persists join requests across close/reopen by storing event IDs
  const joinedIdsRef = useRef<Set<string>>(new Set());
  const [joinRequested, setJoinRequested] = useState(false);
  const [requestsWithNames, setRequestsWithNames] = useState<JoinRequestWithName[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [judgingId, setJudgingId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [paxLoading, setPaxLoading] = useState(false);
  const [panicLoading, setPanicLoading] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setDetail(null); setJoinRequested(false);
      setPendingCount(0); setRequestsWithNames([]);
      return;
    }
    setJoinRequested(joinedIdsRef.current.has(eventId));
    setLoading(true);
    const token = localStorage.getItem("token") ?? "";
    getEventDetail(eventId, token)
      .then(async (d) => {
        setDetail(d);
        setEditTitulo(d.titulo);
        setEditDescricao(d.descricao ?? "");
        setEditCapacity(d.capacidadeMaxima);
        // Pre-load pending request count for host
        if (userId && d.host.id === userId) {
          try {
            const reqs = await listRequests(eventId, token);
            setPendingCount(reqs.length);
          } catch { /* non-critical */ }
        }
      })
      .finally(() => setLoading(false));
  }, [eventId, userId]);

  const visible = !!eventId;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : "";
  const isHost = !!detail && !!userId && detail.host.id === userId;
  const isParticipant = !!detail?.isParticipant;



  const vacancyPct = detail
    ? Math.round((detail.totalAprovados / detail.capacidadeMaxima) * 100)
    : 0;
  const vacancyColor = vacancyPct < 60 ? "green.400" : vacancyPct < 90 ? "brand.400" : "red.400";

  async function handleCheckIn() {
    if (!eventId || !userPosition) return;
    setActionLoading("checkin");
    try {
      await checkInEvent(eventId, userPosition.lat, userPosition.lng, token);
      toast({ title: "Check-in realizado! ✅", status: "success", duration: 2500, isClosable: true });
      onEventMutated?.();
      onClose();
    } catch (err) {
      toast({ title: "Erro no check-in", description: err instanceof Error ? err.message : "Tente novamente.", status: "error", duration: 3500, isClosable: true });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel() {
    if (!eventId) return;
    setActionLoading("cancel");
    try {
      await cancelEvent(eventId, token);
      toast({ title: "Rolê cancelado.", status: "info", duration: 2500, isClosable: true });
      onEventMutated?.();
      onClose();
    } catch (err) {
      toast({ title: "Erro ao cancelar", description: err instanceof Error ? err.message : "Tente novamente.", status: "error", duration: 3500, isClosable: true });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleEdit() {
    if (!eventId) return;
    setActionLoading("edit");
    const payload: EditEventRequest = {};
    if (editTitulo !== detail?.titulo) payload.titulo = editTitulo;
    if (editDescricao !== detail?.descricao) payload.descricao = editDescricao;
    if (editCapacity !== detail?.capacidadeMaxima) payload.maxCapacity = editCapacity;
    try {
      await editEvent(eventId, payload, token);
      toast({ title: "Rolê atualizado! ✅", status: "success", duration: 2500, isClosable: true });
      closeEdit();
      // refresh detail
      const updated = await getEventDetail(eventId, token);
      setDetail(updated);
      onEventMutated?.();
    } catch (err) {
      toast({ title: "Erro ao editar", description: err instanceof Error ? err.message : "Tente novamente.", status: "error", duration: 3500, isClosable: true });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleJoin() {
    if (!eventId) return;
    setActionLoading("join");
    try {
      await joinEvent(eventId, token);
      joinedIdsRef.current.add(eventId);
      setJoinRequested(true);
      toast({ title: "Solicitação enviada! ⏳", description: "Aguarde a aprovação do anfitrião.", status: "success", duration: 3000, isClosable: true });
    } catch (err) {
      toast({ title: "Erro ao solicitar", description: err instanceof Error ? err.message : "Tente novamente.", status: "error", duration: 3500, isClosable: true });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleJudge(reqId: string, aprovada: boolean) {
    if (!eventId) return;
    setJudgingId(reqId);
    try {
      await judgeRequest(eventId, reqId, aprovada, token);
      setRequestsWithNames((prev) => prev.filter((r) => r.solicitacaoId !== reqId));
      setPendingCount((c) => Math.max(0, c - 1));
      if (aprovada) {
        setDetail((d) => d ? { ...d, totalAprovados: d.totalAprovados + 1 } : d);
      }
      onEventMutated?.();
    } catch {
      // leave item in list so user can retry
    } finally {
      setJudgingId(null);
    }
  }

  async function handleLoadRequests() {
    if (!eventId) return;
    setRequestsLoading(true);
    try {
      const reqs = await listRequests(eventId, token);
      // Resolve display names in parallel
      const withNames = await Promise.all(
        reqs.map(async (req) => {
          try {
            const profile = await getPublicProfile(req.usuarioId, token);
            return { ...req, nomeDisplay: profile.nomeDisplay };
          } catch {
            return { ...req, nomeDisplay: undefined };
          }
        }),
      );
      setRequestsWithNames(withNames);
      setPendingCount(withNames.length);
    } finally {
      setRequestsLoading(false);
    }
  }

  async function handlePanic() {
    if (!eventId) return;
    setPanicLoading(true);
    try {
      await triggerPanic(eventId, token);
    } catch {
      // server always returns 202 — only swallow network errors
    } finally {
      setPanicLoading(false);
    }
  }

  async function handleLoadParticipants() {
    if (!eventId) return;
    setPaxLoading(true);
    try {
      setParticipants(await listParticipants(eventId, token));
    } finally {
      setPaxLoading(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <Box
        position="absolute"
        inset={0}
        zIndex={50}
        pointerEvents={visible ? "auto" : "none"}
        onClick={onClose}
      >
        {/* Sheet — sits above the BottomNav (73px) */}
        <Box
          position="absolute"
          bottom="73px"
          left={0}
          right={0}
          bg="surface.card"
          borderTopRadius="2xl"
          border="1px solid"
          borderColor="whiteAlpha.100"
          p={5}
          pb={8}
          transform={visible ? "translateY(0)" : "translateY(110%)"}
          transition="transform 0.28s cubic-bezier(0.32,0.72,0,1)"
          onClick={(e) => e.stopPropagation()}
          maxH="75%"
          overflowY="auto"
        >
          {/* Handle + close */}
          <Flex justify="space-between" align="center" mb={4}>
            <Box w="36px" h="4px" bg="whiteAlpha.200" borderRadius="full" mx="auto" />
            <Box as="button" color="gray.500" _hover={{ color: "white" }} onClick={onClose} ml={2}>
              <XIcon />
            </Box>
          </Flex>

          {loading || !detail ? (
            <Stack spacing={3}>
              <Skeleton h="22px" w="70%" borderRadius="md" />
              <Skeleton h="14px" w="50%" borderRadius="md" />
              <Skeleton h="14px" w="90%" borderRadius="md" />
              <Skeleton h="8px" borderRadius="full" />
              <Skeleton h="44px" borderRadius="xl" />
            </Stack>
          ) : (
            <Stack spacing={4}>
              {/* Title + status */}
              <Flex justify="space-between" align="flex-start" gap={2}>
                <Text fontWeight="bold" fontSize="lg" color="white" lineHeight="short">
                  {detail.titulo}
                </Text>
                <Tag
                  borderRadius="full"
                  fontSize="xs"
                  colorScheme={detail.status === "CRIADO" ? "green" : "gray"}
                  flexShrink={0}
                >
                  {detail.status}
                </Tag>
              </Flex>

              {/* Meta */}
              <Stack spacing={2}>
                <HStack color="gray.400" fontSize="xs" gap={1}>
                  <ClockIcon /><Text>{formatDate(detail.inicioEm)}</Text>
                </HStack>
                <HStack color="gray.400" fontSize="xs" gap={1}>
                  <PinIcon /><Text noOfLines={1}>{detail.enderecoLegivel}</Text>
                </HStack>
                <HStack color="gray.400" fontSize="xs" gap={1}>
                  <UserIcon />
                  <Text
                    as="button"
                    color="gray.400"
                    _hover={{ color: "brand.400", textDecoration: "underline" }}
                    transition="color 0.15s"
                    cursor="pointer"
                    onClick={() => router.push(`/profile/${detail.host.id}?eventId=${detail.id}`)}
                  >
                    {detail.host.nomeDisplay}
                  </Text>
                  <Text color="brand.400" fontWeight="bold">★ {detail.host.trustScore.toFixed(1)}</Text>
                </HStack>
              </Stack>

              <Divider borderColor="whiteAlpha.100" />

              {/* Occupancy bar */}
              <Box>
                <Flex justify="space-between" mb={1}>
                  <Text fontSize="xs" color="gray.500">Vagas</Text>
                  <Text fontSize="xs" color={vacancyColor} fontWeight="bold">
                    {detail.totalAprovados}/{detail.capacidadeMaxima}
                  </Text>
                </Flex>
                <Box bg="surface.input" borderRadius="full" h="6px" overflow="hidden">
                  <Box bg={vacancyColor} h="full" w={`${vacancyPct}%`} borderRadius="full" transition="width 0.4s ease" />
                </Box>
              </Box>

              {/* Weather */}
              {detail.clima && (
                <HStack bg="surface.bg" borderRadius="xl" px={3} py={2} gap={2} border="1px solid" borderColor="whiteAlpha.100">
                  <Text fontSize="xl" lineHeight="1">
                    {/rain|chuva/i.test(detail.clima.condition) ? "🌧️"
                      : /thunder|trovoada|storm/i.test(detail.clima.condition) ? "⛈️"
                      : /snow|neve/i.test(detail.clima.condition) ? "❄️"
                      : /cloud|nublado|overcast/i.test(detail.clima.condition) ? "☁️"
                      : /mist|fog|neblina/i.test(detail.clima.condition) ? "🌫️"
                      : "☀️"}
                  </Text>
                  <Text fontSize="sm" color="gray.300">
                    {detail.clima.temp.toFixed(0)}°C · {detail.clima.condition}
                  </Text>
                </HStack>
              )}

              {/* Description */}
              {detail.descricao && (
                <Text fontSize="sm" color="gray.400" lineHeight="tall">{detail.descricao}</Text>
              )}

              <Divider borderColor="whiteAlpha.100" />

              {/* ── Action bar ── */}
              <Stack spacing={2}>
                {/* Participant: check-in (available for all active statuses) */}
                {isParticipant && detail.status !== "EXPIRADO" && (
                  <Button
                    size="md"
                    borderRadius="xl"
                    fontWeight="bold"
                    isLoading={actionLoading === "checkin"}
                    isDisabled={!userPosition}
                    onClick={handleCheckIn}
                    title={!userPosition ? "Aguardando localização..." : undefined}
                  >
                    Check-in →
                  </Button>
                )}

                {/* Host actions */}
                {isHost && (
                  <Stack spacing={2}>
                    <HStack spacing={2}>
                      <Button
                        flex={1}
                        size="md"
                        borderRadius="xl"
                        variant="outline"
                        colorScheme="brand"
                        fontWeight="semibold"
                        isLoading={actionLoading === "edit"}
                        onClick={openEdit}
                      >
                        Editar
                      </Button>
                      <Button
                        flex={1}
                        size="md"
                        borderRadius="xl"
                        colorScheme="red"
                        variant="outline"
                        fontWeight="semibold"
                        isLoading={actionLoading === "cancel"}
                        onClick={handleCancel}
                      >
                        Cancelar rolê
                      </Button>
                    </HStack>
                    {/* Pending requests button with live count badge */}
                    <Button
                      size="sm"
                      variant={pendingCount > 0 ? "solid" : "ghost"}
                      colorScheme={pendingCount > 0 ? "orange" : undefined}
                      color={pendingCount > 0 ? undefined : "gray.400"}
                      _hover={pendingCount > 0 ? undefined : { color: "white" }}
                      fontWeight="medium"
                      borderRadius="xl"
                      onClick={() => { handleLoadRequests(); openReq(); }}
                    >
                      {pendingCount > 0
                        ? `🔔 ${pendingCount} solicitaç${pendingCount === 1 ? "ão" : "ões"} pendente${pendingCount === 1 ? "" : "s"}`
                        : "Ver Solicitações"}
                    </Button>
                  </Stack>
                )}

                {/* Guest: request to join — only when event is open and has spots */}
                {!isHost && !isParticipant && (detail.status === "ABERTO_PARA_VAGAS" || detail.status === "CRIADO") && (
                  <>
                    {detail.totalAprovados >= detail.capacidadeMaxima ? (
                      <Button
                        size="md"
                        borderRadius="xl"
                        variant="outline"
                        fontWeight="bold"
                        isDisabled
                        colorScheme="gray"
                      >
                        Rolê lotado 😔
                      </Button>
                    ) : joinRequested ? (
                      <Button
                        size="md"
                        borderRadius="xl"
                        variant="outline"
                        fontWeight="bold"
                        isDisabled
                        colorScheme="green"
                      >
                        Solicitação enviada ✓
                      </Button>
                    ) : (
                      <Button
                        size="md"
                        borderRadius="xl"
                        fontWeight="bold"
                        isLoading={actionLoading === "join"}
                        onClick={handleJoin}
                      >
                        Pedir para Participar · {detail.capacidadeMaxima - detail.totalAprovados} vaga{detail.capacidadeMaxima - detail.totalAprovados !== 1 ? "s" : ""}
                      </Button>
                    )}
                  </>
                )}

                {/* Shared: participants list (host + approved) */}
                {(isHost || isParticipant) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    color="gray.500"
                    _hover={{ color: "gray.200" }}
                    fontWeight="normal"
                    onClick={() => { handleLoadParticipants(); openPax(); }}
                  >
                    Ver Participantes ({detail.totalAprovados})
                  </Button>
                )}

                {/* SOS — available to host and approved participants on active events */}
                {(isHost || isParticipant) && detail.status !== "EXPIRADO" && (
                  <Button
                    size="xs"
                    variant="ghost"
                    color="red.600"
                    _hover={{ color: "red.400" }}
                    fontWeight="normal"
                    isLoading={panicLoading}
                    onClick={handlePanic}
                  >
                    🚨 SOS — Emergência
                  </Button>
                )}
              </Stack>
            </Stack>
          )}
        </Box>
      </Box>

      {/* Edit modal */}
      <Modal isOpen={isEditOpen} onClose={closeEdit} initialFocusRef={editRef} isCentered size="sm">
        <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.700" />
        <ModalContent bg="surface.card" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" mx={4}>
          <ModalHeader color="white" fontSize="md">Editar Rolê</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            <Stack spacing={4}>
              <Box>
                <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={1}>Título</Text>
                <Input
                  ref={editRef}
                  value={editTitulo}
                  onChange={(e) => setEditTitulo(e.target.value)}
                  borderRadius="xl"
                  size="md"
                />
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={1}>Descrição</Text>
                <Textarea
                  value={editDescricao}
                  onChange={(e) => setEditDescricao(e.target.value)}
                  bg="surface.input"
                  border="1px solid"
                  borderColor="whiteAlpha.100"
                  borderRadius="xl"
                  fontSize="sm"
                  color="gray.100"
                  _focus={{ borderColor: "brand.500", boxShadow: "none" }}
                  resize="none"
                  rows={3}
                />
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={1}>Capacidade máxima</Text>
                <NumberInput min={2} max={500} value={editCapacity} onChange={(_, v) => setEditCapacity(v)}>
                  <NumberInputField
                    bg="surface.input"
                    border="1px solid"
                    borderColor="whiteAlpha.100"
                    borderRadius="xl"
                    _focus={{ borderColor: "brand.500", boxShadow: "none" }}
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper borderColor="whiteAlpha.100" color="gray.400" />
                    <NumberDecrementStepper borderColor="whiteAlpha.100" color="gray.400" />
                  </NumberInputStepper>
                </NumberInput>
              </Box>
            </Stack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" color="gray.400" onClick={closeEdit} size="sm">Cancelar</Button>
            <Button
              size="sm"
              borderRadius="lg"
              isLoading={actionLoading === "edit"}
              onClick={handleEdit}
            >
              Salvar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Requests modal — host only */}
      <Modal isOpen={isReqOpen} onClose={closeReq} isCentered size="sm">
        <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.700" />
        <ModalContent bg="surface.card" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" mx={4}>
          <ModalHeader color="white" fontSize="md">
            <Flex justify="space-between" align="center">
              <Text>Fila de Entrada{requestsWithNames.length > 0 ? ` (${requestsWithNames.length})` : ""}</Text>
              <Button
                size="xs"
                variant="ghost"
                color="gray.500"
                _hover={{ color: "white" }}
                isLoading={requestsLoading}
                onClick={handleLoadRequests}
                mr={8}
              >
                ↻ Atualizar
              </Button>
            </Flex>
          </ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody pb={6}>
            {requestsLoading ? (
              <Stack spacing={3}>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} h="60px" borderRadius="xl" startColor="surface.bg" endColor="surface.input" />
                ))}
              </Stack>
            ) : requestsWithNames.length === 0 ? (
              <Flex direction="column" align="center" py={6} gap={2}>
                <Text fontSize="2xl">✅</Text>
                <Text color="gray.500" fontSize="sm">Nenhuma solicitação pendente.</Text>
              </Flex>
            ) : (
              <Stack spacing={3}>
                {requestsWithNames.map((req) => (
                  <Flex
                    key={req.solicitacaoId}
                    align="center"
                    justify="space-between"
                    bg="surface.bg"
                    borderRadius="xl"
                    px={3}
                    py={3}
                    border="1px solid"
                    borderColor="whiteAlpha.100"
                    gap={3}
                  >
                    <HStack spacing={3} flex={1} minW={0}>
                      <Avatar
                        size="sm"
                        name={req.nomeDisplay ?? req.usuarioId}
                        bg="brand.900"
                        color="brand.200"
                        flexShrink={0}
                      />
                      <Box minW={0}>
                        <Text fontSize="sm" color="gray.100" fontWeight="semibold" noOfLines={1}>
                          {req.nomeDisplay ?? `Usuário ${req.usuarioId.slice(0, 8)}…`}
                        </Text>
                        <Text fontSize="xs" color="brand.400">★ {req.trustScore.toFixed(1)} trust score</Text>
                      </Box>
                    </HStack>
                    <HStack spacing={2} flexShrink={0}>
                      <Button
                        size="sm"
                        colorScheme="green"
                        borderRadius="lg"
                        isLoading={judgingId === req.solicitacaoId}
                        onClick={() => handleJudge(req.solicitacaoId, true)}
                      >
                        Aceitar
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        borderRadius="lg"
                        isLoading={judgingId === req.solicitacaoId}
                        onClick={() => handleJudge(req.solicitacaoId, false)}
                      >
                        Recusar
                      </Button>
                    </HStack>
                  </Flex>
                ))}
              </Stack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Participants modal — host + approved participants */}
      <Modal isOpen={isPaxOpen} onClose={closePax} isCentered size="sm">
        <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.700" />
        <ModalContent bg="surface.card" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" mx={4}>
          <ModalHeader color="white" fontSize="md">
            Participantes{participants.length > 0 ? ` (${participants.length})` : ""}
          </ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody pb={6}>
            {paxLoading ? (
              <Stack spacing={3}>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} h="60px" borderRadius="xl" startColor="surface.bg" endColor="surface.input" />
                ))}
              </Stack>
            ) : participants.length === 0 ? (
              <Flex direction="column" align="center" py={6} gap={2}>
                <Text fontSize="2xl">👥</Text>
                <Text color="gray.500" fontSize="sm">Nenhum participante ainda.</Text>
              </Flex>
            ) : (
              <Stack spacing={2}>
                {participants.map((p) => (
                  <Flex
                    key={p.usuarioId}
                    align="center"
                    bg="surface.bg"
                    borderRadius="xl"
                    px={3}
                    py={3}
                    border="1px solid"
                    borderColor="whiteAlpha.100"
                    gap={3}
                  >
                    <Avatar
                      size="sm"
                      name={p.nomeDisplay}
                      bg="purple.900"
                      color="purple.200"
                      flexShrink={0}
                    />
                    <Box flex={1} minW={0}>
                      <Flex justify="space-between" align="center">
                        <Text fontSize="sm" color="gray.100" fontWeight="semibold" noOfLines={1}>
                          {p.nomeDisplay}
                        </Text>
                        <Text fontSize="xs" color="brand.400" flexShrink={0} ml={2}>
                          ★ {p.trustScore.toFixed(1)}
                        </Text>
                      </Flex>
                      {p.vibes.length > 0 && (
                        <HStack spacing={1} mt={1} flexWrap="wrap">
                          {p.vibes.slice(0, 3).map((v) => (
                            <Badge key={v} colorScheme="orange" fontSize="2xs" borderRadius="full" variant="subtle">
                              {v.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </HStack>
                      )}
                    </Box>
                  </Flex>
                ))}
              </Stack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

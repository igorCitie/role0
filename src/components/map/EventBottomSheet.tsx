"use client";

import { useEffect, useRef, useState } from "react";
import {
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
  type EventDetail,
  type EditEventRequest,
  type JoinRequest,
  type Participant,
} from "@/lib/api/events";
import type { GeoPosition } from "@/hooks/useGeolocation";

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
  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
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
  const [joinRequested, setJoinRequested] = useState(false);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [judgingId, setJudgingId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [paxLoading, setPaxLoading] = useState(false);

  useEffect(() => {
    if (!eventId) { setDetail(null); setActionError(null); setJoinRequested(false); return; }
    setLoading(true);
    const token = localStorage.getItem("token") ?? "";
    getEventDetail(eventId, token)
      .then((d) => {
        setDetail(d);
        setEditTitulo(d.titulo);
        setEditDescricao(d.descricao ?? "");
        setEditCapacity(d.capacidadeMaxima);
      })
      .finally(() => setLoading(false));
  }, [eventId]);

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
    setActionError(null);
    setActionLoading("checkin");
    try {
      await checkInEvent(eventId, userPosition.lat, userPosition.lng, token);
      onEventMutated?.();
      onClose();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erro no check-in.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel() {
    if (!eventId) return;
    setActionError(null);
    setActionLoading("cancel");
    try {
      await cancelEvent(eventId, token);
      onEventMutated?.();
      onClose();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erro ao cancelar.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleEdit() {
    if (!eventId) return;
    setActionError(null);
    setActionLoading("edit");
    const payload: EditEventRequest = {};
    if (editTitulo !== detail?.titulo) payload.titulo = editTitulo;
    if (editDescricao !== detail?.descricao) payload.descricao = editDescricao;
    if (editCapacity !== detail?.capacidadeMaxima) payload.maxCapacity = editCapacity;
    try {
      await editEvent(eventId, payload, token);
      closeEdit();
      // refresh detail
      const updated = await getEventDetail(eventId, token);
      setDetail(updated);
      onEventMutated?.();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erro ao editar.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleJoin() {
    if (!eventId) return;
    setActionError(null);
    setActionLoading("join");
    try {
      await joinEvent(eventId, token);
      setJoinRequested(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erro ao solicitar participação.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleJudge(reqId: string, aprovada: boolean) {
    if (!eventId) return;
    setJudgingId(reqId);
    try {
      await judgeRequest(eventId, reqId, aprovada, token);
      setRequests((prev) => prev.filter((r) => r.solicitacaoId !== reqId));
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
      setRequests(await listRequests(eventId, token));
    } finally {
      setRequestsLoading(false);
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
        {/* Sheet */}
        <Box
          position="absolute"
          bottom={0}
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
                  <Text>{detail.host.nomeDisplay}</Text>
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={detail.clima.icon} alt={detail.clima.condition} width={28} height={28} />
                  <Text fontSize="sm" color="gray.300">
                    {detail.clima.temp.toFixed(0)}°C · {detail.clima.condition}
                  </Text>
                </HStack>
              )}

              {/* Description */}
              {detail.descricao && (
                <Text fontSize="sm" color="gray.400" lineHeight="tall">{detail.descricao}</Text>
              )}

              {actionError && (
                <Text color="red.400" fontSize="xs">{actionError}</Text>
              )}

              <Divider borderColor="whiteAlpha.100" />

              {/* ── Action bar ── */}
              <Stack spacing={2}>
                {/* Participant: check-in */}
                {isParticipant && detail.status === "CRIADO" && (
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
                    <Button
                      size="sm"
                      variant="ghost"
                      color="gray.400"
                      _hover={{ color: "white" }}
                      fontWeight="medium"
                      onClick={() => { handleLoadRequests(); openReq(); }}
                    >
                      Ver Solicitações Pendentes
                    </Button>
                  </Stack>
                )}

                {/* Guest: request to join */}
                {!isHost && !isParticipant && (
                  <Button
                    size="md"
                    borderRadius="xl"
                    variant="outline"
                    colorScheme="brand"
                    fontWeight="bold"
                    isLoading={actionLoading === "join"}
                    isDisabled={joinRequested}
                    onClick={handleJoin}
                  >
                    {joinRequested ? "Solicitação enviada ✓" : "Pedir para Participar"}
                  </Button>
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
          <ModalHeader color="white" fontSize="md">Solicitações Pendentes</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody pb={6}>
            {requestsLoading ? (
              <Stack spacing={3}>
                <Skeleton h="48px" borderRadius="xl" />
                <Skeleton h="48px" borderRadius="xl" />
              </Stack>
            ) : requests.length === 0 ? (
              <Text color="gray.500" textAlign="center" fontSize="sm" py={4}>
                Nenhuma solicitação pendente.
              </Text>
            ) : (
              <Stack spacing={3}>
                {requests.map((req) => (
                  <Flex
                    key={req.solicitacaoId}
                    align="center"
                    justify="space-between"
                    bg="surface.bg"
                    borderRadius="xl"
                    px={3}
                    py={2}
                    border="1px solid"
                    borderColor="whiteAlpha.100"
                  >
                    <Box>
                      <Text fontSize="sm" color="gray.200" fontWeight="medium">
                        {req.solicitacaoId.slice(0, 8)}…
                      </Text>
                      <Text fontSize="xs" color="brand.400">★ {req.trustScore.toFixed(1)}</Text>
                    </Box>
                    <HStack spacing={2}>
                      <Button
                        size="xs"
                        colorScheme="green"
                        borderRadius="lg"
                        isLoading={judgingId === req.solicitacaoId}
                        onClick={() => handleJudge(req.solicitacaoId, true)}
                      >
                        Aceitar
                      </Button>
                      <Button
                        size="xs"
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
          <ModalHeader color="white" fontSize="md">Participantes</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody pb={6}>
            {paxLoading ? (
              <Stack spacing={3}>
                <Skeleton h="48px" borderRadius="xl" />
                <Skeleton h="48px" borderRadius="xl" />
              </Stack>
            ) : participants.length === 0 ? (
              <Text color="gray.500" textAlign="center" fontSize="sm" py={4}>
                Nenhum participante ainda.
              </Text>
            ) : (
              <Stack spacing={2}>
                {participants.map((p) => (
                  <Flex
                    key={p.usuarioId}
                    align="center"
                    justify="space-between"
                    bg="surface.bg"
                    borderRadius="xl"
                    px={3}
                    py={2}
                    border="1px solid"
                    borderColor="whiteAlpha.100"
                  >
                    <Box>
                      <Text fontSize="sm" color="gray.200" fontWeight="medium">{p.nomeDisplay}</Text>
                      <Text fontSize="xs" color="brand.400">★ {p.trustScore.toFixed(1)}</Text>
                    </Box>
                    {p.vibes.length > 0 && (
                      <HStack spacing={1} flexWrap="wrap" maxW="50%" justify="flex-end">
                        {p.vibes.slice(0, 2).map((v) => (
                          <Badge key={v} colorScheme="orange" fontSize="2xs" borderRadius="full" variant="subtle">
                            {v.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </HStack>
                    )}
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

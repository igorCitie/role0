"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Badge,
  Box,
  Button,
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
  Text,
  Textarea,
  useDisclosure,
  useToast,
  IconButton,
  Grid,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
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
import {
  CloseIcon,
  ClockIcon,
  PinIcon,
  UserIcon,
  AlertIcon,
  CheckCircleIcon,
  UsersIcon,
  RainIcon,
  StormIcon,
  SnowIcon,
  CloudIcon,
  FogIcon,
  SunIcon,
  ShareIcon,
  ArrowRightIcon,
  StarFilledIcon,
  MessageIcon,
} from "@/components/icons";
import EventChatModal from "@/components/chat/EventChatModal";

type JoinRequestWithName = {
  solicitacaoId: string;
  usuarioId: string;
  trustScore: number;
  nomeDisplay?: string;
};

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
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { isOpen: isEditOpen, onOpen: openEdit, onClose: closeEdit } = useDisclosure();
  const [editTitulo, setEditTitulo] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [editCapacity, setEditCapacity] = useState(10);
  const editRef = useRef<HTMLInputElement>(null);

  const { isOpen: isReqOpen, onOpen: openReq, onClose: closeReq } = useDisclosure();
  const { isOpen: isPaxOpen, onOpen: openPax, onClose: closePax } = useDisclosure();
  const { isOpen: isChatOpen, onOpen: openChat, onClose: closeChat } = useDisclosure();
  const { isOpen: isSosConfirmOpen, onOpen: openSosConfirm, onClose: closeSosConfirm } = useDisclosure();
  const cancelSosRef = useRef<HTMLButtonElement>(null);
  
  const joinedIdsRef = useRef<Set<string>>(new Set());
  const [joinRequested, setJoinRequested] = useState(false);
  const [requestsWithNames, setRequestsWithNames] = useState<JoinRequestWithName[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [judgingId, setJudgingId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [paxLoading, setPaxLoading] = useState(false);
  const [panicLoading, setPanicLoading] = useState(false);

  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    setTouchStartY(e.targetTouches[0].clientY);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartY === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    if (touchEndY - touchStartY > 60) {
      onClose();
    }
    setTouchStartY(null);
  }

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
        if (userId && d.host.id === userId) {
          try {
            const reqs = await listRequests(eventId, token);
            setPendingCount(reqs.length);
          } catch { /* non-critical */ }
        }
      })
      .finally(() => setLoading(false));
  }, [eventId, userId]);

  useEffect(() => {
    if (eventId) {
      const token = localStorage.getItem("token") ?? "";
      listParticipants(eventId, token).then(setParticipants).catch(() => {});
    }
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
    setActionLoading("checkin");
    try {
      await checkInEvent(eventId, userPosition.lat, userPosition.lng, token);
      toast({ title: "Check-in realizado com sucesso", status: "success", duration: 2500, isClosable: true });
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
      toast({ title: "Rolê atualizado", status: "success", duration: 2500, isClosable: true });
      closeEdit();
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
      toast({ title: "Solicitação enviada", description: "Aguarde a aprovação do anfitrião.", status: "success", duration: 3000, isClosable: true });
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
      toast({ title: "Equipe de segurança acionada.", status: "success", position: "top" });
      closeSosConfirm();
    } catch (error) {
      toast({ title: "Erro ao acionar SOS", status: "error", position: "top" });
      closeSosConfirm();
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

  const tituloParts = detail?.titulo ? detail.titulo.split(" ") : [];
  const mid = Math.ceil(tituloParts.length / 2);
  const titleP1 = tituloParts.slice(0, mid).join(" ");
  const titleP2 = tituloParts.slice(mid).join(" ");

  return (
    <>
      <Box
        position="fixed"
        inset={0}
        zIndex={200}
        pointerEvents={visible ? "auto" : "none"}
        onClick={onClose}
        display={visible ? "block" : "none"}
      >
        <Box 
          position="absolute" inset={0} bg="blackAlpha.600" 
          opacity={visible ? 1 : 0} transition="opacity 0.3s"
        />
        
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          top="auto"
          maxH="96%"
          h="full"
          bg="#0d0d0f"
          borderTopRadius="2xl"
          transform={visible ? "translateY(0)" : "translateY(100%)"}
          transition="transform 0.4s cubic-bezier(0.32,0.72,0,1)"
          _mediaReduceMotion={{ transition: "none" }}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          overflowY="auto"
          boxShadow="0 -10px 40px rgba(0,0,0,0.8)"
          display="flex"
          flexDirection="column"
        >
          <Flex position="absolute" top={4} left={4} right={4} justify="space-between" zIndex={10}>
            <IconButton
              aria-label="Fechar"
              icon={<CloseIcon size={20} />}
              variant="unstyled"
              size="md"
              bg="rgba(0,0,0,0.4)"
              color="white"
              borderRadius="full"
              backdropFilter="blur(12px)"
              onClick={onClose}
              display="flex"
              alignItems="center"
              justifyContent="center"
            />
            {isParticipant && (
              <IconButton
                aria-label="Chat"
                icon={<MessageIcon size={20} />}
                variant="unstyled"
                size="md"
                bg="rgba(0,0,0,0.4)"
                color="white"
                borderRadius="full"
                backdropFilter="blur(12px)"
                onClick={openChat}
                display="flex"
                alignItems="center"
                justifyContent="center"
              />
            )}
            <IconButton
              aria-label="Compartilhar"
              icon={<ShareIcon size={18} />}
              variant="unstyled"
              size="md"
              bg="rgba(0,0,0,0.4)"
              color="white"
              borderRadius="full"
              backdropFilter="blur(12px)"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: detail?.titulo,
                    text: detail?.descricao,
                    url: window.location.href,
                  }).catch(() => {});
                }
              }}
              display="flex"
              alignItems="center"
              justifyContent="center"
            />
          </Flex>

          {loading || !detail ? (
            <Stack spacing={4} p={5} mt={16}>
              <Skeleton h="280px" borderRadius="xl" />
              <Skeleton h="32px" w="70%" borderRadius="md" />
              <Skeleton h="24px" w="50%" borderRadius="md" />
              <Skeleton h="100px" borderRadius="xl" />
            </Stack>
          ) : (
            <Flex direction="column" flex={1}>
              <Box
                position="relative"
                h="280px"
                bg="linear-gradient(to bottom, #2a0e00, #0d0d0f)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="brand.500"
                flexShrink={0}
              >
                <StarFilledIcon size={90} />
                <Box position="absolute" bottom={4} left={5}>
                  <Badge
                    bg="brand.600"
                    color="white"
                    fontSize="10px"
                    fontWeight="800"
                    px={2.5}
                    py={1}
                    borderRadius="sm"
                    letterSpacing="0.1em"
                    textTransform="uppercase"
                  >
                    {detail.status === "CRIADO" ? "NOVO EVENTO" : detail.status.replace(/_/g, " ")}
                  </Badge>
                </Box>
              </Box>

              <Stack spacing={6} p={5} flex={1}>
                <Box>
                  <Text fontSize="26px" fontWeight="700" color="white" lineHeight="1.1">
                    {titleP1}
                  </Text>
                  <Text fontSize="26px" fontWeight="700" fontStyle="italic" color="brand.500" lineHeight="1.1">
                    {titleP2}
                  </Text>
                </Box>

                <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
                  <HStack color="gray.400" fontSize="sm" flex={1} minW="200px">
                    <PinIcon size={16} />
                    <Text noOfLines={2} lineHeight="short">{detail.enderecoLegivel}</Text>
                  </HStack>
                  <HStack spacing={2}>
                    <Badge bg="whiteAlpha.200" color="white" borderRadius="full" px={3} py={1} fontSize="10px" fontWeight="600">
                      #VIP
                    </Badge>
                  </HStack>
                </Flex>

                <Grid templateColumns="1fr 1fr" gap={3}>
                  <Box bg="#181820" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" p={4}>
                    <Text color="brand.400" fontSize="9px" fontWeight="800" letterSpacing="0.12em" textTransform="uppercase" mb={3}>
                      Availability
                    </Text>
                    <Text color="white" fontSize="32px" fontWeight="700" lineHeight="1" mb={3}>
                      {detail.totalAprovados} <Text as="span" fontSize="sm" color="gray.500" fontWeight="500">de {detail.capacidadeMaxima}</Text>
                    </Text>
                    <Box bg="whiteAlpha.100" borderRadius="full" h="4px" overflow="hidden" mb={2}>
                      <Box bg={vacancyColor} h="full" w={`${vacancyPct}%`} borderRadius="full" transition="width 0.4s ease" />
                    </Box>
                    <Flex align="center" gap={1.5}>
                      <Box w="6px" h="6px" borderRadius="full" bg={vacancyColor} />
                      <Text fontSize="xs" color="gray.400" fontWeight="600">{vacancyPct}% FULL</Text>
                    </Flex>
                  </Box>

                  <Box bg="#181820" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" p={4} display="flex" flexDirection="column" justifyContent="space-between" onClick={() => { handleLoadParticipants(); openPax(); }}>
                    <Text color="brand.400" fontSize="9px" fontWeight="800" letterSpacing="0.12em" textTransform="uppercase" mb={3}>
                      Community
                    </Text>
                    <Flex mb={3}>
                      {participants.slice(0, 4).map((p, i) => (
                        <Avatar
                          key={p.usuarioId}
                          size="md"
                          name={p.nomeDisplay}
                          bg="brand.800"
                          color="white"
                          border="2px solid #181820"
                          ml={i > 0 ? "-12px" : "0"}
                          zIndex={5 - i}
                        />
                      ))}
                      {participants.length === 0 && (
                        <Avatar size="md" icon={<UsersIcon size={20} />} bg="whiteAlpha.100" color="gray.500" />
                      )}
                      {participants.length > 4 && (
                        <Flex
                          w="48px" h="48px" borderRadius="full"
                          bg="surface.card" border="2px solid #181820"
                          ml="-12px" zIndex={1}
                          align="center" justify="center"
                          fontSize="xs" fontWeight="bold" color="brand.400"
                        >
                          +{participants.length - 4}
                        </Flex>
                      )}
                    </Flex>
                    <Text fontSize="xs" color="gray.400" fontWeight="600" lineHeight="1.2">
                      QUEM VAI ESTAR<br/>LÁ
                    </Text>
                  </Box>
                </Grid>

                <Stack spacing={3}>
                  <HStack color="gray.300" fontSize="sm" gap={2}>
                    <ClockIcon size={16} />
                    <Text fontWeight="500">{formatDate(detail.inicioEm)}</Text>
                  </HStack>
                  <HStack color="gray.300" fontSize="sm" gap={2}>
                    <UserIcon size={16} />
                    <Text>
                      Anfitrião:{" "}
                      <Text
                        as="span"
                        color="white"
                        fontWeight="600"
                        _hover={{ color: "brand.400", textDecoration: "underline" }}
                        cursor="pointer"
                        onClick={() => router.push(`/profile/${detail.host.id}?eventId=${detail.id}`)}
                      >
                        {detail.host.nomeDisplay}
                      </Text>
                    </Text>
                  </HStack>
                  {detail.clima && (
                    <HStack color="gray.300" fontSize="sm" gap={2}>
                      <Box color="brand.400">
                        {/rain|chuva/i.test(detail.clima.condition) ? <RainIcon />
                          : /thunder|trovoada|storm/i.test(detail.clima.condition) ? <StormIcon />
                          : /snow|neve/i.test(detail.clima.condition) ? <SnowIcon />
                          : /cloud|nublado|overcast/i.test(detail.clima.condition) ? <CloudIcon />
                          : /mist|fog|neblina/i.test(detail.clima.condition) ? <FogIcon />
                          : <SunIcon />}
                      </Box>
                      <Text>{detail.clima.temp.toFixed(0)}°C · {detail.clima.condition}</Text>
                    </HStack>
                  )}
                </Stack>

                {detail.descricao && (
                  <Box>
                    <Text color="gray.500" fontSize="xs" textTransform="uppercase" fontWeight="700" letterSpacing="wider" mb={2}>Sobre o evento</Text>
                    <Text fontSize="sm" color="gray.300" lineHeight="tall">{detail.descricao}</Text>
                  </Box>
                )}

              </Stack>
              
              <Box h="100px" />
            </Flex>
          )}
          
          {detail && (
            <Box
              position="sticky"
              bottom={0}
              left={0}
              right={0}
              bg="linear-gradient(to top, #0d0d0f 70%, transparent)"
              pt={6}
              pb="max(24px, env(safe-area-inset-bottom))"
              px={5}
              zIndex={20}
            >
              {isHost ? (
                <Stack spacing={2}>
                  <Button
                    w="full"
                    h="56px"
                    borderRadius="full"
                    colorScheme="brand"
                    bg="brand.500"
                    color="white"
                    fontWeight="700"
                    fontSize="md"
                    onClick={openEdit}
                  >
                    GERENCIAR ROLÊ
                  </Button>
                  <HStack spacing={2}>
                    <Button
                      flex={1}
                      size="sm"
                      borderRadius="full"
                      variant="outline"
                      colorScheme="red"
                      onClick={handleCancel}
                      isLoading={actionLoading === "cancel"}
                    >
                      Cancelar Evento
                    </Button>
                    <Button
                      flex={1}
                      size="sm"
                      borderRadius="full"
                      variant={pendingCount > 0 ? "solid" : "outline"}
                      colorScheme={pendingCount > 0 ? "brand" : "gray"}
                      onClick={() => { handleLoadRequests(); openReq(); }}
                    >
                      {pendingCount > 0 ? `${pendingCount} solicitações` : "Fila Vazia"}
                    </Button>
                  </HStack>
                </Stack>
              ) : isParticipant ? (
                <Button
                  w="full"
                  h="56px"
                  borderRadius="full"
                  variant="outline"
                  colorScheme="brand"
                  fontWeight="700"
                  fontSize="md"
                  onClick={handleCheckIn}
                  isLoading={actionLoading === "checkin"}
                  isDisabled={detail.status === "EXPIRADO" || !userPosition}
                  rightIcon={<ArrowRightIcon size={20} />}
                >
                  {detail.status === "EXPIRADO" ? "EVENTO ENCERRADO" : "FAZER CHECK-IN"}
                </Button>
              ) : (detail.status === "ABERTO_PARA_VAGAS" || detail.status === "CRIADO") ? (
                detail.totalAprovados >= detail.capacidadeMaxima ? (
                  <Button
                    w="full"
                    h="56px"
                    borderRadius="full"
                    colorScheme="gray"
                    bg="whiteAlpha.100"
                    color="gray.400"
                    fontWeight="700"
                    fontSize="md"
                    isDisabled
                  >
                    VAGAS ESGOTADAS
                  </Button>
                ) : joinRequested ? (
                  <Button
                    w="full"
                    h="56px"
                    borderRadius="full"
                    variant="outline"
                    colorScheme="green"
                    fontWeight="700"
                    fontSize="md"
                    isDisabled
                  >
                    SOLICITAÇÃO ENVIADA
                  </Button>
                ) : (
                  <Button
                    w="full"
                    h="56px"
                    borderRadius="full"
                    colorScheme="brand"
                    bg="brand.500"
                    color="white"
                    fontWeight="700"
                    fontSize="md"
                    onClick={handleJoin}
                    isLoading={actionLoading === "join"}
                    rightIcon={<ArrowRightIcon size={20} />}
                  >
                    QUERO ME JUNTAR
                  </Button>
                )
              ) : (
                <Button
                  w="full"
                  h="56px"
                  borderRadius="full"
                  colorScheme="gray"
                  bg="whiteAlpha.100"
                  color="gray.400"
                  fontWeight="700"
                  fontSize="md"
                  isDisabled
                >
                  {detail.status.replace(/_/g, " ")}
                </Button>
              )}
              
              {(isHost || isParticipant) && detail.status !== "EXPIRADO" && (
                <Flex justify="center" mt={3}>
                  <Button
                    size="sm"
                    variant="solid"
                    colorScheme="red"
                    bg="red.600"
                    color="white"
                    fontWeight="700"
                    borderRadius="full"
                    leftIcon={<AlertIcon />}
                    w="full"
                    isLoading={panicLoading}
                    onClick={openSosConfirm}
                  >
                    🆘 EMERGÊNCIA · SOS
                  </Button>
                </Flex>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Edit modal */}
      <Modal isOpen={isEditOpen} onClose={closeEdit} initialFocusRef={editRef} isCentered size="sm">
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(4px)" />
        <ModalContent mx={4} bg="surface.card" borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100">
          <ModalHeader color="white">Editar Rolê</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            <Stack spacing={4}>
              <Box>
                <Text fontSize="xs" color="gray.500" fontWeight="bold" letterSpacing="wider" mb={1}>TÍTULO</Text>
                <Input
                  ref={editRef}
                  value={editTitulo}
                  onChange={(e) => setEditTitulo(e.target.value)}
                  size="md"
                  bg="surface.input"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  borderRadius="xl"
                  _focus={{ borderColor: "brand.500", boxShadow: "none" }}
                />
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500" fontWeight="bold" letterSpacing="wider" mb={1}>DESCRIÇÃO</Text>
                <Textarea
                  value={editDescricao}
                  onChange={(e) => setEditDescricao(e.target.value)}
                  resize="none"
                  rows={3}
                  bg="surface.input"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  borderRadius="xl"
                  _focus={{ borderColor: "brand.500", boxShadow: "none" }}
                />
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500" fontWeight="bold" letterSpacing="wider" mb={1}>CAPACIDADE MÁXIMA</Text>
                <NumberInput min={2} max={500} value={editCapacity} onChange={(_, v) => setEditCapacity(v)}>
                  <NumberInputField 
                    bg="surface.input"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
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
            <Button variant="ghost" color="gray.400" onClick={closeEdit} size="sm" borderRadius="button">Cancelar</Button>
            <Button size="sm" colorScheme="brand" isLoading={actionLoading === "edit"} onClick={handleEdit} borderRadius="button">
              Salvar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Requests modal */}
      <Modal isOpen={isReqOpen} onClose={closeReq} isCentered size="sm">
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(4px)" />
        <ModalContent mx={4} bg="surface.card" borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100" maxH="80vh">
          <ModalHeader color="white">
            <Flex justify="space-between" align="center">
              <Text>Fila de Entrada{requestsWithNames.length > 0 ? ` (${requestsWithNames.length})` : ""}</Text>
              <Button
                size="xs"
                variant="ghost"
                color="gray.400"
                _hover={{ color: "white" }}
                isLoading={requestsLoading}
                onClick={handleLoadRequests}
                mr={8}
              >
                Atualizar
              </Button>
            </Flex>
          </ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody pb={6} overflowY="auto">
            {requestsLoading ? (
              <Stack spacing={3}>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} h="60px" borderRadius="xl" bg="whiteAlpha.100" startColor="whiteAlpha.50" endColor="whiteAlpha.200" />
                ))}
              </Stack>
            ) : requestsWithNames.length === 0 ? (
              <Flex direction="column" align="center" py={6} gap={2} color="gray.500">
                <CheckCircleIcon size={32} />
                <Text fontSize="sm">Nenhuma solicitação pendente.</Text>
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
                    borderColor="whiteAlpha.50"
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
                        borderRadius="button"
                        isLoading={judgingId === req.solicitacaoId}
                        onClick={() => handleJudge(req.solicitacaoId, true)}
                      >
                        Aceitar
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        borderRadius="button"
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

      {/* Participants modal */}
      <Modal isOpen={isPaxOpen} onClose={closePax} isCentered size="sm">
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(4px)" />
        <ModalContent mx={4} bg="surface.card" borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100" maxH="80vh">
          <ModalHeader color="white">
            Participantes{participants.length > 0 ? ` (${participants.length})` : ""}
          </ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody pb={6} overflowY="auto">
            {paxLoading ? (
              <Stack spacing={3}>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} h="60px" borderRadius="xl" bg="whiteAlpha.100" startColor="whiteAlpha.50" endColor="whiteAlpha.200" />
                ))}
              </Stack>
            ) : participants.length === 0 ? (
              <Flex direction="column" align="center" py={6} gap={2} color="gray.500">
                <UsersIcon size={32} />
                <Text fontSize="sm">Nenhum participante ainda.</Text>
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
                    borderColor="whiteAlpha.50"
                    gap={3}
                  >
                    <Avatar
                      size="sm"
                      name={p.nomeDisplay}
                      bg="brand.900"
                      color="brand.200"
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
                            <Badge key={v} colorScheme="brand" fontSize="2xs" borderRadius="full" variant="subtle">
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

      {/* SOS Alert Dialog */}
      <AlertDialog
        isOpen={isSosConfirmOpen}
        leastDestructiveRef={cancelSosRef}
        onClose={closeSosConfirm}
        isCentered
      >
        <AlertDialogOverlay bg="blackAlpha.800" backdropFilter="blur(4px)" />
        <AlertDialogContent bg="surface.card" borderRadius="2xl" border="1px solid" borderColor="red.900" mx={4}>
          <AlertDialogHeader fontSize="lg" fontWeight="bold" color="red.400">
            Confirmar SOS
          </AlertDialogHeader>

          <AlertDialogBody color="gray.300" fontSize="sm">
            Isso vai alertar a equipe de segurança e congelar os dados do evento de forma irrevogável. Tem certeza?
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelSosRef} onClick={closeSosConfirm} borderRadius="button" size="sm" variant="ghost" color="gray.400">
              Cancelar
            </Button>
            <Button colorScheme="red" onClick={handlePanic} isLoading={panicLoading} borderRadius="button" size="sm" ml={3}>
              CONFIRMAR SOS
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Chat Modal */}
      {eventId && userId && (
        <EventChatModal
          isOpen={isChatOpen}
          onClose={closeChat}
          eventId={eventId}
          currentUserId={userId}
        />
      )}
    </>
  );
}

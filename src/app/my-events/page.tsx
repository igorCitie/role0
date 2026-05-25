"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
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
  IconButton,
} from "@chakra-ui/react";
import AuthGuard from "@/components/auth/AuthGuard";
import BottomNav from "@/components/layout/BottomNav";
import {
  cancelEvent,
  editEvent,
  getEventDetail,
  getMyEvents,
  type EditEventRequest,
  type MyEvent,
  type EventStatus,
} from "@/lib/api/events";
import {
  BackIcon,
  CalendarIcon,
  PencilIcon,
  TrashIcon,
  TicketIcon,
} from "@/components/icons";

const STATUS_CONFIG: Record<EventStatus, { label: string; color: string; bg: string }> = {
  CRIADO:             { label: "Criado",        color: "gray.300",  bg: "whiteAlpha.100" },
  ABERTO_PARA_VAGAS:  { label: "Aberto",        color: "green.300", bg: "green.900"      },
  FECHADO_PREGAME:    { label: "Pré-game",      color: "yellow.300",bg: "yellow.900"     },
  CANCELADO:          { label: "Cancelado",     color: "red.300",   bg: "red.900"        },
  EXPIRADO:           { label: "Encerrado",     color: "gray.500",  bg: "whiteAlpha.50"  },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EventCard({ event, onEdit, onDelete }: { event: MyEvent; onEdit?: () => void; onDelete?: () => void }) {
  const status = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.EXPIRADO;
  const expired = event.status === "EXPIRADO";
  const canEdit = event.isHost && !expired;

  return (
    <Box
      bg="surface.card"
      border="1px solid"
      borderColor="whiteAlpha.100"
      borderRadius="xl"
      px={4}
      py={3}
      opacity={expired ? 0.6 : 1}
      transition="opacity 0.15s"
      _hover={{ borderColor: "whiteAlpha.200" }}
    >
      <Flex justify="space-between" align="flex-start" mb={2}>
        <Tag
          size="sm"
          bg={status.bg}
          color={status.color}
          borderRadius="full"
          px={2}
          fontSize="10px"
          fontWeight="bold"
          letterSpacing="0.04em"
        >
          {status.label}
        </Tag>
        <Flex align="center" gap={2}>
          {canEdit && (
            <IconButton
              aria-label="Editar rolê"
              icon={<PencilIcon />}
              variant="unstyled"
              size="xs"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); onEdit?.(); }}
              color="gray.500"
              _hover={{ color: "brand.400" }}
              display="flex"
              alignItems="center"
              justifyContent="center"
              minW="auto"
              h="auto"
            />
          )}
          {canEdit && (
            <IconButton
              aria-label="Excluir rolê"
              icon={<TrashIcon />}
              variant="unstyled"
              size="xs"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDelete?.(); }}
              color="gray.500"
              _hover={{ color: "red.400" }}
              display="flex"
              alignItems="center"
              justifyContent="center"
              minW="auto"
              h="auto"
            />
          )}
          <Tag
            size="sm"
            bg={event.isHost ? "brand.900" : "blue.900"}
            color={event.isHost ? "brand.200" : "blue.200"}
            borderRadius="full"
            px={2}
            fontSize="10px"
            fontWeight="bold"
            letterSpacing="0.04em"
          >
            {event.isHost ? "ANFITRIÃO" : "PARTICIPANTE"}
          </Tag>
        </Flex>
      </Flex>

      <Text fontWeight="semibold" fontSize="sm" color="gray.100" noOfLines={2} mb={1}>
        {event.titulo}
      </Text>

      <Flex align="center" gap={1.5} color="gray.500">
        <CalendarIcon size={12} />
        <Text fontSize="xs">{formatDate(event.horarioInicio)}</Text>
      </Flex>
    </Box>
  );
}

function EmptyState() {
  const router = useRouter();
  return (
    <Flex direction="column" align="center" justify="center" py={16} gap={4}>
      <Box color="gray.600">
        <TicketIcon size={32} />
      </Box>
      <Text color="gray.400" fontSize="sm" textAlign="center" px={6}>
        Você ainda não participou de nenhum rolê.{" "}
        <Text as="span" color="brand.400" cursor="pointer" onClick={() => router.push("/home")}>
          Explore o mapa
        </Text>{" "}
        ou crie um!
      </Text>
    </Flex>
  );
}

export default function MyEventsPage() {
  const router = useRouter();
  const toast = useToast();
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const editRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [editCapacity, setEditCapacity] = useState(10);
  const [editDetailLoading, setEditDetailLoading] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingTitle, setDeletingTitle] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  function loadEvents() {
    const token = localStorage.getItem("token") ?? "";
    getMyEvents(token)
      .then(setEvents)
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar rolês."))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadEvents(); }, []);

  async function handleOpenEdit(event: MyEvent) {
    setEditingId(event.id);
    setEditTitulo(event.titulo);
    setEditDescricao("");
    setEditCapacity(10);
    setEditDetailLoading(true);
    onOpen();
    try {
      const token = localStorage.getItem("token") ?? "";
      const detail = await getEventDetail(event.id, token);
      setEditDescricao(detail.descricao ?? "");
      setEditCapacity(detail.capacidadeMaxima);
    } catch { /* non-critical */ }
    finally { setEditDetailLoading(false); }
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    const token = localStorage.getItem("token") ?? "";
    const original = events.find((e) => e.id === editingId);
    const payload: EditEventRequest = {};
    if (editTitulo !== original?.titulo) payload.titulo = editTitulo;
    if (editDescricao !== undefined) payload.descricao = editDescricao;
    payload.maxCapacity = editCapacity;

    setEditSubmitting(true);
    try {
      await editEvent(editingId, payload, token);
      toast({ title: "Rolê atualizado!", status: "success", duration: 2500, isClosable: true });
      setEvents((prev) => prev.map((e) => e.id === editingId ? { ...e, titulo: editTitulo } : e));
      onClose();
    } catch (err) {
      toast({ title: "Erro ao editar", description: err instanceof Error ? err.message : "Tente novamente.", status: "error", duration: 3500, isClosable: true });
    } finally {
      setEditSubmitting(false);
    }
  }

  function handleOpenDelete(event: MyEvent) {
    setDeletingId(event.id);
    setDeletingTitle(event.titulo);
    onDeleteOpen();
  }

  async function handleConfirmDelete() {
    if (!deletingId) return;
    const token = localStorage.getItem("token") ?? "";
    setDeleteSubmitting(true);
    try {
      await cancelEvent(deletingId, token);
      toast({ title: "Rolê cancelado.", status: "info", duration: 2500, isClosable: true });
      setEvents((prev) => prev.filter((e) => e.id !== deletingId));
      onDeleteClose();
    } catch (err) {
      toast({ title: "Erro ao cancelar", description: err instanceof Error ? err.message : "Tente novamente.", status: "error", duration: 3500, isClosable: true });
    } finally {
      setDeleteSubmitting(false);
    }
  }

  const active = events.filter((e) => e.status !== "EXPIRADO");
  const past   = events.filter((e) => e.status === "EXPIRADO");

  return (
    <AuthGuard>
      <Box w="100%" h="100dvh" bg="surface.bg" display="flex" flexDirection="column" alignItems="center" position="relative" overflow="hidden">
        <Container maxW="390px" px={0} pb="80px" flex={1} overflowY="auto" w="100%">
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
            <IconButton
              aria-label="Voltar"
              icon={<BackIcon />}
              variant="unstyled"
              onClick={() => router.back()}
              color="gray.400"
              _hover={{ color: "white" }}
              display="flex"
              alignItems="center"
              justifyContent="center"
              minW="auto"
              h="auto"
            />
            <Heading size="md" color="gray.100">
              Meus Rolês
            </Heading>
          </Flex>

          <Box px={4} pt={4}>
            {error && (
              <Text color="red.400" fontSize="sm" textAlign="center" py={8}>
                {error}
              </Text>
            )}

            {loading && (
              <Stack spacing={3}>
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} h="90px" borderRadius="xl" startColor="surface.card" endColor="surface.input" />
                ))}
              </Stack>
            )}

            {!loading && !error && events.length === 0 && <EmptyState />}

            {!loading && !error && active.length > 0 && (
              <>
                <Text fontSize="xs" color="gray.500" fontWeight="bold" letterSpacing="wider" textTransform="uppercase" mb={3}>
                  Ativos ({active.length})
                </Text>
                <Stack spacing={3} mb={6}>
                  {active.map((e) => <EventCard key={e.id} event={e} onEdit={() => handleOpenEdit(e)} onDelete={() => handleOpenDelete(e)} />)}
                </Stack>
              </>
            )}

            {!loading && !error && past.length > 0 && (
              <>
                {active.length > 0 && <Divider borderColor="whiteAlpha.100" mb={5} />}
                <Text fontSize="xs" color="gray.500" fontWeight="bold" letterSpacing="wider" textTransform="uppercase" mb={3}>
                  Histórico ({past.length})
                </Text>
                <Stack spacing={3}>
                  {past.map((e) => <EventCard key={e.id} event={e} onEdit={() => handleOpenEdit(e)} onDelete={() => handleOpenDelete(e)} />)}
                </Stack>
              </>
            )}
          </Box>
        </Container>

        <BottomNav />

        <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered motionPreset="slideInBottom" size="sm">
          <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(4px)" />
          <ModalContent bg="surface.card" borderRadius="2xl" mx={4} border="1px solid" borderColor="whiteAlpha.100">
            <ModalHeader color="white" fontSize="md">Cancelar Rolê</ModalHeader>
            <ModalCloseButton color="gray.400" />
            <ModalBody>
              <Text color="gray.300" fontSize="sm">
                Tem certeza que deseja cancelar{" "}
                <Text as="span" fontWeight="bold" color="white">&ldquo;{deletingTitle}&rdquo;</Text>?
                {" "}Esta ação não pode ser desfeita.
              </Text>
            </ModalBody>
            <ModalFooter gap={2}>
              <Button variant="ghost" color="gray.400" onClick={onDeleteClose} size="sm">
                Voltar
              </Button>
              <Button
                bg="red.500"
                color="white"
                _hover={{ bg: "red.400" }}
                size="sm"
                borderRadius="full"
                onClick={handleConfirmDelete}
                isLoading={deleteSubmitting}
              >
                Cancelar Rolê
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal isOpen={isOpen} onClose={onClose} isCentered motionPreset="slideInBottom" initialFocusRef={editRef}>
          <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(4px)" />
          <ModalContent bg="surface.card" borderRadius="2xl" mx={4} border="1px solid" borderColor="whiteAlpha.100">
            <ModalHeader color="white" fontSize="md">Editar Rolê</ModalHeader>
            <ModalCloseButton color="gray.400" />
            <ModalBody>
              {editDetailLoading ? (
                <Stack spacing={4}>
                  <Skeleton h="40px" borderRadius="xl" startColor="surface.card" endColor="surface.input" />
                  <Skeleton h="80px" borderRadius="xl" startColor="surface.card" endColor="surface.input" />
                  <Skeleton h="40px" borderRadius="xl" startColor="surface.card" endColor="surface.input" />
                </Stack>
              ) : (
                <Stack spacing={4}>
                  <FormControl>
                    <FormLabel fontSize="xs" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={1}>Título</FormLabel>
                    <Input
                      ref={editRef}
                      value={editTitulo}
                      onChange={(e) => setEditTitulo(e.target.value)}
                      bg="surface.input"
                      border="1px solid"
                      borderColor="whiteAlpha.200"
                      _focus={{ borderColor: "brand.500", boxShadow: "none" }}
                      color="white"
                      borderRadius="xl"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={1}>Descrição</FormLabel>
                    <Textarea
                      value={editDescricao}
                      onChange={(e) => setEditDescricao(e.target.value)}
                      bg="surface.input"
                      border="1px solid"
                      borderColor="whiteAlpha.200"
                      _focus={{ borderColor: "brand.500", boxShadow: "none" }}
                      color="white"
                      _placeholder={{ color: "gray.600" }}
                      borderRadius="xl"
                      resize="none"
                      rows={3}
                      fontSize="sm"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={1}>Capacidade máxima</FormLabel>
                    <NumberInput value={editCapacity} onChange={(_, n) => !isNaN(n) && setEditCapacity(n)} min={1} max={500}>
                      <NumberInputField
                        bg="surface.input"
                        border="1px solid"
                        borderColor="whiteAlpha.200"
                        _focus={{ borderColor: "brand.500", boxShadow: "none" }}
                        color="white"
                        borderRadius="xl"
                      />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </Stack>
              )}
            </ModalBody>
            <ModalFooter gap={2}>
              <Button variant="ghost" color="gray.400" onClick={onClose} size="sm">Cancelar</Button>
              <Button
                bg="brand.500"
                color="white"
                _hover={{ bg: "brand.400" }}
                size="sm"
                borderRadius="full"
                onClick={handleSaveEdit}
                isLoading={editSubmitting}
                isDisabled={editDetailLoading || !editTitulo.trim()}
              >
                Salvar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </AuthGuard>
  );
}

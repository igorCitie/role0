"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  Textarea,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import AuthGuard from "@/components/auth/AuthGuard";
import BottomNav from "@/components/layout/BottomNav";
import { getPublicProfile, getUserReviews, submitReview, type AvaliacaoResponse, type PublicUserProfile } from "@/lib/api/users";

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

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" stroke="white" strokeWidth="2" fill="none" />
    </svg>
  );
}

function Stars({ nota, size = "sm" }: { nota: number; size?: "sm" | "lg" }) {
  const fontSize = size === "lg" ? "2xl" : "xs";
  return (
    <HStack spacing={0}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Text key={n} fontSize={fontSize} color={n <= nota ? "yellow.400" : "gray.700"} lineHeight="1">
          ★
        </Text>
      ))}
    </HStack>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <HStack spacing={1}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Box
          key={n}
          as="button"
          fontSize="3xl"
          lineHeight="1"
          color={(hovered || value) >= n ? "yellow.400" : "gray.600"}
          transition="color 0.1s"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
        >
          ★
        </Box>
      ))}
    </HStack>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function ReviewCard({ review }: { review: AvaliacaoResponse }) {
  return (
    <Box bg="surface.card" borderRadius="xl" p={3} border="1px solid" borderColor="whiteAlpha.100">
      <Flex justify="space-between" align="flex-start" mb={1}>
        <Text fontWeight="semibold" color="gray.200" fontSize="sm">{review.avaliadorNome}</Text>
        <Stars nota={review.nota} />
      </Flex>
      {review.comentario && (
        <Text color="gray.400" fontSize="xs" mt={1}>{review.comentario}</Text>
      )}
      <Text color="gray.600" fontSize="xs" mt={2}>{formatDate(review.criadoEm)}</Text>
    </Box>
  );
}

/* ─── main content (Suspense required for useSearchParams) ─────────────── */

function PublicProfileContent() {
  const router = useRouter();
  const { userId } = useParams<{ userId: string }>();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");
  const toast = useToast();

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<AvaliacaoResponse[] | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [reviewNota, setReviewNota] = useState(0);
  const [reviewComentario, setReviewComentario] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const token = localStorage.getItem("token") ?? "";

    getPublicProfile(userId, token)
      .then(setProfile)
      .catch((err) => setProfileError(err instanceof Error ? err.message : "Perfil não encontrado."));

    getUserReviews(userId, token)
      .then((res) => setReviews(res.avaliacoes))
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [userId]);

  async function handleSubmitReview() {
    if (reviewNota === 0) {
      toast({ title: "Selecione uma nota de 1 a 5.", status: "warning", duration: 2500, isClosable: true });
      return;
    }
    const token = localStorage.getItem("token") ?? "";
    setSubmitting(true);
    try {
      await submitReview(
        userId,
        { eventoId: eventId!, nota: reviewNota, comentario: reviewComentario || undefined },
        token,
      );
      toast({ title: "Avaliação enviada!", status: "success", duration: 2500, isClosable: true });
      getUserReviews(userId, token).then((res) => setReviews(res.avaliacoes)).catch(() => null);
      setReviewNota(0);
      setReviewComentario("");
      onClose();
    } catch (err) {
      toast({
        title: "Erro ao enviar avaliação",
        description: err instanceof Error ? err.message : "Tente novamente.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  }

  const profileLoading = !profile && !profileError;

  return (
    <AuthGuard>
      <Box w="100%" minH="100dvh" bg="surface.bg" display="flex" flexDirection="column" alignItems="center">
        <Container maxW="390px" px={0} pb="80px">

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
              p={1}
            >
              <BackIcon />
            </Box>
            <Heading size="md" color="gray.100">
              {profileLoading ? "Carregando…" : profile?.nomeDisplay ?? "Perfil"}
            </Heading>
          </Flex>

          <Stack spacing={6} px={4} pt={6}>
            {/* Avatar + name */}
            {profileLoading ? (
              <Flex direction="column" align="center" gap={3}>
                <SkeletonCircle size="20" />
                <Skeleton h="20px" w="160px" borderRadius="md" />
                <Skeleton h="14px" w="100px" borderRadius="md" />
              </Flex>
            ) : profileError ? (
              <Text color="red.400" fontSize="sm" textAlign="center" py={8}>{profileError}</Text>
            ) : profile && (
              <Flex direction="column" align="center" gap={3}>
                <Box position="relative">
                  <Avatar
                    size="xl"
                    name={profile.nomeDisplay}
                    bg="surface.card"
                    border="3px solid"
                    borderColor="brand.500"
                  />
                  {profile.isProvedIdentityToken && (
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
                      <ShieldIcon />
                    </Flex>
                  )}
                </Box>

                <Stack spacing={1} align="center">
                  <Heading size="md" color="white">{profile.nomeDisplay}</Heading>
                  <HStack spacing={2}>
                    {profile.isProvedIdentityToken && (
                      <Badge colorScheme="green" borderRadius="full" fontSize="xs" px={2}>
                        Identidade verificada
                      </Badge>
                    )}
                    {profile.qtdAvaliacoes > 0 && (
                      <HStack spacing={1} color="gray.500" fontSize="xs">
                        <Text>★</Text>
                        <Text>{profile.qtdAvaliacoes} avaliação{profile.qtdAvaliacoes !== 1 ? "ões" : ""}</Text>
                      </HStack>
                    )}
                  </HStack>
                </Stack>
              </Flex>
            )}

            <Divider borderColor="whiteAlpha.100" />

            {/* Trust score */}
            {profileLoading ? (
              <Skeleton h="40px" borderRadius="md" startColor="surface.card" endColor="surface.input" />
            ) : profile && (
              <Box bg="surface.card" borderRadius="xl" p={4} border="1px solid" borderColor="whiteAlpha.100">
                <TrustScoreBar score={profile.trustScore} />
              </Box>
            )}

            {/* Vibes */}
            {profileLoading ? (
              <HStack flexWrap="wrap" spacing={2}>
                {[80, 110, 70, 95].map((w) => (
                  <Skeleton key={w} h="28px" w={`${w}px`} borderRadius="full" startColor="surface.card" endColor="surface.input" />
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
                      {v.replace(/_/g, " ")}
                    </Tag>
                  ))}
                </Flex>
              </Box>
            )}

            <Divider borderColor="whiteAlpha.100" />

            {/* Reviews */}
            <Box>
              <Flex justify="space-between" align="center" mb={3}>
                <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                  Avaliações
                </Text>
                {eventId && (
                  <Button
                    size="xs"
                    variant="outline"
                    borderColor="brand.500"
                    color="brand.400"
                    _hover={{ bg: "brand.900" }}
                    borderRadius="full"
                    onClick={onOpen}
                  >
                    ★ Avaliar
                  </Button>
                )}
              </Flex>

              {reviewsLoading ? (
                <Stack spacing={3}>
                  {[1, 2].map((i) => (
                    <Skeleton key={i} h="70px" borderRadius="xl" startColor="surface.card" endColor="surface.input" />
                  ))}
                </Stack>
              ) : reviews && reviews.length > 0 ? (
                <Stack spacing={3}>
                  {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
                </Stack>
              ) : (
                <Text color="gray.600" fontSize="sm" textAlign="center" py={4}>
                  Nenhuma avaliação ainda.
                </Text>
              )}
            </Box>

          </Stack>
        </Container>

        <BottomNav />

        {/* Review submit modal */}
        <Modal isOpen={isOpen} onClose={onClose} isCentered motionPreset="slideInBottom">
          <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(4px)" />
          <ModalContent bg="surface.card" borderRadius="2xl" mx={4} border="1px solid" borderColor="whiteAlpha.100">
            <ModalHeader color="white" fontSize="md">
              Avaliar {profile?.nomeDisplay}
            </ModalHeader>
            <ModalCloseButton color="gray.400" />
            <ModalBody>
              <Stack spacing={5}>
                <Flex direction="column" align="center" gap={2}>
                  <Text color="gray.400" fontSize="sm">Nota</Text>
                  <StarPicker value={reviewNota} onChange={setReviewNota} />
                  {reviewNota > 0 && (
                    <Text color="yellow.400" fontSize="xs">
                      {["" , "Péssimo", "Ruim", "Regular", "Bom", "Excelente"][reviewNota]}
                    </Text>
                  )}
                </Flex>
                <Box>
                  <Text color="gray.400" fontSize="sm" mb={2}>Comentário (opcional)</Text>
                  <Textarea
                    placeholder="Como foi a experiência com esse usuário?"
                    value={reviewComentario}
                    onChange={(e) => setReviewComentario(e.target.value)}
                    bg="surface.input"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    _focus={{ borderColor: "brand.500", boxShadow: "none" }}
                    color="white"
                    _placeholder={{ color: "gray.600" }}
                    resize="none"
                    rows={3}
                    maxLength={300}
                    fontSize="sm"
                    borderRadius="xl"
                  />
                  <Text color="gray.600" fontSize="xs" textAlign="right" mt={1}>
                    {reviewComentario.length}/300
                  </Text>
                </Box>
              </Stack>
            </ModalBody>
            <ModalFooter gap={2}>
              <Button variant="ghost" color="gray.400" onClick={onClose} size="sm">
                Cancelar
              </Button>
              <Button
                bg="brand.500"
                color="white"
                _hover={{ bg: "brand.400" }}
                size="sm"
                borderRadius="full"
                onClick={handleSubmitReview}
                isLoading={submitting}
                isDisabled={reviewNota === 0}
              >
                Enviar avaliação
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </AuthGuard>
  );
}

/* ─── page export (Suspense required for useSearchParams) ─────────────── */

export default function PublicProfilePage() {
  return (
    <Suspense>
      <PublicProfileContent />
    </Suspense>
  );
}

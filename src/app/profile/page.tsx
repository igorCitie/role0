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
  Skeleton,
  SkeletonCircle,
  Stack,
  Tag,
  Text,
} from "@chakra-ui/react";
import AuthGuard from "@/components/auth/AuthGuard";
import BottomNav from "@/components/layout/BottomNav";
import { getMyProfile, type UserProfile } from "@/lib/api/users";

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token") ?? "";
    getMyProfile(token)
      .then(setProfile)
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar perfil."));
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    router.replace("/login");
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
                </HStack>
              </Box>
            )}
          </Stack>
        </Container>

        <BottomNav />
      </Box>
    </AuthGuard>
  );
}

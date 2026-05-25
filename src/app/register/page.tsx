"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { register } from "@/lib/api/auth";
import { getMyProfile } from "@/lib/api/users";

export default function RegisterPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token } = await register({ nome, email, senha });
      localStorage.setItem("token", token);
      try {
        const profile = await getMyProfile(token);
        localStorage.setItem("userId", profile.id);
      } catch { /* non-critical */ }
      router.push("/home");
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("API 409")) {
        setError("Este e-mail ja esta cadastrado.");
      } else {
        setError(err instanceof Error ? err.message : "Erro ao criar conta.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      minH="100dvh"
      bg="surface.bg"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      px={4}
      position="relative"
      overflow="hidden"
    >
      {/* Background ambient glows — brand orange only */}
      <Box
        position="absolute"
        top="-100px"
        right="-80px"
        w="400px"
        h="400px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(224,56,0,0.12) 0%, transparent 70%)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="-100px"
        left="-60px"
        w="360px"
        h="360px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(224,56,0,0.06) 0%, transparent 70%)"
        pointerEvents="none"
      />

      <Container maxW="390px" px={0} position="relative" zIndex={1}>
        {/* Logo */}
        <Stack spacing={2} mb={8} align="center">
          <Heading
            fontSize="48px"
            fontWeight="900"
            letterSpacing="-2px"
            marginTop="1em"
            color="white"
            lineHeight={1}
          >
            Role
            <Box as="span" color="brand.500">0</Box>
          </Heading>
          <Text fontSize="sm" color="gray.500" letterSpacing="0.04em">
            Sua conta, seus roles.
          </Text>
        </Stack>

        {/* Card */}
        <Box
          borderRadius="card"
          p="1px"
          bg="linear-gradient(135deg, rgba(224,56,0,0.4) 0%, rgba(255,255,255,0.06) 50%, rgba(224,56,0,0.2) 100%)"
          boxShadow="0 24px 64px rgba(224,56,0,0.08), 0 4px 24px rgba(0,0,0,0.4)"
        >
          <Box
            bg="surface.cardTranslucent"
            borderRadius="19px"
            p={8}
            backdropFilter="blur(20px)"
          >
            <Stack spacing={5} as="form" onSubmit={handleSubmit}>
              <Stack spacing={1} mb={1}>
                <Heading size="lg" fontWeight="800" letterSpacing="-0.5px">
                  Criar conta
                </Heading>
                <Text fontSize="sm" color="gray.500">
                  Comece a descobrir os melhores roles
                </Text>
              </Stack>

              <FormControl isRequired>
                <FormLabel fontSize="xs" color="gray.400" mb={1.5} letterSpacing="0.08em" textTransform="uppercase" fontWeight="600">
                  Nome
                </FormLabel>
                <Input
                  type="text"
                  autoComplete="name"
                  placeholder="Joao das Neves"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  size="lg"
                  fontSize="16px"
                  borderRadius="input"
                  bg="rgba(255,255,255,0.04)"
                  border="1px solid rgba(255,255,255,0.08)"
                  color="white"
                  _placeholder={{ color: "gray.500" }}
                  _hover={{ border: "1px solid rgba(224,56,0,0.3)", bg: "rgba(255,255,255,0.06)" }}
                  _focus={{ border: "1px solid", borderColor: "brand.500", bg: "rgba(224,56,0,0.04)", boxShadow: "0 0 0 3px rgba(224,56,0,0.12)", outline: "none" }}
                  transition="all 0.2s"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs" color="gray.400" mb={1.5} letterSpacing="0.08em" textTransform="uppercase" fontWeight="600">
                  E-mail
                </FormLabel>
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  size="lg"
                  fontSize="16px"
                  borderRadius="input"
                  bg="rgba(255,255,255,0.04)"
                  border="1px solid rgba(255,255,255,0.08)"
                  color="white"
                  _placeholder={{ color: "gray.500" }}
                  _hover={{ border: "1px solid rgba(224,56,0,0.3)", bg: "rgba(255,255,255,0.06)" }}
                  _focus={{ border: "1px solid", borderColor: "brand.500", bg: "rgba(224,56,0,0.04)", boxShadow: "0 0 0 3px rgba(224,56,0,0.12)", outline: "none" }}
                  transition="all 0.2s"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs" color="gray.400" mb={1.5} letterSpacing="0.08em" textTransform="uppercase" fontWeight="600">
                  Senha
                </FormLabel>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  size="lg"
                  fontSize="16px"
                  borderRadius="input"
                  bg="rgba(255,255,255,0.04)"
                  border="1px solid rgba(255,255,255,0.08)"
                  color="white"
                  _placeholder={{ color: "gray.500" }}
                  _hover={{ border: "1px solid rgba(224,56,0,0.3)", bg: "rgba(255,255,255,0.06)" }}
                  _focus={{ border: "1px solid", borderColor: "brand.500", bg: "rgba(224,56,0,0.04)", boxShadow: "0 0 0 3px rgba(224,56,0,0.12)", outline: "none" }}
                  transition="all 0.2s"
                />
              </FormControl>

              {error && (
                <Box
                  bg="rgba(224,56,0,0.1)"
                  border="1px solid rgba(224,56,0,0.3)"
                  borderRadius="10px"
                  px={4}
                  py={3}
                >
                  <Text color="brand.400" fontSize="sm" fontWeight="500">
                    {error}
                  </Text>
                </Box>
              )}

              <Button
                type="submit"
                size="lg"
                borderRadius="button"
                isLoading={loading}
                fontWeight="700"
                fontSize="md"
                bg="brand.500"
                color="white"
                border="none"
                _hover={{
                  bg: "brand.400",
                  transform: "translateY(-1px)",
                  boxShadow: "0 8px 32px rgba(224,56,0,0.35)",
                }}
                _active={{ transform: "translateY(0)", boxShadow: "0 4px 16px rgba(224,56,0,0.25)" }}
                boxShadow="0 4px 20px rgba(224,56,0,0.2)"
                transition="all 0.2s"
                h="52px"
                mt={1}
              >
                Criar conta
              </Button>

              {/* Verification hint */}
              <HStack justify="center" spacing={2} pt={1}>
                <Box w="6px" h="6px" borderRadius="full" bg="green.400" boxShadow="0 0 8px rgba(72, 187, 120, 0.5)" />
                <Text fontSize="xs" color="gray.500">
                  Conta verificada imediatamente apos o cadastro
                </Text>
              </HStack>
            </Stack>
          </Box>
        </Box>

        {/* Footer */}
        <HStack justify="center" mt={6} spacing={1}>
          <Text fontSize="sm" color="gray.500">
            Ja tem uma conta?
          </Text>
          <Button
            as={NextLink}
            href="/login"
            variant="link"
            fontSize="sm"
            fontWeight="700"
            color="brand.400"
            _hover={{ color: "brand.300", textDecoration: "none" }}
          >
            Entrar
          </Button>
        </HStack>

        <HStack justify="center" mt={2}>
          <Button
            as={NextLink}
            href="/"
            variant="link"
            fontSize="xs"
            color="gray.600"
            _hover={{ color: "gray.400" }}
          >
            Voltar ao inicio
          </Button>
        </HStack>
      </Container>
    </Box>
  );
}

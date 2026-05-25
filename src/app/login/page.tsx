"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
  useToast,
} from "@chakra-ui/react";
import { login } from "@/lib/api/auth";
import { getMyProfile } from "@/lib/api/users";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  // Restore credentials from sessionStorage on mount (if page was reloaded/reset)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = sessionStorage.getItem("login_email");
      const savedSenha = sessionStorage.getItem("login_senha");
      if (savedEmail) setEmail(savedEmail);
      if (savedSenha) setSenha(savedSenha);
    }
  }, []);

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("login_email", val);
    }
  };

  const handleSenhaChange = (val: string) => {
    setSenha(val);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("login_senha", val);
    }
  };

  // Auto-redirect if already logged in (intelligent session check)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && token !== "undefined" && token !== "null") {
      router.replace("/home");
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    
    // Defer setLoading to the next tick to ensure preventDefault propagates cleanly
    // and doesn't trigger a native browser form submission fallback
    setTimeout(() => {
      setLoading(true);
    }, 0);

    try {
      const { token } = await login({ email, senha });
      localStorage.setItem("token", token);
      
      // Clear sessionStorage credentials on successful login
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("login_email");
        sessionStorage.removeItem("login_senha");
      }

      try {
        const profile = await getMyProfile(token);
        localStorage.setItem("userId", profile.id);
      } catch { /* non-critical */ }
      
      toast({ title: "Login realizado!", status: "success", duration: 2000, isClosable: true });
      router.push("/home");
    } catch (err) {
      toast({
        title: "Falha no login",
        description: err instanceof Error ? err.message : "Verifique suas credenciais.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      // Ensure loading is set back to false on error
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
        top="-120px"
        left="50%"
        transform="translateX(-50%)"
        w="480px"
        h="480px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(224, 56, 0, 0.12) 0%, transparent 70%)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="-80px"
        right="-60px"
        w="320px"
        h="320px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(224, 56, 0, 0.06) 0%, transparent 70%)"
        pointerEvents="none"
      />

      <Container maxW="390px" px={0} position="relative" zIndex={1}>
        {/* Logo */}
        <Stack spacing={2} mb={10} align="center">
          <Heading
            fontSize="48px"
            marginTop="1em"
            fontWeight="900"
            letterSpacing="-2px"
            color="white"
            lineHeight={1}
          >
            Role
            <Box as="span" color="brand.500">0</Box>
          </Heading>
          <Text fontSize="sm" color="gray.500" letterSpacing="0.04em">
            Encontre o role certo para voce.
          </Text>
        </Stack>

        {/* Card */}
        <Box
          borderRadius="card"
          p="1px"
          bg="linear-gradient(135deg, rgba(224, 56, 0, 0.4) 0%, rgba(255,255,255,0.06) 50%, rgba(224, 56, 0, 0.2) 100%)"
          boxShadow="0 24px 64px rgba(224, 56, 0, 0.08), 0 4px 24px rgba(0,0,0,0.4)"
        >
          <Box
            bg="surface.cardTranslucent"
            borderRadius="19px"
            p={8}
            backdropFilter="blur(20px)"
          >
            <form onSubmit={handleSubmit} action="javascript:void(0);" style={{ width: "100%" }}>
              <Stack spacing={6}>
                <Stack spacing={1}>
                  <Heading size="lg" fontWeight="800" letterSpacing="-0.5px">
                    Bem-vindo de volta
                  </Heading>
                  <Text fontSize="sm" color="gray.500">
                    Entre na sua conta para continuar
                  </Text>
                </Stack>

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
                    onChange={(e) => handleEmailChange(e.target.value)}
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
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => handleSenhaChange(e.target.value)}
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
                >
                  Continuar
                </Button>
              </Stack>
            </form>
          </Box>
        </Box>

        {/* Footer */}
        <HStack justify="center" mt={6} spacing={1}>
          <Text fontSize="sm" color="gray.500">
            Nao tem uma conta?
          </Text>
          <Button
            as={NextLink}
            href="/register"
            variant="link"
            fontSize="sm"
            fontWeight="700"
            color="brand.400"
            _hover={{ color: "brand.300", textDecoration: "none" }}
          >
            Criar conta
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

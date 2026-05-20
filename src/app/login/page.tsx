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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { token } = await login({ email, senha });
      localStorage.setItem("token", token);
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      minH="100vh"
      bg="#0B0B0F"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      px={4}
      position="relative"
      overflow="hidden"
    >
      {/* Background ambient glows */}
      <Box
        position="absolute"
        top="-120px"
        left="50%"
        transform="translateX(-50%)"
        w="480px"
        h="480px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(188, 0, 209, 0.18) 0%, transparent 70%)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="-80px"
        right="-60px"
        w="320px"
        h="320px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(255, 71, 10, 0.12) 0%, transparent 70%)"
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
            <Box
              as="span"
              bgGradient="linear(135deg, #3800e0, #e03800)"
              bgClip="text"
              style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
            >
              0
            </Box>
          </Heading>
          <Text fontSize="sm" color="gray.500" letterSpacing="0.04em">
            Encontre o rolê certo para você.
          </Text>
        </Stack>

        {/* Card */}
        <Box
          borderRadius="24px"
          p="1px"
          bg="linear-gradient(135deg, rgba(208, 101, 74, 0.5) 0%, rgba(255,255,255,0.06) 50%, rgba(224,56,0,0.3) 100%)"
          boxShadow="0 24px 64px rgba(56,0,224,0.15), 0 4px 24px rgba(0,0,0,0.4)"
        >
          <Box
            bg="rgba(18,18,26,0.95)"
            borderRadius="23px"
            p={8}
            backdropFilter="blur(20px)"
          >
            <Stack spacing={6} as="form" onSubmit={handleSubmit}>
              <Stack spacing={1}>
                <Heading size="lg" color="white" fontWeight="800" letterSpacing="-0.5px">
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
                  placeholder="voce@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  size="lg"
                  borderRadius="12px"
                  bg="rgba(255,255,255,0.04)"
                  border="1px solid rgba(255,255,255,0.08)"
                  color="white"
                  _placeholder={{ color: "gray.600" }}
                  _hover={{ border: "1px solid rgba(56,0,224,0.4)", bg: "rgba(255,255,255,0.06)" }}
                  _focus={{ border: "1px solid #3800e0", bg: "rgba(56,0,224,0.08)", boxShadow: "0 0 0 3px rgba(56,0,224,0.15)", outline: "none" }}
                  transition="all 0.2s"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs" color="gray.400" mb={1.5} letterSpacing="0.08em" textTransform="uppercase" fontWeight="600">
                  Senha
                </FormLabel>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  size="lg"
                  borderRadius="12px"
                  bg="rgba(255,255,255,0.04)"
                  border="1px solid rgba(255,255,255,0.08)"
                  color="white"
                  _placeholder={{ color: "gray.600" }}
                  _hover={{ border: "1px solid rgba(56,0,224,0.4)", bg: "rgba(255,255,255,0.06)" }}
                  _focus={{ border: "1px solid #3800e0", bg: "rgba(56,0,224,0.08)", boxShadow: "0 0 0 3px rgba(56,0,224,0.15)", outline: "none" }}
                  transition="all 0.2s"
                />
              </FormControl>

              <Button
                type="submit"
                size="lg"
                borderRadius="12px"
                isLoading={loading}
                fontWeight="700"
                fontSize="md"
                bg="linear-gradient(135deg, #e05600 0%, #5c1aff 100%)"
                color="white"
                border="none"
                _hover={{
                  bg: "linear-gradient(135deg, #fc432a 0%, #6e2aff 100%)",
                  transform: "translateY(-1px)",
                  boxShadow: "0 8px 32px rgba(56,0,224,0.45)",
                }}
                _active={{ transform: "translateY(0)", boxShadow: "0 4px 16px rgba(56,0,224,0.35)" }}
                boxShadow="0 4px 20px rgba(252, 92, 60, 0.3)"
                transition="all 0.2s"
                h="52px"
              >
                Continuar →
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* Footer */}
        <HStack justify="center" mt={6} spacing={1}>
          <Text fontSize="sm" color="gray.500">
            Não tem uma conta?
          </Text>
          <Button
            as={NextLink}
            href="/register"
            variant="link"
            fontSize="sm"
            fontWeight="700"
            color="#3800e0"
            _hover={{ color: "#5c1aff", textDecoration: "none" }}
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
            Voltar ao início
          </Button>
        </HStack>
      </Container>
    </Box>
  );
}

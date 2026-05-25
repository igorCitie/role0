"use client";

import { useEffect } from "react";
import { Box, Heading, Text, Button, Stack, Container, Flex } from "@chakra-ui/react";

export default function GlobalErrorFallback({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log do erro para um serviço de monitoramento (ex: Sentry) no mundo real
    if (process.env.NODE_ENV !== "production") {
      console.error("Global Error Caught:", error);
    }
  }, [error]);

  return (
    <Box
      minH="100dvh"
      bg="#0a0a0d"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      px={5}
    >
      <Container maxW="390px" centerContent textAlign="center">
        <Stack spacing={6} align="center">
          <Flex
            w="64px"
            h="64px"
            borderRadius="full"
            bg="red.500"
            color="white"
            align="center"
            justify="center"
            mb={2}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </Flex>
          
          <Stack spacing={2}>
            <Heading size="lg" color="white" fontWeight="800" letterSpacing="-0.02em">
              Algo deu errado
            </Heading>
            <Text color="whiteAlpha.600" fontSize="sm" lineHeight="1.6">
              Encontramos um erro inesperado ao carregar esta tela. Já fomos notificados.
            </Text>
          </Stack>

          <Button
            onClick={() => reset()}
            size="lg"
            bg="white"
            color="black"
            borderRadius="full"
            px={8}
            fontWeight="700"
            _hover={{ bg: "whiteAlpha.800" }}
            _active={{ transform: "scale(0.96)" }}
            transition="all 0.2s"
          >
            Tentar Novamente
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}

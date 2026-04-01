import NextLink from "next/link";
import { Box, Button, Container, Heading, Stack, Text } from "@chakra-ui/react";

export default function HomePage() {
  return (
    <Box minH="100vh" py={{ base: 12, md: 20 }}>
      <Container maxW="container.md">
        <Stack spacing={8} align="stretch">
          <Heading as="h1" size="2xl" lineHeight="shorter">
            Role0
          </Heading>
          <Text fontSize="lg" color="gray.400">
            Facilitador de experiências coletivas — encontre rolês, ocupe vagas em
            mesas e reduza o custo social de ir sozinho.
          </Text>
          <Stack direction={{ base: "column", sm: "row" }} spacing={4}>
            <Button as={NextLink} href="/login" size="lg" colorScheme="brand">
              Entrar
            </Button>
            <Button
              as={NextLink}
              href="/home"
              size="lg"
              variant="outline"
              borderColor="brand.500"
              color="brand.200"
              _hover={{ bg: "whiteAlpha.100" }}
            >
              Ver mapa de rolês
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

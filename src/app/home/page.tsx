import NextLink from "next/link";
import { Box, Button, Container, Heading, Stack, Text } from "@chakra-ui/react";
import { Header } from "@/components/layout/Header";

export default function HomeMapPage() {
  return (
    <Box minH="100vh" bg="surface.bg">
      <Header />
      <Container maxW="container.lg" py={8}>
        <Stack spacing={6}>
          <Heading size="md">Mapa de rolês</Heading>
          <Text color="gray.400">
            Área reservada para o mapa (Leaflet / pins) e integração com{" "}
            <Text as="span" color="accent.green">
              {process.env.NEXT_PUBLIC_API_URL ?? "NEXT_PUBLIC_API_URL"}
            </Text>
            .
          </Text>
          <Box
            h="320px"
            rounded="lg"
            borderWidth="1px"
            borderColor="whiteAlpha.200"
            bg="surface.card"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="gray.500"
          >
            Mapa em construção
          </Box>
          <Button as={NextLink} href="/" variant="outline" w="fit-content">
            Início
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}

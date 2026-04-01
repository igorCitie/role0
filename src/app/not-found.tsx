import NextLink from "next/link";
import { Box, Button, Container, Heading, Text } from "@chakra-ui/react";

export default function NotFound() {
  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" p={8}>
      <Container textAlign="center">
        <Heading mb={4}>Página não encontrada</Heading>
        <Text color="gray.400" mb={6}>
          O endereço não existe ou foi movido.
        </Text>
        <Button as={NextLink} href="/" colorScheme="brand">
          Voltar ao início
        </Button>
      </Container>
    </Box>
  );
}

import NextLink from "next/link";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";

export default function LoginPage() {
  return (
    <Box minH="100vh" py={12}>
      <Container maxW="sm">
        <Stack spacing={8}>
          <Heading size="lg">Entrar</Heading>
          <Text color="gray.400" fontSize="sm">
            Placeholder de login — conecte à API Role0 quando estiver pronto.
          </Text>
          <Stack spacing={4} as="form">
            <FormControl>
              <FormLabel>E-mail</FormLabel>
              <Input type="email" placeholder="voce@email.com" />
            </FormControl>
            <FormControl>
              <FormLabel>Senha</FormLabel>
              <Input type="password" placeholder="••••••••" />
            </FormControl>
            <Button type="submit" colorScheme="brand" size="lg">
              Continuar
            </Button>
          </Stack>
          <Button as={NextLink} href="/" variant="link" color="gray.400">
            Voltar ao início
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}

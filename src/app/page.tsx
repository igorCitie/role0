import NextLink from "next/link";
import { Box, Button, Container, Heading, Stack, Text, Flex, Badge } from "@chakra-ui/react";
import { TicketIcon, UsersIcon, MapIcon } from "@/components/icons";

export default function HomePage() {
  return (
    <Box minH="100dvh" bg="surface.bg" position="relative" overflow="hidden">
      {/* Background ambient glow */}
      <Box
        position="absolute"
        top="-150px"
        right="-150px"
        w="500px"
        h="500px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(224,56,0,0.15) 0%, transparent 70%)"
        pointerEvents="none"
      />

      <Container maxW="container.md" pt={{ base: 20, md: 32 }} pb={16} position="relative" zIndex={1}>
        <Stack spacing={8} align="flex-start">
          <Badge colorScheme="brand" variant="subtle" borderRadius="full" px={3} py={1}>
            Role0 Beta
          </Badge>
          
          <Heading as="h1" fontSize={{ base: "5xl", md: "7xl" }} fontWeight="900" letterSpacing="-2px" lineHeight="1">
            Role
            <Box as="span" color="brand.500">0</Box>
          </Heading>
          
          <Text fontSize={{ base: "xl", md: "2xl" }} color="gray.400" maxW="lg" lineHeight="short">
            Descubra rolês locais, ocupe vagas em mesas e reduza o custo social de ir sozinho.
          </Text>

          <Stack direction={{ base: "column", sm: "row" }} spacing={4} w={{ base: "full", sm: "auto" }} pt={4}>
            <Button
              as={NextLink}
              href="/register"
              size="lg"
              h="56px"
              px={8}
              borderRadius="button"
              fontSize="md"
              bg="brand.500"
              color="white"
              _hover={{ bg: "brand.400", transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(224,56,0,0.3)" }}
              _active={{ transform: "translateY(0)" }}
              transition="all 0.2s"
              boxShadow="0 4px 16px rgba(224,56,0,0.2)"
            >
              Criar conta gratuita
            </Button>
            <Button
              as={NextLink}
              href="/login"
              size="lg"
              h="56px"
              px={8}
              borderRadius="button"
              fontSize="md"
              variant="outline"
              borderColor="whiteAlpha.200"
              color="white"
              bg="surface.cardTranslucent"
              _hover={{ bg: "whiteAlpha.100", borderColor: "whiteAlpha.300" }}
            >
              Já tenho conta
            </Button>
          </Stack>
        </Stack>

        <Box mt={24}>
          <Text fontSize="sm" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={8} fontWeight="bold">
            Como funciona
          </Text>
          <Stack direction={{ base: "column", md: "row" }} spacing={8}>
            <Flex direction="column" gap={4} flex={1}>
              <Box w="48px" h="48px" borderRadius="xl" bg="surface.input" display="flex" alignItems="center" justifyContent="center" color="brand.400">
                <MapIcon size={24} />
              </Box>
              <Text fontWeight="bold" fontSize="lg" color="white">1. Encontre no mapa</Text>
              <Text color="gray.400" fontSize="sm">Veja o que está acontecendo ao seu redor em tempo real, com detalhes como clima e vibes.</Text>
            </Flex>
            <Flex direction="column" gap={4} flex={1}>
              <Box w="48px" h="48px" borderRadius="xl" bg="surface.input" display="flex" alignItems="center" justifyContent="center" color="brand.400">
                <TicketIcon size={24} />
              </Box>
              <Text fontWeight="bold" fontSize="lg" color="white">2. Peça para entrar</Text>
              <Text color="gray.400" fontSize="sm">Solicite sua vaga. O anfitrião analisa seu Trust Score e aprova sua entrada.</Text>
            </Flex>
            <Flex direction="column" gap={4} flex={1}>
              <Box w="48px" h="48px" borderRadius="xl" bg="surface.input" display="flex" alignItems="center" justifyContent="center" color="brand.400">
                <UsersIcon size={24} />
              </Box>
              <Text fontWeight="bold" fontSize="lg" color="white">3. Curta com a galera</Text>
              <Text color="gray.400" fontSize="sm">Vá ao local, faça check-in pelo app e aproveite a resenha presencialmente.</Text>
            </Flex>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

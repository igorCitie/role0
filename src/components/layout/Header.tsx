import NextLink from "next/link";
import { Box, Flex, Heading, Link } from "@chakra-ui/react";

export function Header() {
  return (
    <Box as="header" borderBottomWidth="1px" borderColor="whiteAlpha.200" py={4} px={6}>
      <Flex align="center" justify="space-between" maxW="container.lg" mx="auto">
        <Heading size="sm" as={NextLink} href="/" _hover={{ color: "brand.300" }}>
          Role0
        </Heading>
        <Flex gap={4} fontSize="sm">
          <Link as={NextLink} href="/home" color="gray.300">
            Mapa
          </Link>
          <Link as={NextLink} href="/login" color="gray.300">
            Entrar
          </Link>
        </Flex>
      </Flex>
    </Box>
  );
}

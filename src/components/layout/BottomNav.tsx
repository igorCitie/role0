"use client";

import { Box, Flex, Text, IconButton } from "@chakra-ui/react";
import { usePathname, useRouter } from "next/navigation";
import { MapIcon, TicketIcon, UserIcon, PlusIcon, HeartIcon } from "@/components/icons";

const leftTabs = [
  { label: "Mapa",  href: "/home",      icon: MapIcon    },
  { label: "Rolês", href: "/my-events", icon: TicketIcon },
];
const rightTabs = [
  { label: "Atividade", href: "/activity", icon: HeartIcon },
  { label: "Perfil", href: "/profile", icon: UserIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Box
      as="nav"
      aria-label="Navegação principal"
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg="surface.cardTranslucent"
      backdropFilter="blur(20px)"
      borderTop="1px solid"
      borderColor="whiteAlpha.100"
      px={2}
      pb="max(12px, env(safe-area-inset-bottom))"
      zIndex={100}
    >
      <Flex align="center" justify="space-around" h="60px">
        {/* Left tabs */}
        <Flex flex={2} justify="space-evenly">
          {leftTabs.map(({ label, href, icon: TabIcon }) => {
            const active = pathname === href;
            return (
              <Flex
                key={href}
                direction="column"
                align="center"
                justify="center"
                gap="4px"
                flex={1}
                as="button"
                type="button"
                aria-label={`Ir para ${label}`}
                aria-current={active ? "page" : undefined}
                onClick={() => router.push(href)}
                color={active ? "brand.500" : "gray.500"}
                _hover={{ color: "brand.400" }}
                _active={{ opacity: 0.7 }}
                transition="color 0.15s, opacity 0.1s"
                h="100%"
                minH="44px"
              >
                <TabIcon size={24} />
                <Text fontSize="11px" fontWeight={active ? "bold" : "500"} letterSpacing="0.04em">
                  {label.toUpperCase()}
                </Text>
              </Flex>
            );
          })}
        </Flex>

        {/* FAB center button */}
        <Flex flex={1} justify="center" position="relative">
          <IconButton
            aria-label="Criar novo rolê"
            icon={<PlusIcon size={24} />}
            w="56px"
            h="56px"
            bg="brand.500"
            borderRadius="full"
            boxShadow="0 4px 24px rgba(224,56,0,0.4)"
            position="absolute"
            bottom="10px"
            _hover={{ bg: "brand.400", transform: "scale(1.05)" }}
            _active={{ transform: "scale(0.95)" }}
            transition="all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
            onClick={() => router.push("/create")}
          />
        </Flex>

        {/* Right tabs */}
        <Flex flex={2} justify="space-evenly">
          {rightTabs.map(({ label, href, icon: TabIcon }) => {
            const active = pathname === href;
            return (
              <Flex
                key={href}
                direction="column"
                align="center"
                justify="center"
                gap="4px"
                flex={1}
                as="button"
                type="button"
                aria-label={`Ir para ${label}`}
                aria-current={active ? "page" : undefined}
                onClick={() => router.push(href)}
                color={active ? "brand.500" : "gray.500"}
                _hover={{ color: "brand.400" }}
                _active={{ opacity: 0.7 }}
                transition="color 0.15s, opacity 0.1s"
                h="100%"
                minH="44px"
              >
                <TabIcon size={24} />
                <Text fontSize="11px" fontWeight={active ? "bold" : "500"} letterSpacing="0.04em">
                  {label.toUpperCase()}
                </Text>
              </Flex>
            );
          })}
        </Flex>
      </Flex>
    </Box>
  );
}

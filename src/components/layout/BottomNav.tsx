"use client";

import { Box, Flex, Icon, Text, IconButton } from "@chakra-ui/react";
import { usePathname, useRouter } from "next/navigation";

function MapIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const tabs = [
  { label: "Mapa", href: "/home", icon: MapIcon },
  { label: "Perfil", href: "/profile", icon: UserIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Box
      position="absolute"
      bottom={0}
      left={0}
      right={0}
      bg="surface.card"
      borderTop="1px solid"
      borderColor="whiteAlpha.100"
      px={2}
      pb="12px"
      zIndex={100}
    >
      <Flex align="center" justify="space-around" h="60px">
        {/* First tab */}
        {tabs.slice(0, 1).map(({ label, href, icon: TabIcon }) => {
          const active = pathname === href;
          return (
            <Flex
              key={href}
              direction="column"
              align="center"
              gap="2px"
              flex={1}
              as="button"
              onClick={() => router.push(href)}
              color={active ? "brand.500" : "gray.500"}
              _hover={{ color: "brand.400" }}
              transition="color 0.15s"
            >
              <TabIcon />
              <Text fontSize="9px" fontWeight={active ? "bold" : "normal"} letterSpacing="0.04em">
                {label.toUpperCase()}
              </Text>
            </Flex>
          );
        })}

        {/* FAB center button */}
        <Flex flex={1} justify="center" position="relative">
          <Box
            as="button"
            w="52px"
            h="52px"
            bg="brand.500"
            borderRadius="full"
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxShadow="0 4px 24px rgba(224,56,0,0.5)"
            position="absolute"
            bottom="8px"
            _hover={{ bg: "brand.400", transform: "scale(1.05)" }}
            transition="all 0.15s"
            onClick={() => router.push("/create")}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="none">
              <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </Box>
        </Flex>

        {/* Last tab */}
        {tabs.slice(1).map(({ label, href, icon: TabIcon }) => {
          const active = pathname === href;
          return (
            <Flex
              key={href}
              direction="column"
              align="center"
              gap="2px"
              flex={1}
              as="button"
              onClick={() => router.push(href)}
              color={active ? "brand.500" : "gray.500"}
              _hover={{ color: "brand.400" }}
              transition="color 0.15s"
            >
              <TabIcon />
              <Text fontSize="9px" fontWeight={active ? "bold" : "normal"} letterSpacing="0.04em">
                {label.toUpperCase()}
              </Text>
            </Flex>
          );
        })}
      </Flex>
    </Box>
  );
}

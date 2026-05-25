import { Box, Flex, Text } from "@chakra-ui/react";

interface TrustScoreBarProps {
  score: number;
}

export function TrustScoreBar({ score }: TrustScoreBarProps) {
  const pct = Math.min(Math.max(score, 0), 100);
  const color = pct >= 75 ? "green.400" : pct >= 40 ? "brand.400" : "red.400";

  return (
    <Box>
      <Flex justify="space-between" mb={1}>
        <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider">
          Trust Score
        </Text>
        <Text fontSize="xs" fontWeight="bold" color={color}>
          {pct}
        </Text>
      </Flex>
      <Box bg="surface.input" borderRadius="full" h="6px" overflow="hidden">
        <Box bg={color} h="full" w={`${pct}%`} borderRadius="full" transition="width 0.6s ease" />
      </Box>
    </Box>
  );
}

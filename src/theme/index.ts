import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

/** Dark Mode Triad — README Role0 */
export const theme = extendTheme({
  config,
  colors: {
    brand: {
      50: "#fff0eb",
      100: "#ffd0be",
      200: "#ffaf8f",
      300: "#ff8e60",
      400: "#ff6d31",
      500: "#e03800",
      600: "#b32c00",
      700: "#862100",
      800: "#591600",
      900: "#2d0b00",
    },
    surface: {
      bg: "#0B0B0F",
      card: "#12121a",
      input: "#1a1a24",
    },
  },
  styles: {
    global: {
      body: {
        bg: "surface.bg",
        color: "gray.100",
      },
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: "brand",
      },
    },
    Input: {
      variants: {
        filled: {
          field: {
            bg: "surface.input",
            borderColor: "whiteAlpha.100",
            color: "gray.100",
            _hover: { bg: "surface.input" },
            _focus: { bg: "surface.input", borderColor: "brand.500" },
            _placeholder: { color: "gray.600" },
          },
        },
      },
      defaultProps: {
        variant: "filled",
      },
    },
  },
});

export default theme;

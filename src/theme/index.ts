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
      50: "#ebe4ff",
      100: "#c9b8ff",
      200: "#a38bff",
      300: "#7d5eff",
      400: "#5731ff",
      500: "#3800e0",
      600: "#2d00b3",
      700: "#220086",
      800: "#160059",
      900: "#0b002d",
    },
    accent: {
      orange: "#e03800",
      green: "#00e038",
    },
    surface: {
      bg: "#0B0B0F",
      card: "#12121a",
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
  },
});

export default theme;

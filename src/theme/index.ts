import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

export const theme = extendTheme({
  config,
  fonts: {
    heading: "'Inter', system-ui, -apple-system, sans-serif",
    body: "'Inter', system-ui, -apple-system, sans-serif",
  },
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
      cardTranslucent: "rgba(18, 18, 26, 0.95)",
      hover: "#1f1f2e",
    },
  },
  radii: {
    card: "20px",
    input: "12px",
    button: "12px",
    sheet: "16px",
    modal: "20px",
    chip: "9999px",
  },
  styles: {
    global: {
      ":root": {
        "--nav-height": "60px",
      },
      body: {
        bg: "surface.bg",
        color: "gray.100",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        textRendering: "optimizeLegibility",
      },
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: "brand",
      },
      baseStyle: {
        fontWeight: "600",
        minH: "44px",
        _active: {
          transform: "scale(0.97)",
        },
      },
    },
    Input: {
      variants: {
        filled: {
          field: {
            bg: "surface.input",
            borderColor: "whiteAlpha.100",
            color: "gray.100",
            borderRadius: "input",
            _hover: { bg: "surface.input" },
            _focus: { bg: "surface.input", borderColor: "brand.500" },
            _placeholder: { color: "gray.500" },
          },
        },
      },
      defaultProps: {
        variant: "filled",
      },
    },
    Textarea: {
      variants: {
        filled: {
          bg: "surface.input",
          borderColor: "whiteAlpha.100",
          color: "gray.100",
          borderRadius: "input",
          _hover: { bg: "surface.input" },
          _focus: { bg: "surface.input", borderColor: "brand.500", boxShadow: "none" },
          _placeholder: { color: "gray.500" },
        },
      },
      defaultProps: {
        variant: "filled",
      },
    },
    Tag: {
      baseStyle: {
        container: {
          borderRadius: "chip",
          fontWeight: "500",
          fontSize: "xs",
        },
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: "surface.card",
          border: "1px solid",
          borderColor: "whiteAlpha.100",
          borderRadius: "modal",
        },
        header: {
          color: "white",
          fontSize: "md",
        },
        closeButton: {
          color: "gray.400",
        },
        overlay: {
          bg: "blackAlpha.800",
          backdropFilter: "blur(4px)",
        },
      },
    },
    Heading: {
      baseStyle: {
        color: "white",
        letterSpacing: "-0.02em",
      },
    },
    Skeleton: {
      defaultProps: {
        startColor: "surface.card",
        endColor: "surface.input",
      },
    },
  },
});

export default theme;

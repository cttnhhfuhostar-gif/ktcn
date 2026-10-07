// tailwind.config.js - Màu sắc, font, spacing của Design System (Tailwind CDN)
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "on-secondary-fixed-variant": "#003ea8",
        "on-secondary-fixed": "#00174b",
        "secondary-container": "#316bf3",
        "inverse-primary": "#b6c4ff",
        "on-secondary": "#ffffff",
        "primary-fixed-dim": "#b6c4ff",
        primary: "#00236f",
        "secondary-fixed-dim": "#b4c5ff",
        "on-secondary-container": "#fefcff",
        error: "#ba1a1a",
        background: "#faf8ff",
        "secondary-fixed": "#dbe1ff",
        "error-container": "#ffdad6",
        outline: "#757682",
        "tertiary-container": "#5c3800",
        surface: "#faf8ff",
        secondary: "#0051d5",
        "surface-container": "#eaedff",
        "surface-container-low": "#f2f3ff",
        "on-tertiary-fixed-variant": "#653e00",
        "on-tertiary": "#ffffff",
        "on-primary": "#ffffff",
        "surface-container-highest": "#dae2fd",
        "tertiary-fixed": "#ffddb8",
        "tertiary-fixed-dim": "#ffb95f",
        "primary-container": "#1e3a8a",
        "surface-dim": "#d2d9f4",
        "on-primary-fixed-variant": "#264191",
        "primary-fixed": "#dce1ff",
        "inverse-surface": "#283044",
        "surface-tint": "#4059aa",
        "on-primary-fixed": "#00164e",
        "on-primary-container": "#90a8ff",
        "on-tertiary-container": "#ef9900",
        "on-surface-variant": "#444651",
        "on-surface": "#131b2e",
        "on-tertiary-fixed": "#2a1700",
        "surface-container-high": "#e2e7ff",
        "inverse-on-surface": "#eef0ff",
        "on-background": "#131b2e",
        "on-error": "#ffffff",
        "surface-container-lowest": "#ffffff",
        tertiary: "#3e2400",
        "outline-variant": "#c5c5d3",
        "surface-variant": "#dae2fd",
        "surface-bright": "#faf8ff",
        "on-error-container": "#93000a",
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem",
      },
      spacing: {
        "space-md": "1rem",
        "space-xs": "0.25rem",
        gutter: "1.5rem",
        "space-xl": "2.5rem",
        "space-lg": "1.5rem",
        "space-sm": "0.5rem",
        margin: "2rem",
      },
      fontFamily: {
        "body-md": [
          "Be Vietnam Pro",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
        "headline-md": [
          "Space Grotesk",
          "'Be Vietnam Pro'",
          "sans-serif",
        ],
        "label-md": [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
        "label-sm": [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
        "body-lg": [
          "Be Vietnam Pro",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        "headline-xl": [
          "Space Grotesk",
          "'Be Vietnam Pro'",
          "sans-serif",
        ],
        "headline-xl-mobile": [
          "Space Grotesk",
          "'Be Vietnam Pro'",
          "sans-serif",
        ],
        "button-text": [
          "Be Vietnam Pro",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        "headline-sm": [
          "Space Grotesk",
          "'Be Vietnam Pro'",
          "sans-serif",
        ],
        "headline-lg": [
          "Space Grotesk",
          "'Be Vietnam Pro'",
          "sans-serif",
        ],
        "headline-lg-mobile": [
          "Space Grotesk",
          "'Be Vietnam Pro'",
          "sans-serif",
        ],
        "body-sm": [
          "Be Vietnam Pro",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      fontSize: {
        "body-md": [
          "1rem", // 16px - Đạt chuẩn WCAG & UX theo yêu cầu
          { lineHeight: "1.65rem", fontWeight: "400" },
        ],
        "headline-md": [
          "1.25rem",
          { lineHeight: "1.75rem", fontWeight: "600" },
        ],
        "label-md": [
          "0.875rem", // 14px
          {
            lineHeight: "1.25rem",
            letterSpacing: "0.01em",
            fontWeight: "500",
          },
        ],
        "label-sm": [
          "0.78125rem", // 12.5px
          {
            lineHeight: "1.125rem",
            letterSpacing: "0.015em",
            fontWeight: "500",
          },
        ],
        "body-lg": [
          "1.125rem", // 18px
          { lineHeight: "1.75rem", fontWeight: "400" },
        ],
        "headline-xl": [
          "2.25rem",
          {
            lineHeight: "2.75rem",
            letterSpacing: "-0.02em",
            fontWeight: "700",
          },
        ],
        "headline-xl-mobile": [
          "1.75rem",
          {
            lineHeight: "2.25rem",
            letterSpacing: "-0.015em",
            fontWeight: "700",
          },
        ],
        "button-text": [
          "0.9375rem", // 15px
          { lineHeight: "1.375rem", fontWeight: "600" },
        ],
        "headline-sm": [
          "1.125rem",
          { lineHeight: "1.5rem", fontWeight: "600" },
        ],
        "headline-lg": [
          "1.75rem",
          {
            lineHeight: "2.25rem",
            letterSpacing: "-0.015em",
            fontWeight: "600",
          },
        ],
        "headline-lg-mobile": [
          "1.375rem",
          {
            lineHeight: "1.75rem",
            letterSpacing: "-0.01em",
            fontWeight: "600",
          },
        ],
        "body-sm": [
          "0.875rem", // 14px thay vì 12px để không bị quá nhỏ
          { lineHeight: "1.45rem", fontWeight: "400" },
        ],
      },
    },
  },
};

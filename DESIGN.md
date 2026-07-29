---
name: Bookxboi
description: Neo-Minimalist & Soft Brutalist digital book reader and bookshelf web app
colors:
  ink-black: "#111111"
  paper-white: "#F7F4EF"
  canvas-light: "#F5F2EB"
  canvas-dark: "#EFECE6"
  contrast-midnight: "#1C2321"
  accent-ochre: "#E87034"
  accent-gold: "#D4AF37"
  gold-alpha: "rgba(212, 175, 55, 0.4)"
  amber-alpha: "rgba(232, 112, 52, 0.85)"
  glass-bg: "rgba(255, 255, 255, 0.15)"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(2.5rem, 6vw, 4.5rem)"
    fontWeight: 700
    lineHeight: 0.98
  headline:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.15
  title:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.6
  label:
    fontFamily: "Fira Code, JetBrains Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.15em"
  micro:
    fontFamily: "Fira Code, JetBrains Mono, monospace"
    fontSize: "0.625rem"
    fontWeight: 700
    letterSpacing: "0.2em"
rounded:
  none: "0px"
  xs: "2px"
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  brutal-badge:
    backgroundColor: "{colors.ink-black}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.none}"
    padding: "4px 10px"
  brutal-card:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.none}"
    padding: "24px"
  brutal-btn-primary:
    backgroundColor: "{colors.accent-ochre}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.none}"
    padding: "14px 28px"
---

# Design System: Bookxboi

## Overview

**Creative North Star: "Neo Minimal & Soft Brutalism"**

Bookxboi is a high-craft, distraction-free digital reading workspace combining Neo-Minimalist whitespace and contemporary editorial typography with soft brutalist outline geometry and tactile micro-interactions.

## Colors

Stark ink black (`#111111`), warm paper canvas (`#F7F4EF`), and high-energy editorial accents (`#E87034`, `#D4AF37`).

### Primary
- **Ink Black** (#111111): Primary typography, 2px borders, and structural framing.
- **Accent Ochre** (#E87034): Primary CTA backgrounds, key highlights, and active state badges.

### Secondary & Accent
- **Accent Gold** (#D4AF37): Secondary editorial highlights and progress indicators.
- **Gold Alpha** (rgba(212, 175, 55, 0.4)): Glow and focus rings.

### Neutral
- **Paper White** (#F7F4EF): Primary surface canvas color.
- **Canvas Light** (#F5F2EB): Secondary warm paper background.
- **Midnight Contrast** (#1C2321): Reading view text contrast.

## Typography

- **Display Font:** Playfair Display (Serif)
- **Body Font:** Inter / Hind Siliguri (Sans-serif)
- **Label / Micro Font:** Fira Code / JetBrains Mono (Monospace)

### Hierarchy
- **Display** (700, clamp(2.5rem, 6vw, 4.5rem), 0.98): Hero mastheads and editorial titles.
- **Headline** (600, 1.75rem, 1.15): Section headers.
- **Title** (600, 1.25rem, 1.25): Book card titles.
- **Body** (400, 1rem, 1.6): Reader body text.
- **Label** (700 monospace, 0.75rem, 0.15em tracking): Buttons and badge labels.
- **Micro** (700 monospace, 0.625rem, 0.2em tracking): Metadata stamps and status tags.

## Layout

Strict grid alignment with clean, generous whitespace. Max-width containers (max-w-4xl, max-w-screen-2xl) enforce optimal line lengths and scannability.

## Elevation & Depth

Tactile offset shadows (`box-shadow: 4px 4px 0px #111111`, `5px 5px 0px #F7F4EF`) replacing soft ambient drop shadows. Crisp 2px solid borders define all component bounds.

## Shapes

Sharp structural geometry (`0px` to `4px` radius) for cards and badges, giving a tactile, architectural feel.

## Do's and Don'ts

### Do:
- **Do** use 2px solid dark borders (`#111111`) and offset box shadows for soft brutalist component hierarchy.
- **Do** pair serif headlines with uppercase monospace metadata for contemporary editorial contrast.

### Don't:
- **Don't** use generic default blue or plain red colors; stick strictly to the documented `#111111`, `#F7F4EF`, and `#E87034` palette.

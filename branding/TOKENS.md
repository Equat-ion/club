# Design Tokens: Club

## 1. Brand Identity
**Name:** Club  
**Persona:** Energetic Startup (Playful, vibrant, energetic, friendly)  
**Target Audience:** Club Volunteers and Leaders  
**Vibe:** Eco / Natural (Forest Greens and Earthy Tones)  

## 2. Visual Design Tokens

### Brand Color Palette (Eco-Energetic)

| Token | Light Mode | Dark Mode | Tailwind Class | Usage |
|-------|------------|-----------|----------------|-------|
| Primary (Emerald) | `#059669` | `#34d399` | `text-club-primary` | Links, primary buttons, active states |
| Primary Light | `#34d399` | `#6ee7b7` | `text-club-primary-light` | Hover states, accents |
| Primary 50 | `#ecfdf5` | `#064e3b` | `bg-club-primary-50` | Light backgrounds |
| Secondary (Amber) | `#d97706` | `#fbbf24` | `text-club-secondary` | Secondary buttons, highlights |
| Accent (Lime) | `#84cc16` | `#bef264` | `text-club-accent` | Energetic accents, success states |
| Earth (Brown) | `#78350f` | `#fde68a` | `text-club-earth` | Strong emphasis, borders |
| Forest (Dark) | `#064e3b` | `#ecfdf5` | `text-club-forest` | Maximum contrast, headings |

### Semantic State Colors

| State | Color | Light BG | Border | Tailwind Prefix |
|-------|-------|----------|--------|-----------------|
| Success | `#10b981` | `#d1fae5` | `#6ee7b7` | `club-success` |
| Error | `#ef4444` | `#fee2e2` | `#fca5a5` | `club-error` |
| Warning | `#f59e0b` | `#fef3c7` | `#fcd34d` | `club-warning` |
| Info | `#3b82f6` | `#dbeafe` | `#93c5fd` | `club-info` |

### Typography

| Element | Font Family | Weight | Usage |
|---------|-------------|--------|-------|
| Headings | Hanken Grotesk (wide) | 700 | Page titles, major sections |
| Subheadings | Hanken Grotesk | 600 | Card titles, labels |
| Body | Inter / Sans-Serif | 400 | General text, descriptions |
| UI | Inter / Sans-Serif | 500 | Buttons, navigation, tabs |

### Spacing (8px Grid)

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Icon gaps |
| `space-2` | 8px | Inline elements |
| `space-4` | 16px | Component padding |
| `space-6` | 24px | Section gaps |
| `space-8` | 32px | Major sections |
| `space-12` | 48px | Page sections |

## 3. Visual Guidelines

- **Corner Radius:** 12px (Rounded for a friendly, playful look).
- **Shadows:** Soft, natural shadows (e.g., `shadow-md` with earthy tint).
- **Gradients:** Subtle natural gradients (e.g., Forest Green to Emerald).
## 4. AI Brand Prompts

Use these prompts with AI tools to maintain brand consistency.

### 4.1 UI Component Prompt
"Act as a Senior Frontend Engineer. Design a [COMPONENT_NAME] for the 'Club' application. The style must be 'Energetic Startup' with an 'Eco / Natural' palette. Use Emerald Green (#059669) as the primary color and Amber (#d97706) as the secondary. Ensure a 12px corner radius and soft natural shadows. The vibe should be playful yet professional, targeting club volunteers and leaders."

### 4.2 Copywriting Prompt
"Write a [CONTENT_TYPE] for 'Club', a platform for club volunteers. Use an energetic, friendly, and encouraging tone. Avoid corporate jargon. Focus on community empowerment and simplicity. Use natural metaphors where appropriate (e.g., growth, roots, flourishing)."

### 4.3 Image Generation Prompt (Midjourney/DALL-E)
"Professional modern software interface for club management, eco-friendly aesthetic, forest green and emerald color palette, vibrant lime accents, clean sans-serif typography, high-quality UI/UX design, playful and energetic vibe, soft natural lighting, volumetric shadows --v 6.0"

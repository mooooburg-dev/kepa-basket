# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kepa Basket is a Korean price comparison mobile web application designed to work within React Native WebView. It enables barcode scanning for price comparison using the Coupang Partners API.

## Development Commands

### Essential Commands

```bash
# Development with Turbopack
npm run dev

# Production build
npm run build

# Lint code
npm run lint

# Start production server
npm run start
```

### Environment Setup

- Requires Node.js 22.17.1 (specified in `.nvmrc`)
- Environment variable `COUPANG_API_KEY` must be set for API functionality

## Architecture Overview

### Tech Stack

- **Next.js 15.4.5** with App Router
- **React 19.1.1** with TypeScript 5.9.2
- **Tailwind CSS 4.1.11** for styling
- **React Native WebView** integration for mobile

### Core Directory Structure

- `app/` - Next.js App Router pages and API routes
- `components/common/` - Reusable UI components (Button, Card, Input)
- `lib/` - Business logic (Coupang API integration, similarity algorithms)
- `types/` - TypeScript type definitions
- `utils/` - Utility functions and constants

### Key Integration Points

#### React Native WebView Communication

The application communicates with the native mobile app through:

- `window.ReactNativeWebView.postMessage()` for sending messages
- Global type declarations in `types/index.ts`

#### Coupang API Integration

- Product search functionality in `lib/searchCoupang.ts`
- Uses string similarity matching for product comparison
- Requires API key configuration

### Code Style and Quality

#### Formatting Rules (Prettier)

- Semicolons: Yes
- Single quotes
- 80 character line width
- 2 space indentation

#### Linting Rules

- ESLint with Next.js and TypeScript configurations
- Prettier formatting enforced as errors
- Console logs limited to warnings/errors only
- Unused variables with underscore prefix allowed

### Mobile-Specific Considerations

- Safe area insets configured in Tailwind
- Mobile viewport optimization
- Korean language support (lang="ko")
- WebView-specific global types

### Development Notes

- No testing framework currently implemented
- API routes directory exists but not yet developed
- Uses Turbopack for faster development builds
- Path aliases configured in TypeScript (@/\* for root imports)

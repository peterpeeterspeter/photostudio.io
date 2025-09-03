# Overview

Photostudio.io is an AI-powered boutique image editor specifically designed for fashion and apparel photography. The application provides intelligent image editing capabilities with preset templates for common fashion photography needs like studio backgrounds, ghost mannequin effects, lifestyle scenes, and flatlay compositions. Built as a web application, it leverages Google's Gemini AI for advanced image processing while maintaining high standards for garment accuracy and professional fashion photography requirements.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: Next.js 15 with App Router for modern React development
- **Styling**: Tailwind CSS for utility-first styling with additional CDN loading for enhanced flexibility
- **State Management**: React hooks (useState, useRef, useMemo) for local component state
- **File Handling**: Browser File API with drag-and-drop support and file validation (18MB limit, image types only)

## Backend Architecture
- **API Design**: Next.js App Router API routes using the `/api` directory structure
- **Runtime**: Node.js runtime for server-side processing with Buffer API support
- **Request Handling**: Multipart form-data processing for image uploads
- **Error Handling**: Comprehensive validation for file types, sizes, and content restrictions

## Image Processing Pipeline
- **AI Integration**: Google Gemini 2.5 Flash Image Preview model for advanced image editing
- **Prompt Engineering**: Preset-based prompt system with built-in guardrails for garment accuracy
- **Output Format**: Base64-encoded image responses converted to blob URLs for client display
- **Quality Assurance**: Automatic inclusion of fabric texture preservation, color accuracy, and proportion maintenance instructions

## Security and Compliance
- **Content Filtering**: EEA-compliant content restrictions with keyword filtering
- **CORS Configuration**: Cross-origin resource sharing headers for Replit deployment compatibility
- **Input Validation**: Server-side validation for file types, sizes, and prompt content
- **Error Boundaries**: Comprehensive error handling with user-friendly messaging

# External Dependencies

## AI Services
- **Google Gemini AI**: Primary image processing engine using the `@google/genai` package
- **Model**: Gemini 2.5 Flash Image Preview for fashion-specific image editing capabilities
- **Authentication**: Google Auth Library integration for API access

## Development Dependencies
- **Next.js**: React framework for full-stack development
- **React 19**: Latest React version for modern component architecture
- **TypeScript Support**: Type definitions included for enhanced development experience

## Styling and UI
- **Tailwind CSS**: Utility-first CSS framework with PostCSS and Autoprefixer
- **CDN Integration**: Additional Tailwind CSS loading via CDN for enhanced styling options

## Environment Configuration
- **Replit Optimization**: Special configuration for Replit hosting environment
- **Production Settings**: Asset prefix handling and CORS configuration for deployment
- **Development Mode**: Hot reloading and development server on port 3000
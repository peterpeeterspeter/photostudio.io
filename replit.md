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
- **Dual Processing Modes**: Standard single-shot editing (2-5 seconds) and Advanced multi-stage pipeline (30-60 seconds)
- **Standard Mode**: Google Gemini 2.5 Flash Image Preview model for fast AI editing
- **Advanced Pipeline**: Multi-stage processing chain:
  1. Background removal with fal.ai BiRefNet for clean alpha masks
  2. Primary AI editing with Gemini 2.5 Flash Image
  3. Background harmonization using fal.ai Flux models for lighting consistency
  4. Upscaling with Real-ESRGAN via Replicate API for 2x-4x quality enhancement
- **Batch Processing**: Supabase-powered system for processing up to 25 images with database persistence and real-time status tracking
- **Prompt Engineering**: Preset-based prompt system with built-in guardrails for garment accuracy
- **Output Format**: Base64-encoded or URL-based image responses with quality optimization
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
- **fal.ai Integration**: Advanced background removal (BiRefNet), harmonization, and specialized models via `@fal-ai/serverless-client`
- **Replicate API**: High-quality image upscaling with Real-ESRGAN for post-processing enhancement
- **Webhook Support**: Async processing capabilities for batch operations and real-time status updates
- **Authentication**: Secure API key management for all integrated services

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
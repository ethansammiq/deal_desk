# Deal Desk Application

## Project Overview
A comprehensive deal desk application that leverages AI and advanced analytics to streamline commercial deal submission, approval tracking, and support request management.

**Core Technologies:**
- TypeScript for robust type checking
- Node.js and React for dynamic frontend
- Tailwind CSS for responsive design
- Anthropic AI integration for intelligent deal assessment
- Standardized form components for consistent user experience

## Project Architecture

### Backend Structure
- **Express.js Server** (`server/index.ts`) - Main application entry point
- **Storage Layer** (`server/storage.ts`) - Handles data persistence with in-memory storage
- **AI Integration** (`server/anthropic.ts`) - Claude AI for deal analysis and recommendations
- **API Routes** (`server/routes.ts`) - RESTful endpoints for deal management
- **Database Schema** (`shared/schema.ts`) - Drizzle ORM schema definitions

### Frontend Structure
- **React with Wouter** for routing and state management
- **TanStack Query** for server state management
- **React Hook Form + Zod** for form validation
- **Shadcn/UI + Tailwind** for component library and styling
- **DealGenie Chatbot** for AI-powered user assistance

### Key Features
- Deal submission with tiered and flat commit structures
- Real-time AI analysis and recommendations
- Dashboard with deal tracking and statistics
- Intelligent chatbot for user guidance
- Comprehensive form validation and error handling

## Current Technical Debt Status

### Critical Issues (🔴 High Priority)
1. **Type Safety Problems** - Dashboard component has 8 type errors
2. **Schema Mismatches** - Frontend/backend data model inconsistencies
3. **Mock Data Dependencies** - Hardcoded stats instead of real calculations
4. **Storage Type Errors** - 11 LSP diagnostics in storage layer

### Active Development Areas
- Fixing type safety issues across components
- Implementing real statistics calculations
- Refactoring oversized form components
- Cleaning up unused dependencies

## Recent Changes
- **2025-01-08**: Completed comprehensive technical debt analysis
- **2025-01-08**: Identified 20 LSP diagnostics requiring immediate attention
- **2025-01-08**: Documented schema mismatches between frontend and backend

## User Preferences
- Focus on production-ready code quality
- Prioritize type safety and error handling
- Maintain comprehensive documentation
- Use authentic data over mock/placeholder data

## Development Guidelines
- Always check LSP diagnostics before committing changes
- Update this file when making architectural changes
- Follow the full-stack JavaScript development guidelines
- Use in-memory storage exclusively as requested
- Maintain consistent error handling patterns

## Next Steps
1. Fix critical type errors in Dashboard component
2. Align Deal schema with frontend requirements
3. Replace mock stats with real database calculations
4. Extract business logic from oversized components
5. Implement comprehensive error boundaries
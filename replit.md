# Deal Desk Application

## Overview
This project is a comprehensive deal desk application designed to streamline commercial deal submission, approval tracking, and support request management. It leverages AI and advanced analytics to provide intelligent deal assessment and recommendations, aiming to improve efficiency and decision-making in commercial operations. The application aims to deliver intelligent insights and recommendations for deals, offer real-time deal tracking and performance statistics through a dashboard, and provide AI-powered assistance via an intelligent chatbot (DealGenie).

## User Preferences
- Focus on production-ready code quality
- Prioritize type safety and error handling
- Maintain comprehensive documentation
- Use authentic data over mock/placeholder data

## System Architecture

### Core Technologies
- **TypeScript**: For robust type checking.
- **Node.js**: Backend runtime environment.
- **React**: Frontend library for building dynamic user interfaces.
- **Tailwind CSS**: For responsive styling.
- **Wouter**: Lightweight routing.
- **TanStack Query**: For efficient server state management.
- **React Hook Form + Zod**: For robust form validation and schema definition.
- **Shadcn/UI**: Component library for standardized UI elements.

### Backend Structure
- **Express.js Server**: Main application entry point for API requests.
- **In-memory Storage**: Used for data persistence.
- **API Routes**: Defines RESTful endpoints for deal management, submission, and tracking.
- **Drizzle ORM**: Used for database schema definitions.

### Frontend Structure
- **Component-Based Design**: Extensive use of reusable components for consistency and reduced redundancy.
- **Hook-Based Logic**: Utilizes custom React hooks for encapsulating complex state management and business logic.
- **Multi-Step Forms**: Designed for user experience, breaking forms into logical, manageable steps (max 5 steps).
- **UI/UX Decisions**: Emphasizes consistent user experience through standardized form components and a clear, functional layout, with a focus on consistent styling across all financial sections.

### Key Features
- **Deal Submission**: Supports both tiered and flat commit structures.
- **Real-time AI Analysis**: Provides intelligent insights and recommendations for deals.
- **Dashboard**: Offers real-time deal tracking and performance statistics.
- **Intelligent Chatbot (DealGenie)**: AI-powered assistance for users.
- **Comprehensive Form Validation**: Ensures data integrity and user input accuracy.
- **Centralized Constants**: Business logic constants are centralized for easy management and consistency.
- **Error Handling**: Implemented comprehensive error boundaries, loading states, and query state handling for robust application behavior.
- **Performance Optimization**: Includes TanStack Query optimization, component memoization, hook optimization, and lazy loading for improved performance.
- **Data Structure Consolidation**: Unified data structures across the application, particularly for incentives and financial calculations, ensuring a single source of truth.

## Current Development Priority
- **Phase 7**: Deal Flow & Status Management Implementation (CURRENT PRIORITY)
  - **Critical Need**: Implement 9-status workflow (Scoping → Submitted → Under Review → Negotiating → Approved → Legal Review → Contract Sent → Signed → Lost)
  - **User Roles**: Seller, Approver, Legal Team with role-based permissions and dashboard views
  - **Form Connection**: Direct conversion from deal scoping request to deal submission with pre-filled data
  - **Action Centers**: Role-specific dashboards with workflow management capabilities
  - **Lost Deal Tracking**: Granular categorization (Commercial, Product, Timing, No Response, Internal, Others)
  - **Future Integration**: Linksquare contract management integration for Legal Review and Contract Sent statuses

## External Dependencies
- **Anthropic AI (Claude)**: Integrated for intelligent deal assessment, analysis, and recommendations.
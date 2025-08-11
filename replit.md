# Deal Desk Application

## Overview
This project is a comprehensive deal desk application designed to streamline commercial deal submission, approval tracking, and support request management. It leverages AI and advanced analytics to provide intelligent deal assessment and recommendations, aiming to improve efficiency and decision-making in commercial operations.

## User Preferences
- Focus on production-ready code quality
- Prioritize type safety and error handling
- Maintain comprehensive documentation
- Use authentic data over mock/placeholder data

## System Architecture

### Core Technologies
- **TypeScript**: For robust type checking and improved code quality.
- **Node.js**: Backend runtime environment.
- **React**: Frontend library for building dynamic user interfaces.
- **Tailwind CSS**: For responsive and utility-first styling.
- **Wouter**: Lightweight routing for React applications.
- **TanStack Query**: For efficient server state management.
- **React Hook Form + Zod**: For robust form validation and schema definition.
- **Shadcn/UI**: Component library for standardized UI elements.

### Backend Structure
- **Express.js Server**: Main application entry point for handling API requests.
- **In-memory Storage**: Used for data persistence.
- **API Routes**: Defines RESTful endpoints for deal management, submission, and tracking.
- **Drizzle ORM**: Used for database schema definitions (though currently in-memory).

### Frontend Structure
- **Component-Based Design**: Extensive use of reusable components like `FormFieldWithTooltip`, `FormSelectField`, `ConditionalFieldGroup`, `FinancialInputGroup`, and `DateRangeInput` to ensure consistency and reduce redundancy.
- **Hook-Based Logic**: Utilizes custom React hooks such as `useDealTiers`, `useDealFormValidation`, and `useIncentiveSelection` for encapsulating complex state management and business logic.
- **Multi-Step Forms**: Designed with user experience in mind, ensuring forms like "SubmitDeal" and "RequestSupport" are broken into logical, manageable steps (max 5 steps).
- **UI/UX Decisions**: Emphasizes consistent user experience through standardized form components and a clear, functional layout.

### Key Features
- **Deal Submission**: Supports both tiered and flat commit structures.
- **Real-time AI Analysis**: Provides intelligent insights and recommendations for deals.
- **Dashboard**: Offers real-time deal tracking and performance statistics.
- **Intelligent Chatbot (DealGenie)**: AI-powered assistance for users.
- **Comprehensive Form Validation**: Ensures data integrity and user input accuracy.
- **Centralized Constants**: Business logic constants are centralized for easy management and consistency.

## External Dependencies
- **Anthropic AI (Claude)**: Integrated for intelligent deal assessment, analysis, and recommendations.
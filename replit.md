# Club Security Management System

## Overview

This is a full-stack web application for managing nightclub security operations, including guest management, banned guest tracking, guestlists, and real-time communication between security personnel. The application is built with a modern tech stack featuring React frontend, Express backend, PostgreSQL database, and real-time WebSocket communication.

## System Architecture

### Frontend Architecture
- **React** with TypeScript for the user interface
- **Vite** for fast development and building
- **Tailwind CSS** with shadcn/ui components for styling
- **React Router (Wouter)** for client-side routing
- **TanStack React Query** for server state management
- **React Hook Form** with Zod validation for form handling
- **i18next** for internationalization support

### Backend Architecture
- **Express.js** with TypeScript for the REST API server
- **Passport.js** with local strategy for authentication
- **Express sessions** with PostgreSQL session store
- **WebSocket Server** for real-time communication
- **Drizzle ORM** for database operations and schema management

### Database Architecture
- **PostgreSQL** as the primary database
- **Neon Database** serverless connection for cloud deployment
- **Drizzle Kit** for database migrations and schema management

## Key Components

### Authentication & Authorization
- Role-based access control with six user roles:
  - `super_admin`: Full system access
  - `admin`: Administrative functions
  - `club_manager`: Club-specific management
  - `security_teamleader`: Team leadership functions
  - `security_personnel`: Basic security operations
  - `club_employee`: Limited access
- Session-based authentication with secure password hashing
- Automatic password change requirement for new users

### Data Models
- **Users**: System users with role-based permissions
- **Clubs**: Venue information and management
- **Banned Guests**: Guest ban tracking with status management
- **Guestlists**: Event-based guest approval system
- **Chat Messages**: Real-time communication between staff
- **Activity Logs**: System action tracking and auditing

### Real-time Features
- WebSocket connections for live updates
- Role-based message broadcasting
- Real-time notifications for security events
- Live chat system between security personnel

### User Interface
- Responsive design with mobile-first approach
- Dark/light theme support
- Modular component architecture using shadcn/ui
- Dashboard with quick actions and status overview
- Dedicated pages for each major function

## Data Flow

1. **Authentication Flow**: Users log in through the auth page, creating a session stored in PostgreSQL
2. **API Requests**: Frontend makes authenticated requests to Express API endpoints
3. **Database Operations**: Express routes use Drizzle ORM to interact with PostgreSQL
4. **Real-time Updates**: WebSocket connections broadcast updates to relevant users based on roles
5. **State Management**: React Query manages server state with optimistic updates

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database ORM
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store
- **ws**: WebSocket implementation

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **react-hook-form**: Form state management
- **zod**: Schema validation

## Deployment Strategy

### Development Environment
- **Replit** development environment with PostgreSQL module
- **Vite dev server** for frontend with HMR
- **tsx** for TypeScript execution
- **Port 5000** for the application server

### Production Build
- **Vite build** for optimized frontend bundle
- **esbuild** for server-side TypeScript compilation
- **Autoscale deployment** target on Replit
- Static file serving from Express

### Database Management
- **Drizzle migrations** for schema changes
- **Environment variables** for database connection
- **Automatic database provisioning** check

## Recent Changes

### December 18, 2024 - Enhanced Guestlist Management & Bookmetender Integration
- **Fixed Guestlist Functionality**: Resolved React hooks errors and API endpoint mismatches preventing proper guest management
- **Enhanced Date/Time Picker**: Improved UX with future date validation, helper text, and better visual styling
- **Bookmetender Integration Workflow**: Complete integration system for connecting guestlists to Bookmetender events
  - API key and event ID configuration dialog
  - Automatic guest data synchronization
  - Real-time approval status sync
  - Visual indicators for connected events
- **Manage Guests Interface**: Fixed navigation and functionality for comprehensive guest management within guestlists
- **Demo User System**: Created complete demo accounts for all user roles with proper club assignments
- **Super Admin Impersonation**: Enhanced user impersonation feature for testing different role perspectives

### June 17, 2025 - SMS Notifications & Live Chat Integration
- **SMS Notification System**: Integrated SMS alerts with ID verification system using Twilio/SendGrid APIs
- **Enhanced Live Chat**: Real-time messaging system with WebSocket support, contact management, and message threading
- **ID Scanning Alerts**: Automatic SMS notifications sent to security team when banned guests are detected
- **Chat API Infrastructure**: Complete REST endpoints for chat contacts (/api/chat/contacts), messages (/api/chat/messages), and real-time WebSocket communication
- **Database Schema Fixes**: Resolved date validation issues in banned guest creation and improved message handling

### June 17, 2025 - Comprehensive Platform Management System
- **Platform Settings**: Complete super admin control panel with SMTP configuration, security policies, feature toggles, and system maintenance settings
- **License Management**: 16-character license key generation system with organization tracking, feature control, and expiration management
- **Plugin Architecture**: Foundation for extensible plugin system with license-based activation, configuration management, and installation controls
- **Enhanced Navigation**: Added dedicated super admin sections in sidebar with proper role-based access control
- **User Settings**: Individual user profile management separate from platform-wide settings
- **API Infrastructure**: Complete REST endpoints for platform settings (/api/platform/settings), license management (/api/platform/licenses), and plugin management (/api/plugins)

### Key Features Added
- ✅ Platform branding and configuration control
- ✅ SMTP and notification system settings
- ✅ Security policy management (passwords, sessions, login attempts)
- ✅ Feature flags for system capabilities
- ✅ License generation with XESS-XXXX-XXXX-XXXX-XXXX format
- ✅ Plugin installation and configuration framework
- ✅ User password change functionality
- ✅ Comprehensive activity logging for all admin actions

## Changelog
- June 17, 2025: Comprehensive Platform Management System implementation
- June 14, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.
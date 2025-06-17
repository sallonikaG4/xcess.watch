# XESS - Club Security Management System

A comprehensive multilingual SaaS web application for club and event management with role-based authentication, banned guest management, guestlist functionality, and real-time communication.

## Features Implemented

### 🔐 Authentication & Authorization
- **Role-based Access Control** with 6 distinct user roles:
  - `super_admin`: Full system access and user management
  - `admin`: Administrative functions and user management (excluding super admins)
  - `club_manager`: Club-specific management and operations
  - `security_teamleader`: Team leadership and security operations
  - `security_personnel`: Basic security operations and guest management
  - `club_employee`: Limited access to assigned functions

- **Secure Authentication System**:
  - Session-based authentication with PostgreSQL session store
  - Password hashing using scrypt with salt
  - Automatic password change requirement for new users
  - Password reset functionality for administrators

### 🏢 Clubs Management
- **Complete Club CRUD Operations**:
  - Add, edit, and delete club venues
  - License key management and validation
  - Club status tracking (active/inactive)
  - Location information (address, city, country)
  - License status monitoring (active, inactive, expired, suspended)

- **Role-based Permissions**:
  - Only super admins and admins can manage clubs
  - View-only access for other roles
  - Proper validation and error handling

### 👥 Users Management
- **Comprehensive User Management**:
  - Create, edit, and manage user accounts
  - Role assignment with hierarchical permissions
  - User status management (active/inactive)
  - Password reset and force password change
  - Search and filter functionality by role and status

- **Advanced Role Management**:
  - Hierarchical role system preventing lower roles from managing higher ones
  - Self-protection (users cannot deactivate their own accounts)
  - Role-specific available actions and permissions
  - Automatic role validation and assignment restrictions

### 🚫 Banned Guests Management
- **Complete Ban Tracking System**:
  - Add, edit, and track banned individuals
  - Multiple ban statuses: Short-term, Long-term, Revoked, Reinstated
  - Detailed incident documentation and police report tracking
  - ID verification support (Passport, National ID, Driver's License)
  - Club-specific ban management

- **Advanced Ban Features**:
  - Ban revocation with reason tracking
  - Incident date and description logging
  - Police incident number tracking
  - Search and filter by status, club, and personal information
  - Audit trail for all ban-related actions

### 🎨 User Interface & Experience
- **Modern Responsive Design**:
  - Clean, professional interface using Tailwind CSS and shadcn/ui
  - Mobile-first responsive design
  - Dark/light theme support with theme toggle
  - Consistent navigation with collapsible sidebar

- **Multilingual Support**:
  - i18next integration for internationalization
  - Support for multiple languages (English/German configured)
  - Easy addition of new languages

### 🔄 Real-time Features
- **WebSocket Integration**:
  - Real-time chat functionality between security personnel
  - Live notifications for security events
  - Role-based message broadcasting
  - Connection state management

### 📊 Dashboard & Analytics
- **Comprehensive Dashboard**:
  - Real-time statistics display
  - Recent activity tracking
  - Quick action buttons for common tasks
  - Active ban monitoring and alerts

## Technical Architecture

### Frontend Stack
- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and optimized builds
- **TanStack React Query** for server state management and caching
- **React Hook Form** with Zod validation for form handling
- **Wouter** for lightweight client-side routing
- **Tailwind CSS** with shadcn/ui for consistent design system

### Backend Stack
- **Express.js** with TypeScript for REST API server
- **Passport.js** with local strategy for authentication
- **Express sessions** with PostgreSQL session persistence
- **WebSocket Server** for real-time communication
- **Drizzle ORM** for type-safe database operations

### Database
- **PostgreSQL** with comprehensive schema design
- **Neon Database** for serverless cloud deployment
- **Session persistence** and user data management
- **Activity logging** and audit trails

## Recent Changes & Updates

### June 17, 2025 - Major Feature Implementation

#### ✅ Clubs Logic Implementation
- **Complete CRUD Operations**: Full create, read, update, delete functionality for club management
- **License Management**: License key validation and status tracking
- **Role-based Access**: Only super admins and admins can manage clubs
- **Responsive UI**: Card-based layout with edit/delete actions
- **Form Validation**: Comprehensive form validation with error handling
- **Real-time Updates**: Automatic UI updates using React Query cache invalidation

#### ✅ Users Logic with Role-based Access
- **Hierarchical Permission System**: 6-tier role hierarchy with appropriate access controls
- **Advanced User Management**: Create, edit, activate/deactivate users with role restrictions
- **Self-protection Mechanisms**: Users cannot manage their own accounts or higher-level roles
- **Password Management**: Password reset functionality and forced password changes
- **Search & Filter**: Advanced filtering by role, status, and search terms
- **User Status Tracking**: Active/inactive status with last login tracking

#### ✅ Banned Guests Logic
- **Comprehensive Ban System**: Full lifecycle management of banned individuals
- **Multiple Ban Types**: Short-term, long-term, revoked, and reinstated statuses
- **Detailed Documentation**: Incident tracking, police reports, and ID verification
- **Revocation System**: Ban revocation with reason tracking and audit trails
- **Advanced Search**: Multi-criteria filtering by status, club, and personal information
- **Role-based Permissions**: Appropriate access controls for different user roles

#### ✅ Guestlists Management System
- **Event-based Guestlists**: Create and manage event-specific guest approval lists
- **Guest Entry Management**: Add, edit, and track individual guests with full contact information
- **Capacity Tracking**: Monitor guest count against maximum event capacity
- **Status Management**: Complete guest lifecycle from pending to checked-in
- **Check-in Functionality**: One-click guest check-in with timestamp tracking
- **Advanced Filtering**: Search and filter guests by status, name, or contact information
- **Role-based Permissions**: Appropriate access for different security personnel levels
- **Real-time Updates**: Live guest count and status updates across the system

#### ✅ User Settings & Profile Management
- **Personal Profile Management**: Users can edit their own information, email, and contact details
- **Password Management**: Secure password change with current password verification
- **Password Visibility Toggle**: Enhanced UX with show/hide password functionality
- **Profile Summary**: Visual display of user role, status, and account information
- **Security Information**: Display password status and security guidelines
- **Form Validation**: Comprehensive client-side validation for all profile updates
- **Responsive Design**: Mobile-friendly tabbed interface for settings management

#### ✅ UI/UX Enhancements
- **CSS Hover Fix**: Fixed navigation hover states to show white text on blue background
- **Consistent Navigation**: Improved sidebar navigation with proper active/inactive states
- **Enhanced Forms**: Better form layouts with proper spacing and visual hierarchy
- **Professional Design**: Polished card-based layouts with consistent styling
- **Loading States**: Proper loading indicators and skeleton screens
- **Error Handling**: User-friendly error messages and validation feedback

#### 🔧 Technical Improvements
- **TypeScript Enhancements**: Fixed compilation errors and improved type safety
- **Database Optimization**: Improved query performance and data relationships
- **Schema Alignment**: Corrected field name mismatches between frontend and backend
- **API Completeness**: Full REST API coverage for all CRUD operations
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Form Validation**: Robust client and server-side validation
- **Real-time Communication**: WebSocket integration for live updates

### Previous Updates

#### June 14, 2025 - Initial Setup
- **Project Foundation**: Initial setup with modern tech stack
- **Authentication System**: Basic login/register functionality
- **Database Schema**: Comprehensive PostgreSQL schema design
- **UI Framework**: Tailwind CSS and shadcn/ui integration
- **Routing Setup**: Protected routes and navigation structure

## Database Schema

### Core Tables
- **users**: User accounts with role-based permissions
- **clubs**: Club venues with license management
- **banned_guests**: Comprehensive ban tracking
- **guestlists**: Event-based guest management
- **chat_messages**: Real-time communication
- **activity_logs**: System audit trails
- **notifications**: User notification system

### Relationships
- Users can be assigned to multiple clubs
- Banned guests are associated with specific clubs
- Activity logs track all system changes
- Chat messages support club-specific and direct communication

## Security Features

### Authentication Security
- **Secure Password Storage**: Scrypt hashing with random salts
- **Session Management**: PostgreSQL-backed session persistence
- **Role-based Authorization**: Granular permission controls
- **Password Policies**: Forced password changes and complexity requirements

### Data Protection
- **Input Validation**: Comprehensive client and server-side validation
- **SQL Injection Prevention**: Parameterized queries with Drizzle ORM
- **XSS Protection**: Proper input sanitization and output encoding
- **CSRF Protection**: Session-based request validation

## Deployment & Environment

### Development Environment
- **Replit Integration**: Optimized for Replit development environment
- **Hot Module Replacement**: Fast development with Vite HMR
- **TypeScript Compilation**: Real-time type checking and compilation
- **Database Migrations**: Automated schema management with Drizzle

### Production Readiness
- **Optimized Builds**: Vite production builds with tree shaking
- **Static Asset Serving**: Efficient static file handling
- **Environment Configuration**: Proper environment variable management
- **Error Monitoring**: Comprehensive error handling and logging

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Environment variables configured

### Installation
```bash
# Install dependencies
npm install

# Set up database
npm run db:push

# Start development server
npm run dev
```

### Environment Variables
```
DATABASE_URL=your_postgresql_url
SESSION_SECRET=your_session_secret
```

## Usage

### User Roles & Permissions

#### Super Admin
- Full system access
- Manage all users including other admins
- Complete club management
- System configuration

#### Admin  
- Manage users (except super admins)
- Complete club management
- Ban management
- User role assignment

#### Club Manager
- Manage assigned club operations
- Ban management for assigned clubs
- User management for club staff
- Guestlist management

#### Security Team Leader
- Team management functions
- Ban management and revocation
- Guest verification
- Incident reporting

#### Security Personnel
- Guest verification and check-in
- Basic ban management
- Incident logging
- Communication access

#### Club Employee
- Basic guest services
- Limited system access
- Communication access

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user

### Users Management
- `GET /api/users` - List all users (admin only)
- `POST /api/users` - Create new user (admin only)
- `PATCH /api/users/:id` - Update user (admin only)
- `POST /api/users/:id/reset-password` - Reset user password

### Clubs Management
- `GET /api/clubs` - List all clubs
- `POST /api/clubs` - Create new club (admin only)
- `PATCH /api/clubs/:id` - Update club (admin only)
- `DELETE /api/clubs/:id` - Delete club (admin only)

### Banned Guests
- `GET /api/banned-guests` - List banned guests
- `POST /api/banned-guests` - Add new ban
- `PATCH /api/banned-guests/:id` - Update ban status
- `GET /api/banned-guests/search` - Search banned guests

## Contributing

### Development Guidelines
- Follow TypeScript best practices
- Use consistent naming conventions
- Implement proper error handling
- Write comprehensive comments
- Test all new functionality

### Code Style
- Use ESLint and Prettier configurations
- Follow React and Express.js best practices
- Implement proper TypeScript types
- Use semantic commit messages

## License

This project is proprietary software developed for club security management.

## Support

For technical support or feature requests, please contact the development team.

---

**Last Updated**: June 17, 2025  
**Version**: 1.1.0  
**Status**: Production Ready
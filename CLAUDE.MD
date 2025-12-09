# GKVK Login Portal - Project Context

## Project Overview
GKVK Login Portal is an Angular-based web application for managing authentication, user administration, and reporting for GKVK (Gandhi Krishi Vignana Kendra). The system includes role-based access control, unit management, and comprehensive reporting features.

## Tech Stack
- **Framework**: Angular 19.2.0
- **Language**: TypeScript 5.7.2
- **UI**: Bootstrap 5.3.7
- **Authentication**: JWT (jsonwebtoken, jwt-decode)
- **Storage**: Azure Blob Storage (@azure/storage-blob)
- **Document Generation**:
  - PDF: jsPDF, jspdf-autotable, html2pdf.js
  - DOCX: docx library
- **HTTP Client**: Axios
- **Additional Libraries**:
  - ng-multiselect-dropdown
  - ng-otp-input
  - ngx-pagination
  - ngx-filter-pipe

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── guards/          # Auth guards for route protection
│   │   ├── models/          # Data models (User, Admin, Units, etc.)
│   │   └── services/        # Core services (User, Units, Password, etc.)
│   ├── interceptors/        # HTTP interceptors (Auth)
│   ├── pages/              # Feature components
│   │   ├── edit-units/
│   │   ├── manageadmins/
│   │   ├── layout/
│   │   │   ├── main/
│   │   │   ├── header/
│   │   │   └── left-sidebar/
│   │   ├── login/
│   │   ├── profile/
│   │   └── password/
│   ├── app.config.ts       # Application configuration
│   └── app.routes.ts       # Routing configuration
├── assets/
│   └── images/
└── main.ts
```

## Key Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (UserRoles model)
- Auth guards for protected routes
- Auth interceptor for HTTP requests
- OTP-based verification
- Password reset functionality

### User Management
- Admin management
- Unit-based organization
- User profiles
- Employee type categorization

### Location Data
- State management
- District management
- Institute management

### Reporting & Documents
- PDF report generation (jsPDF with autotable)
- DOCX file downloads
- Unit-based reports
- UnitHead statistics
- IBTVA reports
- ATIC reports
- FIU table reports

### Azure Integration
- Azure Blob Storage integration for file storage

## Development Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Build and deploy (with base href)
npm run build-deploy

# Watch mode (auto-rebuild on changes)
npm run watch

# Run tests
npm test
```

## Recent Development Activity

Recent commits show active development in:
1. **Package updates** - Latest dependency management
2. **UnitHead Statistics** - Fixed and enhanced unit head stats
3. **DOCX Downloads** - Implemented DOCX file download functionality
4. **Unit-based Reports** - Finalized unit-based changes for PDF reports
5. **FIU Table** - New FIU table component
6. **IBTVA Reports** - ATIC report enhancements

## Important Files

- `package.json` - Dependencies and scripts
- `angular.json` - Angular project configuration
- `tsconfig.json` - TypeScript configuration
- `src/app/app.routes.ts` - Application routing
- `src/app/app.config.ts` - App-level configuration
- `src/app/interceptors/auth.interceptor.ts` - HTTP authentication
- `src/app/core/guards/auth.guard.ts` - Route protection

## Environment Notes

- Base deployment path: `/dashboard/`
- Uses environment-based configuration (dotenv)
- Supports production and development builds

## Data Models

Key models include:
- `User` - User account information
- `Admin` - Administrative users
- `Units` - Organizational units
- `Institute` - Institute information
- `States` - State data
- `Districts` - District data
- `UserRoles` - Role definitions
- `GenderEnum` - Gender enumeration
- `EmpTypeEnum` - Employee type enumeration

## Common Development Patterns

1. **Services**: Located in `src/app/core/services/`
2. **Models**: TypeScript interfaces in `src/app/core/models/`
3. **Guards**: Route protection in `src/app/core/guards/`
4. **Components**: Feature pages in `src/app/pages/`
5. **Interceptors**: HTTP interceptors in `src/app/interceptors/`

## Git Branch Strategy

- Main development branch: Track from git status
- Feature branches: Use `claude/` prefix for AI-assisted development
- Always commit with clear, descriptive messages

## Notes for AI Assistance

- This is an active project with frequent updates to reporting features
- Unit-based functionality is a core feature
- PDF and DOCX generation are important capabilities
- Authentication and authorization are critical - maintain security best practices
- Bootstrap is used for styling - maintain consistency with existing UI patterns
- Follow Angular 19 best practices (standalone components, signals, etc.)

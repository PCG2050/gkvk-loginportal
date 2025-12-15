/**
 * Azure Storage folder organization models
 * Defines the hierarchical structure for file storage
 */

export enum FileCategory {
  PROFILE_PICTURE = 'profile-pics',
  DOCUMENT = 'documents',
  PHOTO = 'photos',
  REPORT = 'reports',
  CERTIFICATE = 'certificates',
  LOGO = 'logos',
  OTHER = 'other'
}

export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  UNITHEAD = 'unithead',
  TRAINER = 'trainer'
}

export interface FileUploadContext {
  file: File;
  containerName: string;

  // User information
  userId: number;
  userRole: UserRole;

  // Unit information (optional, required for trainers/unitheads)
  unitName?: string;
  unitId?: number;

  // File categorization
  category: FileCategory;

  // Additional metadata
  isPublic?: boolean;
  customPath?: string; // Override automatic path generation
}

export interface FilePathInfo {
  fullPath: string;
  containerName: string;
  segments: {
    unit?: string;
    role?: string;
    userId: number;
    category: string;
    filename: string;
  };
}

/**
 * Folder structure convention:
 *
 * For Profile Pictures:
 *   profile-pics/{userId}/avatar.jpg
 *
 * For Superadmin/Admin:
 *   {role}/{userId}/{category}/filename.ext
 *   Example: admin/123/documents/policy.pdf
 *
 * For UnitHead:
 *   units/{unitName}/unitheads/{userId}/{category}/filename.ext
 *   Example: units/gkvk-bangalore/unitheads/456/documents/report.pdf
 *
 * For Trainer:
 *   units/{unitName}/trainers/{userId}/{category}/filename.ext
 *   Example: units/gkvk-bangalore/trainers/789/documents/certificate.pdf
 */

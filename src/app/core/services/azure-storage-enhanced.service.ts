import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { BlobServiceClient } from '@azure/storage-blob';
import { AzureStorageService, FileUploadResult } from './azure-storage.service';
import {
  FileUploadContext,
  FilePathInfo,
  FileCategory,
  UserRole
} from '../models/azure-storage.models';

/**
 * Enhanced Azure Storage Service with hierarchical folder organization
 *
 * Folder Structure:
 * ================
 *
 * Profile Pictures (Public Container):
 *   profile-pics/{userId}/avatar.jpg
 *
 * Superadmin/Admin Files (Private Container):
 *   {role}/{userId}/{category}/filename.ext
 *   Examples:
 *     - admin/123/documents/policy.pdf
 *     - superadmin/1/reports/annual-report.xlsx
 *
 * UnitHead Files (Private Container):
 *   units/{unitName}/unitheads/{userId}/{category}/filename.ext
 *   Examples:
 *     - units/gkvk-bangalore/unitheads/456/documents/report.pdf
 *     - units/gkvk-bangalore/unitheads/456/photos/team-photo.jpg
 *
 * Trainer Files (Private Container):
 *   units/{unitName}/trainers/{userId}/{category}/filename.ext
 *   Examples:
 *     - units/gkvk-bangalore/trainers/789/documents/certificate.pdf
 *     - units/gkvk-bangalore/trainers/789/photos/event.jpg
 *
 * Organization Logos (Public Container):
 *   logos/{organizationId}/logo.png
 */
@Injectable({
  providedIn: 'root'
})
export class AzureStorageEnhancedService {
  constructor(private baseStorageService: AzureStorageService) {}

  /**
   * Build the blob path based on user role, unit, and file category
   * @param context File upload context
   * @returns Constructed blob path
   */
  private buildBlobPath(context: FileUploadContext): string {
    // If custom path is provided, use it
    if (context.customPath) {
      return `${context.customPath}/${context.file.name}`;
    }

    const { userId, userRole, unitName, category, file } = context;

    // Profile pictures go in a dedicated folder
    if (category === FileCategory.PROFILE_PICTURE) {
      return `profile-pics/${userId}/${file.name}`;
    }

    // Organization logos
    if (category === FileCategory.LOGO) {
      return `logos/${userId}/${file.name}`;
    }

    // Superadmin and Admin files
    if (userRole === UserRole.SUPERADMIN || userRole === UserRole.ADMIN) {
      return `${userRole}/${userId}/${category}/${file.name}`;
    }

    // UnitHead and Trainer files (must have unitName)
    if (userRole === UserRole.UNITHEAD || userRole === UserRole.TRAINER) {
      if (!unitName) {
        throw new Error(`Unit name is required for ${userRole} file uploads`);
      }

      // Sanitize unit name (remove spaces, lowercase, replace special chars)
      const sanitizedUnitName = this.sanitizeUnitName(unitName);
      const roleFolder = userRole === UserRole.UNITHEAD ? 'unitheads' : 'trainers';

      return `units/${sanitizedUnitName}/${roleFolder}/${userId}/${category}/${file.name}`;
    }

    // Fallback: simple userId/category structure
    return `${userId}/${category}/${file.name}`;
  }

  /**
   * Sanitize unit name for use in blob paths
   * @param unitName Original unit name
   * @returns Sanitized unit name
   */
  private sanitizeUnitName(unitName: string): string {
    return unitName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, '') // Remove special characters
      .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
  }

  /**
   * Upload a file with intelligent path generation
   * @param context File upload context
   * @returns Observable with upload result
   */
  uploadFileWithContext(context: FileUploadContext): Observable<FileUploadResult> {
    try {
      const blobPath = this.buildBlobPath(context);
      const isPublic = context.isPublic ?? this.shouldBePublic(context.category);

      console.log('📁 Generated blob path:', blobPath);
      console.log('🔒 Container:', context.containerName, '| Public:', isPublic);

      // Get SAS token and upload
      return this.baseStorageService.getSasToken(context.containerName, isPublic, 'rwdl').pipe(
        switchMap(sasResponse => {
          return this.uploadFileToBlob(
            context.file,
            context.containerName,
            blobPath,
            sasResponse.sasToken
          );
        }),
        catchError(error => {
          console.error('❌ Error uploading file:', error);
          return throwError(() => ({
            success: false,
            blobUrl: '',
            fileName: context.file.name,
            errorMessage: error.message || 'Failed to upload file'
          }));
        })
      );
    } catch (error: any) {
      return throwError(() => ({
        success: false,
        blobUrl: '',
        fileName: context.file.name,
        errorMessage: error.message
      }));
    }
  }

  /**
   * Determine if a file category should be in public container
   * @param category File category
   * @returns True if should be public
   */
  private shouldBePublic(category: FileCategory): boolean {
    const publicCategories = [
      FileCategory.PROFILE_PICTURE,
      FileCategory.LOGO
    ];
    return publicCategories.includes(category);
  }

  /**
   * Upload file to blob storage using SAS token
   */
  private uploadFileToBlob(
    file: File,
    containerName: string,
    blobName: string,
    sasToken: string
  ): Observable<FileUploadResult> {
    const containerUrl = `${this.getStorageAccountUrl()}/${containerName}?${sasToken}`;
    const blobServiceClient = new BlobServiceClient(containerUrl);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    return from(
      blockBlobClient.uploadData(file, {
        blobHTTPHeaders: {
          blobContentType: file.type
        }
      })
    ).pipe(
      map(() => ({
        success: true,
        blobUrl: blockBlobClient.url.split('?')[0],
        fileName: file.name
      })),
      catchError(error => {
        console.error('Blob upload error:', error);
        return throwError(() => ({
          success: false,
          blobUrl: '',
          fileName: file.name,
          errorMessage: error.message || 'Blob upload failed'
        }));
      })
    );
  }

  /**
   * Get storage account URL (configure this based on your Azure storage account)
   */
  private getStorageAccountUrl(): string {
    // TODO: Configure this with your actual Azure storage account name
    return 'https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net';
  }

  /**
   * Parse a blob path into its components
   * @param blobPath Full blob path
   * @returns Parsed path information
   */
  parseFilePath(blobPath: string): FilePathInfo {
    const segments = blobPath.split('/');

    // Profile picture format: profile-pics/{userId}/filename
    if (segments[0] === 'profile-pics') {
      return {
        fullPath: blobPath,
        containerName: '', // Will be set by caller
        segments: {
          userId: parseInt(segments[1]),
          category: FileCategory.PROFILE_PICTURE,
          filename: segments[2]
        }
      };
    }

    // Logo format: logos/{orgId}/filename
    if (segments[0] === 'logos') {
      return {
        fullPath: blobPath,
        containerName: '',
        segments: {
          userId: parseInt(segments[1]),
          category: FileCategory.LOGO,
          filename: segments[2]
        }
      };
    }

    // Units format: units/{unitName}/{role}/{userId}/{category}/filename
    if (segments[0] === 'units') {
      return {
        fullPath: blobPath,
        containerName: '',
        segments: {
          unit: segments[1],
          role: segments[2],
          userId: parseInt(segments[3]),
          category: segments[4],
          filename: segments[5]
        }
      };
    }

    // Admin/Superadmin format: {role}/{userId}/{category}/filename
    if (segments[0] === 'admin' || segments[0] === 'superadmin') {
      return {
        fullPath: blobPath,
        containerName: '',
        segments: {
          role: segments[0],
          userId: parseInt(segments[1]),
          category: segments[2],
          filename: segments[3]
        }
      };
    }

    // Fallback: simple format {userId}/{category}/filename
    return {
      fullPath: blobPath,
      containerName: '',
      segments: {
        userId: parseInt(segments[0]),
        category: segments[1],
        filename: segments[2]
      }
    };
  }

  /**
   * List files for a user in a specific category
   * @param containerName Container name
   * @param context User and category context
   * @returns Observable with list of file paths
   */
  listUserFiles(
    containerName: string,
    userId: number,
    userRole: UserRole,
    category?: FileCategory,
    unitName?: string
  ): Observable<string[]> {
    // Build the prefix based on role
    let prefix: string;

    if (category === FileCategory.PROFILE_PICTURE) {
      prefix = `profile-pics/${userId}/`;
    } else if (userRole === UserRole.SUPERADMIN || userRole === UserRole.ADMIN) {
      prefix = category
        ? `${userRole}/${userId}/${category}/`
        : `${userRole}/${userId}/`;
    } else if (userRole === UserRole.UNITHEAD || userRole === UserRole.TRAINER) {
      if (!unitName) {
        return throwError(() => new Error('Unit name required for listing files'));
      }
      const sanitizedUnitName = this.sanitizeUnitName(unitName);
      const roleFolder = userRole === UserRole.UNITHEAD ? 'unitheads' : 'trainers';
      prefix = category
        ? `units/${sanitizedUnitName}/${roleFolder}/${userId}/${category}/`
        : `units/${sanitizedUnitName}/${roleFolder}/${userId}/`;
    } else {
      prefix = category ? `${userId}/${category}/` : `${userId}/`;
    }

    return this.baseStorageService.listFiles(containerName, prefix);
  }

  /**
   * Delete a file by its full path
   * @param containerName Container name
   * @param blobPath Full blob path
   * @param isPublic Whether container is public
   * @returns Observable with success status
   */
  deleteFileByPath(
    containerName: string,
    blobPath: string,
    isPublic: boolean = false
  ): Observable<boolean> {
    return this.baseStorageService.deleteFile(containerName, blobPath, isPublic);
  }

  /**
   * Get URL for a file (with SAS token if private)
   * @param containerName Container name
   * @param blobPath Full blob path
   * @param isPublic Whether container is public
   * @returns Observable with file URL
   */
  getFileUrl(
    containerName: string,
    blobPath: string,
    isPublic: boolean = false
  ): Observable<string> {
    if (isPublic) {
      return new Observable(observer => {
        observer.next(this.baseStorageService.getPublicFileUrl(containerName, blobPath));
        observer.complete();
      });
    } else {
      return this.baseStorageService.getPrivateFileUrl(containerName, blobPath);
    }
  }

  /**
   * Helper: Upload profile picture
   */
  uploadProfilePicture(
    userId: number,
    file: File,
    publicContainerName: string
  ): Observable<FileUploadResult> {
    return this.uploadFileWithContext({
      file,
      containerName: publicContainerName,
      userId,
      userRole: UserRole.TRAINER, // Role doesn't matter for profile pics
      category: FileCategory.PROFILE_PICTURE,
      isPublic: true
    });
  }

  /**
   * Helper: Upload trainer document
   */
  uploadTrainerDocument(
    trainerId: number,
    unitName: string,
    file: File,
    privateContainerName: string
  ): Observable<FileUploadResult> {
    return this.uploadFileWithContext({
      file,
      containerName: privateContainerName,
      userId: trainerId,
      userRole: UserRole.TRAINER,
      unitName,
      category: FileCategory.DOCUMENT,
      isPublic: false
    });
  }

  /**
   * Helper: Upload unit head document
   */
  uploadUnitHeadDocument(
    unitHeadId: number,
    unitName: string,
    file: File,
    privateContainerName: string
  ): Observable<FileUploadResult> {
    return this.uploadFileWithContext({
      file,
      containerName: privateContainerName,
      userId: unitHeadId,
      userRole: UserRole.UNITHEAD,
      unitName,
      category: FileCategory.DOCUMENT,
      isPublic: false
    });
  }

  /**
   * Helper: Upload organization logo
   */
  uploadOrganizationLogo(
    organizationId: number,
    file: File,
    publicContainerName: string
  ): Observable<FileUploadResult> {
    return this.uploadFileWithContext({
      file,
      containerName: publicContainerName,
      userId: organizationId,
      userRole: UserRole.ADMIN,
      category: FileCategory.LOGO,
      isPublic: true
    });
  }
}

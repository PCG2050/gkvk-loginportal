import { Injectable } from '@angular/core';
import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';

export type UploadFolder = 'Profile' | 'Content';

@Injectable({
  providedIn: 'root'
})
export class AzureStorageService {

  // SAS URL from your Azure Storage Account
  private readonly SAS_URL =
    'https://tdms.blob.core.windows.net/tdms-public?sp=racwdl&st=2025-11-20T05:13:26Z&se=2026-08-31T13:28:26Z&spr=https&sv=2024-11-04&sr=c&sig=uLnirWkHAmInI%2BD2swIpR%2F0oh83S9pns2s5pDG%2BaBMg%3D';

  private readonly CONTAINER_NAME = 'tdms-public';

  // Allowed file types for profile pictures
  private readonly ALLOWED_IMAGE_TYPES = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp'
  ];

  // Allowed file types for content
  private readonly ALLOWED_CONTENT_TYPES = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/pdf',
    'text/plain',
    'text/csv',
    ...this.ALLOWED_IMAGE_TYPES
  ];

  constructor() {}

  /**
   * Upload a file to Azure Blob Storage with folder structure: {userId}/{folder}/{filename}
   *
   * @param file - The file to upload
   * @param userId - The user ID for folder organization
   * @param folder - The folder type ('Profile' or 'Content')
   * @param maxSizeMB - Maximum file size in MB (default: 10MB)
   * @returns Promise<string> - The public URL of the uploaded file
   */
  async uploadFileAsync(
    file: File,
    userId: string | number,
    folder: UploadFolder = 'Profile',
    maxSizeMB: number = 10
  ): Promise<string> {
    try {
      // Validation: Check if file exists
      if (!file) {
        throw new Error('No file selected.');
      }

      // Validation: Check file type
      const allowedTypes = folder === 'Profile'
        ? this.ALLOWED_IMAGE_TYPES
        : this.ALLOWED_CONTENT_TYPES;

      if (!allowedTypes.includes(file.type)) {
        const fileTypeMessage = folder === 'Profile'
          ? 'Please upload an image file (PNG, JPEG, JPG, GIF, or WEBP).'
          : 'Invalid file type. Please upload a supported format.';
        throw new Error(fileTypeMessage);
      }

      // Validation: Check file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        throw new Error(`File size exceeds ${maxSizeMB}MB limit.`);
      }

      // Create BlobServiceClient using SAS URL
      const blobServiceClient = new BlobServiceClient(this.SAS_URL);

      // Get container client
      const containerClient = blobServiceClient.getContainerClient(this.CONTAINER_NAME);

      // Generate blob path: {userId}/{folder}/{timestamp}_{filename}
      const timestamp = Date.now();
      const sanitizedFileName = this.sanitizeFileName(file.name);
      const blobPath = `${userId}/${folder}/${timestamp}_${sanitizedFileName}`;

      // Create block blob client
      const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(blobPath);

      // Upload file with progress tracking
      console.log(`📤 Uploading file to: ${blobPath}`);

      await blockBlobClient.uploadBrowserData(file, {
        blobHTTPHeaders: {
          blobContentType: file.type,
          blobCacheControl: 'public, max-age=31536000' // Cache for 1 year
        },
        onProgress: (progress) => {
          const percentage = ((progress.loadedBytes / file.size) * 100).toFixed(2);
          console.log(`Upload progress: ${percentage}%`);
        }
      });

      // Get the public URL (remove SAS token for cleaner URL)
      const publicUrl = blockBlobClient.url.split('?')[0];

      console.log('✅ File uploaded successfully:', publicUrl);
      return publicUrl;

    } catch (error: any) {
      console.error('❌ Azure upload error:', error);
      throw new Error(error.message || 'Failed to upload file to Azure Storage');
    }
  }

  /**
   * Upload profile picture specifically
   *
   * @param file - The profile picture file
   * @param userId - The user ID
   * @returns Promise<string> - The public URL of the profile picture
   */
  async uploadProfilePicture(file: File, userId: string | number): Promise<string> {
    return this.uploadFileAsync(file, userId, 'Profile', 5); // 5MB limit for profile pictures
  }

  /**
   * Upload content file
   *
   * @param file - The content file
   * @param userId - The user ID
   * @returns Promise<string> - The public URL of the content file
   */
  async uploadContentFile(file: File, userId: string | number): Promise<string> {
    return this.uploadFileAsync(file, userId, 'Content', 10); // 10MB limit for content
  }

  /**
   * Sanitize filename to remove special characters and spaces
   *
   * @param fileName - Original filename
   * @returns Sanitized filename
   */
  private sanitizeFileName(fileName: string): string {
    // Replace spaces with underscores and remove special characters
    return fileName
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .toLowerCase();
  }

  /**
   * Delete a blob from Azure Storage
   *
   * @param blobUrl - The full URL of the blob to delete
   * @returns Promise<boolean> - True if deleted successfully
   */
  async deleteBlob(blobUrl: string): Promise<boolean> {
    try {
      // Extract blob name from URL
      const urlParts = blobUrl.split('/');
      const blobName = urlParts.slice(4).join('/'); // Everything after container name

      const blobServiceClient = new BlobServiceClient(this.SAS_URL);
      const containerClient = blobServiceClient.getContainerClient(this.CONTAINER_NAME);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.delete();
      console.log('✅ Blob deleted successfully:', blobUrl);
      return true;

    } catch (error) {
      console.error('❌ Failed to delete blob:', error);
      return false;
    }
  }
}

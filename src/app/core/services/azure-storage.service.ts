import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, throwError, forkJoin } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { BlobServiceClient, ContainerClient, BlockBlobClient } from '@azure/storage-blob';
import { Endpoints } from '../../shared/endpoints.model';

export interface SasTokenResponse {
  sasToken: string;
  containerName: string;
  expiresOn: string;
  isPublic: boolean;
}

export interface ContainerInfo {
  containerName: string;
  isPublic: boolean;
  createdOn?: string;
}

export interface FileUploadOptions {
  file: File;
  containerName: string;
  userId: number;
  folder?: string; // Optional subfolder within userId folder
  isPublic?: boolean;
}

export interface FileUploadResult {
  success: boolean;
  blobUrl: string;
  fileName: string;
  errorMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AzureStorageService {
  private readonly STORAGE_ACCOUNT_URL = 'https://tdms.blob.core.windows.net';

  constructor(private http: HttpClient) {}

  /**
   * Request a SAS token from the backend for a specific container
   * @param containerName The name of the container
   * @param isPublic Whether this is a public or private container
   * @param permissions Permissions required (r=read, w=write, d=delete, l=list)
   */
  getSasToken(containerName: string, isPublic: boolean = false, permissions: string = 'rwdl'): Observable<SasTokenResponse> {
    const body = { containerName, isPublic, permissions };

    return this.http.post<SasTokenResponse>(Endpoints.storageSasToken, body).pipe(
      catchError(error => {
        console.error('Error getting SAS token:', error);
        return throwError(() => new Error('Failed to get SAS token'));
      })
    );
  }

  /**
   * Create a new container for an organization
   * @param organizationId The organization ID
   * @param privateContainerName Name for private container
   * @param publicContainerName Name for public container
   */
  createOrganizationContainers(
    organizationId: number,
    privateContainerName: string,
    publicContainerName: string
  ): Observable<{privateContainer: ContainerInfo, publicContainer: ContainerInfo}> {
    const body = {
      organizationId,
      privateContainerName,
      publicContainerName
    };

    return this.http.post<{privateContainer: ContainerInfo, publicContainer: ContainerInfo}>(
      Endpoints.storageCreateContainers,
      body
    ).pipe(
      catchError(error => {
        console.error('Error creating containers:', error);
        return throwError(() => new Error('Failed to create containers'));
      })
    );
  }

  /**
   * Upload a file to Azure Blob Storage
   * @param options File upload options including file, container, userId, etc.
   */
  uploadFile(options: FileUploadOptions): Observable<FileUploadResult> {
    const { file, containerName, userId, folder, isPublic = false } = options;

    // Construct the blob path: {userId}/{folder}/{filename}
    const folderPath = folder ? `${userId}/${folder}` : `${userId}`;
    const blobName = `${folderPath}/${file.name}`;

    // Get SAS token first, then upload
    return this.getSasToken(containerName, isPublic, 'rwdl').pipe(
      switchMap(sasResponse => {
        return this.uploadFileToBlob(file, containerName, blobName, sasResponse.sasToken);
      }),
      catchError(error => {
        console.error('Error uploading file:', error);
        return throwError(() => ({
          success: false,
          blobUrl: '',
          fileName: file.name,
          errorMessage: error.message || 'Failed to upload file'
        }));
      })
    );
  }

  /**
   * Upload file to blob storage using SAS token
   * @param file The file to upload
   * @param containerName Container name
   * @param blobName Blob name (path)
   * @param sasToken SAS token with write permissions
   */
  private uploadFileToBlob(
    file: File,
    containerName: string,
    blobName: string,
    sasToken: string
  ): Observable<FileUploadResult> {
    const containerUrl = `${this.STORAGE_ACCOUNT_URL}/${containerName}?${sasToken}`;
    const blobServiceClient = new BlobServiceClient(containerUrl);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Convert promise to observable
    return from(
      blockBlobClient.uploadData(file, {
        blobHTTPHeaders: {
          blobContentType: file.type
        }
      })
    ).pipe(
      map(() => ({
        success: true,
        blobUrl: blockBlobClient.url.split('?')[0], // Remove SAS token from URL
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
   * Upload multiple files in parallel
   * @param files Array of files to upload
   * @param containerName Container name
   * @param userId User ID for folder organization
   * @param folder Optional subfolder
   */
  uploadMultipleFiles(
    files: File[],
    containerName: string,
    userId: number,
    folder?: string,
    isPublic?: boolean
  ): Observable<FileUploadResult[]> {
    const uploadObservables = files.map(file =>
      this.uploadFile({ file, containerName, userId, folder, isPublic })
    );

    // Use forkJoin to wait for all uploads to complete
    return forkJoin(uploadObservables).pipe(
      catchError(error => {
        console.error('Error uploading multiple files:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a file from blob storage
   * @param containerName Container name
   * @param blobName Blob name (full path)
   * @param isPublic Whether this is a public container
   */
  deleteFile(containerName: string, blobName: string, isPublic: boolean = false): Observable<boolean> {
    return this.getSasToken(containerName, isPublic, 'rwdl').pipe(
      switchMap(sasResponse => {
        const containerUrl = `${this.STORAGE_ACCOUNT_URL}/${containerName}?${sasResponse.sasToken}`;
        const blobServiceClient = new BlobServiceClient(containerUrl);
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        return from(blockBlobClient.delete()).pipe(
          map(() => true),
          catchError(error => {
            console.error('Error deleting blob:', error);
            return throwError(() => false);
          })
        );
      })
    );
  }

  /**
   * Get a public URL for a file (for public containers)
   * @param containerName Container name
   * @param blobName Blob name (path)
   */
  getPublicFileUrl(containerName: string, blobName: string): string {
    return `${this.STORAGE_ACCOUNT_URL}/${containerName}/${blobName}`;
  }

  /**
   * Get a temporary URL with SAS token for private files
   * @param containerName Container name
   * @param blobName Blob name (path)
   */
  getPrivateFileUrl(containerName: string, blobName: string): Observable<string> {
    return this.getSasToken(containerName, false, 'r').pipe(
      map(sasResponse => {
        return `${this.STORAGE_ACCOUNT_URL}/${containerName}/${blobName}?${sasResponse.sasToken}`;
      })
    );
  }

  /**
   * List files in a specific folder (e.g., for a specific user)
   * @param containerName Container name
   * @param prefix Prefix to filter blobs (e.g., "userId/folder")
   * @param isPublic Whether this is a public container
   */
  listFiles(containerName: string, prefix: string, isPublic: boolean = false): Observable<string[]> {
    return this.getSasToken(containerName, isPublic, 'rl').pipe(
      switchMap(sasResponse => {
        const containerUrl = `${this.STORAGE_ACCOUNT_URL}/${containerName}?${sasResponse.sasToken}`;
        const blobServiceClient = new BlobServiceClient(containerUrl);
        const containerClient = blobServiceClient.getContainerClient(containerName);

        return from(this.listBlobsWithPrefix(containerClient, prefix));
      })
    );
  }

  /**
   * Helper method to list blobs with a prefix
   */
  private async listBlobsWithPrefix(containerClient: ContainerClient, prefix: string): Promise<string[]> {
    const blobNames: string[] = [];

    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
      blobNames.push(blob.name);
    }

    return blobNames;
  }
}

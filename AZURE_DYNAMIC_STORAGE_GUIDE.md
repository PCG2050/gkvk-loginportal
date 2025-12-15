# Azure Dynamic Storage Implementation - Complete Guide

This guide provides a comprehensive overview of the dynamic Azure Blob Storage implementation for the GKVK Login Portal, covering container creation, SAS token management, and file organization by userId.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Frontend Implementation](#frontend-implementation)
4. [Backend Implementation](#backend-implementation)
5. [Usage Examples](#usage-examples)
6. [Container Organization](#container-organization)
7. [Security](#security)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

### Problem Statement

Previously, all organizations used a single hardcoded Azure container (`tdms` and `tdms-public`) for file storage. This approach had several limitations:

- **No isolation** between organizations
- **Security concerns** with shared storage
- **Difficult to manage** file access and permissions
- **Scalability issues** as more organizations are added

### Solution

The new implementation provides:

✅ **Dynamic container creation** when a superadmin creates an organization
✅ **Automatic SAS token generation** with caching and expiry management
✅ **User-based file organization** within containers (userId/folder/file)
✅ **Role-based access** (superadmin, admin, unithead, trainer)
✅ **Public and private containers** for each organization

---

## 🏗️ Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Superadmin Creates Institute                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard Component → Institute Service → Backend API           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         Backend Creates Organization in Database                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend Calls AzureStorageService.CreateContainersAsync()       │
│    - Creates {org}-private container (PublicAccessType.None)     │
│    - Creates {org}-public container (PublicAccessType.Blob)      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│           Containers Created in Azure Blob Storage               │
│         Organization record updated with container info          │
└─────────────────────────────────────────────────────────────────┘
```

### File Upload Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  User Selects File → Component → AzureStorageService             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  AzureStorageService.getSasToken(containerName, permissions)     │
│    → Backend checks SasTokenCache table                          │
│    → If cached & valid: return cached token                      │
│    → If expired: generate new token, cache it, return            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  AzureStorageService.uploadFile({file, container, userId})       │
│    - Constructs blob path: {userId}/{folder}/{filename}          │
│    - Uses Azure SDK with SAS token to upload                     │
│    - Returns blob URL                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💻 Frontend Implementation

### 1. Azure Storage Service

**Location**: `src/app/core/services/azure-storage.service.ts`

**Key Methods**:

```typescript
// Get SAS token for a container
getSasToken(containerName: string, isPublic: boolean, permissions: string): Observable<SasTokenResponse>

// Create organization containers
createOrganizationContainers(orgId: number, privateName: string, publicName: string): Observable<ContainerInfo>

// Upload file organized by userId
uploadFile(options: FileUploadOptions): Observable<FileUploadResult>

// Upload multiple files in parallel
uploadMultipleFiles(files: File[], container: string, userId: number): Observable<FileUploadResult[]>

// Delete file
deleteFile(containerName: string, blobName: string): Observable<boolean>

// List files for a user
listFiles(containerName: string, prefix: string): Observable<string[]>

// Get public URL
getPublicFileUrl(containerName: string, blobName: string): string

// Get private URL with SAS token
getPrivateFileUrl(containerName: string, blobName: string): Observable<string>
```

### 2. Institute Service Integration

**Location**: `src/app/core/services/institute.service.ts`

The institute service now has two methods for creating organizations:

#### Option 1: Backend Handles Everything (Recommended)

```typescript
addInstitute(instituteData: any): Observable<any>
```

The backend automatically creates containers when the organization is created.

#### Option 2: Frontend-Managed Container Creation

```typescript
addInstituteWithContainers(instituteData: any): Observable<any>
```

The frontend explicitly calls the Azure Storage Service after organization creation.

### 3. Endpoints Configuration

**Location**: `src/app/shared/endpoints.model.ts`

New endpoints added:

```typescript
static storageCreateContainers = Endpoints.getbaseURL() + '/api/Storage/create-containers';
static storageSasToken = Endpoints.getbaseURL() + '/api/Storage/sas-token';
static storageUpload = Endpoints.getbaseURL() + '/api/Storage/upload';
static storageDelete = Endpoints.getbaseURL() + '/api/Storage/delete';
static storageList = Endpoints.getbaseURL() + '/api/Storage/list';
```

---

## 🔧 Backend Implementation

### Database Changes

#### 1. Organizations Table - Add Columns

```sql
ALTER TABLE Organizations
ADD StorageContainerName NVARCHAR(63) NOT NULL DEFAULT 'default-private',
    StorageContainerNamePublic NVARCHAR(63) NOT NULL DEFAULT 'default-public',
    ContainerCreatedDate DATETIME2 NULL,
    ContainerCreatedBy INT NULL;
```

#### 2. SasTokenCache Table - Create New Table

```sql
CREATE TABLE SasTokenCache (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ContainerName NVARCHAR(63) NOT NULL,
    SasToken NVARCHAR(MAX) NOT NULL,
    Permissions NVARCHAR(10) NOT NULL,
    ExpiresOn DATETIME2 NOT NULL,
    CreatedOn DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IsPublicContainer BIT NOT NULL DEFAULT 0,

    CONSTRAINT UQ_Container_Permissions UNIQUE (ContainerName, Permissions, IsPublicContainer)
);
```

### Backend Services

See **`AZURE_STORAGE_BACKEND_IMPLEMENTATION.md`** for:
- Complete `AzureStorageService` implementation
- `StorageController` with all endpoints
- `SasTokenCleanupService` for automatic token expiry management
- Security configurations and best practices

---

## 📚 Usage Examples

### Example 1: Creating an Institute with Containers

**Component**: `dashboard.ts`

```typescript
saveInstitute(form: NgForm) {
  if (this.isEditMode) {
    // Update existing institute
    // ... existing code ...
  } else {
    // Create new institute
    const newInstitute = {
      name: this.form.name,
      districtId: this.form.address.district,
      pincode: this.form.address.pincode,
      storageContainerName: this.form.storageInfo.storageContainerName,
      storageContainerNamePublic: this.form.storageInfo.storageContainerNamePublic
    };

    // Option 1: Backend handles container creation (Recommended)
    this.instituteServices.addInstitute(newInstitute).subscribe({
      next: (response) => {
        alert("Added institute successfully with containers!");
        console.log('Institute and containers created:', response);
        this.onLoadInstitutes();
      },
      error: (err) => {
        alert("Failed to add institute");
        console.error('Error:', err);
      }
    });

    // Option 2: Frontend-managed container creation
    // this.instituteServices.addInstituteWithContainers(newInstitute).subscribe({
    //   next: (response) => {
    //     alert("Added institute successfully with containers!");
    //     this.onLoadInstitutes();
    //   },
    //   error: (err) => {
    //     alert("Failed to add institute");
    //   }
    // });
  }
}
```

### Example 2: Uploading a File (e.g., Logo)

**Component**: `dashboard.ts`

```typescript
import { AzureStorageService } from '../../core/services/azure-storage.service';

export class Dashboard {
  private azureStorageService = inject(AzureStorageService);
  selectedFile: File | null = null;

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  uploadLogo(organizationId: number) {
    if (!this.selectedFile) return;

    const userId = Number(localStorage.getItem('userId'));
    const containerName = this.form.storageInfo.storageContainerNamePublic; // Use public for logos

    this.isLoading = true;

    this.azureStorageService.uploadFile({
      file: this.selectedFile,
      containerName: containerName,
      userId: userId,
      folder: 'logos', // Optional: organize in subfolder
      isPublic: true
    }).subscribe({
      next: (result) => {
        if (result.success) {
          console.log('✅ Logo uploaded successfully:', result.blobUrl);
          this.form.logoUrl = result.blobUrl;

          // Update organization with logo URL
          this.updateInstituteLogoUrl(organizationId, result.blobUrl);
        } else {
          alert('Failed to upload logo: ' + result.errorMessage);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Upload error:', err);
        alert('Failed to upload logo');
        this.isLoading = false;
      }
    });
  }

  updateInstituteLogoUrl(organizationId: number, logoUrl: string) {
    const updateData = { logoUrl };
    this.instituteServices.updateInstitutes(updateData, organizationId).subscribe({
      next: () => {
        console.log('Logo URL updated in database');
      },
      error: (err) => {
        console.error('Failed to update logo URL:', err);
      }
    });
  }
}
```

### Example 3: Uploading Documents (Private Container)

**Component**: `staff.component.ts` or any other component

```typescript
import { AzureStorageService } from '../../core/services/azure-storage.service';

export class StaffComponent {
  private azureStorageService = inject(AzureStorageService);

  uploadStaffDocument(trainerId: number, file: File) {
    const containerName = localStorage.getItem('privateContainerName'); // Get from org settings

    this.azureStorageService.uploadFile({
      file: file,
      containerName: containerName!,
      userId: trainerId,
      folder: 'documents',
      isPublic: false // Private container
    }).subscribe({
      next: (result) => {
        if (result.success) {
          console.log('📄 Document uploaded:', result.blobUrl);
          // Save document reference in database
          this.saveDocumentReference(trainerId, result.blobUrl, file.name);
        }
      },
      error: (err) => {
        console.error('Upload failed:', err);
      }
    });
  }

  saveDocumentReference(trainerId: number, blobUrl: string, fileName: string) {
    // Call backend to save document metadata
    const documentData = {
      trainerId,
      fileName,
      blobUrl,
      uploadedDate: new Date()
    };
    // ... backend call to save document reference ...
  }
}
```

### Example 4: Listing User Files

```typescript
listUserDocuments(userId: number, containerName: string) {
  this.azureStorageService.listFiles(containerName, `${userId}/documents`).subscribe({
    next: (files) => {
      console.log('User documents:', files);
      this.userFiles = files;
    },
    error: (err) => {
      console.error('Failed to list files:', err);
    }
  });
}
```

### Example 5: Downloading a Private File

```typescript
downloadPrivateFile(containerName: string, blobName: string) {
  this.azureStorageService.getPrivateFileUrl(containerName, blobName).subscribe({
    next: (urlWithSas) => {
      // Open in new tab or download
      window.open(urlWithSas, '_blank');
    },
    error: (err) => {
      console.error('Failed to get file URL:', err);
    }
  });
}
```

### Example 6: Deleting a File

```typescript
deleteUserFile(containerName: string, blobName: string) {
  if (!confirm('Are you sure you want to delete this file?')) return;

  this.azureStorageService.deleteFile(containerName, blobName, false).subscribe({
    next: (success) => {
      if (success) {
        alert('File deleted successfully');
        this.refreshFileList();
      } else {
        alert('Failed to delete file');
      }
    },
    error: (err) => {
      console.error('Delete error:', err);
    }
  });
}
```

---

## 📁 Container Organization

### Naming Convention

```
Organization: "Karnataka GKVK"
Private Container: "gkvk-private"
Public Container: "gkvk-public"
```

### File Structure

```
gkvk-private/
├── 123/                        (userId: superadmin)
│   ├── documents/
│   │   ├── policy.pdf
│   │   └── guidelines.docx
│   └── reports/
│       └── annual-report.xlsx
│
├── 456/                        (userId: trainer)
│   ├── documents/
│   │   └── certification.pdf
│   ├── profile/
│   │   └── avatar.jpg
│   └── uploads/
│       └── assignment.docx
│
└── 789/                        (userId: unithead)
    └── reports/
        └── monthly-summary.pdf

gkvk-public/
├── 123/                        (userId: superadmin)
│   └── logos/
│       └── organization-logo.png
│
└── 456/                        (userId: trainer)
    └── public-documents/
        └── announcement.pdf
```

### Best Practices

1. **Always organize by userId** - First level folder is always userId
2. **Use descriptive subfolders** - documents, reports, uploads, profile, etc.
3. **Public vs Private**:
   - **Public**: Organization logos, public announcements, public documents
   - **Private**: User documents, reports, personal files, sensitive data
4. **File naming**: Use descriptive names with timestamps if needed
5. **Clean up**: Implement file lifecycle policies in Azure Storage

---

## 🔒 Security

### SAS Token Security

1. **Time-Limited**: Tokens expire after 24 hours (configurable)
2. **Cached**: Tokens are cached to avoid regenerating constantly
3. **Minimum Permissions**: Only grant required permissions (r, w, d, l)
4. **User-Specific**: Users can only access their own folders

### Access Control

| Role | Private Container | Public Container |
|------|-------------------|------------------|
| Superadmin | Full access (all users) | Full access (all users) |
| Admin | Full access (org users) | Full access (org users) |
| UnitHead | Own files + assigned trainers | Own files + assigned trainers |
| Trainer | Own files only | Own files only |

### Implementation Notes

1. Always check user authorization before generating SAS tokens
2. Validate userId matches authenticated user (except for admin roles)
3. Use HTTPS only for all Azure operations
4. Never expose SAS tokens in client-side code
5. Implement rate limiting on SAS token generation endpoints

---

## 🐛 Troubleshooting

### Issue 1: Container Creation Fails

**Symptoms**: Error when creating organization

**Solutions**:
- Check Azure connection string in backend `appsettings.json`
- Verify container naming rules (3-63 chars, lowercase, no special chars)
- Check Azure storage account permissions
- Ensure storage account has sufficient capacity

### Issue 2: SAS Token Doesn't Work

**Symptoms**: 403 Forbidden when uploading/downloading files

**Solutions**:
- Verify SAS token hasn't expired
- Check permissions match the operation (upload needs 'w', download needs 'r')
- Ensure clock synchronization between server and Azure
- Check if container exists
- Verify SAS token was generated correctly

### Issue 3: File Upload Fails

**Symptoms**: Upload throws error or times out

**Solutions**:
- Check file size limits (Azure has a max blob size)
- Verify SAS token has write ('w') permission
- Ensure container exists before uploading
- Check network connectivity to Azure
- Verify CORS settings if uploading from browser

### Issue 4: Cannot Access Private Files

**Symptoms**: Unable to view/download private files

**Solutions**:
- Generate a new SAS token with read ('r') permission
- Check userId folder structure is correct
- Verify user has permission to access the file
- Ensure SAS token hasn't expired

### Issue 5: Duplicate Container Names

**Symptoms**: Error "Container already exists"

**Solutions**:
- Use unique container names per organization
- Implement name validation in the form
- Check for existing containers before creation
- Use organization ID as part of container name

---

## 📊 Monitoring and Logs

### Frontend Logging

The Azure Storage Service includes console logging:

```typescript
console.log('📤 Uploading file:', fileName);
console.log('✅ Upload successful:', blobUrl);
console.error('❌ Upload failed:', error);
```

### Backend Logging

The backend service includes structured logging:

```csharp
_logger.LogInformation("Creating containers for organization {OrgId}", organizationId);
_logger.LogError(ex, "Error creating containers for organization {OrgId}", organizationId);
```

### Azure Storage Metrics

Monitor in Azure Portal:
- Container creation/deletion events
- Blob upload/download metrics
- Failed requests
- SAS token usage

---

## 🎓 Summary

### What We Built

✅ **Dynamic Container Creation**: Containers are created automatically when organizations are added
✅ **SAS Token Management**: Automatic generation, caching, and expiry handling
✅ **User-Based Organization**: Files are organized by userId within containers
✅ **Frontend Service**: Complete Angular service for all Azure operations
✅ **Backend API**: REST endpoints for container management and file operations
✅ **Security**: Role-based access control and time-limited tokens

### Next Steps

1. **Implement the backend** using `AZURE_STORAGE_BACKEND_IMPLEMENTATION.md`
2. **Update dashboard component** to use new upload methods
3. **Test container creation** with a new organization
4. **Test file uploads** to both public and private containers
5. **Implement file management UI** for viewing/deleting user files
6. **Set up Azure Storage lifecycle policies** for automatic cleanup
7. **Configure monitoring and alerts** in Azure Portal

---

## 📞 Support

For backend implementation details, see:
- `AZURE_STORAGE_BACKEND_IMPLEMENTATION.md` - Complete backend guide

For questions or issues:
- Check the troubleshooting section
- Review Azure SDK documentation
- Check backend logs for detailed error messages

---

**Last Updated**: 2025-12-15
**Version**: 1.0
**Author**: Claude Code Assistant

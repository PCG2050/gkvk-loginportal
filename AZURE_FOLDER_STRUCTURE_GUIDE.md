# Azure Storage Folder Structure Guide

This document defines the **complete folder organization** for Azure Blob Storage in the GKVK Login Portal, including decision logic for where to store different file types based on user role, unit, and file category.

---

## 📁 Folder Structure Overview

### Container Organization

Each organization has **two containers**:

1. **Private Container** (`{org-name}-private`)
   - Documents, reports, certificates
   - Access controlled via SAS tokens
   - No anonymous access

2. **Public Container** (`{org-name}-public`)
   - Profile pictures, logos
   - Publicly accessible URLs
   - No SAS token needed for read access

---

## 🗂️ Complete Folder Structure

### 1. Profile Pictures (Public Container)

```
{org-name}-public/
├── profile-pics/
│   ├── 123/                    (userId: superadmin)
│   │   └── avatar.jpg
│   ├── 456/                    (userId: admin)
│   │   └── profile.png
│   ├── 789/                    (userId: unithead)
│   │   └── photo.jpg
│   └── 999/                    (userId: trainer)
│       └── avatar.png
```

**Decision Rule:**
- **ANY user** uploading a profile picture → `profile-pics/{userId}/`

---

### 2. Organization Logos (Public Container)

```
{org-name}-public/
├── logos/
│   └── 1/                      (organizationId)
│       ├── logo.png
│       ├── logo-dark.png
│       └── favicon.ico
```

**Decision Rule:**
- Organization logo uploads → `logos/{organizationId}/`

---

### 3. Superadmin Files (Private Container)

```
{org-name}-private/
├── superadmin/
│   └── 1/                      (superadmin userId)
│       ├── documents/
│       │   ├── system-policy.pdf
│       │   └── guidelines.docx
│       ├── reports/
│       │   └── annual-summary.xlsx
│       └── other/
│           └── backup.zip
```

**Decision Rule:**
- User role = SUPERADMIN → `superadmin/{userId}/{category}/`

**Categories:**
- `documents/` - Policies, guidelines, official documents
- `reports/` - System-wide reports
- `other/` - Miscellaneous files

---

### 4. Admin Files (Private Container)

```
{org-name}-private/
├── admin/
│   ├── 123/                    (admin userId)
│   │   ├── documents/
│   │   │   ├── org-policy.pdf
│   │   │   └── memo.docx
│   │   ├── reports/
│   │   │   └── monthly-report.xlsx
│   │   └── certificates/
│   │       └── accreditation.pdf
│   └── 456/                    (another admin)
│       └── documents/
│           └── circular.pdf
```

**Decision Rule:**
- User role = ADMIN → `admin/{userId}/{category}/`

**Categories:**
- `documents/` - Organization documents, memos, circulars
- `reports/` - Organization-level reports
- `certificates/` - Organization certificates
- `other/` - Miscellaneous files

---

### 5. UnitHead Files (Private Container)

```
{org-name}-private/
├── units/
│   ├── gkvk-bangalore/                     (unit name)
│   │   ├── unitheads/
│   │   │   ├── 789/                        (unithead userId)
│   │   │   │   ├── documents/
│   │   │   │   │   ├── attendance-report.pdf
│   │   │   │   │   └── budget-proposal.docx
│   │   │   │   ├── reports/
│   │   │   │   │   ├── monthly-summary.xlsx
│   │   │   │   │   └── quarterly-report.pdf
│   │   │   │   ├── photos/
│   │   │   │   │   ├── team-meeting.jpg
│   │   │   │   │   └── event-2024.jpg
│   │   │   │   └── certificates/
│   │   │   │       └── training-cert.pdf
│   │   │   └── 790/                        (another unithead)
│   │   │       └── documents/
│   │   │           └── report.pdf
│   │   └── trainers/
│   │       └── (trainer files - see below)
│   │
│   └── gkvk-mysore/                        (another unit)
│       ├── unitheads/
│       │   └── 800/
│       │       └── documents/
│       └── trainers/
│           └── (trainer files)
```

**Decision Rule:**
- User role = UNITHEAD → `units/{unitName}/unitheads/{userId}/{category}/`

**Unit Name Sanitization:**
- Original: "GKVK Bangalore"
- Sanitized: "gkvk-bangalore"
- Rules: lowercase, spaces → hyphens, remove special chars

**Categories:**
- `documents/` - Unit documents, proposals, official papers
- `reports/` - Unit-level reports, summaries
- `photos/` - Unit events, team photos
- `certificates/` - Training certificates, awards
- `other/` - Miscellaneous files

---

### 6. Trainer Files (Private Container)

```
{org-name}-private/
├── units/
│   └── gkvk-bangalore/                     (unit name)
│       └── trainers/
│           ├── 999/                        (trainer userId)
│           │   ├── documents/
│           │   │   ├── training-module.pdf
│           │   │   ├── lesson-plan.docx
│           │   │   └── attendance-sheet.xlsx
│           │   ├── photos/
│           │   │   ├── field-visit-1.jpg
│           │   │   ├── workshop-2024.jpg
│           │   │   └── demonstration.png
│           │   ├── videos/
│           │   │   ├── training-session.mp4
│           │   │   ├── field-demo.mp4
│           │   │   └── workshop-recording.mov
│           │   ├── certificates/
│           │   │   ├── qualification.pdf
│           │   │   └── workshop-cert.pdf
│           │   └── reports/
│           │       └── activity-report.pdf
│           │
│           ├── 1000/                       (another trainer)
│           │   ├── documents/
│           │   │   └── module.pdf
│           │   ├── photos/
│           │   │   └── training.jpg
│           │   └── videos/
│           │       └── demonstration.mp4
│           │
│           └── 1001/                       (another trainer)
│               ├── documents/
│               │   └── presentation.pptx
│               └── videos/
│                   └── lecture.mp4
```

**Decision Rule:**
- User role = TRAINER → `units/{unitName}/trainers/{userId}/{category}/`

**Categories:**
- `documents/` - Training modules, lesson plans, assignments
- `photos/` - Field visits, workshops, training sessions, demonstrations
- `videos/` - Training videos, demonstrations, workshop recordings (MP4, MOV, AVI)
- `certificates/` - Trainer qualifications, certifications
- `reports/` - Activity reports, progress reports
- `other/` - Miscellaneous files

---

## 🎯 Decision Matrix: Where to Store Files

| User Role | File Type | Container | Path Pattern |
|-----------|-----------|-----------|--------------|
| **Any** | Profile Picture | Public | `profile-pics/{userId}/avatar.jpg` |
| **Superadmin** | Documents | Private | `superadmin/{userId}/documents/file.pdf` |
| **Superadmin** | Reports | Private | `superadmin/{userId}/reports/report.xlsx` |
| **Admin** | Documents | Private | `admin/{userId}/documents/file.pdf` |
| **Admin** | Reports | Private | `admin/{userId}/reports/report.xlsx` |
| **Admin** | Certificates | Private | `admin/{userId}/certificates/cert.pdf` |
| **UnitHead** | Documents | Private | `units/{unit}/unitheads/{userId}/documents/file.pdf` |
| **UnitHead** | Reports | Private | `units/{unit}/unitheads/{userId}/reports/report.xlsx` |
| **UnitHead** | Photos | Private | `units/{unit}/unitheads/{userId}/photos/photo.jpg` |
| **UnitHead** | Certificates | Private | `units/{unit}/unitheads/{userId}/certificates/cert.pdf` |
| **Trainer** | Documents | Private | `units/{unit}/trainers/{userId}/documents/file.pdf` |
| **Trainer** | Photos | Private | `units/{unit}/trainers/{userId}/photos/photo.jpg` |
| **Trainer** | Videos | Private | `units/{unit}/trainers/{userId}/videos/video.mp4` |
| **Trainer** | Certificates | Private | `units/{unit}/trainers/{userId}/certificates/cert.pdf` |
| **Trainer** | Reports | Private | `units/{unit}/trainers/{userId}/reports/report.pdf` |
| **Organization** | Logo | Public | `logos/{orgId}/logo.png` |

---

## 🛠️ Implementation: How to Use

### Example 1: Upload Trainer Document

```typescript
import { AzureStorageEnhancedService } from '../../core/services/azure-storage-enhanced.service';
import { FileCategory, UserRole } from '../../core/models/azure-storage.models';

export class TrainerComponent {
  constructor(private azureStorage: AzureStorageEnhancedService) {}

  uploadDocument(file: File) {
    const trainerId = Number(localStorage.getItem('userId'));
    const unitName = localStorage.getItem('unitName'); // e.g., "GKVK Bangalore"
    const containerName = localStorage.getItem('privateContainerName'); // e.g., "gkvk-private"

    // Option 1: Using helper method
    this.azureStorage.uploadTrainerDocument(
      trainerId,
      unitName!,
      file,
      containerName!
    ).subscribe({
      next: (result) => {
        console.log('✅ Document uploaded:', result.blobUrl);
        // Result path: units/gkvk-bangalore/trainers/999/documents/file.pdf
      },
      error: (err) => {
        console.error('❌ Upload failed:', err);
      }
    });

    // Option 2: Using context-based method
    this.azureStorage.uploadFileWithContext({
      file: file,
      containerName: containerName!,
      userId: trainerId,
      userRole: UserRole.TRAINER,
      unitName: unitName!,
      category: FileCategory.DOCUMENT,
      isPublic: false
    }).subscribe({
      next: (result) => {
        console.log('✅ Document uploaded:', result.blobUrl);
      },
      error: (err) => {
        console.error('❌ Upload failed:', err);
      }
    });
  }
}
```

### Example 2: Upload Trainer Photos

```typescript
uploadPhoto(file: File) {
  const trainerId = Number(localStorage.getItem('userId'));
  const unitName = localStorage.getItem('unitName');
  const containerName = localStorage.getItem('privateContainerName');

  this.azureStorage.uploadFileWithContext({
    file: file,
    containerName: containerName!,
    userId: trainerId,
    userRole: UserRole.TRAINER,
    unitName: unitName!,
    category: FileCategory.PHOTO,
    isPublic: false
  }).subscribe({
    next: (result) => {
      console.log('✅ Photo uploaded:', result.blobUrl);
      // Result path: units/gkvk-bangalore/trainers/999/photos/event.jpg
    }
  });
}
```

### Example 3: Upload Profile Picture (Any Role)

```typescript
uploadProfilePicture(file: File) {
  const userId = Number(localStorage.getItem('userId'));
  const publicContainerName = localStorage.getItem('publicContainerName');

  // Option 1: Using helper method
  this.azureStorage.uploadProfilePicture(
    userId,
    file,
    publicContainerName!
  ).subscribe({
    next: (result) => {
      console.log('✅ Profile picture uploaded:', result.blobUrl);
      // Result path: profile-pics/999/avatar.jpg
      this.updateUserProfile(result.blobUrl);
    }
  });
}
```

### Example 4: Upload UnitHead Report

```typescript
uploadReport(file: File) {
  const unitHeadId = Number(localStorage.getItem('userId'));
  const unitName = localStorage.getItem('unitName');
  const containerName = localStorage.getItem('privateContainerName');

  this.azureStorage.uploadFileWithContext({
    file: file,
    containerName: containerName!,
    userId: unitHeadId,
    userRole: UserRole.UNITHEAD,
    unitName: unitName!,
    category: FileCategory.REPORT,
    isPublic: false
  }).subscribe({
    next: (result) => {
      console.log('✅ Report uploaded:', result.blobUrl);
      // Result path: units/gkvk-bangalore/unitheads/789/reports/monthly.xlsx
    }
  });
}
```

### Example 5: Upload Organization Logo (Admin/Superadmin)

```typescript
uploadOrganizationLogo(file: File) {
  const organizationId = Number(localStorage.getItem('organizationId'));
  const publicContainerName = localStorage.getItem('publicContainerName');

  this.azureStorage.uploadOrganizationLogo(
    organizationId,
    file,
    publicContainerName!
  ).subscribe({
    next: (result) => {
      console.log('✅ Logo uploaded:', result.blobUrl);
      // Result path: logos/1/logo.png
      this.updateOrganizationLogo(result.blobUrl);
    }
  });
}
```

### Example 6: List Trainer Documents

```typescript
listMyDocuments() {
  const trainerId = Number(localStorage.getItem('userId'));
  const unitName = localStorage.getItem('unitName');
  const containerName = localStorage.getItem('privateContainerName');

  this.azureStorage.listUserFiles(
    containerName!,
    trainerId,
    UserRole.TRAINER,
    FileCategory.DOCUMENT,
    unitName!
  ).subscribe({
    next: (files) => {
      console.log('📄 My documents:', files);
      // Returns: [
      //   'units/gkvk-bangalore/trainers/999/documents/file1.pdf',
      //   'units/gkvk-bangalore/trainers/999/documents/file2.docx'
      // ]
      this.displayFiles(files);
    }
  });
}
```

### Example 7: Delete a File

```typescript
deleteFile(blobPath: string) {
  const containerName = localStorage.getItem('privateContainerName');

  if (!confirm('Are you sure you want to delete this file?')) return;

  this.azureStorage.deleteFileByPath(
    containerName!,
    blobPath,
    false // isPublic = false for private container
  ).subscribe({
    next: (success) => {
      if (success) {
        console.log('✅ File deleted successfully');
        this.refreshFileList();
      }
    },
    error: (err) => {
      console.error('❌ Delete failed:', err);
    }
  });
}
```

---

## 🔍 File Category Definitions

| Category | Enum Value | Description | Use Cases |
|----------|-----------|-------------|-----------|
| **Profile Picture** | `PROFILE_PICTURE` | User avatar/photo | Any user's profile picture |
| **Document** | `DOCUMENT` | Official documents | Policies, guidelines, memos, modules, lesson plans |
| **Photo** | `PHOTO` | Event photos | Field visits, workshops, meetings, demonstrations |
| **Video** | `VIDEO` | Training videos | Training sessions, demonstrations, workshop recordings |
| **Report** | `REPORT` | Reports and summaries | Monthly reports, activity reports, progress reports |
| **Certificate** | `CERTIFICATE` | Certificates and awards | Qualifications, training certificates, accreditations |
| **Logo** | `LOGO` | Organization logos | Main logo, dark logo, favicon |
| **Other** | `OTHER` | Miscellaneous | Files that don't fit other categories |

---

## 🔒 Access Control by Path

### Public Container Access

| Path Pattern | Who Can Access | How |
|--------------|----------------|-----|
| `profile-pics/*` | Everyone | Public URL (no SAS token) |
| `logos/*` | Everyone | Public URL (no SAS token) |

### Private Container Access

| Path Pattern | Who Can Access | Restrictions |
|--------------|----------------|--------------|
| `superadmin/{userId}/*` | Only that superadmin | User ID must match |
| `admin/{userId}/*` | Only that admin | User ID must match |
| `units/{unit}/unitheads/{userId}/*` | Only that unithead | User ID + Unit must match |
| `units/{unit}/trainers/{userId}/*` | Only that trainer | User ID + Unit must match |

**Exception:** Admins and Superadmins can access all files within their organization.

---

## 📊 Complete Example Folder Tree

```
gkvk-private/                              (Private Container)
├── superadmin/
│   └── 1/
│       ├── documents/
│       │   ├── system-policy.pdf
│       │   └── guidelines.docx
│       └── reports/
│           └── annual-summary.xlsx
│
├── admin/
│   ├── 123/
│   │   ├── documents/
│   │   │   └── org-policy.pdf
│   │   └── reports/
│   │       └── monthly-report.xlsx
│   └── 456/
│       └── certificates/
│           └── accreditation.pdf
│
└── units/
    ├── gkvk-bangalore/
    │   ├── unitheads/
    │   │   └── 789/
    │   │       ├── documents/
    │   │       │   └── attendance-report.pdf
    │   │       ├── reports/
    │   │       │   └── monthly-summary.xlsx
    │   │       └── photos/
    │   │           └── team-meeting.jpg
    │   └── trainers/
    │       ├── 999/
    │       │   ├── documents/
    │       │   │   ├── training-module.pdf
    │       │   │   └── lesson-plan.docx
    │       │   ├── photos/
    │       │   │   ├── field-visit-1.jpg
    │       │   │   └── workshop-2024.jpg
    │       │   ├── videos/
    │       │   │   ├── training-session.mp4
    │       │   │   └── demonstration.mov
    │       │   └── certificates/
    │       │       └── qualification.pdf
    │       └── 1000/
    │           ├── documents/
    │           │   └── module.pdf
    │           └── videos/
    │               └── workshop.mp4
    │
    └── gkvk-mysore/
        ├── unitheads/
        │   └── 800/
        │       └── documents/
        └── trainers/
            └── 1001/
                └── documents/

gkvk-public/                               (Public Container)
├── profile-pics/
│   ├── 1/                                 (superadmin)
│   │   └── avatar.jpg
│   ├── 123/                               (admin)
│   │   └── profile.png
│   ├── 789/                               (unithead)
│   │   └── photo.jpg
│   └── 999/                               (trainer)
│       └── avatar.png
│
└── logos/
    └── 1/                                 (organizationId)
        ├── logo.png
        └── logo-dark.png
```

---

## 🚀 Summary

### Key Principles

1. **Unit-Based Organization**: UnitHeads and Trainers files are organized under `units/{unitName}/`
2. **Role-Based Folders**: Separate folders for superadmin, admin, unitheads, trainers
3. **User Isolation**: Each user has their own folder identified by userId
4. **Category Separation**: Documents, photos, videos, reports, certificates in separate folders
5. **Public vs Private**: Profile pictures and logos are public, everything else is private

### File Path Examples

| User | File Type | Final Path |
|------|-----------|------------|
| Trainer (ID: 999) | Document | `units/gkvk-bangalore/trainers/999/documents/module.pdf` |
| Trainer (ID: 999) | Photo | `units/gkvk-bangalore/trainers/999/photos/event.jpg` |
| Trainer (ID: 999) | Video | `units/gkvk-bangalore/trainers/999/videos/training.mp4` |
| UnitHead (ID: 789) | Report | `units/gkvk-bangalore/unitheads/789/reports/monthly.xlsx` |
| Admin (ID: 123) | Document | `admin/123/documents/policy.pdf` |
| Any User (ID: 999) | Profile Pic | `profile-pics/999/avatar.jpg` |
| Organization (ID: 1) | Logo | `logos/1/logo.png` |

---

**Last Updated**: 2025-12-15
**Version**: 2.0
**Author**: Claude Code Assistant

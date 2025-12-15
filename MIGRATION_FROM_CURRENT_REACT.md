# Migration Guide: From Current React Implementation to Hierarchical Structure

This guide shows **exactly what changes** you need to make to your existing React code to adopt the new hierarchical folder structure.

---

## 🔍 Current vs New Implementation

### **Your Current `azureUtils.js`**

```javascript
export const azureUploadAsync = async (file) => {
  // ❌ Problems with current implementation:

  // 1. Hardcoded SAS URL in frontend (security risk)
  const sasUrl =
    "https://tdms.blob.core.windows.net/tdms-public?sp=racwdl&st=2025-11-20T05:13:26Z&se=2026-08-31T13:28:26Z&spr=https&sv=2024-11-04&sr=c&sig=uLnirWkHAmInI%2BD2swIpR%2F0oh83S9pns2s5pDG%2BaBMg%3D";

  // 2. Hardcoded container name (all orgs share same container)
  const containerName = "tdms-public";

  // 3. Flat file structure (no organization by unit/role)
  const blobName = `${Date.now()}_${file.name}`;
  // Results in: tdms-public/1735123456_module.pdf (no hierarchy)

  // 4. No differentiation between documents, photos, videos
  // 5. No unit-based organization for trainers

  await blockBlobClient.uploadBrowserData(file);
  return blockBlobClient.url;
};
```

**Result**: All files from all trainers in all units go to the same flat folder:
```
tdms-public/
├── 1735123456_module.pdf       (trainer 1, unit A)
├── 1735123460_photo.jpg        (trainer 2, unit B)
├── 1735123465_video.mp4        (trainer 3, unit A)
└── 1735123470_document.docx    (trainer 1, unit C)
```

---

### **New Enhanced `azureUtils.js`**

```javascript
export const azureUploadAsync = async (
  file,
  {
    userId,
    userRole,
    unitName,     // NEW: Required for trainers
    category,     // NEW: 'documents', 'photos', 'videos'
    containerName, // NEW: Dynamic per organization
    isPublic = false
  }
) => {
  // ✅ 1. Build hierarchical path
  const blobPath = buildBlobPath({
    userId,
    userRole,
    unitName,
    category,
    fileName: file.name
  });
  // Results in: units/gkvk-bangalore/trainers/999/documents/module.pdf

  // ✅ 2. Get SAS token from backend (not hardcoded)
  const sasToken = await getSasTokenFromBackend(containerName, isPublic);

  // ✅ 3. Use dynamic container
  const blobServiceClient = new BlobServiceClient(
    `https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net?${sasToken}`
  );

  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobPath);

  await blockBlobClient.uploadData(file);
  return blockBlobClient.url.split('?')[0]; // Remove SAS token
};
```

**Result**: Files organized by unit, role, and category:
```
gkvk-private/
└── units/
    ├── gkvk-bangalore/
    │   └── trainers/
    │       ├── 999/
    │       │   ├── documents/
    │       │   │   └── module.pdf
    │       │   ├── photos/
    │       │   │   └── photo.jpg
    │       │   └── videos/
    │       │       └── video.mp4
    │       └── 1000/
    │           └── documents/
    │               └── lesson-plan.docx
    └── gkvk-mysore/
        └── trainers/
            └── 1001/
                └── documents/
                    └── training.pdf
```

---

## 📝 What You Need to Change

### **Step 1: Replace `azureUtils.js` Entirely**

Replace your entire file with the new version from `REACT_AZURE_INTEGRATION_GUIDE.md`:

**Key additions:**
1. `getSasTokenFromBackend()` - Fetches tokens from API
2. `sanitizeUnitName()` - Converts "GKVK Bangalore" → "gkvk-bangalore"
3. `buildBlobPath()` - Builds hierarchical paths
4. `azureUploadAsync()` - Enhanced upload with context parameters
5. Helper functions:
   - `uploadTrainerDocument()`
   - `uploadTrainerPhoto()`
   - `uploadTrainerVideo()`
   - `uploadProfilePicture()`

---

### **Step 2: Update `UploadPhoto.jsx`**

#### **Current (Simplified)**

```jsx
const handleFileChange = async (e, key) => {
  const file = e.target.files[0];

  // ❌ Current: Simple upload, no context
  const uploadedUrl = await azureUploadAsync(file);

  setFormData((prev) => ({
    ...prev,
    [key]: uploadedUrl,
  }));
};
```

#### **New (With Context)**

```jsx
const UploadPhoto = ({
  // ... existing props ...
  fileType = "documents", // NEW PROP: 'documents' or 'photos'
}) => {

  const handleFileChange = async (e, key) => {
    const file = e.target.files[0];

    // ✅ Get trainer context
    const trainerId = parseInt(localStorage.getItem("userId"));
    const unitName = localStorage.getItem("unitName"); // "GKVK Bangalore"

    // ✅ Determine category and use appropriate upload function
    let uploadedUrl;

    if (fileType === "photos" || file.type.startsWith("image/")) {
      uploadedUrl = await uploadTrainerPhoto(file, trainerId, unitName);
      // Path: units/gkvk-bangalore/trainers/999/photos/image.jpg
    } else {
      uploadedUrl = await uploadTrainerDocument(file, trainerId, unitName);
      // Path: units/gkvk-bangalore/trainers/999/documents/file.pdf
    }

    setFormData((prev) => ({
      ...prev,
      [key]: uploadedUrl,
    }));
  };

  // ... rest of component unchanged ...
};
```

**New usage in forms:**

```jsx
{/* Upload document */}
<UploadPhoto
  fieldKey="trainingModule"
  label="Upload Training Module"
  fileType="documents"
  {...otherProps}
/>
{/* Result: units/gkvk-bangalore/trainers/999/documents/module.pdf */}

{/* Upload photo */}
<UploadPhoto
  fieldKey="fieldPhoto"
  label="Upload Field Photo"
  fileType="photos"
  {...otherProps}
/>
{/* Result: units/gkvk-bangalore/trainers/999/photos/photo.jpg */}
```

---

### **Step 3: Update `UploadVideo.jsx`**

#### **Current (Stores File Objects)**

```jsx
const handleFileChange = (e, key) => {
  const files = Array.from(e.target.files);

  // ❌ Current: Stores File objects (not URLs)
  setFormData((prev) => ({
    ...prev,
    [key]: [...(prev[key] || []), ...validFiles],
  }));
};
```

#### **New (Uploads and Stores URLs)**

```jsx
import { uploadTrainerVideo } from "/src/utils/azureUtils";

const handleFileChange = async (e, key) => {
  const files = Array.from(e.target.files);
  const trainerId = parseInt(localStorage.getItem("userId"));
  const unitName = localStorage.getItem("unitName");

  // ✅ Upload all files and get URLs
  const uploadPromises = validFiles.map(async (file) => {
    const uploadedUrl = await uploadTrainerVideo(file, trainerId, unitName);
    // Path: units/gkvk-bangalore/trainers/999/videos/video.mp4

    return {
      name: file.name,
      url: uploadedUrl,
      size: file.size
    };
  });

  const uploadedVideos = await Promise.all(uploadPromises);

  // ✅ Store video metadata with URLs (not File objects)
  setFormData((prev) => ({
    ...prev,
    [key]: [...(prev[key] || []), ...uploadedVideos],
  }));
};
```

---

### **Step 4: Set Up Context in Your App**

Add this to your login/auth flow or app initialization:

```jsx
// After successful login
useEffect(() => {
  // Get from your API or auth context
  const user = getUserFromAuthToken();

  localStorage.setItem("userId", user.id); // e.g., "999"
  localStorage.setItem("unitName", user.unitName); // e.g., "GKVK Bangalore"
  localStorage.setItem("privateContainerName", user.organizationContainerPrivate); // e.g., "gkvk-private"
  localStorage.setItem("publicContainerName", user.organizationContainerPublic); // e.g., "gkvk-public"
}, []);
```

---

## ⚠️ Important Security Changes

### **1. Remove Hardcoded SAS Token**

**Current (❌ Security Risk):**
```javascript
const sasUrl =
  "https://tdms.blob.core.windows.net/tdms-public?sp=racwdl&st=2025-11-20T05:13:26Z...";
```

**New (✅ Secure):**
```javascript
const sasToken = await getSasTokenFromBackend(containerName, isPublic);
// Token generated on-demand by backend with 24-hour expiry
```

### **2. Dynamic Containers Per Organization**

**Current (❌ All orgs share one container):**
```javascript
const containerName = "tdms-public"; // Everyone uses this
```

**New (✅ Each org has own containers):**
```javascript
const containerName = localStorage.getItem('privateContainerName'); // "gkvk-private"
// GKVK uses: gkvk-private, gkvk-public
// Another org uses: ati-private, ati-public
```

---

## 📊 Before vs After Comparison

### **Before: Flat Structure**

```
tdms-public/
├── 1735123456_module.pdf
├── 1735123460_photo.jpg
├── 1735123465_video.mp4
├── 1735123470_document.docx
└── 1735123475_report.pdf
```

❌ **Problems:**
- Can't tell which unit uploaded what
- No separation between file types
- All organizations share same container
- No way to list files for specific trainer
- No way to enforce access control by unit

### **After: Hierarchical Structure**

```
gkvk-private/
└── units/
    ├── gkvk-bangalore/
    │   └── trainers/
    │       └── 999/
    │           ├── documents/
    │           │   ├── module.pdf
    │           │   └── lesson-plan.docx
    │           ├── photos/
    │           │   └── field-visit.jpg
    │           └── videos/
    │               └── training.mp4
    └── gkvk-mysore/
        └── trainers/
            └── 1001/
                └── documents/
                    └── training.pdf
```

✅ **Benefits:**
- Clear unit organization
- Separated by file type (documents/photos/videos)
- Each org has own containers
- Easy to list files for specific trainer
- Access control by unit/role
- Scalable structure

---

## 🔄 Migration Steps

1. ✅ **Replace `azureUtils.js`** with new version from `REACT_AZURE_INTEGRATION_GUIDE.md`
2. ✅ **Add `fileType` prop** to `UploadPhoto` component
3. ✅ **Update `UploadVideo`** to upload files and store URLs (not File objects)
4. ✅ **Set localStorage** values in your auth flow
5. ✅ **Update backend** to increase max file size for videos (100MB)
6. ✅ **Test uploads** to verify correct paths

---

## 🧪 Testing Checklist

After migration, verify:

- [ ] Documents upload to: `units/{unit}/trainers/{id}/documents/`
- [ ] Photos upload to: `units/{unit}/trainers/{id}/photos/`
- [ ] Videos upload to: `units/{unit}/trainers/{id}/videos/`
- [ ] Unit name is sanitized (spaces → hyphens, lowercase)
- [ ] SAS tokens are fetched from backend (not hardcoded)
- [ ] Correct container is used (not hardcoded "tdms-public")
- [ ] Video files up to 100MB can be uploaded
- [ ] Uploaded URLs are stored in database (not File objects)
- [ ] Files from different trainers don't mix
- [ ] Files from different units are separated

---

## ✅ Summary

**What Changed:**
1. **SAS tokens**: From hardcoded → backend-generated
2. **Container**: From hardcoded "tdms-public" → dynamic per org
3. **File paths**: From `${Date.now()}_${file.name}` → hierarchical structure
4. **Organization**: From flat → unit/role/category folders
5. **Security**: From public SAS URL → temporary tokens with expiry

**What Stayed the Same:**
1. Azure SDK (`@azure/storage-blob`)
2. Component structure (UploadPhoto, UploadVideo)
3. Form data flow
4. User experience (same UI, same behavior)

**Migration Effort:**
- Replace 1 file: `azureUtils.js`
- Update 2 components: `UploadPhoto.jsx`, `UploadVideo.jsx`
- Add 4 localStorage values in auth flow
- Total: ~1-2 hours of work

**Documentation:**
- Full implementation: `REACT_AZURE_INTEGRATION_GUIDE.md`
- Folder structure: `AZURE_FOLDER_STRUCTURE_GUIDE.md`
- Backend implementation: `AZURE_STORAGE_BACKEND_IMPLEMENTATION.md`

---

**Last Updated**: 2025-12-15
**Version**: 1.0 - Migration Guide

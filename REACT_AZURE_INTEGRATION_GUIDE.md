# React Integration Guide for Azure Storage

This guide shows how to integrate the **hierarchical folder structure** with your existing React components (`UploadPhoto`, `UploadVideo`) and `azureUtils`.

---

## 📁 Folder Structure for React App

Your React app (trainer/unithead interface) will follow the same structure:

```
gkvk-private/
└── units/
    └── gkvk-bangalore/
        └── trainers/
            └── 999/                    (trainerId)
                ├── documents/          ← PDF, DOCX, XLSX, PPT, etc.
                ├── photos/             ← JPG, PNG images
                ├── videos/             ← MP3, MP4 videos
                ├── reports/
                └── certificates/
```

---

## 🔧 Step 1: Update `azureUtils.js`

Update your `azureUploadAsync` function to accept **path building parameters**:

### **Before** (Simple Upload)

```javascript
// src/utils/azureUtils.js
import { BlobServiceClient } from "@azure/storage-blob";

export const azureUploadAsync = async (file) => {
  const sasToken = await getSasTokenFromBackend();
  const containerName = "tdms"; // Hardcoded

  const blobServiceClient = new BlobServiceClient(
    `https://YOUR_ACCOUNT.blob.core.windows.net?${sasToken}`
  );

  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobName = `${Date.now()}_${file.name}`; // Simple naming
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(file);
  return blockBlobClient.url;
};
```

### **After** (Hierarchical Upload)

```javascript
// src/utils/azureUtils.js
import { BlobServiceClient } from "@azure/storage-blob";
import axios from "axios";

const API_BASE_URL = "https://gkvk-qaenv.azurewebsites.net/api";

/**
 * Get SAS token from backend
 */
const getSasTokenFromBackend = async (containerName, isPublic = false) => {
  const token = localStorage.getItem("authtoken");

  const response = await axios.post(
    `${API_BASE_URL}/Storage/sas-token`,
    {
      containerName,
      isPublic,
      permissions: "rwdl"
    },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data.sasToken;
};

/**
 * Sanitize unit name for folder path
 */
const sanitizeUnitName = (unitName) => {
  return unitName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Spaces → hyphens
    .replace(/[^a-z0-9-]/g, '')  // Remove special chars
    .replace(/-+/g, '-');        // Multiple hyphens → single
};

/**
 * Build blob path based on user role and file category
 */
export const buildBlobPath = ({
  userId,
  userRole,    // 'trainer', 'unithead', 'admin', 'superadmin'
  unitName,    // Required for trainer/unithead
  category,    // 'documents', 'photos', 'videos', 'reports', 'certificates'
  fileName
}) => {
  // Profile pictures - special case
  if (category === 'profile-pics') {
    return `profile-pics/${userId}/${fileName}`;
  }

  // Logos - special case
  if (category === 'logos') {
    return `logos/${userId}/${fileName}`;
  }

  // Superadmin/Admin
  if (userRole === 'superadmin' || userRole === 'admin') {
    return `${userRole}/${userId}/${category}/${fileName}`;
  }

  // UnitHead/Trainer - requires unit name
  if (userRole === 'unithead' || userRole === 'trainer') {
    if (!unitName) {
      throw new Error(`Unit name is required for ${userRole} uploads`);
    }

    const sanitizedUnitName = sanitizeUnitName(unitName);
    const roleFolder = userRole === 'unithead' ? 'unitheads' : 'trainers';

    return `units/${sanitizedUnitName}/${roleFolder}/${userId}/${category}/${fileName}`;
  }

  // Fallback
  return `${userId}/${category}/${fileName}`;
};

/**
 * Enhanced upload function with hierarchical path
 */
export const azureUploadAsync = async (
  file,
  {
    userId,
    userRole,
    unitName,
    category,
    containerName,  // e.g., "gkvk-private"
    isPublic = false
  }
) => {
  try {
    // Step 1: Build the blob path
    const blobPath = buildBlobPath({
      userId,
      userRole,
      unitName,
      category,
      fileName: file.name
    });

    console.log('📁 Upload path:', blobPath);

    // Step 2: Get SAS token from backend
    const sasToken = await getSasTokenFromBackend(containerName, isPublic);

    // Step 3: Upload to Azure
    const blobServiceClient = new BlobServiceClient(
      `https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net?${sasToken}`
    );

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);

    await blockBlobClient.uploadData(file, {
      blobHTTPHeaders: {
        blobContentType: file.type
      }
    });

    // Return the URL without SAS token (for storage in DB)
    const publicUrl = blockBlobClient.url.split('?')[0];
    console.log('✅ Uploaded to:', publicUrl);

    return publicUrl;
  } catch (error) {
    console.error('❌ Upload failed:', error);
    throw error;
  }
};

/**
 * Helper: Upload trainer document
 */
export const uploadTrainerDocument = async (file, trainerId, unitName) => {
  const containerName = localStorage.getItem('privateContainerName') || 'gkvk-private';

  return azureUploadAsync(file, {
    userId: trainerId,
    userRole: 'trainer',
    unitName,
    category: 'documents',
    containerName,
    isPublic: false
  });
};

/**
 * Helper: Upload trainer photo
 */
export const uploadTrainerPhoto = async (file, trainerId, unitName) => {
  const containerName = localStorage.getItem('privateContainerName') || 'gkvk-private';

  return azureUploadAsync(file, {
    userId: trainerId,
    userRole: 'trainer',
    unitName,
    category: 'photos',
    containerName,
    isPublic: false
  });
};

/**
 * Helper: Upload trainer video
 */
export const uploadTrainerVideo = async (file, trainerId, unitName) => {
  const containerName = localStorage.getItem('privateContainerName') || 'gkvk-private';

  return azureUploadAsync(file, {
    userId: trainerId,
    userRole: 'trainer',
    unitName,
    category: 'videos',
    containerName,
    isPublic: false
  });
};

/**
 * Helper: Upload profile picture (any user)
 */
export const uploadProfilePicture = async (file, userId) => {
  const containerName = localStorage.getItem('publicContainerName') || 'gkvk-public';

  return azureUploadAsync(file, {
    userId,
    userRole: 'trainer', // Doesn't matter for profile pics
    unitName: null,
    category: 'profile-pics',
    containerName,
    isPublic: true
  });
};
```

---

## 🔧 Step 2: Update `UploadPhoto.jsx`

Modify your existing `UploadPhoto` component to use the new path structure:

```jsx
import React, { useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";
import styles from "/src/Styles/Training.module.css";
import { uploadTrainerDocument, uploadTrainerPhoto } from "/src/utils/azureUtils";
import toast from "react-hot-toast";

const UploadPhoto = ({
  fieldKey,
  label,
  note,
  accept = ".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,.txt,.csv,.png,.jpeg,.jpg",
  formData,
  setFormData,
  maxSizeMB = 10,
  style = {},
  fileType = "documents", // NEW: 'documents' or 'photos'
}) => {
  const fileInputRefs = useRef({});
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e, key) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File exceeds the ${maxSizeMB}MB limit.`);
      return;
    }

    setUploading(true);

    try {
      // Get trainer info from localStorage or context
      const trainerId = parseInt(localStorage.getItem("userId"));
      const unitName = localStorage.getItem("unitName"); // e.g., "GKVK Bangalore"

      // Determine file type and use appropriate upload function
      let uploadedUrl;

      if (fileType === "photos" || file.type.startsWith("image/")) {
        uploadedUrl = await uploadTrainerPhoto(file, trainerId, unitName);
        console.log("📸 Photo uploaded to:", uploadedUrl);
        // Path: units/gkvk-bangalore/trainers/999/photos/image.jpg
      } else {
        uploadedUrl = await uploadTrainerDocument(file, trainerId, unitName);
        console.log("📄 Document uploaded to:", uploadedUrl);
        // Path: units/gkvk-bangalore/trainers/999/documents/file.pdf
      }

      setFormData((prev) => ({
        ...prev,
        [key]: uploadedUrl,
      }));

      toast.success("✅ File uploaded successfully!");
    } catch (error) {
      console.error("❌ Upload failed:", error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (key) => {
    setFormData((prev) => ({
      ...prev,
      [key]: null,
    }));
    if (fileInputRefs.current[key]) {
      fileInputRefs.current[key].value = "";
    }
  };

  const getFileNameFromUrl = (url) => {
    try {
      const filePart = decodeURIComponent(url.split("/").pop());
      return filePart.split("?")[0];
    } catch {
      return "Uploaded File";
    }
  };

  return (
    <div className={styles.formItem} style={style}>
      <label>{label}</label>

      <input
        type="file"
        ref={(el) => (fileInputRefs.current[fieldKey] = el)}
        accept={accept}
        disabled={uploading}
        onChange={(e) => handleFileChange(e, fieldKey)}
      />

      {note && <div className={styles.note}>{note}</div>}

      {formData[fieldKey] && (
        <div className={styles.uploadPreview}>
          <p><strong>Uploaded file:</strong></p>
          <div className={styles.listFile}>
            <span>{getFileNameFromUrl(formData[fieldKey])}</span>
            <a
              href={formData[fieldKey]}
              target="_blank"
              rel="noopener noreferrer"
              style={{ marginLeft: "8px", color: "#007bff" }}
            >
              View
            </a>
            <button
              type="button"
              onClick={() => handleRemoveFile(fieldKey)}
              className={styles.fileRemove}
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {uploading && <p style={{ color: "gray" }}>Uploading...</p>}
    </div>
  );
};

export default UploadPhoto;
```

---

## 🔧 Step 3: Update `UploadVideo.jsx`

Update the video upload component:

```jsx
import React, { useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";
import styles from "/src/styles/Training.module.css";
import { uploadTrainerVideo } from "/src/utils/azureUtils";
import toast from "react-hot-toast";

const UploadVideo = ({
  fieldKey,
  label,
  note,
  accept = ".mp3,.mp4,.avi,.mov,.wmv",
  formData,
  setFormData,
  maxSizeMB = 100, // Increased for videos
  style = {},
}) => {
  const fileInputRefs = useRef({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const handleFileChange = async (e, key) => {
    const files = Array.from(e.target.files);

    const validFiles = [];
    const rejectedFiles = [];

    files.forEach((file) => {
      if (file.size <= maxSizeMB * 1024 * 1024) {
        validFiles.push(file);
      } else {
        rejectedFiles.push(file.name);
      }
    });

    if (rejectedFiles.length > 0) {
      toast.error(
        `These files exceed the size limit (${maxSizeMB}MB): ${rejectedFiles.join(", ")}`
      );
    }

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      const trainerId = parseInt(localStorage.getItem("userId"));
      const unitName = localStorage.getItem("unitName");

      // Upload all valid files
      const uploadPromises = validFiles.map(async (file, index) => {
        try {
          setUploadProgress((prev) => ({
            ...prev,
            [file.name]: "Uploading..."
          }));

          const uploadedUrl = await uploadTrainerVideo(file, trainerId, unitName);

          console.log(`🎥 Video ${index + 1}/${validFiles.length} uploaded:`, uploadedUrl);
          // Path: units/gkvk-bangalore/trainers/999/videos/video.mp4

          setUploadProgress((prev) => ({
            ...prev,
            [file.name]: "✅ Done"
          }));

          return {
            name: file.name,
            url: uploadedUrl,
            size: file.size
          };
        } catch (error) {
          console.error(`❌ Failed to upload ${file.name}:`, error);
          setUploadProgress((prev) => ({
            ...prev,
            [file.name]: "❌ Failed"
          }));
          throw error;
        }
      });

      const uploadedVideos = await Promise.all(uploadPromises);

      // Store video URLs (not File objects)
      setFormData((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), ...uploadedVideos],
      }));

      toast.success(`✅ ${validFiles.length} video(s) uploaded successfully!`);
    } catch (error) {
      console.error("❌ Upload failed:", error);
      toast.error("Some videos failed to upload. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const handleRemoveFile = (key, index) => {
    const updatedVideos = [...(formData[key] || [])];
    updatedVideos.splice(index, 1);

    setFormData((prev) => ({
      ...prev,
      [key]: updatedVideos,
    }));
  };

  return (
    <div className={styles.formItem} style={style}>
      <label>{label}</label>

      <input
        type="file"
        ref={(el) => (fileInputRefs.current[fieldKey] = el)}
        accept={accept}
        onChange={(e) => handleFileChange(e, fieldKey)}
        multiple
        disabled={uploading}
      />

      {note && <div className={styles.note}>{note}</div>}

      {/* Upload progress */}
      {uploading && Object.keys(uploadProgress).length > 0 && (
        <div style={{ marginTop: "10px", fontSize: "0.9em" }}>
          {Object.entries(uploadProgress).map(([fileName, status]) => (
            <div key={fileName} style={{ marginBottom: "5px" }}>
              {fileName}: {status}
            </div>
          ))}
        </div>
      )}

      {/* Uploaded videos list */}
      {formData[fieldKey] && formData[fieldKey].length > 0 && (
        <div style={{ marginTop: "10px" }}>
          <p><strong>Uploaded videos:</strong></p>
          <ul>
            {formData[fieldKey].map((video, index) => (
              <li key={index} className={styles.listFile}>
                <strong>{video.name}</strong>
                {video.size && (
                  <span> ({(video.size / 1024 / 1024).toFixed(2)} MB)</span>
                )}
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ marginLeft: "8px", color: "#007bff" }}
                >
                  View
                </a>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(fieldKey, index)}
                  className={styles.fileRemove}
                >
                  <FaTimes />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UploadVideo;
```

---

## 🔧 Step 4: Usage in Your Forms

Update your training forms to use the new components:

```jsx
import UploadPhoto from "./components/UploadPhoto";
import UploadVideo from "./components/UploadVideo";

function TrainingForm() {
  const [formData, setFormData] = useState({
    trainingModule: null,     // Document URL
    fieldPhoto: null,         // Photo URL
    workshopVideos: [],       // Array of video objects
  });

  // Make sure userId and unitName are in localStorage
  useEffect(() => {
    // Set from your auth context or API
    localStorage.setItem("userId", "999");
    localStorage.setItem("unitName", "GKVK Bangalore");
    localStorage.setItem("privateContainerName", "gkvk-private");
    localStorage.setItem("publicContainerName", "gkvk-public");
  }, []);

  return (
    <form>
      {/* Upload training module (document) */}
      <UploadPhoto
        fieldKey="trainingModule"
        label="Upload Training Module"
        accept=".pdf,.docx,.pptx"
        formData={formData}
        setFormData={setFormData}
        fileType="documents"
        maxSizeMB={10}
      />
      {/* Result: units/gkvk-bangalore/trainers/999/documents/module.pdf */}

      {/* Upload field photo */}
      <UploadPhoto
        fieldKey="fieldPhoto"
        label="Upload Field Visit Photo"
        accept=".jpg,.jpeg,.png"
        formData={formData}
        setFormData={setFormData}
        fileType="photos"
        maxSizeMB={5}
      />
      {/* Result: units/gkvk-bangalore/trainers/999/photos/field-visit.jpg */}

      {/* Upload workshop videos */}
      <UploadVideo
        fieldKey="workshopVideos"
        label="Upload Workshop Videos"
        accept=".mp4,.mov,.avi"
        formData={formData}
        setFormData={setFormData}
        maxSizeMB={100}
      />
      {/* Result: units/gkvk-bangalore/trainers/999/videos/workshop.mp4 */}

      <button type="submit">Submit Training Record</button>
    </form>
  );
}
```

---

## 📊 Final Folder Structure

After uploads, your blob storage will look like:

```
gkvk-private/
└── units/
    └── gkvk-bangalore/
        └── trainers/
            └── 999/
                ├── documents/
                │   ├── module.pdf
                │   └── lesson-plan.docx
                ├── photos/
                │   ├── field-visit.jpg
                │   └── workshop-2024.jpg
                └── videos/
                    ├── demonstration.mp4
                    └── workshop.mp4
```

---

## 🔑 Key Changes Summary

| Component | What Changed |
|-----------|-------------|
| **azureUtils.js** | Added `buildBlobPath()` and helper functions for hierarchical paths |
| **UploadPhoto.jsx** | Added `fileType` prop, uses `uploadTrainerDocument()` or `uploadTrainerPhoto()` |
| **UploadVideo.jsx** | Uses `uploadTrainerVideo()`, uploads to `videos/` folder |
| **Backend** | Need to support larger video files (configure max request size) |

---

## ⚙️ Backend Configuration for Videos

Update your backend to handle larger video files:

### ASP.NET Core - `Program.cs`

```csharp
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 104857600; // 100 MB
});

builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 104857600; // 100 MB
});
```

### `appsettings.json`

```json
{
  "AzureStorage": {
    "SasTokenExpiryHours": 24,
    "MaxFileSizeMB": {
      "Documents": 10,
      "Photos": 5,
      "Videos": 100
    }
  }
}
```

---

## ✅ Testing Checklist

- [ ] Upload document → verify path: `units/{unit}/trainers/{id}/documents/`
- [ ] Upload photo → verify path: `units/{unit}/trainers/{id}/photos/`
- [ ] Upload video → verify path: `units/{unit}/trainers/{id}/videos/`
- [ ] Upload multiple videos → verify all go to correct folder
- [ ] Check file sizes respect limits
- [ ] Verify SAS token works for private container
- [ ] Test file deletion
- [ ] Check uploaded URLs stored correctly in database

---

## 🚀 Summary

Your implementation now:
✅ Organizes files by **unit name** (e.g., `gkvk-bangalore`)
✅ Separates **documents**, **photos**, and **videos** into different folders
✅ Maintains **trainer-specific** folders under each unit
✅ Supports **large video files** (up to 100MB by default)
✅ Uses the **same hierarchical structure** as the Angular app
✅ Stores **URLs** (not File objects) in your backend database

**Last Updated**: 2025-12-15
**Version**: 1.0 - React Integration

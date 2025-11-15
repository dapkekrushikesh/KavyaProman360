# Profile Avatar Upload Feature

## Overview
Users can now upload, view, and delete their profile avatars from the Settings page. The uploaded avatar will be displayed across all pages wherever the user profile is shown.

## Features Implemented

### 1. Backend Changes

#### User Model (`backend/models/User.js`)
- Added `avatar` field to store the avatar file path
- Type: String, default: null

#### Auth Routes (`backend/routes/auth.js`)
- **Multer Configuration**: 
  - Storage: `uploads/avatars/` directory
  - Filename format: `userId-timestamp.ext`
  - File filter: Only images (jpeg, jpg, png, gif)
  - Size limit: 5MB

- **New Endpoints**:
  
  **POST /api/auth/upload-avatar**
  - Requires authentication
  - Accepts multipart/form-data with 'avatar' field
  - Automatically deletes old avatar when uploading new one
  - Returns avatar URL on success
  
  **DELETE /api/auth/delete-avatar**
  - Requires authentication
  - Removes avatar file from server
  - Sets user.avatar to null

- **Updated Endpoints**:
  - `POST /api/auth/signup` - Now returns avatar field
  - `POST /api/auth/login` - Now returns avatar field
  - `GET /api/auth/me` - Now includes avatar field

#### Server Configuration (`backend/server.js`)
- Already configured to serve static files from `uploads/` directory
- Avatar files accessible at: `{BACKEND_URL}/uploads/avatars/{filename}`

### 2. Frontend Changes

#### Settings Page (`frontend/setting.html`)
- Added "Profile Avatar" section at the top of settings
- Features:
  - Current avatar preview (150x150px, circular)
  - File input for selecting new avatar
  - Upload button (enabled only when file is selected)
  - Remove Avatar button
  - Real-time validation messages
  - File type and size validation

#### Settings JavaScript (`frontend/assests/js/setting.js`)
- **loadCurrentAvatar()**: Loads user's current avatar on page load
- **Avatar Upload**:
  - Client-side validation (file type, size)
  - Preview before upload
  - FormData submission
  - Success/error messages
  - Auto-reload after upload
- **Avatar Delete**:
  - Confirmation dialog
  - Resets to default avatar
  - Auto-reload after deletion

#### User Profile JavaScript (`frontend/assests/js/user-profile.js`)
- Updated `loadUserProfile()` function to:
  - Fetch avatar URL from backend
  - Update all avatar images across the page
  - Fall back to default avatar if none is set
  - Selector: `img[alt="User Avatar"]`

## File Structure

```
backend/
  └── uploads/
      └── avatars/          # Auto-created, stores uploaded avatars
          └── {userId}-{timestamp}.{ext}

frontend/
  └── assests/
      └── img/
          └── profileavatar.png  # Default avatar fallback
```

## Usage Flow

1. **User goes to Settings page**
   - Current avatar is loaded automatically
   - Default avatar shown if none exists

2. **Upload New Avatar**:
   - Click "Choose File" and select an image
   - Preview appears immediately
   - Click "Upload Avatar"
   - Success message shown
   - Page reloads to update all avatars

3. **Remove Avatar**:
   - Click "Remove Avatar"
   - Confirm deletion
   - Avatar resets to default
   - Page reloads to update all avatars

4. **Avatar Display**:
   - Profile modal (all pages)
   - Profile details modal (all pages)
   - Settings page preview

## Validation Rules

### File Type
- Allowed: JPEG, JPG, PNG, GIF
- MIME types: `image/jpeg`, `image/jpg`, `image/png`, `image/gif`

### File Size
- Maximum: 5MB (5,242,880 bytes)
- Enforced on both client and server side

### Security
- Authentication required for upload/delete
- Only authenticated user can modify their own avatar
- Old avatar files are automatically deleted on upload
- File extensions validated using regex

## Testing Checklist

### Backend Testing
- [ ] Upload avatar with valid image file
- [ ] Upload avatar with invalid file type (should fail)
- [ ] Upload avatar larger than 5MB (should fail)
- [ ] Upload avatar without authentication (should fail)
- [ ] Delete avatar when one exists
- [ ] Delete avatar when none exists
- [ ] Verify old avatar file is deleted on new upload
- [ ] Verify avatar appears in /api/auth/me response
- [ ] Verify avatar appears in login response
- [ ] Verify avatar URL is accessible

### Frontend Testing
- [ ] Navigate to Settings page
- [ ] Verify default avatar shows initially
- [ ] Select valid image file
- [ ] Verify preview appears
- [ ] Verify upload button becomes enabled
- [ ] Upload avatar successfully
- [ ] Verify success message appears
- [ ] Verify avatar updates across all pages after reload
- [ ] Delete avatar
- [ ] Verify confirmation dialog appears
- [ ] Verify avatar resets to default
- [ ] Test with invalid file type
- [ ] Test with file larger than 5MB
- [ ] Verify error messages display correctly

## API Documentation

### Upload Avatar
```http
POST /api/auth/upload-avatar
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
{
  "avatar": <file>
}

Response (200):
{
  "message": "Avatar uploaded successfully",
  "avatar": "/uploads/avatars/userId-timestamp.png"
}
```

### Delete Avatar
```http
DELETE /api/auth/delete-avatar
Authorization: Bearer {token}

Response (200):
{
  "message": "Avatar deleted successfully"
}
```

### Get Current User (includes avatar)
```http
GET /api/auth/me
Authorization: Bearer {token}

Response (200):
{
  "user": {
    "id": "userId",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user",
    "avatar": "/uploads/avatars/userId-timestamp.png"
  }
}
```

## Production Deployment Notes

1. **Environment Variables**:
   - No new environment variables needed
   - Uses existing `UPLOAD_DIR` (defaults to 'uploads')

2. **File Storage**:
   - Avatars stored in `backend/uploads/avatars/`
   - Ensure directory has write permissions
   - On Render: Files will persist during deployment
   - Consider using cloud storage (S3, Cloudinary) for production at scale

3. **CORS**:
   - Already configured for production frontend URL
   - Avatar files served from backend domain

4. **Render Deployment**:
   - Upload directory will be created automatically
   - No additional configuration needed
   - Files persist between deploys (in same instance)

## Future Enhancements

1. **Image Optimization**:
   - Resize images to standard size (e.g., 300x300)
   - Compress images to reduce file size
   - Generate thumbnails

2. **Cloud Storage**:
   - Integrate with AWS S3 or Cloudinary
   - CDN for faster delivery
   - Better scalability

3. **Crop/Edit**:
   - Client-side image cropping tool
   - Rotate, zoom features
   - Aspect ratio enforcement

4. **Multiple Profiles**:
   - Allow multiple avatar options
   - Avatar gallery/library
   - Preset avatars

## Troubleshooting

**Avatar not uploading:**
- Check file size (< 5MB)
- Check file type (jpeg, jpg, png, gif)
- Verify authentication token exists
- Check browser console for errors

**Avatar not displaying:**
- Check if avatar URL is correct in API response
- Verify backend is serving uploads directory
- Check CORS configuration
- Clear browser cache

**Old avatar not deleted:**
- Check file permissions on uploads directory
- Verify file path is correct in database
- Check server logs for errors

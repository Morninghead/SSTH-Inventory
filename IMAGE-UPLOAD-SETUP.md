# Image Upload Setup Guide - SSTH Inventory System

**Feature:** Item Image Upload
**Storage:** Supabase Storage
**Status:** ✅ Code Complete - Requires Supabase Configuration

---

## 🎯 What's New

You can now upload images for inventory items! Images are stored in Supabase Storage and displayed in:
- ✅ Item creation form (with preview)
- ✅ Item edit form (shows existing image)
- ✅ Inventory list table (thumbnail view)
- ✅ Automatic image deletion when updating/removing

---

## ⚙️ Supabase Storage Setup (REQUIRED)

Before using image upload, you MUST create a storage bucket in Supabase.

### Step 1: Create Storage Bucket

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/project/viabjxdggrdarcveaxam

2. **Navigate to Storage**
   - Click **Storage** in the left sidebar
   - Click **"New bucket"** button

3. **Create Bucket**
   - **Name:** `inventory-images` (EXACTLY this name - code depends on it)
   - **Public bucket:** ✅ **Enable** (so images can be viewed)
   - **File size limit:** 5MB (recommended)
   - **Allowed MIME types:** `image/*` (all image types)
   - Click **"Create bucket"**

### Step 2: Configure Bucket Policies (Optional)

For better security, set up RLS policies:

1. **Go to Storage Policies**
   - Storage → `inventory-images` → Policies

2. **Add Policy for Upload** (Authenticated users can upload)
   ```sql
   CREATE POLICY "Authenticated users can upload images"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'inventory-images');
   ```

3. **Add Policy for Public Read** (Anyone can view)
   ```sql
   CREATE POLICY "Public can view images"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'inventory-images');
   ```

4. **Add Policy for Delete** (Authenticated users can delete their uploads)
   ```sql
   CREATE POLICY "Authenticated users can delete images"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (bucket_id = 'inventory-images');
   ```

---

## 🚀 Features Implemented

### 1. Image Upload in Form
**Location:** `src/components/inventory/ItemFormModal.tsx`

**Features:**
- ✅ Drag & drop or click to upload
- ✅ Image preview before save
- ✅ File type validation (only images)
- ✅ File size validation (max 5MB)
- ✅ Remove image button
- ✅ Shows existing image when editing

### 2. Image Display in List
**Location:** `src/pages/InventoryPage.tsx`

**Features:**
- ✅ Thumbnail view (48x48px)
- ✅ Placeholder icon when no image
- ✅ Rounded corners with border
- ✅ Proper aspect ratio (object-cover)

### 3. Automatic Image Management

**Upload Flow:**
1. User selects image → Preview shown
2. User saves item → Image uploaded to Supabase Storage
3. Image URL saved to database (`image_url` column)
4. Image path saved for deletion (`image_path` column)

**Update Flow:**
1. User edits item with existing image → Image shown
2. User uploads new image → Old image deleted from storage
3. New image uploaded → URL updated in database

**Delete Flow:**
1. User removes image → Image deleted from storage
2. Database fields cleared (`image_url` and `image_path` = null)

---

## 📝 Database Fields Used

The `items` table has these columns for images:

```sql
- image_url: text (nullable) - Public URL to view image
- image_path: text (nullable) - Storage path for deletion (e.g., "item-images/ABC-001-1699123456.jpg")
```

These fields already exist in your database schema.

---

## 🧪 Testing the Feature

### Test Upload

1. **Start the app**
   ```bash
   npm run dev
   ```

2. **Login**
   - Go to http://localhost:5173/login
   - Login with your credentials

3. **Add New Item**
   - Click **"Add Item"** button
   - Fill in item details
   - Click the image upload area
   - Select an image (JPG, PNG, GIF)
   - See preview appear
   - Click **"Create Item"**
   - ✅ Image should upload and save

4. **View in List**
   - Go to Inventory page
   - See your item with image thumbnail
   - ✅ Image should display

5. **Edit Item**
   - Click **Edit** on an item with image
   - ✅ Existing image should show
   - Upload new image to replace
   - ✅ Old image deleted, new image shown

### Test Validation

1. **File Type Validation**
   - Try uploading a PDF or document
   - ✅ Should show error: "Please select an image file"

2. **File Size Validation**
   - Try uploading image > 5MB
   - ✅ Should show error: "Image size must be less than 5MB"

3. **Remove Image**
   - Upload an image
   - Click the **X** button on preview
   - ✅ Image should disappear

---

## 🔒 Security Considerations

### What's Protected

- ✅ **File type validation:** Only images allowed (client-side)
- ✅ **File size limit:** Max 5MB (client-side)
- ✅ **Unique filenames:** Timestamp prevents collisions
- ✅ **Authenticated uploads:** Only logged-in users can upload
- ✅ **Organized storage:** Images in `item-images/` folder

### What You Should Add (Optional)

1. **Server-side validation** (Supabase Edge Functions)
   - Validate file types on server
   - Scan for malware
   - Resize images to standard size

2. **Image optimization**
   - Compress images before upload
   - Generate thumbnails
   - Convert to WebP format

3. **Storage limits**
   - Monitor storage usage
   - Set up alerts
   - Clean up orphaned images

---

## 🐛 Troubleshooting

### Error: "Bucket not found"

**Problem:** The `inventory-images` bucket doesn't exist

**Solution:**
1. Go to Supabase Dashboard → Storage
2. Create bucket named `inventory-images`
3. Make it public
4. Try again

### Error: "New row violates row-level security"

**Problem:** RLS policies prevent upload

**Solution:**
1. Go to Storage → Policies
2. Add policy to allow authenticated uploads (see Step 2 above)
3. Or temporarily disable RLS (not recommended)

### Error: "Failed to upload image"

**Problem:** Various causes

**Solutions:**
1. Check Supabase project is active
2. Verify environment variables are correct
3. Check browser console for detailed error
4. Verify user is authenticated
5. Check storage quota not exceeded

### Image doesn't display

**Problem:** URL issues

**Solutions:**
1. Check `image_url` in database is valid
2. Verify bucket is public
3. Check CORS settings in Supabase
4. Open image URL directly in browser to test

### Images upload but don't show in list

**Problem:** Data not refr eshed

**Solutions:**
1. Refresh the page
2. Check `loadItems()` is called after save
3. Verify `image_url` field is in SELECT query

---

## 📊 Storage Limits

### Supabase Free Tier
- **Storage:** 1GB
- **Bandwidth:** 2GB/month
- **File size:** No limit (but we enforce 5MB)

### Recommendations
- Average image size: 200-500KB
- Expected capacity: ~2,000-5,000 images per 1GB
- Monitor usage monthly
- Upgrade if needed

---

## 🎨 UI/UX Features

### Form Upload Area
- **Empty state:** Dashed border with upload icon
- **Hover:** Background color changes
- **With image:** Shows 128x128px preview
- **Remove button:** Red X in top-right corner

### Table Display
- **With image:** 48x48px thumbnail, rounded, bordered
- **Without image:** Gray placeholder with package icon
- **Hover:** Row highlights

---

## 🔄 Future Enhancements

### Possible Improvements

1. **Multiple images per item**
   - Create `item_images` table
   - Image gallery view
   - Set primary image

2. **Image editing**
   - Crop before upload
   - Rotate/flip
   - Add text overlay

3. **Drag & drop to table**
   - Upload directly from list view
   - Bulk upload

4. **Image optimization**
   - Auto-resize to 800x800px
   - Convert to WebP
   - Generate thumbnails (200x200px)

5. **Advanced features**
   - Barcode scanning from image
   - OCR for item details
   - Image search

---

## 📁 Files Modified

1. **`src/components/inventory/ItemFormModal.tsx`**
   - Added image upload field
   - Added image preview
   - Added upload logic
   - Added delete old image logic

2. **`src/pages/InventoryPage.tsx`**
   - Added image column to table
   - Added thumbnail display
   - Added placeholder for no image

---

## ✅ Completion Checklist

Before using in production:

- [ ] Create `inventory-images` bucket in Supabase
- [ ] Set bucket to public
- [ ] Configure RLS policies (optional)
- [ ] Test uploading image
- [ ] Test viewing image in list
- [ ] Test editing item with image
- [ ] Test removing image
- [ ] Test validation (file type, size)
- [ ] Monitor storage usage
- [ ] Document for team

---

## 🎉 You're Ready!

**Image upload is now fully functional!**

Follow the setup steps above to configure Supabase Storage, then start uploading item images.

**Quick Start:**
1. Create `inventory-images` bucket (public)
2. Add an item with image
3. See it in the list! ✨

---

**Need Help?**
- Check Supabase Storage docs: https://supabase.com/docs/guides/storage
- Review code in `ItemFormModal.tsx` for implementation details
- Check browser console for error messages

---

**Last Updated:** November 5, 2025
**Status:** ✅ Ready for Use (After Supabase Setup)

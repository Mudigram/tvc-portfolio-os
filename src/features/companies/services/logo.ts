import { createBrowserClient } from '@/lib/supabase/client'

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml',
]

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 // 2MB cap

/**
 * Derive file extension from MIME type rather than untrusted user filename.
 */
function getExtensionFromMimeType(mimeType: string): string {
  switch (mimeType.toLowerCase()) {
    case 'image/png':
      return 'png'
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg'
    case 'image/webp':
      return 'webp'
    case 'image/svg+xml':
      return 'svg'
    default:
      return 'png'
  }
}

/**
 * Returns the public URL for a company logo.
 * Synchronous and deterministic for both Server and Client components.
 * If logo_path is present, derives public storage URL from 'company-logos' bucket.
 * Otherwise falls back to legacy logo_url or null.
 */
export function getCompanyLogoUrl(company: {
  logo_path?: string | null
  logo_url?: string | null
}): string | null {
  if (company.logo_path) {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
    if (baseUrl) {
      return `${baseUrl}/storage/v1/object/public/company-logos/${company.logo_path}`
    }
  }
  return company.logo_url ?? null
}

/**
 * Client-side direct upload to Supabase Storage bucket 'company-logos'.
 * Path format: {company_id}/logo.{ext}
 * Uses upsert: true so re-uploads replace existing logos without orphaned files.
 * On success, updates the companies.logo_path column in Supabase DB.
 */
export async function uploadCompanyLogo(
  companyId: string,
  file: File
): Promise<{ success: boolean; logoPath?: string; logoUrl?: string; error?: string }> {
  if (!file) {
    return { success: false, error: 'No file selected.' }
  }

  // 1. Client-side validation: file type
  if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      success: false,
      error: 'Invalid file format. Supported formats: PNG, JPEG, WebP, SVG.',
    }
  }

  // 2. Client-side validation: file size (2MB limit)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      error: 'File size exceeds the 2MB limit. Please select a smaller image.',
    }
  }

  try {
    const ext = getExtensionFromMimeType(file.type)
    const storagePath = `${companyId}/logo.${ext}`

    const supabase = createBrowserClient()

    // 3. Direct client-side upload with user's JWT context
    const { data: storageData, error: storageErr } = await supabase.storage
      .from('company-logos')
      .upload(storagePath, file, {
        upsert: true,
        contentType: file.type,
      })

    if (storageErr) {
      console.error('[logo.service] Storage upload error:', storageErr.message)
      return { success: false, error: storageErr.message || 'Failed to upload image to storage.' }
    }

    const finalPath = storageData?.path || storagePath

    // 4. Record logo_path on companies table row
    const { error: dbErr } = await supabase
      .from('companies')
      .update({ logo_path: finalPath })
      .eq('id', companyId)

    if (dbErr) {
      console.error('[logo.service] DB logo_path update error:', dbErr.message)
      return { success: false, error: 'Image uploaded, but failed to link to company profile.' }
    }

    const logoUrl = getCompanyLogoUrl({ logo_path: finalPath })

    return {
      success: true,
      logoPath: finalPath,
      logoUrl: logoUrl ?? undefined,
    }
  } catch (err: any) {
    console.error('[logo.service] Unexpected exception during logo upload:', err)
    return { success: false, error: err?.message || 'An error occurred while uploading the logo.' }
  }
}

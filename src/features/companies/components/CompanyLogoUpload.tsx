'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Camera, AlertCircle, CheckCircle2 } from 'lucide-react'
import { uploadCompanyLogo, getCompanyLogoUrl } from '../services/logo'
import { Spinner } from '@/components/ui/spinner'

interface CompanyLogoUploadProps {
  companyId: string
  companyName: string
  currentLogoPath?: string | null
  currentLogoUrl?: string | null
  onUploadSuccess?: (newLogoUrl: string, newLogoPath: string) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function CompanyLogoUpload({
  companyId,
  companyName,
  currentLogoPath,
  currentLogoUrl,
  onUploadSuccess,
  size = 'md',
  className = '',
}: CompanyLogoUploadProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initialUrl = getCompanyLogoUrl({
    logo_path: currentLogoPath,
    logo_url: currentLogoUrl,
  })

  const [displayUrl, setDisplayUrl] = useState<string | null>(initialUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const initials = companyName
    ? companyName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : 'CO'

  const sizeClasses = {
    sm: 'w-12 h-12 text-xs',
    md: 'w-20 h-20 text-lg',
    lg: 'w-28 h-28 text-2xl',
  }[size]

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setSuccessMsg(null)

    // Client-side validation: Mime types
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
    if (!allowed.includes(file.type.toLowerCase())) {
      setError('Invalid format. Please select PNG, JPEG, WebP, or SVG.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Client-side validation: Max 2MB size
    if (file.size > 2 * 1024 * 1024) {
      setError('File size exceeds 2MB limit.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Temporary local object URL preview for immediate feedback
    const objectUrl = URL.createObjectURL(file)
    setDisplayUrl(objectUrl)

    setUploading(true)

    const result = await uploadCompanyLogo(companyId, file)

    if (result.success && result.logoUrl && result.logoPath) {
      setDisplayUrl(result.logoUrl)
      setSuccessMsg('Logo updated!')
      if (onUploadSuccess) {
        onUploadSuccess(result.logoUrl, result.logoPath)
      }
      router.refresh()
    } else {
      setError(result.error || 'Failed to upload logo.')
      // Revert to initial URL if upload failed
      setDisplayUrl(initialUrl)
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative group inline-block">
        {/* Logo Image or Initials Box */}
        <div
          className={`${sizeClasses} rounded-xl border border-zinc-200 overflow-hidden bg-white shadow-sm flex items-center justify-center relative transition-all group-hover:border-[#1a23bd]`}
        >
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt={`${companyName} logo`}
              width={112}
              height={112}
              className="w-full h-full object-contain p-1.5"
              unoptimized
            />
          ) : (
            <span className="font-bold text-zinc-300 tracking-wide">{initials}</span>
          )}

          {/* Hover Overlay & Upload Trigger */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 bg-zinc-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer disabled:cursor-not-allowed"
            title="Click to upload or replace logo"
          >
            {uploading ? (
              <Spinner size="default" className="text-white" />
            ) : (
              <>
                <Camera className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-semibold tracking-tight uppercase">
                  {displayUrl ? 'Replace' : 'Upload'}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Validation Messages & Feedback */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  )
}

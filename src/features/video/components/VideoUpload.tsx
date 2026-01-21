import { useCallback, useState } from 'react'
import { Upload, FileVideo, AlertCircle, Loader2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { useVideoStore } from '@/stores/video'

interface VideoUploadProps {
  projectId?: string
  onUploadComplete?: (url: string) => void
}

export function VideoUpload({ projectId = 'default', onUploadComplete }: VideoUploadProps) {
  const { setMetadata } = useVideoStore()
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime']
    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Please upload MP4, WebM, or MOV.'
    }

    const maxSize = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSize) {
      return 'File too large. Maximum size is 500MB.'
    }

    return null
  }

  const extractMetadata = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata'

      video.onloadedmetadata = () => {
        // Default frame rate fallback
        const frameRate = 30

        // Use simple metadata extraction (frame rate detection is complex)
        setMetadata({
          storageUrl: '', // Will be set after upload
          fileName: file.name,
          duration: video.duration,
          frameRate,
          width: video.videoWidth,
          height: video.videoHeight,
          totalFrames: Math.floor(video.duration * frameRate),
        })

        URL.revokeObjectURL(video.src)
        resolve()
      }

      video.onerror = () => {
        URL.revokeObjectURL(video.src)
        reject(new Error('Failed to load video metadata'))
      }

      video.src = URL.createObjectURL(file)
    })
  }

  const uploadFile = async (file: File): Promise<string> => {
    // Get presigned URL
    const presignResponse = await fetch('/api/upload/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        projectId,
      }),
    })

    if (!presignResponse.ok) {
      const errorData = await presignResponse.json()
      throw new Error(errorData.error || 'Failed to get upload URL')
    }

    const { uploadUrl, readUrl } = await presignResponse.json()

    // Upload to MinIO with progress tracking
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          reject(new Error('Upload failed'))
        }
      }

      xhr.onerror = () => reject(new Error('Upload failed'))

      xhr.open('PUT', uploadUrl)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.send(file)
    })

    return readUrl
  }

  const handleFile = useCallback(
    async (file: File) => {
      setError(null)

      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      try {
        setIsUploading(true)
        setUploadProgress(0)

        // Extract metadata first
        await extractMetadata(file)

        // Then upload
        const storageUrl = await uploadFile(file)

        // Update metadata with storage URL
        const currentMetadata = useVideoStore.getState().metadata
        if (currentMetadata) {
          setMetadata({ ...currentMetadata, storageUrl })
        }

        onUploadComplete?.(storageUrl)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
      } finally {
        setIsUploading(false)
      }
    },
    [setMetadata, onUploadComplete, projectId]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  return (
    <div className="flex h-full w-full flex-col">
      {/* Error display */}
      {error && (
        <div className="mb-4 flex items-center gap-3 rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isUploading ? (
        /* Upload progress state */
        <div className="flex h-full flex-col items-center justify-center gap-6 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900 p-8">
          {/* Spinning loader with technical aesthetic */}
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-2 border-zinc-700" />
            <div
              className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-2 border-transparent border-t-emerald-500"
              style={{ animationDuration: '1s' }}
            />
            <Loader2 className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-zinc-500" />
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="font-mono text-sm uppercase tracking-wider text-zinc-400">
              {uploadProgress === 0 ? 'Analyzing video...' : 'Uploading'}
            </span>
            {uploadProgress > 0 && (
              <span className="font-mono text-2xl tabular-nums text-zinc-100">
                {uploadProgress}%
              </span>
            )}
          </div>

          {uploadProgress > 0 && (
            <div className="w-64">
              <Progress
                value={uploadProgress}
                className="h-1 bg-zinc-800 [&>div]:bg-emerald-500"
              />
            </div>
          )}
        </div>
      ) : (
        /* Drop zone */
        <label
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative flex h-full cursor-pointer flex-col items-center justify-center gap-6 overflow-hidden rounded-lg border-2 border-dashed
            transition-all duration-200
            ${
              isDragging
                ? 'border-emerald-500 bg-emerald-500/5'
                : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800/50'
            }
          `}
        >
          {/* Technical grid background */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(to right, currentColor 1px, transparent 1px),
                linear-gradient(to bottom, currentColor 1px, transparent 1px)
              `,
              backgroundSize: '24px 24px',
            }}
          />

          {/* Corner brackets for technical feel */}
          <div className="pointer-events-none absolute left-4 top-4 h-8 w-8 border-l-2 border-t-2 border-zinc-700" />
          <div className="pointer-events-none absolute right-4 top-4 h-8 w-8 border-r-2 border-t-2 border-zinc-700" />
          <div className="pointer-events-none absolute bottom-4 left-4 h-8 w-8 border-b-2 border-l-2 border-zinc-700" />
          <div className="pointer-events-none absolute bottom-4 right-4 h-8 w-8 border-b-2 border-r-2 border-zinc-700" />

          {/* Icon */}
          <div
            className={`
              rounded-full p-4 transition-colors
              ${isDragging ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}
            `}
          >
            {isDragging ? (
              <FileVideo className="h-10 w-10" />
            ) : (
              <Upload className="h-10 w-10" />
            )}
          </div>

          {/* Text */}
          <div className="flex flex-col items-center gap-2 text-center">
            <span
              className={`text-lg font-medium ${isDragging ? 'text-emerald-400' : 'text-zinc-300'}`}
            >
              {isDragging ? 'Drop video here' : 'Drop video or click to upload'}
            </span>
            <span className="font-mono text-xs uppercase tracking-wider text-zinc-600">
              MP4 • WebM • MOV • Max 500MB
            </span>
          </div>

          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      )}
    </div>
  )
}

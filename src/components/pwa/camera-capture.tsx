'use client'

import { useRef, useState } from 'react'
import { Camera, Upload, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface CameraCaptureProps {
  onCapture: (file: File) => void
  accept?: string
  multiple?: boolean
}

/**
 * Camera capture component — uses native camera on mobile devices via input capture.
 * On Capacitor-native apps, uses @capacitor/camera for full native camera access.
 */
export function CameraCapture({ onCapture, accept = 'image/*', multiple = false }: CameraCaptureProps) {
  const [open, setOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    if (multiple) {
      Array.from(files).forEach(onCapture)
    } else {
      onCapture(files[0])
    }
    setOpen(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Camera className="h-4 w-4 mr-2" />
          Scanner / Capturer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un document</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Button
            variant="default"
            className="w-full justify-start"
            size="lg"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="h-5 w-5 mr-3" />
            Prendre une photo
          </Button>
          <input
            ref={cameraInputRef}
            type="file"
            accept={accept}
            capture="environment"
            multiple={multiple}
            className="hidden"
            onChange={handleFileSelect}
          />

          <Button
            variant="outline"
            className="w-full justify-start"
            size="lg"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-5 w-5 mr-3" />
            Choisir un fichier
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

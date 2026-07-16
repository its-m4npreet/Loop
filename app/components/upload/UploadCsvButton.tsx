'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Upload } from 'lucide-react'
import CsvUploadModal from './CsvUploadModal'

interface UploadCsvButtonProps {
  /** Visual style for the trigger button */
  variant?: 'secondary' | 'primary'
  /** Optional button label */
  label?: string
  /** Hide the button and only open from URL query `?upload=csv` */
  buttonOnly?: boolean
  className?: string
  id?: string
}

/**
 * Upload CSV trigger + modal.
 * Also auto-opens when the URL contains `?upload=csv` (used by Quick Actions).
 */
export default function UploadCsvButton({
  variant = 'secondary',
  label = 'Upload CSV',
  className,
  id = 'upload-csv-btn',
}: UploadCsvButtonProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (searchParams.get('upload') === 'csv') {
      setOpen(true)
    }
  }, [searchParams])

  function handleClose() {
    setOpen(false)
    // Clear query param if present so reopening works later
    if (searchParams.get('upload') === 'csv') {
      const path = window.location.pathname
      router.replace(path, { scroll: false })
    }
  }

  const btnClass =
    variant === 'primary' ? 'btn-primary' : 'btn-secondary'

  return (
    <>
      <button
        type="button"
        className={className ? `${btnClass} ${className}` : btnClass}
        id={id}
        onClick={() => setOpen(true)}
      >
        <Upload size={15} />
        {label}
      </button>
      <CsvUploadModal open={open} onClose={handleClose} />
    </>
  )
}

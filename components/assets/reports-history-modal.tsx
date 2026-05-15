"use client";

import { format } from "date-fns";
import {
  FileText,
  Calendar,
  Users,
  Globe,
  DollarSign,
  ChevronRight,
  Building2,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type Asset, type SavedReport, SAVED_REPORTS, formatCurrency } from "@/lib/constants";

interface ReportsHistoryModalProps {
  asset: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportsHistoryModal({
  asset,
  open,
  onOpenChange,
}: ReportsHistoryModalProps) {
  if (!asset) return null;

  const reports = SAVED_REPORTS.filter((r) => r.assetId === asset.id).sort(
    (a, b) => b.generatedAt.getTime() - a.generatedAt.getTime()
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "trust":
        return <Building2 className="size-3" />;
      case "company":
        return <Building2 className="size-3" />;
      default:
        return <User className="size-3" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-lg">
              <FileText className="size-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg">Report History</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Previously generated reports for <span className="font-medium text-foreground">{asset.name}</span>
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-slate-100 rounded-full mb-4">
                <FileText className="size-8 text-slate-400" />
              </div>
              <h3 className="font-medium text-slate-900 mb-1">No Reports Yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Click the Optimize button to generate your first tax optimization analysis for this asset.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card
                  key={report.id}
                  className="hover:border-slate-300 transition-colors cursor-pointer"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Date and Savings */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar className="size-4" />
                            <span>{format(report.generatedAt, "MMM d, yyyy")}</span>
                            <span className="text-slate-300">at</span>
                            <span>{format(report.generatedAt, "h:mm a")}</span>
                          </div>
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            <DollarSign className="size-3 mr-0.5" />
                            {formatCurrency(report.estimatedSavings, asset.currency)} potential savings
                          </Badge>
                        </div>

                        {/* Summary */}
                        <p className="text-sm text-slate-700 mb-4 leading-relaxed">
                          {report.summary}
                        </p>

                        {/* Identities and Jurisdictions */}
                        <div className="flex flex-wrap gap-4">
                          {/* Identities */}
                          <div className="flex items-start gap-2">
                            <Users className="size-4 text-slate-400 mt-0.5 shrink-0" />
                            <div className="flex flex-wrap gap-1.5">
                              {report.identities.map((identity, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="text-xs font-normal gap-1"
                                >
                                  {getTypeIcon(identity.type)}
                                  {identity.name}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Jurisdictions */}
                          <div className="flex items-start gap-2">
                            <Globe className="size-4 text-slate-400 mt-0.5 shrink-0" />
                            <div className="flex flex-wrap gap-1.5">
                              {report.jurisdictions.map((jurisdiction, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="text-xs font-normal bg-blue-50 border-blue-200 text-blue-700"
                                >
                                  {jurisdiction.code}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* View Button */}
                      <Button variant="ghost" size="sm" className="shrink-0">
                        View
                        <ChevronRight className="size-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-slate-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {reports.length} report{reports.length !== 1 ? "s" : ""} generated
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

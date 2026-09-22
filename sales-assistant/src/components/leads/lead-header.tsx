"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { linkedInAdapter } from "@/lib/linkedin-adapter";
import { PRIORITY_STYLE, STATUS_BADGE_STYLE, statusLabel, type Priority } from "@/lib/status";
import type { LeadDetail } from "@/types";
import { ExternalLink } from "lucide-react";

export function LeadHeader({ lead }: { lead: LeadDetail }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{lead.name}</h1>
          <Badge variant="outline" className={STATUS_BADGE_STYLE[lead.status as never]}>
            {statusLabel(lead.status)}
          </Badge>
          {lead.priority && (
            <Badge variant="outline" className={PRIORITY_STYLE[lead.priority as Priority]}>
              優先度 {lead.priority}
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {lead.companyName}
          {lead.title ? ` / ${lead.title}` : ""}
          {lead.industry ? ` / ${lead.industry}` : ""}
          {lead.location ? ` / ${lead.location}` : ""}
        </p>
        <div className="mt-2 flex items-center gap-3 text-sm">
          {lead.overallScore !== null && (
            <span>
              総合スコア <span className="font-semibold text-en-orange">{lead.overallScore}</span> / 100
            </span>
          )}
          {lead.isCustomerLead && <Badge variant="secondary">顧客候補</Badge>}
          {lead.isPartnerLead && <Badge variant="secondary">協業候補</Badge>}
        </div>
      </div>
      <Button variant="outline" onClick={() => linkedInAdapter.openProfile(lead.linkedinUrl)}>
        <ExternalLink className="h-4 w-4" />
        LinkedInプロフィールを開く
      </Button>
    </div>
  );
}

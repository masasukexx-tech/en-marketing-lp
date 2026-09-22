import Link from "next/link";
import { Suspense } from "react";
import { listLeads, parseLeadListParams } from "@/lib/leads";
import { LeadFilters } from "@/components/leads/lead-filters";
import { LeadTable } from "@/components/leads/lead-table";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const usp = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === "string") usp.set(key, value);
  });

  const params = parseLeadListParams(usp);
  const { leads, total } = await listLeads(params);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">候補者一覧</h1>
          <p className="text-sm text-muted-foreground">{total}件の候補者</p>
        </div>
        <Button asChild>
          <Link href="/leads/new">
            <UserPlus className="h-4 w-4" />
            候補者を登録
          </Link>
        </Button>
      </div>

      <Suspense fallback={null}>
        <LeadFilters />
      </Suspense>
      <LeadTable leads={leads} />
    </div>
  );
}

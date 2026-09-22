import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadForm } from "@/components/leads/lead-form";
import { CsvImport } from "@/components/leads/csv-import";

export default function NewLeadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">候補者登録</h1>
        <p className="text-sm text-muted-foreground">
          LinkedInの内容は手動でコピー＆ペーストしてください。自動取得・自動操作は行いません。
        </p>
      </div>

      <Tabs defaultValue="single">
        <TabsList>
          <TabsTrigger value="single">個別登録</TabsTrigger>
          <TabsTrigger value="csv">CSV一括登録</TabsTrigger>
        </TabsList>
        <TabsContent value="single">
          <LeadForm />
        </TabsContent>
        <TabsContent value="csv">
          <CsvImport />
        </TabsContent>
      </Tabs>
    </div>
  );
}

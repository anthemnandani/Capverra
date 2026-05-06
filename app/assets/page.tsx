import { AssetsTable } from "@/components/assets/assets-table"

export default function AssetsPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-balance">Asset Management</h1>
        <p className="text-muted-foreground mt-2 text-pretty">
          Track asset performance, valuations, and get AI-powered optimization recommendations.
        </p>
      </div>
      <AssetsTable />
    </div>
  )
}

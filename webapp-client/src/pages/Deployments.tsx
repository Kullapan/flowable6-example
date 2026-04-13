import { Card } from "../components/ui/Card"
import { Button } from "../components/ui/Button"
import { Badge } from "../components/ui/Badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table"
import { Download, Plus } from "lucide-react"

export function Deployments() {
  const tableData = [
    { id: "1", name: "Expense Approval", key: "expenseApproval", version: 3, tenant: "default", state: "Active" },
    { id: "2", name: "Contract Review", key: "contractReview", version: 12, tenant: "legal", state: "Active" },
    { id: "3", name: "HR Onboarding", key: "hrOnboarding", version: 1, tenant: "hr", state: "Suspended" },
    { id: "4", name: "Invoice Processing", key: "invoiceProcessing", version: 5, tenant: "finance", state: "Active" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-sm text-on-surface font-semibold">Definitions & Deployments</h1>
          <p className="text-body-md text-on-surface-variant">Manage and deploy your business process definitions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="gap-2">
            <Download className="w-4 h-4" />
            Export Selected
          </Button>
          <Button variant="primary" className="gap-2">
            <Plus className="w-4 h-4" />
            New Deployment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-6 items-start">
        <Card>
          <div className="p-4 border-b border-outline-variant/15 flex items-center justify-between bg-surface-container-lowest rounded-t-lg">
            <h2 className="text-title-md text-on-surface font-semibold">Process Definitions</h2>
            <div className="flex gap-4 border-b-2 border-primary/20 pb-1">
              <span className="text-body-md text-primary font-semibold border-b-2 border-primary -mb-[5px] pb-1 cursor-pointer">All</span>
              <span className="text-body-md text-on-surface-variant cursor-pointer">Active</span>
              <span className="text-body-md text-on-surface-variant cursor-pointer">Suspended</span>
            </div>
          </div>
          <Table className="border-0 rounded-none">
            <TableHeader>
              <TableRow>
                <TableHead>Definition Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Tenant ID</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-on-surface">{row.name}</TableCell>
                  <TableCell className="font-mono text-xs">{row.key}</TableCell>
                  <TableCell>v{row.version}</TableCell>
                  <TableCell>{row.tenant}</TableCell>
                  <TableCell>
                     {row.state === 'Active' ? (
                        <Badge className="bg-primary-container text-on-primary-container">{row.state}</Badge>
                     ) : (
                        <Badge className="bg-error-container text-on-error-container">{row.state}</Badge>
                     )}
                  </TableCell>
                  <TableCell>
                    <Button variant="tertiary">View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Master Details layout as specified by Asymmetry rule */}
        <Card className="sticky top-6">
          <div className="p-4 border-b border-outline-variant/15 bg-surface-container-highest rounded-t-lg">
             <h3 className="text-title-md text-on-surface font-bold">Selected Details</h3>
          </div>
          <div className="p-4 text-body-md text-on-surface-variant">
             <p>Select a definition from the list to view its technical details, deployment ID, and graphical diagram.</p>
          </div>
        </Card>
      </div>
    </div>
  )
}

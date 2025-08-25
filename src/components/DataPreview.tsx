import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, FileText, BarChart2 } from "lucide-react";
import type { CustomerData, InvoiceData } from "@/types/invoice";
import { Button } from "@/components/ui/button";
import { exportSummaryToExcel } from "@/lib/excel-data-processor";

interface DataPreviewProps {
  customerData: CustomerData[];
  invoiceData: InvoiceData[];
}

export const DataPreview = ({
  customerData,
  invoiceData,
}: DataPreviewProps) => {
  const [activeTab, setActiveTab] = useState("customers");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate summary totals
  const summaryTotals = useMemo(() => {
    const godownRentTotal = invoiceData.reduce(
      (sum, invoice) => sum + invoice.godownRent,
      0
    );
    const mainBillAmountTotal = invoiceData.reduce(
      (sum, invoice) => sum + invoice.mainBillAmount,
      0
    );
    const freightBalanceTotal = invoiceData.reduce(
      (sum, invoice) => sum + invoice.freightBalance,
      0
    );
    const combinedTotal =
      godownRentTotal + mainBillAmountTotal + freightBalanceTotal;

    return {
      godownRentTotal,
      mainBillAmountTotal,
      freightBalanceTotal,
      combinedTotal,
    };
  }, [invoiceData]);

  const handleDownloadSummary = () => {
    exportSummaryToExcel(summaryTotals, "InvoiceSummary.xlsx");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {customerData.length} Customers
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {invoiceData.length} Invoices
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
          <BarChart2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Summary</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          {" "}
          {/* Reverted to grid-cols-3 */}
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Customer Master Data</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SAP Code</TableHead>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>GSTIN</TableHead>
                      <TableHead>PAN</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Mobile</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerData.map((customer) => (
                      <TableRow key={customer.sapCode}>
                        <TableCell className="font-medium">
                          {customer.sapCode}
                        </TableCell>
                        <TableCell>{customer.customerName}</TableCell>
                        <TableCell className="max-w-xs">
                          {customer.address}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              customer.gstin === "GSTIN not provided"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {customer.gstin}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              customer.pan === "PAN not provided"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {customer.pan}
                          </Badge>
                        </TableCell>
                        <TableCell>{customer.email || "N/A"}</TableCell>
                        <TableCell>{customer.mobile || "N/A"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Data (Apr Cases)</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SAP Code</TableHead>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>District</TableHead>
                      <TableHead>Quantity Lifted</TableHead>
                      <TableHead>Godown Rent</TableHead>
                      <TableHead>Main Bill</TableHead>
                      <TableHead>Freight Balance</TableHead>
                      <TableHead>Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceData.map((invoice) => (
                      <TableRow key={invoice.sapCode}>
                        <TableCell className="font-medium">
                          {invoice.sapCode}
                        </TableCell>
                        <TableCell>{invoice.customerName}</TableCell>
                        <TableCell>{invoice.district}</TableCell>
                        <TableCell>{invoice.quantityLifted} MT</TableCell>
                        <TableCell>
                          {formatCurrency(invoice.godownRent)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(invoice.mainBillAmount)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(invoice.freightBalance)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(invoice.totalValue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Invoice Summary
              </CardTitle>
              <Button size="sm" onClick={handleDownloadSummary}>
                Download Summary (Excel)
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      Godown Rent Total
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(summaryTotals.godownRentTotal)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Main Bill Amount Total (Loading/Unloading/Local
                      Transportation)
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(summaryTotals.mainBillAmountTotal)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Freight Balance Total
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(summaryTotals.freightBalanceTotal)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="font-bold">
                    <TableCell>Combined Total</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(summaryTotals.combinedTotal)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

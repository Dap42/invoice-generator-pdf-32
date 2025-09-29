import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileText, ChevronDown, ChevronRight } from "lucide-react";
import type { MergedInvoiceData } from "@/types/invoice";
import { GeneratedInvoice } from "@/components/InvoiceGenerator";
import { extractStateFromAddress, otherMainStates } from "@/lib/utils";
import { InvoiceDetailCard } from "@/components/InvoiceDetailCard";

interface GeneratedInvoiceListProps {
  generatedInvoices: GeneratedInvoice[];
  mergedData: MergedInvoiceData[];
  downloadInvoice: (invoice: GeneratedInvoice) => void;
  downloadAllInvoices: (invoices: GeneratedInvoice[]) => void;
  formatCurrency: (amount: number) => string;
  formatNumber: (amount: number) => string;
}

export const GeneratedInvoiceList = ({
  generatedInvoices,
  mergedData,
  downloadInvoice,
  downloadAllInvoices,
  formatCurrency,
  formatNumber,
}: GeneratedInvoiceListProps) => {
  const [openCustomers, setOpenCustomers] = useState<Record<string, boolean>>(
    {}
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterState, setFilterState] = useState("All States");

  const toggleCustomer = (customerName: string) => {
    setOpenCustomers((prev) => ({
      ...prev,
      [customerName]: !prev[customerName],
    }));
  };

  // Filtered invoices based on search term and state filter
  const filteredGeneratedInvoices = generatedInvoices.filter((invoice) => {
    const matchesSearchTerm = invoice.customerName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const customerData = mergedData.find(
      (data) => data.customer.customerName === invoice.customerName
    );
    // Use the same robust state extraction for filtering
    const customerState = customerData
      ? extractStateFromAddress(customerData.customer.address)
      : "Uttar Pradesh"; // Fallback if customerData not found

    const matchesFilterState =
      filterState === "All States" || customerState === filterState;

    return matchesSearchTerm && matchesFilterState;
  });

  // Get unique states for the filter dropdown from the relevant list
  const uniqueStates = Array.from(
    new Set([
      "Uttar Pradesh", // General UP, covers all regional UPs
      ...otherMainStates, // Other main states
    ])
  ).sort();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Generated Invoices ({filteredGeneratedInvoices.length})
        </CardTitle>
        <Button
          onClick={() => downloadAllInvoices(filteredGeneratedInvoices)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            placeholder="Search by party name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Select value={filterState} onValueChange={setFilterState}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All States">All States</SelectItem>
              {uniqueStates.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-6">
          {/* Group invoices by customer with collapsible dropdowns */}
          {Array.from(
            new Set(filteredGeneratedInvoices.map((inv) => inv.customerName))
          ).map((customerName, index) => {
            const customerInvoices = filteredGeneratedInvoices.filter(
              (inv) => inv.customerName === customerName
            );
            const isOpen = openCustomers[customerName];
            const totalCustomerAmount = customerInvoices.reduce(
              (sum, inv) => sum + inv.amount,
              0
            );

            // Create unique key using customer name + index to avoid duplicates
            const uniqueKey = `${customerName}-${index}`;

            return (
              <Collapsible
                key={uniqueKey}
                open={isOpen}
                onOpenChange={() => toggleCustomer(customerName)}
              >
                <div className="border rounded-lg overflow-hidden">
                  <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-lg text-primary">
                          {customerName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {customerInvoices.length} invoices •{" "}
                          {formatCurrency(totalCustomerAmount)} total
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {customerInvoices.map((invoice) => {
                          const typeColors = {
                            godown: "bg-blue-500",
                            main: "bg-green-500",
                            freight: "bg-orange-500",
                          };
                          return (
                            <div
                              key={invoice.type}
                              className={`w-3 h-3 rounded-full ${
                                typeColors[invoice.type]
                              }`}
                              title={invoice.type}
                            />
                          );
                        })}
                      </div>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t bg-muted/20">
                      <div className="p-4 space-y-3">
                        {customerInvoices.map((invoice) => (
                          <InvoiceDetailCard
                            key={invoice.id}
                            invoice={invoice}
                            downloadInvoice={downloadInvoice}
                            formatCurrency={formatCurrency}
                          />
                        ))}

                        {/* Quick download all for this customer */}
                        <div className="pt-2 border-t">
                          <Button
                            onClick={() => {
                              customerInvoices.forEach((invoice, index) => {
                                setTimeout(
                                  () => downloadInvoice(invoice),
                                  index * 200
                                );
                              });
                            }}
                            variant="secondary"
                            size="sm"
                            className="w-full flex items-center gap-2"
                          >
                            <Download className="h-3 w-3" />
                            Download All {customerName} Invoices
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

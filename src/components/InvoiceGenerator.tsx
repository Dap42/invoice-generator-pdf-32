import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { FileText, Zap } from "lucide-react";
import type { MergedInvoiceData } from "@/types/invoice";
import { GeneratedInvoiceList } from "@/components/GeneratedInvoiceList";
import { generateInvoicePDF } from "@/lib/invoice-pdf-generator";

interface InvoiceGeneratorProps {
  mergedData: MergedInvoiceData[];
}

export interface GeneratedInvoice {
  id: string;
  customerName: string;
  fileName: string;
  blob: Blob;
  type: "godown" | "main" | "freight";
  amount: number;
}

export const InvoiceGenerator = ({ mergedData }: InvoiceGeneratorProps) => {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedInvoices, setGeneratedInvoices] = useState<
    GeneratedInvoice[]
  >([]);
  const [openCustomers, setOpenCustomers] = useState<Record<string, boolean>>(
    {}
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterState, setFilterState] = useState("All States");
  const { toast } = useToast();

  const toggleCustomer = (customerName: string) => {
    setOpenCustomers((prev) => ({
      ...prev,
      [customerName]: !prev[customerName],
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const generateAllInvoices = async () => {
    setGenerating(true);
    setProgress(0);
    setGeneratedInvoices([]);

    try {
      const invoices: GeneratedInvoice[] = [];
      const totalInvoices = mergedData.length * 3;
      let processedCount = 0;

      for (let i = 0; i < mergedData.length; i++) {
        const data = mergedData[i];
        const customerNameSafe = data.customer.customerName.replace(
          /[^a-zA-Z0-9]/g,
          "_"
        );

        // Generate 3 invoices per customer
        const invoiceTypes: Array<{
          type: "godown" | "main" | "freight";
          name: string;
          amount: number;
        }> = [
          { type: "godown", name: "Godown_Rent", amount: data.godownRent },
          {
            type: "main",
            name: "Main_Services",
            amount:
              data.loadingCharges +
              data.unloadingCharges +
              data.localTransportation,
          },
          {
            type: "freight",
            name: "Secondary_Freight",
            amount: data.freightBalance,
          },
        ];

        for (const invoiceInfo of invoiceTypes) {
          const blob = generateInvoicePDF(data, invoiceInfo.type, formatNumber);
          const fileName = `${invoiceInfo.name}_${customerNameSafe}_${data.sapCode}.pdf`;

          invoices.push({
            id: `${data.sapCode}-${invoiceInfo.type}`,
            customerName: data.customer.customerName,
            fileName,
            blob,
            type: invoiceInfo.type,
            amount: invoiceInfo.amount,
          });

          processedCount++;
          setProgress((processedCount / totalInvoices) * 100);

          // Small delay to show progress
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      setGeneratedInvoices(invoices);

      toast({
        title: "Invoices Generated Successfully",
        description: `Generated ${invoices.length} invoices (3 per customer) for download`,
      });
    } catch (error) {
      console.error("Error generating invoices:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate invoices. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadInvoice = (invoice: GeneratedInvoice) => {
    const url = URL.createObjectURL(invoice.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = invoice.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Started",
      description: `Downloading ${invoice.fileName}`,
    });
  };

  const downloadAllInvoices = (invoicesToDownload: GeneratedInvoice[]) => {
    invoicesToDownload.forEach((invoice, index) => {
      setTimeout(() => {
        downloadInvoice(invoice);
      }, index * 500); // Stagger downloads
    });
  };

  return (
    <div className="space-y-6">
      {/* Generation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Invoice Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Ready to generate {mergedData.length * 3} invoices (
                {mergedData.length} customers × 3 types)
              </p>
            </div>
            <Button
              onClick={generateAllInvoices}
              disabled={generating || mergedData.length === 0}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Generate All Invoices
            </Button>
          </div>

          {generating && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-center text-sm text-muted-foreground">
                Generating invoices... {Math.round(progress)}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Invoices List */}
      {generatedInvoices.length > 0 && (
        <GeneratedInvoiceList
          generatedInvoices={generatedInvoices}
          mergedData={mergedData}
          downloadInvoice={downloadInvoice}
          downloadAllInvoices={downloadAllInvoices}
          formatCurrency={formatCurrency}
          formatNumber={formatNumber}
        />
      )}

      {/* Summary Statistics */}
      {generatedInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {generatedInvoices.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  Invoices Generated
                </p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(
                    mergedData.reduce((sum, item) => sum + item.totalValue, 0)
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Total Value</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {
                    mergedData.filter(
                      (item) => item.customer.customerName === item.customerName
                    ).length
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  Matched Customers
                </p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">PDF</p>
                <p className="text-sm text-muted-foreground">Format</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

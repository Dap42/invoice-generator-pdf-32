import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { FileText, Zap, FileCheck, Receipt } from "lucide-react";
import type { MergedInvoiceData } from "@/types/invoice";
import { GeneratedInvoiceList } from "@/components/GeneratedInvoiceList";
import { generateInvoicePDF } from "@/lib/invoice-pdf-generator";
import { generateDebitNotePDF } from "@/lib/debit-note-pdf-generator";

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
  documentType: "tax-invoice" | "debit-note";
}

export const InvoiceGenerator = ({ mergedData }: InvoiceGeneratorProps) => {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedInvoices, setGeneratedInvoices] = useState<
    GeneratedInvoice[]
  >([]);
  const [generationType, setGenerationType] = useState<"all" | "tax" | "debit">(
    "all"
  );
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

  // Helper functions for granular generation
  const getTotalDocuments = (type: "all" | "tax" | "debit"): number => {
    switch (type) {
      case "tax":
        return mergedData.length * 3; // 3 tax invoices per customer
      case "debit":
        return mergedData.length * 3; // 3 debit notes per customer
      case "all":
        return mergedData.length * 6; // 6 total documents per customer
      default:
        return mergedData.length * 6;
    }
  };

  const getGenerationDescription = (type: "all" | "tax" | "debit"): string => {
    switch (type) {
      case "tax":
        return `Ready to generate ${mergedData.length * 3} Tax Invoices (${
          mergedData.length
        } customers × 3 invoices)`;
      case "debit":
        return `Ready to generate ${mergedData.length * 3} Debit Notes (${
          mergedData.length
        } customers × 3 notes)`;
      case "all":
        return `Ready to generate ${mergedData.length * 6} documents (${
          mergedData.length
        } customers × 6 documents)`;
      default:
        return `Ready to generate ${mergedData.length * 6} documents`;
    }
  };

  const getGenerationMessage = (
    type: "all" | "tax" | "debit",
    count: number
  ): string => {
    switch (type) {
      case "tax":
        return `Generated ${count} Tax Invoices (${mergedData.length} customers × 3 invoices)`;
      case "debit":
        return `Generated ${count} Debit Notes (${mergedData.length} customers × 3 notes)`;
      case "all":
        return `Generated ${count} documents (${mergedData.length} customers × 6 documents)`;
      default:
        return `Generated ${count} documents`;
    }
  };

  const generateAllInvoices = async () => {
    setGenerating(true);
    setProgress(0);
    setGeneratedInvoices([]);

    try {
      const invoices: GeneratedInvoice[] = [];
      const totalInvoices = mergedData.length * 6; // 6 documents per customer (3 tax invoices + 3 debit notes)
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
          // Generate Tax Invoice
          const taxInvoiceBlob = generateInvoicePDF(
            data,
            invoiceInfo.type,
            formatNumber
          );
          const taxInvoiceFileName = `TaxInvoice_${invoiceInfo.name}_${customerNameSafe}_${data.sapCode}.pdf`;

          invoices.push({
            id: `${data.sapCode}-${invoiceInfo.type}-tax`,
            customerName: data.customer.customerName,
            fileName: taxInvoiceFileName,
            blob: taxInvoiceBlob,
            type: invoiceInfo.type,
            amount: invoiceInfo.amount,
            documentType: "tax-invoice",
          });

          processedCount++;
          setProgress((processedCount / totalInvoices) * 100);

          // Generate Debit Note
          const debitNoteBlob = generateDebitNotePDF(
            data,
            invoiceInfo.type,
            formatNumber
          );
          const debitNoteFileName = `DebitNote_${invoiceInfo.name}_${customerNameSafe}_${data.sapCode}.pdf`;

          invoices.push({
            id: `${data.sapCode}-${invoiceInfo.type}-debit`,
            customerName: data.customer.customerName,
            fileName: debitNoteFileName,
            blob: debitNoteBlob,
            type: invoiceInfo.type,
            amount: invoiceInfo.amount,
            documentType: "debit-note",
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

  // New granular generation functions
  const generateTaxInvoices = async () => {
    setGenerating(true);
    setProgress(0);
    setGeneratedInvoices([]);
    setGenerationType("tax");

    try {
      const invoices: GeneratedInvoice[] = [];
      const totalInvoices = getTotalDocuments("tax");
      let processedCount = 0;

      for (let i = 0; i < mergedData.length; i++) {
        const data = mergedData[i];
        const customerNameSafe = data.customer.customerName.replace(
          /[^a-zA-Z0-9]/g,
          "_"
        );

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
          // Generate only Tax Invoice
          const taxInvoiceBlob = generateInvoicePDF(
            data,
            invoiceInfo.type,
            formatNumber
          );
          const taxInvoiceFileName = `TaxInvoice_${invoiceInfo.name}_${customerNameSafe}_${data.sapCode}.pdf`;

          invoices.push({
            id: `${data.sapCode}-${invoiceInfo.type}-tax`,
            customerName: data.customer.customerName,
            fileName: taxInvoiceFileName,
            blob: taxInvoiceBlob,
            type: invoiceInfo.type,
            amount: invoiceInfo.amount,
            documentType: "tax-invoice",
          });

          processedCount++;
          setProgress((processedCount / totalInvoices) * 100);

          // Small delay to show progress
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      setGeneratedInvoices(invoices);

      toast({
        title: "Tax Invoices Generated Successfully",
        description: getGenerationMessage("tax", invoices.length),
      });
    } catch (error) {
      console.error("Error generating tax invoices:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate tax invoices. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateDebitNotes = async () => {
    setGenerating(true);
    setProgress(0);
    setGeneratedInvoices([]);
    setGenerationType("debit");

    try {
      const invoices: GeneratedInvoice[] = [];
      const totalInvoices = getTotalDocuments("debit");
      let processedCount = 0;

      for (let i = 0; i < mergedData.length; i++) {
        const data = mergedData[i];
        const customerNameSafe = data.customer.customerName.replace(
          /[^a-zA-Z0-9]/g,
          "_"
        );

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
          // Generate only Debit Note
          const debitNoteBlob = generateDebitNotePDF(
            data,
            invoiceInfo.type,
            formatNumber
          );
          const debitNoteFileName = `DebitNote_${invoiceInfo.name}_${customerNameSafe}_${data.sapCode}.pdf`;

          invoices.push({
            id: `${data.sapCode}-${invoiceInfo.type}-debit`,
            customerName: data.customer.customerName,
            fileName: debitNoteFileName,
            blob: debitNoteBlob,
            type: invoiceInfo.type,
            amount: invoiceInfo.amount,
            documentType: "debit-note",
          });

          processedCount++;
          setProgress((processedCount / totalInvoices) * 100);

          // Small delay to show progress
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      setGeneratedInvoices(invoices);

      toast({
        title: "Debit Notes Generated Successfully",
        description: getGenerationMessage("debit", invoices.length),
      });
    } catch (error) {
      console.error("Error generating debit notes:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate debit notes. Please try again.",
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
        <CardContent className="space-y-6">
          {/* Generation Description */}
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {getGenerationDescription(generationType)}
            </p>
          </div>

          {/* Generation Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={generateTaxInvoices}
              disabled={generating || mergedData.length === 0}
              variant="outline"
              className="flex items-center gap-2 h-12"
            >
              <FileCheck className="h-4 w-4" />
              Generate Tax Invoices
            </Button>
            <Button
              onClick={generateDebitNotes}
              disabled={generating || mergedData.length === 0}
              variant="outline"
              className="flex items-center gap-2 h-12"
            >
              <Receipt className="h-4 w-4" />
              Generate Debit Notes
            </Button>
            <Button
              onClick={generateAllInvoices}
              disabled={generating || mergedData.length === 0}
              className="flex items-center gap-2 h-12"
            >
              <FileText className="h-4 w-4" />
              Generate All Documents
            </Button>
          </div>

          {/* Progress Indicator */}
          {generating && (
            <div className="space-y-3">
              <Progress value={progress} className="w-full" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {generationType === "tax" && "Generating Tax Invoices..."}
                  {generationType === "debit" && "Generating Debit Notes..."}
                  {generationType === "all" &&
                    "Generating all documents..."}{" "}
                  {Math.round(progress)}%
                </p>
              </div>
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

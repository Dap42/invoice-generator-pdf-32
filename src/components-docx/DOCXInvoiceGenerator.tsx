import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { FileText, Zap, FileCheck, Receipt } from "lucide-react";
import type { DOCXMergedInvoiceData } from "@/types-docx/invoice-docx";
import { GeneratedInvoiceList } from "@/components/GeneratedInvoiceList";
import { generateInvoiceDOCX } from "@/lib-docx/invoice-docx-generator";
import { generateDebitNoteDOCX } from "@/lib-docx/debit-note-docx-generator";

interface DOCXInvoiceGeneratorProps {
  mergedData: DOCXMergedInvoiceData[];
}

export interface DOCXGeneratedInvoice {
  id: string;
  customerName: string;
  fileName: string;
  blob: Blob;
  type: "godown" | "main" | "freight";
  amount: number;
  documentType: "tax-invoice" | "debit-note";
  format: "docx";
}

export const DOCXInvoiceGenerator = ({
  mergedData,
}: DOCXInvoiceGeneratorProps) => {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedInvoices, setGeneratedInvoices] = useState<
    DOCXGeneratedInvoice[]
  >([]);
  const [generationType, setGenerationType] = useState<"all" | "tax" | "debit">(
    "all"
  );
  const { toast } = useToast();

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
      const invoices: DOCXGeneratedInvoice[] = [];
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
          const taxInvoiceBlob = await generateInvoiceDOCX(
            data,
            invoiceInfo.type,
            formatNumber
          );
          const taxInvoiceFileName = `TaxInvoice_${invoiceInfo.name}_${customerNameSafe}_${data.sapCode}.docx`;

          invoices.push({
            id: `${data.sapCode}-${invoiceInfo.type}-tax`,
            customerName: data.customer.customerName,
            fileName: taxInvoiceFileName,
            blob: taxInvoiceBlob,
            type: invoiceInfo.type,
            amount: invoiceInfo.amount,
            documentType: "tax-invoice",
            format: "docx",
          });

          processedCount++;
          setProgress((processedCount / totalInvoices) * 100);

          // Generate Debit Note
          const debitNoteBlob = await generateDebitNoteDOCX(
            data,
            invoiceInfo.type,
            formatNumber
          );
          const debitNoteFileName = `DebitNote_${invoiceInfo.name}_${customerNameSafe}_${data.sapCode}.docx`;

          invoices.push({
            id: `${data.sapCode}-${invoiceInfo.type}-debit`,
            customerName: data.customer.customerName,
            fileName: debitNoteFileName,
            blob: debitNoteBlob,
            type: invoiceInfo.type,
            amount: invoiceInfo.amount,
            documentType: "debit-note",
            format: "docx",
          });

          processedCount++;
          setProgress((processedCount / totalInvoices) * 100);

          // Small delay to show progress
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      setGeneratedInvoices(invoices);

      toast({
        title: "DOCX Documents Generated Successfully",
        description: `Generated ${invoices.length} DOCX documents (3 per customer) for download`,
      });
    } catch (error) {
      console.error("Error generating DOCX invoices:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate DOCX documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateTaxInvoices = async () => {
    setGenerating(true);
    setProgress(0);
    setGeneratedInvoices([]);
    setGenerationType("tax");

    try {
      const invoices: DOCXGeneratedInvoice[] = [];
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
          console.log("🚀 Calling generateInvoiceDOCX for:", invoiceInfo.type);
          const taxInvoiceBlob = await generateInvoiceDOCX(
            data,
            invoiceInfo.type,
            formatNumber
          ).catch((error) => {
            console.error("💥 Error in generateInvoiceDOCX:", error);
            throw error;
          });
          console.log("✅ Tax invoice generated successfully");
          const taxInvoiceFileName = `TaxInvoice_${invoiceInfo.name}_${customerNameSafe}_${data.sapCode}.docx`;

          invoices.push({
            id: `${data.sapCode}-${invoiceInfo.type}-tax`,
            customerName: data.customer.customerName,
            fileName: taxInvoiceFileName,
            blob: taxInvoiceBlob,
            type: invoiceInfo.type,
            amount: invoiceInfo.amount,
            documentType: "tax-invoice",
            format: "docx",
          });

          processedCount++;
          setProgress((processedCount / totalInvoices) * 100);

          // Small delay to show progress
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      setGeneratedInvoices(invoices);

      toast({
        title: "DOCX Tax Invoices Generated Successfully",
        description: getGenerationMessage("tax", invoices.length),
      });
    } catch (error) {
      console.error("Error generating DOCX tax invoices:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate DOCX tax invoices. Please try again.",
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
      const invoices: DOCXGeneratedInvoice[] = [];
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
          const debitNoteBlob = await generateDebitNoteDOCX(
            data,
            invoiceInfo.type,
            formatNumber
          ).catch((error) => {
            console.error("Error generating debit note:", error);
            throw new Error(
              `Failed to generate debit note for ${invoiceInfo.name}`
            );
          });
          const debitNoteFileName = `DebitNote_${invoiceInfo.name}_${customerNameSafe}_${data.sapCode}.docx`;

          invoices.push({
            id: `${data.sapCode}-${invoiceInfo.type}-debit`,
            customerName: data.customer.customerName,
            fileName: debitNoteFileName,
            blob: debitNoteBlob,
            type: invoiceInfo.type,
            amount: invoiceInfo.amount,
            documentType: "debit-note",
            format: "docx",
          });

          processedCount++;
          setProgress((processedCount / totalInvoices) * 100);

          // Small delay to show progress
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      setGeneratedInvoices(invoices);

      toast({
        title: "DOCX Debit Notes Generated Successfully",
        description: getGenerationMessage("debit", invoices.length),
      });
    } catch (error) {
      console.error("Error generating DOCX debit notes:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate DOCX debit notes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadInvoice = (invoice: DOCXGeneratedInvoice) => {
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

  const downloadAllInvoices = (invoicesToDownload: DOCXGeneratedInvoice[]) => {
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
            DOCX Document Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Generation Description */}
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {getGenerationDescription(generationType)}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              NEW: DOCX Format - Microsoft Word Documents
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
              Generate DOCX Tax Invoices
            </Button>
            <Button
              onClick={generateDebitNotes}
              disabled={generating || mergedData.length === 0}
              variant="outline"
              className="flex items-center gap-2 h-12"
            >
              <Receipt className="h-4 w-4" />
              Generate DOCX Debit Notes
            </Button>
            <Button
              onClick={generateAllInvoices}
              disabled={generating || mergedData.length === 0}
              className="flex items-center gap-2 h-12"
            >
              <FileText className="h-4 w-4" />
              Generate All DOCX Documents
            </Button>
          </div>

          {/* Progress Indicator */}
          {generating && (
            <div className="space-y-3">
              <Progress value={progress} className="w-full" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {generationType === "tax" &&
                    "Generating DOCX Tax Invoices..."}
                  {generationType === "debit" &&
                    "Generating DOCX Debit Notes..."}
                  {generationType === "all" &&
                    "Generating all DOCX documents..."}{" "}
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
            <CardTitle>DOCX Generation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {generatedInvoices.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  DOCX Documents Generated
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
                <p className="text-2xl font-bold text-primary">DOCX</p>
                <p className="text-sm text-muted-foreground">Format</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

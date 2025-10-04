import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/FileUpload";
import { DataPreview } from "@/components/DataPreview";
import { DOCXInvoiceGenerator } from "@/components-docx/DOCXInvoiceGenerator";
import type {
  MergedInvoiceData,
  CustomerData,
  InvoiceData,
} from "@/types/invoice";
import type { DOCXMergedInvoiceData } from "@/types-docx/invoice-docx";

export const DOCXInvoicePage = () => {
  const [mergedData, setMergedData] = useState<DOCXMergedInvoiceData[]>([]);
  const [showGenerator, setShowGenerator] = useState(false);

  const handleDataProcessed = (data: MergedInvoiceData[]) => {
    // Convert existing data format to DOCX format
    const docxData: DOCXMergedInvoiceData[] = data.map((item) => ({
      ...item,
      customer: {
        sapCode: item.customer.sapCode,
        customerName: item.customer.customerName,
        gstin: item.customer.gstin,
        pan: item.customer.pan,
        address: item.customer.address,
        email: item.customer.email,
        mobile: item.customer.mobile,
      },
    }));
    setMergedData(docxData);
    setShowGenerator(true);
  };

  const handleBackToUpload = () => {
    setShowGenerator(false);
    setMergedData([]);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">DOCX Invoice Generator</h1>
        <p className="text-lg text-muted-foreground">
          Generate Microsoft Word documents (DOCX format) for invoices and debit
          notes
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          NEW: DOCX Format Support
        </div>
      </div>

      {!showGenerator ? (
        <Card>
          <CardHeader>
            <CardTitle>Upload Your Data</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload onDataProcessed={handleDataProcessed} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">DOCX Document Generation</h2>
            <Button variant="outline" onClick={handleBackToUpload}>
              Back to Upload
            </Button>
          </div>

          <DataPreview mergedData={mergedData} />

          <DOCXInvoiceGenerator mergedData={mergedData} />
        </div>
      )}
    </div>
  );
};

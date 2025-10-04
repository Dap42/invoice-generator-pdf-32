import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DOCXInvoiceGenerator } from "@/components-docx/DOCXInvoiceGenerator";
import type { DOCXMergedInvoiceData } from "@/types-docx/invoice-docx";

export const DOCXInvoicePageSimple = () => {
  const [mergedData, setMergedData] = useState<DOCXMergedInvoiceData[]>([]);
  const [showGenerator, setShowGenerator] = useState(false);

  // Sample data for testing
  const sampleData: DOCXMergedInvoiceData[] = [
    {
      sapCode: "TEST001",
      customerName: "Test Customer",
      customerNameForMatching: "test customer",
      district: "Test District",
      quantityLifted: 100,
      godownRent: 50000,
      mainBillAmount: 75000,
      freightBalance: 25000,
      loadingCharges: 25000,
      unloadingCharges: 25000,
      localTransportation: 25000,
      totalValue: 150000,
      customer: {
        sapCode: "TEST001",
        customerName: "Test Customer",
        gstin: "22AAAAA0000A1Z5",
        pan: "AAAAA0000A",
        address: "Test Address, Test City, Test State - 123456",
        email: "test@example.com",
        mobile: "9876543210",
      },
    },
  ];

  const handleUseSampleData = () => {
    setMergedData(sampleData);
    setShowGenerator(true);
  };

  const handleBackToStart = () => {
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
            <CardTitle>Test DOCX Generation</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Click the button below to test DOCX generation with sample data.
            </p>
            <Button onClick={handleUseSampleData} size="lg">
              Generate Sample DOCX Documents
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">DOCX Document Generation</h2>
            <Button variant="outline" onClick={handleBackToStart}>
              Back to Start
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sample Data Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <strong>Customer:</strong>{" "}
                  {mergedData[0]?.customer.customerName}
                </p>
                <p>
                  <strong>SAP Code:</strong> {mergedData[0]?.sapCode}
                </p>
                <p>
                  <strong>Total Value:</strong> ₹
                  {mergedData[0]?.totalValue.toLocaleString("en-IN")}
                </p>
                <p>
                  <strong>Godown Rent:</strong> ₹
                  {mergedData[0]?.godownRent.toLocaleString("en-IN")}
                </p>
                <p>
                  <strong>Main Services:</strong> ₹
                  {(
                    mergedData[0]?.loadingCharges +
                    mergedData[0]?.unloadingCharges +
                    mergedData[0]?.localTransportation
                  ).toLocaleString("en-IN")}
                </p>
                <p>
                  <strong>Freight:</strong> ₹
                  {mergedData[0]?.freightBalance.toLocaleString("en-IN")}
                </p>
              </div>
            </CardContent>
          </Card>

          <DOCXInvoiceGenerator mergedData={mergedData} />
        </div>
      )}
    </div>
  );
};

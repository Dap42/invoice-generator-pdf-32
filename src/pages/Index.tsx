import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { DataPreview } from "@/components/DataPreview";
import { InvoiceGenerator } from "@/components/InvoiceGenerator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileSpreadsheet, Receipt, Zap } from "lucide-react";
import type { CustomerData, InvoiceData, MergedInvoiceData } from "@/types/invoice";

const Index = () => {
  const [customerData, setCustomerData] = useState<CustomerData[]>([]);
  const [invoiceData, setInvoiceData] = useState<InvoiceData[]>([]);
  const [mergedData, setMergedData] = useState<MergedInvoiceData[]>([]);
  const [currentStep, setCurrentStep] = useState(1);

  const handleCustomerDataParsed = (data: CustomerData[]) => {
    setCustomerData(data);
    mergeData(data, invoiceData);
  };

  const handleInvoiceDataParsed = (data: InvoiceData[]) => {
    setInvoiceData(data);
    mergeData(customerData, data);
  };

  const mergeData = (customers: CustomerData[], invoices: InvoiceData[]) => {
    if (customers.length === 0 || invoices.length === 0) return;

    const merged = invoices.map(invoice => {
      const customer = customers.find(c => 
        c.customerName.toLowerCase().trim() === invoice.customerName.toLowerCase().trim() ||
        (c.sapCode && invoice.sapCode && c.sapCode === invoice.sapCode)
      );
      
      return {
        ...invoice,
        customer: customer || {
          sapCode: invoice.sapCode,
          customerName: invoice.customerName,
          address: 'Address not found',
          gstin: 'GSTIN not found',
          pan: 'PAN not found'
        }
      };
    });

    setMergedData(merged);
    setCurrentStep(3);
  };

  const resetData = () => {
    setCustomerData([]);
    setInvoiceData([]);
    setMergedData([]);
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-primary rounded-lg">
              <Receipt className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">SmartInvoice Generator</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload your Excel files, preview merged data, and generate professional invoices automatically
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[
            { step: 1, icon: FileSpreadsheet, label: "Upload Files" },
            { step: 2, icon: FileSpreadsheet, label: "Preview Data" },
            { step: 3, icon: Zap, label: "Generate Invoices" }
          ].map(({ step, icon: Icon, label }) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep >= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={`font-medium ${
                currentStep >= step ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {label}
              </span>
              {step < 3 && (
                <div className={`w-8 h-0.5 ${
                  currentStep > step ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Step 1: Upload Excel Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload
              onCustomerDataParsed={handleCustomerDataParsed}
              onInvoiceDataParsed={handleInvoiceDataParsed}
              onReset={resetData}
            />
          </CardContent>
        </Card>

        {/* Data Preview Section */}
        {(customerData.length > 0 || invoiceData.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Step 2: Data Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataPreview
                customerData={customerData}
                invoiceData={invoiceData}
                mergedData={mergedData}
              />
            </CardContent>
          </Card>
        )}

        {/* Invoice Generation Section */}
        {mergedData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Step 3: Generate Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceGenerator mergedData={mergedData} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;

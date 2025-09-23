import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, RotateCcw } from "lucide-react";
import type { CustomerData, InvoiceData } from "@/types/invoice";
import { CustomerMasterParser } from "./file-upload/CustomerMasterParser";
import { InvoiceDataParser } from "./file-upload/InvoiceDataParser";

interface FileUploadProps {
  onCustomerDataParsed: (data: CustomerData[]) => void;
  onInvoiceDataParsed: (data: InvoiceData[]) => void;
  onReset: () => void;
}

export const FileUpload = ({
  onCustomerDataParsed,
  onInvoiceDataParsed,
  onReset,
}: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<{
    customer: string | null;
    invoice: string | null;
  }>({ customer: null, invoice: null });
  const [customerFileToParse, setCustomerFileToParse] = useState<File | null>(
    null
  );
  const [invoiceFileToParse, setInvoiceFileToParse] = useState<File | null>(
    null
  );

  const customerFileRef = useRef<HTMLInputElement>(null);
  const invoiceFileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUploadComplete = () => {
    setProgress(100);
    setTimeout(() => {
      setUploading(false);
      setProgress(0);
      setCustomerFileToParse(null);
      setInvoiceFileToParse(null);
    }, 500);
  };

  const handleFileUpload = async (file: File, type: "customer" | "invoice") => {
    if (!file) return;

    setUploading(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 100);

    if (type === "customer") {
      setCustomerFileToParse(file);
      setUploadedFiles((prev) => ({ ...prev, customer: file.name }));
    } else {
      setInvoiceFileToParse(file);
      setUploadedFiles((prev) => ({ ...prev, invoice: file.name }));
    }
    clearInterval(progressInterval);
  };

  const handleReset = () => {
    setUploadedFiles({ customer: null, invoice: null });
    onReset();
    if (customerFileRef.current) customerFileRef.current.value = "";
    if (invoiceFileRef.current) invoiceFileRef.current.value = "";

    toast({
      title: "Reset Complete",
      description: "All data has been cleared. You can upload new files.",
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Customer Master Upload */}
      <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <Label className="text-lg font-semibold">
                Customer Master.xlsx
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Upload customer data with names, addresses, GSTIN, PAN numbers
              </p>
            </div>

            {uploadedFiles.customer ? (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium text-primary">
                  ✓ {uploadedFiles.customer}
                </p>
                <p className="text-xs text-muted-foreground">
                  File uploaded successfully
                </p>
              </div>
            ) : (
              <div>
                <input
                  ref={customerFileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, "customer");
                  }}
                  className="hidden"
                />
                <Button
                  onClick={() => customerFileRef.current?.click()}
                  variant="outline"
                  className="w-full"
                  disabled={uploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Customer Master File
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invoice Data Upload */}
      <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <Label className="text-lg font-semibold">Cases.xlsx</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Upload invoice data with amounts, quantities, taxes, freight
              </p>
            </div>

            {uploadedFiles.invoice ? (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium text-primary">
                  ✓ {uploadedFiles.invoice}
                </p>
                <p className="text-xs text-muted-foreground">
                  File uploaded successfully
                </p>
              </div>
            ) : (
              <div>
                <input
                  ref={invoiceFileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, "invoice");
                  }}
                  className="hidden"
                />
                <Button
                  onClick={() => invoiceFileRef.current?.click()}
                  variant="outline"
                  className="w-full"
                  disabled={uploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Invoice Data File
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress and Actions */}
      {uploading && (
        <div className="md:col-span-2">
          <Progress value={progress} className="w-full" />
          <p className="text-center text-sm text-muted-foreground mt-2">
            Processing file... {progress}%
          </p>
        </div>
      )}

      {(uploadedFiles.customer || uploadedFiles.invoice) && (
        <div className="md:col-span-2 flex justify-center">
          <Button
            onClick={handleReset}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset All Files
          </Button>
        </div>
      )}

      {customerFileToParse && (
        <CustomerMasterParser
          file={customerFileToParse}
          onCustomerDataParsed={onCustomerDataParsed}
          onUploadComplete={handleUploadComplete}
        />
      )}

      {invoiceFileToParse && (
        <InvoiceDataParser
          file={invoiceFileToParse}
          onInvoiceDataParsed={onInvoiceDataParsed}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </div>
  );
};

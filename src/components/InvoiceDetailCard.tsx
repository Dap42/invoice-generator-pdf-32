import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { GeneratedInvoice } from "@/components/InvoiceGenerator";

interface InvoiceDetailCardProps {
  invoice: GeneratedInvoice;
  downloadInvoice: (invoice: GeneratedInvoice) => void;
  formatCurrency: (amount: number) => string;
}

export const InvoiceDetailCard = ({
  invoice,
  downloadInvoice,
  formatCurrency,
}: InvoiceDetailCardProps) => {
  const typeLabels = {
    godown: "Godown Rent",
    main: "Main Services (Loading/Unloading/Transport)",
    freight: "Secondary Freight",
  };
  const typeColors = {
    godown: "bg-blue-100 text-blue-800 border-blue-200",
    main: "bg-green-100 text-green-800 border-green-200",
    freight: "bg-orange-100 text-orange-800 border-orange-200",
  };

  const documentTypeLabels = {
    "tax-invoice": "Tax Invoice",
    "debit-note": "Debit Note",
  };

  const documentTypeColors = {
    "tax-invoice": "bg-purple-100 text-purple-800 border-purple-200",
    "debit-note": "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <div className="flex items-center justify-between p-3 bg-background border rounded-lg hover:shadow-sm transition-all">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2 py-1 text-xs font-medium rounded border ${
                typeColors[invoice.type]
              }`}
            >
              {typeLabels[invoice.type]}
            </span>
            <span
              className={`px-2 py-1 text-xs font-medium rounded border ${
                documentTypeColors[invoice.documentType]
              }`}
            >
              {documentTypeLabels[invoice.documentType]}
            </span>
            <span className="text-sm font-medium">
              {formatCurrency(invoice.amount)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{invoice.fileName}</p>
        </div>
      </div>
      <Button
        onClick={() => downloadInvoice(invoice)}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Download className="h-3 w-3" />
        Download PDF
      </Button>
    </div>
  );
};

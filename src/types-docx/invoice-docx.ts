export interface DOCXCustomerData {
  sapCode: string;
  customerName: string;
  gstin?: string;
  pan?: string;
  address?: string;
  email?: string;
  mobile?: string;
}

export interface DOCXInvoiceData {
  sapCode: string;
  customerName: string;
  customerNameForMatching: string;
  district: string;
  zone?: string;
  quantityLifted: number;
  godownRent: number;
  mainBillAmount: number;
  freightBalance: number;
  loadingCharges: number;
  unloadingCharges: number;
  localTransportation: number;
  totalValue: number;
}

export interface DOCXMergedInvoiceData extends DOCXInvoiceData {
  customer: DOCXCustomerData;
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

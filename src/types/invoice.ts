export interface CustomerData {
  sapCode: string;
  customerName: string;
  gstin: string;
  pan: string;
  address: string;
  email?: string; // Added email field
  mobile?: string; // Added mobile field
}

export interface InvoiceData {
  sapCode: string;
  customerName: string;
  district: string;
  quantityLifted: number;
  godownRent: number;
  mainBillAmount: number;
  freightBalance: number;
  loadingCharges: number;
  unloadingCharges: number;
  localTransportation: number;
  totalValue: number;
}

export interface MergedInvoiceData extends InvoiceData {
  customer: CustomerData;
}

export interface Invoice {
  id: string;
  type: "godown" | "main" | "freight";
  customerName: string;
  sapCode: string;
  amount: number;
  description: string;
  customer: CustomerData;
  details: {
    quantity?: number;
    rate?: number;
    cgst: number;
    sgst: number;
    totalAmount: number;
  };
}

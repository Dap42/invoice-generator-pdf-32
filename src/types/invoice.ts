export interface CustomerData {
  sapCode: string;
  customerName: string;
  gstin?: string; // Optional GSTIN
  pan?: string; // Optional PAN
  address?: string; // Optional Address
  email?: string; // Added email field
  mobile?: string; // Added mobile field
}

export interface InvoiceData {
  sapCode: string;
  customerName: string; // Original case for display
  customerNameForMatching: string; // Lowercase for internal matching
  district: string;
  quantityLifted: number;
  godownRent: number;
  mainBillAmount: number; // This will now include loading, unloading, and local transportation
  freightBalance: number; // Secondary Freight
  loadingCharges: number; // Kept for potential detailed breakdown, but consolidated in mainBillAmount for totalValue
  unloadingCharges: number; // Kept for potential detailed breakdown, but consolidated in mainBillAmount for totalValue
  localTransportation: number; // Kept for potential detailed breakdown, but consolidated in mainBillAmount for totalValue
  totalValue: number; // Sum of godownRent, mainBillAmount, and freightBalance
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

import * as XLSX from "xlsx";
import type { InvoiceData } from "@/types/invoice";
import { useToast } from "@/hooks/use-toast";

interface InvoiceDataParserProps {
  onInvoiceDataParsed: (data: InvoiceData[]) => void;
  file: File;
  onUploadComplete: () => void;
}

export const InvoiceDataParser = ({
  onInvoiceDataParsed,
  file,
  onUploadComplete,
}: InvoiceDataParserProps) => {
  const { toast } = useToast();

  const parseInvoiceData = () => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetNames = workbook.SheetNames;
        console.log("Available Sheet Names:", sheetNames);

        const pivotSheetName = "Pivot.";
        const pivotSheet = workbook.Sheets[pivotSheetName];

        if (!pivotSheet) {
          throw new Error(
            `The required sheet "${pivotSheetName}" was not found in the Excel file.`
          );
        }
        console.log(`Processing sheet: ${pivotSheetName}`);

        const pivotJsonData = XLSX.utils.sheet_to_json(pivotSheet, {
          header: 1,
        });

        const pivotHeaderRowIndex = pivotJsonData.findIndex((row: any) =>
          row.some(
            (cell: any) =>
              typeof cell === "string" &&
              (cell.toLowerCase().includes("bill") ||
                cell.toLowerCase().includes("party") ||
                cell.toLowerCase().includes("amount") ||
                cell.toLowerCase().includes("quantity") ||
                cell.toLowerCase().includes("rent") ||
                cell.toLowerCase().includes("freight"))
          )
        );

        if (pivotHeaderRowIndex === -1) {
          throw new Error(
            "Could not automatically detect the header row in the 'Pivot.' sheet. Please ensure it contains recognizable headers like 'Bill To Party Name', 'Sum of Total QTY Lifted', 'Godown Rent @ Rs. 100/mt', 'Loading', 'Unloading', 'Local Transportation', 'Sum of Balance to be given as Secondary Frt.'."
          );
        }

        const pivotHeaders = pivotJsonData[pivotHeaderRowIndex] as string[];
        console.log("Detected Headers (Pivot.):", pivotHeaders);
        const pivotDataRows = pivotJsonData.slice(
          pivotHeaderRowIndex + 1
        ) as any[][];

        const invoiceData: InvoiceData[] = pivotDataRows
          .filter((row) =>
            row.some(
              (cell) => cell !== null && cell !== undefined && cell !== ""
            )
          )
          .map((row, index) => {
            const findColIndex = (keywords: string[]): number => {
              return pivotHeaders.findIndex((h) =>
                h && typeof h === 'string' && keywords.some(keyword =>
                  h.toLowerCase().includes(keyword.toLowerCase())
                )
              );
            };

            const billToPartyNameColIndex = findColIndex(["bill to party name", "customer name"]);
            const districtColIndex = findColIndex(["district", "location", "region"]);
            const quantityLiftedColIndex = findColIndex(["sum of total qty lifted", "quantity lifted", "quantity"]);
            const godownRentColIndex = findColIndex(["godown rent @ rs. 100/mt", "godown rent", "godown", "rent"]);
            const loadingChargesColIndex = findColIndex(["loading", "loading charges"]);
            const unloadingChargesColIndex = findColIndex(["unloading", "unloading charges"]);
            const localTransportationColIndex = findColIndex(["local transportation", "local transport"]);
            const freightBalanceColIndex = findColIndex(["sum of balance to be given as secondary frt.", "secondary frt.", "freight balance", "freight"]);

            const rawCustomerName = String(row[billToPartyNameColIndex] || "").trim();
            const customerNameForDisplay = rawCustomerName;
            const customerNameForMatching = rawCustomerName.toLowerCase();

            const quantityLiftedValue = parseFloat(String(row[quantityLiftedColIndex]));
            const quantityLifted = !isNaN(quantityLiftedValue) ? quantityLiftedValue : 0;

            const godownRentValue = parseFloat(String(row[godownRentColIndex]));
            const godownRent = !isNaN(godownRentValue) ? godownRentValue : 0;

            const loading = parseFloat(String(row[loadingChargesColIndex])) || 0;
            const unloading = parseFloat(String(row[unloadingChargesColIndex])) || 0;
            const localTransportation = parseFloat(String(row[localTransportationColIndex])) || 0;
            const mainBillAmount = loading + unloading + localTransportation;

            const freightBalance = parseFloat(String(row[freightBalanceColIndex])) || 0;

            const calculatedTotalValue = godownRent + mainBillAmount + freightBalance;

            return {
              sapCode: String(
                row[findColIndex(["sap code", "sap"])] || `SAP${index.toString().padStart(3, "0")}`
              ).trim(),
              customerName: customerNameForDisplay,
              customerNameForMatching: customerNameForMatching,
              district: String(row[districtColIndex] || "Unknown District").trim(),
              quantityLifted,
              godownRent,
              mainBillAmount: mainBillAmount,
              freightBalance,
              loadingCharges: loading,
              unloadingCharges: unloading,
              localTransportation: localTransportation,
              totalValue: calculatedTotalValue,
            };
          });

        const filteredInvoiceData = invoiceData.filter(
          (invoice) => invoice.customerName && invoice.customerName !== ""
        );

        onInvoiceDataParsed(filteredInvoiceData);
        toast({
          title: "Invoice Data Parsed Successfully",
          description: `Found ${filteredInvoiceData.length} invoice records from the Pivot sheet.`,
        });
      } catch (error) {
        console.error("Error parsing invoice data:", error);
        toast({
          title: "Error",
          description: `Failed to parse Invoice file. Please ensure the 'Pivot.' sheet exists and has the correct headers. Error: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        onUploadComplete();
      }
    };
    reader.readAsArrayBuffer(file);
  };

  parseInvoiceData();

  return null;
};

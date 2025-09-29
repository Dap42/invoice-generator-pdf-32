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

        // Filter out empty rows
        const validDataRows = pivotDataRows.filter((row) =>
          row.some((cell) => cell !== null && cell !== undefined && cell !== "")
        );

        // UP Zone Detection Function
        const isUPZone = (plantValue: string, zoneValue: string): boolean => {
          const plant = (plantValue || "").toString().toLowerCase();
          const zone = (zoneValue || "").toString().toLowerCase();

          // Check PLANT column for UP indicators
          if (
            plant.includes("w.up") ||
            plant.includes("e.up") ||
            plant.includes("gajraula")
          ) {
            return true;
          }

          // Check Zone column for UP indicators
          if (
            zone.includes("westup") ||
            zone.includes("east up") ||
            zone.includes("potato belt")
          ) {
            return true;
          }

          return false;
        };

        // Group rows by customer name + UP/Non-UP classification for aggregation
        const aggregatedData = new Map<
          string,
          {
            customerName: string;
            zone: string;
            district: string;
            sapCode: string;
            quantityLifted: number;
            godownRent: number;
            loadingCharges: number;
            unloadingCharges: number;
            localTransportation: number;
            freightBalance: number;
            rowCount: number;
          }
        >();

        validDataRows.forEach((row, index) => {
          const findColIndex = (keywords: string[]): number => {
            return pivotHeaders.findIndex(
              (h) =>
                h &&
                typeof h === "string" &&
                keywords.some((keyword) =>
                  h.toLowerCase().includes(keyword.toLowerCase())
                )
            );
          };

          const plantColIndex = 0; // First column is PLANT
          const zoneColIndex = findColIndex(["zone", "plant"]);
          const billToPartyNameColIndex = findColIndex([
            "bill to party name",
            "customer name",
          ]);
          const districtColIndex = findColIndex([
            "bill to district",
            "district",
            "location",
            "region",
          ]);
          const sapCodeColIndex = findColIndex(["sap code", "sap"]);
          const quantityLiftedColIndex = findColIndex([
            "sum of total qty lifted",
            "quantity lifted",
            "quantity",
          ]);
          const godownRentColIndex = findColIndex([
            "godown rent @ rs. 100/mt",
            "godown rent",
            "godown",
            "rent",
          ]);
          const loadingChargesColIndex = findColIndex([
            "loading",
            "loading charges",
          ]);
          const unloadingChargesColIndex = findColIndex([
            "unloading",
            "unloading charges",
          ]);
          const localTransportationColIndex = findColIndex([
            "local transportation",
            "local transport",
          ]);
          const freightBalanceColIndex = findColIndex([
            "sum of balance to be given as secondary frt.",
            "secondary frt.",
            "freight balance",
            "freight",
          ]);

          const rawCustomerName = String(
            row[billToPartyNameColIndex] || ""
          ).trim();
          const plantValue = String(row[plantColIndex] || "").trim();
          const zoneValue = String(row[zoneColIndex] || "").trim();
          const district = String(
            row[districtColIndex] || "Unknown District"
          ).trim();
          const sapCode = String(row[sapCodeColIndex] || "").trim();

          // Skip if no customer name
          if (!rawCustomerName || rawCustomerName === "") return;

          // Determine if this is UP zone
          const isUp = isUPZone(plantValue, zoneValue);
          const finalZone = isUp ? "UP" : zoneValue;

          // Create grouping key: customerName + finalZone
          const groupKey = `${rawCustomerName.toLowerCase()}|${finalZone.toLowerCase()}`;

          const quantityLiftedValue = parseFloat(
            String(row[quantityLiftedColIndex] || 0)
          );
          const quantityLifted = !isNaN(quantityLiftedValue)
            ? quantityLiftedValue
            : 0;

          const godownRentValue = parseFloat(
            String(row[godownRentColIndex] || 0)
          );
          const godownRent = !isNaN(godownRentValue) ? godownRentValue : 0;

          const loading =
            parseFloat(String(row[loadingChargesColIndex] || 0)) || 0;
          const unloading =
            parseFloat(String(row[unloadingChargesColIndex] || 0)) || 0;
          const localTransportation =
            parseFloat(String(row[localTransportationColIndex] || 0)) || 0;
          const freightBalance =
            parseFloat(String(row[freightBalanceColIndex] || 0)) || 0;

          // Aggregate or create new group
          if (aggregatedData.has(groupKey)) {
            const existing = aggregatedData.get(groupKey)!;
            existing.quantityLifted += quantityLifted;
            existing.godownRent += godownRent;
            existing.loadingCharges += loading;
            existing.unloadingCharges += unloading;
            existing.localTransportation += localTransportation;
            existing.freightBalance += freightBalance;
            existing.rowCount += 1;
          } else {
            aggregatedData.set(groupKey, {
              customerName: rawCustomerName,
              zone: finalZone,
              district: district,
              sapCode: sapCode || `SAP${index.toString().padStart(3, "0")}`,
              quantityLifted,
              godownRent,
              loadingCharges: loading,
              unloadingCharges: unloading,
              localTransportation: localTransportation,
              freightBalance,
              rowCount: 1,
            });
          }
        });

        // Convert aggregated data to InvoiceData array
        const invoiceData: InvoiceData[] = Array.from(
          aggregatedData.values()
        ).map((aggregated, index) => {
          const mainBillAmount =
            aggregated.loadingCharges +
            aggregated.unloadingCharges +
            aggregated.localTransportation;
          const totalValue =
            aggregated.godownRent + mainBillAmount + aggregated.freightBalance;

          return {
            sapCode: aggregated.sapCode,
            customerName: aggregated.customerName,
            customerNameForMatching: aggregated.customerName.toLowerCase(),
            district: aggregated.district,
            quantityLifted: aggregated.quantityLifted,
            godownRent: aggregated.godownRent,
            mainBillAmount: mainBillAmount,
            freightBalance: aggregated.freightBalance,
            loadingCharges: aggregated.loadingCharges,
            unloadingCharges: aggregated.unloadingCharges,
            localTransportation: aggregated.localTransportation,
            totalValue: totalValue,
          };
        });

        console.log(
          `Aggregated ${validDataRows.length} rows into ${invoiceData.length} customer-zone groups`
        );

        onInvoiceDataParsed(invoiceData);
        toast({
          title: "Invoice Data Parsed Successfully",
          description: `Aggregated ${validDataRows.length} rows into ${invoiceData.length} customer-zone groups from the Pivot sheet.`,
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

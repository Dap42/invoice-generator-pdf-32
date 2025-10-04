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
        console.log("=== DEBUG: Invoice Data Parser Started ===");
        console.log("Detected Headers (Pivot.):", pivotHeaders);
        console.log("Total rows found:", pivotJsonData.length);
        console.log("Header row index:", pivotHeaderRowIndex);
        const pivotDataRows = pivotJsonData.slice(
          pivotHeaderRowIndex + 1
        ) as any[][];

        // Filter out empty rows
        const validDataRows = pivotDataRows.filter((row) =>
          row.some((cell) => cell !== null && cell !== undefined && cell !== "")
        );

        // SAP Code-based aggregation - no zone detection needed

        // Group rows by SAP Code for aggregation
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
          console.log(`\n=== DEBUG: Processing Row ${index + 1} ===`);
          console.log("Raw row data:", row);

          const findColIndex = (keywords: string[]): number => {
            const foundIndex = pivotHeaders.findIndex(
              (h) =>
                h &&
                typeof h === "string" &&
                keywords.some((keyword) =>
                  h.toLowerCase().includes(keyword.toLowerCase())
                )
            );
            console.log(
              `Column search for "${keywords.join(
                '", "'
              )}" - Found at index: ${foundIndex}`
            );
            if (foundIndex >= 0) {
              console.log(`Column header: "${pivotHeaders[foundIndex]}"`);
            } else {
              console.log(
                `Column NOT FOUND for keywords: "${keywords.join('", "')}"`
              );
            }
            return foundIndex;
          };

          const plantColIndex = 0; // First column is PLANT
          const zoneColIndex = findColIndex(["Zone", "zone", "plant"]);
          const billToPartyNameColIndex = findColIndex([
            "Bill To Party Name",
            "bill to party name",
            "customer name",
          ]);
          const districtColIndex = findColIndex([
            "bill to district",
            "district",
            "location",
            "region",
          ]);
          const sapCodeColIndex = findColIndex(["SAP Code", "sap code", "sap"]);
          const quantityLiftedColIndex = findColIndex([
            "Sum of Total QTY Lifted",
            "sum of total qty lifted",
            "quantity lifted",
            "quantity",
          ]);
          const godownRentColIndex = findColIndex([
            "Godown Rent @ Rs. 100/mt (Ist Bill)",
            "godown rent @ rs. 100/mt",
            "godown rent",
            "godown",
            "rent",
          ]);
          const loadingChargesColIndex = findColIndex([
            "Loading @ Rs. 75/mt",
            "loading @ rs. 75/mt",
            "loading",
            "loading charges",
          ]);
          const unloadingChargesColIndex = findColIndex([
            "Unloading @ Rs. 75/mt",
            "unloading @ rs. 75/mt",
            "unloading",
            "unloading charges",
          ]);
          const localTransportationColIndex = findColIndex([
            "Local Transportation @ Rs. 200/mt",
            "local transportation @ rs. 200/mt",
            "local transportation",
            "local transport",
          ]);
          const freightBalanceColIndex = findColIndex([
            "Sum of Balance to be given as Secondary Frt. (3rd Bill)",
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

          console.log("=== EXTRACTED VALUES ===");
          console.log(
            `Customer Name: "${rawCustomerName}" (Index: ${billToPartyNameColIndex})`
          );
          console.log(`Plant Value: "${plantValue}" (Index: ${plantColIndex})`);
          console.log(`Zone Value: "${zoneValue}" (Index: ${zoneColIndex})`);
          console.log(`District: "${district}" (Index: ${districtColIndex})`);
          console.log(`SAP Code: "${sapCode}" (Index: ${sapCodeColIndex})`);

          // Skip if no SAP code
          if (!sapCode || sapCode === "") {
            console.log("SKIPPING ROW - No SAP code found");
            return;
          }

          // Create grouping key: SAP Code only
          const groupKey = sapCode.trim();
          console.log(`SAP Code: "${sapCode}" -> Group Key: "${groupKey}"`);

          console.log("=== NUMERIC VALUE PARSING ===");
          const quantityLiftedValue = parseFloat(
            String(row[quantityLiftedColIndex] || 0)
          );
          const quantityLifted = !isNaN(quantityLiftedValue)
            ? quantityLiftedValue
            : 0;
          console.log(
            `Quantity Lifted: ${quantityLifted} (raw: "${row[quantityLiftedColIndex]}")`
          );

          const godownRentValue = parseFloat(
            String(row[godownRentColIndex] || 0)
          );
          const godownRent = !isNaN(godownRentValue) ? godownRentValue : 0;
          console.log(
            `Godown Rent: ${godownRent} (raw: "${row[godownRentColIndex]}")`
          );

          const loading =
            parseFloat(String(row[loadingChargesColIndex] || 0)) || 0;
          const unloading =
            parseFloat(String(row[unloadingChargesColIndex] || 0)) || 0;
          const localTransportation =
            parseFloat(String(row[localTransportationColIndex] || 0)) || 0;
          const freightBalance =
            parseFloat(String(row[freightBalanceColIndex] || 0)) || 0;

          console.log(
            `Loading: ${loading}, Unloading: ${unloading}, Local Transport: ${localTransportation}, Freight Balance: ${freightBalance}`
          );

          // Aggregate or create new group
          const existingGroup = aggregatedData.get(groupKey);
          if (existingGroup) {
            console.log(
              `AGGREGATING - Adding to existing group for key: "${groupKey}"`
            );
            console.log(
              `Before aggregation - Quantity: ${existingGroup.quantityLifted}, Godown Rent: ${existingGroup.godownRent}`
            );

            existingGroup.quantityLifted += quantityLifted;
            existingGroup.godownRent += godownRent;
            existingGroup.loadingCharges += loading;
            existingGroup.unloadingCharges += unloading;
            existingGroup.localTransportation += localTransportation;
            existingGroup.freightBalance += freightBalance;
            existingGroup.rowCount += 1;

            console.log(
              `After aggregation - Quantity: ${existingGroup.quantityLifted}, Godown Rent: ${existingGroup.godownRent}, Row Count: ${existingGroup.rowCount}`
            );
          } else {
            console.log(
              `CREATING NEW GROUP - New group for key: "${groupKey}"`
            );
            aggregatedData.set(groupKey, {
              customerName: rawCustomerName,
              zone: zoneValue,
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
            console.log(
              `New group created with Quantity: ${quantityLifted}, Godown Rent: ${godownRent}`
            );
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

        console.log("\n=== FINAL AGGREGATION RESULTS ===");
        console.log(`Total valid rows processed: ${validDataRows.length}`);
        console.log(`Total aggregated groups: ${aggregatedData.size}`);
        console.log(`Total invoice data items: ${invoiceData.length}`);

        console.log("\n=== DETAILED AGGREGATION SUMMARY ===");
        let totalQuantity = 0;
        let totalGodownRent = 0;
        let totalMainBillAmount = 0;
        let totalFreightBalance = 0;

        aggregatedData.forEach((value, key) => {
          console.log(`\nGroup: ${key}`);
          console.log(`  Customer: ${value.customerName}`);
          console.log(`  Zone: ${value.zone}`);
          console.log(`  District: ${value.district}`);
          console.log(`  SAP Code: ${value.sapCode}`);
          console.log(`  Quantity Lifted: ${value.quantityLifted}`);
          console.log(`  Godown Rent: ${value.godownRent}`);
          console.log(`  Loading Charges: ${value.loadingCharges}`);
          console.log(`  Unloading Charges: ${value.unloadingCharges}`);
          console.log(`  Local Transportation: ${value.localTransportation}`);
          console.log(`  Freight Balance: ${value.freightBalance}`);
          console.log(`  Row Count: ${value.rowCount}`);

          totalQuantity += value.quantityLifted;
          totalGodownRent += value.godownRent;
          totalMainBillAmount +=
            value.loadingCharges +
            value.unloadingCharges +
            value.localTransportation;
          totalFreightBalance += value.freightBalance;
        });

        console.log("\n=== AGGREGATION TOTALS ===");
        console.log(`Total Quantity Lifted: ${totalQuantity}`);
        console.log(`Total Godown Rent: ${totalGodownRent}`);
        console.log(`Total Main Bill Amount: ${totalMainBillAmount}`);
        console.log(`Total Freight Balance: ${totalFreightBalance}`);
        console.log(
          `Grand Total: ${
            totalGodownRent + totalMainBillAmount + totalFreightBalance
          }`
        );

        console.log("\n=== FINAL INVOICE DATA ===");
        invoiceData.forEach((item, index) => {
          console.log(`\nInvoice Item ${index + 1}:`);
          console.log(`  SAP Code: ${item.sapCode}`);
          console.log(`  Customer: ${item.customerName}`);
          console.log(`  District: ${item.district}`);
          console.log(`  Quantity: ${item.quantityLifted}`);
          console.log(`  Godown Rent: ${item.godownRent}`);
          console.log(`  Main Bill: ${item.mainBillAmount}`);
          console.log(`  Freight Balance: ${item.freightBalance}`);
          console.log(`  Total Value: ${item.totalValue}`);
        });

        console.log(
          `Aggregated ${validDataRows.length} rows into ${invoiceData.length} SAP code groups`
        );

        onInvoiceDataParsed(invoiceData);
        toast({
          title: "Invoice Data Parsed Successfully",
          description: `Aggregated ${validDataRows.length} rows into ${invoiceData.length} SAP code groups from the Pivot sheet.`,
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

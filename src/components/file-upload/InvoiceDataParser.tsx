import * as XLSX from "xlsx";
import type { InvoiceData } from "@/types/invoice";
import { useToast } from "@/hooks/use-toast";
import { aggregateColumnByParty } from "@/lib/excel-data-processor";

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

        let pivotSheet: XLSX.WorkSheet | undefined;
        let monthlySheet: XLSX.WorkSheet | undefined;
        let monthlySheetName: string | undefined;

        // 1. Get "Pivot." sheet
        if (workbook.Sheets["Pivot."]) {
          pivotSheet = workbook.Sheets["Pivot."];
          console.log("Found 'Pivot.' sheet.");
        } else {
          console.warn("Pivot. sheet not found.");
        }

        // 2. Get monthly "Dis-MMM-YY" sheet
        const disMonthYearRegex = /^dis-[a-z]{3}-\d{2}$/i; // e.g., "Dis-Apr-25"
        const foundMonthlySheetName = sheetNames.find((name) =>
          disMonthYearRegex.test(name)
        );

        if (foundMonthlySheetName && workbook.Sheets[foundMonthlySheetName]) {
          monthlySheet = workbook.Sheets[foundMonthlySheetName];
          monthlySheetName = foundMonthlySheetName;
          console.log(`Found monthly sheet: ${monthlySheetName}`);
        } else {
          console.warn("No monthly 'Dis-MMM-YY' sheet found.");
        }

        if (!pivotSheet && !monthlySheet) {
          throw new Error(
            "Could not find any suitable invoice data sheets in the Excel file (neither 'Pivot.' nor 'Dis-MMM-YY')."
          );
        }

        // Process Pivot. sheet for main invoice data
        let invoiceData: InvoiceData[] = [];
        if (pivotSheet) {
          const pivotJsonData = XLSX.utils.sheet_to_json(pivotSheet, {
            header: 1,
          });
          console.log("Processing sheet: Pivot.");

          const pivotHeaderRowIndex = pivotJsonData.findIndex((row: any) =>
            row.some(
              (cell: any) =>
                typeof cell === "string" &&
                (cell.toLowerCase().includes("bill") ||
                  cell.toLowerCase().includes("party") ||
                  cell.toLowerCase().includes("amount"))
            )
          );

          if (pivotHeaderRowIndex === -1) {
            console.warn(
              "Could not find header row in Pivot. sheet. Skipping main invoice data extraction."
            );
          } else {
            const pivotHeaders = pivotJsonData[pivotHeaderRowIndex] as string[];
            console.log("Detected Headers (Pivot.):", pivotHeaders);
            const pivotDataRows = pivotJsonData.slice(
              pivotHeaderRowIndex + 1
            ) as any[][];

            invoiceData = pivotDataRows
              .filter((row) =>
                row.some(
                  (cell) => cell !== null && cell !== undefined && cell !== ""
                )
              )
              .map((row, index) => {
                const customerName = String(
                  row[
                    pivotHeaders.findIndex(
                      (h) =>
                        h?.toLowerCase().includes("bill") &&
                        h?.toLowerCase().includes("party")
                    )
                  ] ||
                    row[
                      pivotHeaders.findIndex((h) =>
                        h?.toLowerCase().includes("customer")
                      )
                    ] ||
                    ""
                )
                  .trim()
                  .toLowerCase();

                const quantityLifted =
                  parseFloat(
                    String(
                      row[
                        pivotHeaders.findIndex(
                          (h) =>
                            h?.toLowerCase().includes("quantity") ||
                            h?.toLowerCase().includes("lifted")
                        )
                      ] || 500
                    )
                  ) || 500;
                const godownRent =
                  parseFloat(
                    String(
                      row[
                        pivotHeaders.findIndex(
                          (h) =>
                            h?.toLowerCase().includes("godown") ||
                            h?.toLowerCase().includes("rent")
                        )
                      ] || quantityLifted * 100
                    )
                  ) || quantityLifted * 100;
                const mainBillAmount =
                  parseFloat(
                    String(
                      row[
                        pivotHeaders.findIndex(
                          (h) =>
                            h?.toLowerCase().includes("main") ||
                            h?.toLowerCase().includes("loading") ||
                            h?.toLowerCase().includes("transport")
                        )
                      ] || 50000
                    )
                  ) || 50000;

                const loadingCharges =
                  parseFloat(
                    String(
                      row[
                        pivotHeaders.findIndex((h) =>
                          h?.toLowerCase().includes("loading")
                        )
                      ] || 0
                    )
                  ) || 0;
                const unloadingCharges =
                  parseFloat(
                    String(
                      row[
                        pivotHeaders.findIndex((h) =>
                          h?.toLowerCase().includes("unloading")
                        )
                      ] || 0
                    )
                  ) || 0;
                const localTransportation =
                  parseFloat(
                    String(
                      row[
                        pivotHeaders.findIndex(
                          (h) =>
                            h?.toLowerCase().includes("local") &&
                            h?.toLowerCase().includes("transportation")
                        )
                      ] || 0
                    )
                  ) || 0;

                return {
                  sapCode: String(
                    row[
                      pivotHeaders.findIndex((h) =>
                        h?.toLowerCase().includes("sap")
                      )
                    ] || `SAP${index.toString().padStart(3, "0")}`
                  ).trim(),
                  customerName: String(
                    row[
                      pivotHeaders.findIndex(
                        (h) =>
                          h?.toLowerCase().includes("bill") &&
                          h?.toLowerCase().includes("party")
                      )
                    ] ||
                      row[
                        pivotHeaders.findIndex((h) =>
                          h?.toLowerCase().includes("customer")
                        )
                      ] ||
                      ""
                  ).trim(),
                  district: String(
                    row[
                      pivotHeaders.findIndex(
                        (h) =>
                          h?.toLowerCase().includes("district") ||
                          h?.toLowerCase().includes("location")
                      )
                    ] || "Unknown District"
                  ).trim(),
                  quantityLifted,
                  godownRent,
                  mainBillAmount,
                  freightBalance: 0,
                  loadingCharges,
                  unloadingCharges,
                  localTransportation,
                  totalValue: godownRent + mainBillAmount,
                };
              });
          }
        }

        // Process monthly sheet for secondary freight
        if (monthlySheet && monthlySheetName) {
          const monthlyJsonData = XLSX.utils.sheet_to_json(monthlySheet, {
            header: 1,
          });
          console.log("Processing sheet:", monthlySheetName);

          const monthlyHeaderRowIndex = monthlyJsonData.findIndex((row: any) =>
            row.some(
              (cell: any) =>
                typeof cell === "string" &&
                (cell.toLowerCase().includes("bill") ||
                  cell.toLowerCase().includes("party") ||
                  cell.toLowerCase().includes("amount"))
            )
          );

          if (monthlyHeaderRowIndex === -1) {
            console.warn(
              `Could not find header row in ${monthlySheetName} sheet. Skipping secondary freight extraction.`
            );
          } else {
            const aggregatedSecondaryFreight = aggregateColumnByParty(
              monthlyJsonData as any[][],
              monthlyHeaderRowIndex,
              "Total Discount"
            );
            console.log(
              "Aggregated Secondary Freight Map (from monthly sheet):",
              aggregatedSecondaryFreight
            );

            // Merge secondary freight into existing invoiceData
            invoiceData = invoiceData.map((invoice) => {
              const freightBalance =
                aggregatedSecondaryFreight.get(
                  invoice.customerName.toLowerCase()
                ) || 0;
              console.log(
                `Customer: ${invoice.customerName}, Aggregated freightBalance from monthly sheet: ${freightBalance}`
              );
              return {
                ...invoice,
                freightBalance,
                totalValue: invoice.totalValue + freightBalance,
              };
            });
          }
        }

        // Filter out invoices with no customer name after all processing
        invoiceData = invoiceData.filter(
          (invoice) => invoice.customerName && invoice.customerName !== ""
        );

        onInvoiceDataParsed(invoiceData);
        toast({
          title: "Invoice Data Parsed Successfully",
          description: `Found ${invoiceData.length} invoice records`,
        });
      } catch (error) {
        console.error("Error parsing invoice data:", error);
        toast({
          title: "Error",
          description: "Failed to parse Invoice file. Please check the format.",
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

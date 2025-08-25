import * as XLSX from "xlsx";
import type { CustomerData } from "@/types/invoice";
import { useToast } from "@/hooks/use-toast";

interface CustomerMasterParserProps {
  onCustomerDataParsed: (data: CustomerData[]) => void;
  file: File;
  onUploadComplete: () => void;
}

export const CustomerMasterParser = ({
  onCustomerDataParsed,
  file,
  onUploadComplete,
}: CustomerMasterParserProps) => {
  const { toast } = useToast();

  const parseCustomerMaster = () => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Find header row and parse data
        const headerRowIndex = jsonData.findIndex((row: any) =>
          row.some(
            (cell: any) =>
              typeof cell === "string" &&
              (cell.toLowerCase().includes("customer") ||
                cell.toLowerCase().includes("name") ||
                cell.toLowerCase().includes("party"))
          )
        );

        if (headerRowIndex === -1) {
          throw new Error("Could not find header row in Customer Master file");
        }

        const headers = jsonData[headerRowIndex] as string[];
        const dataRows = jsonData.slice(headerRowIndex + 1) as any[][];

        const customerData: CustomerData[] = dataRows
          .filter((row) =>
            row.some(
              (cell) => cell !== null && cell !== undefined && cell !== ""
            )
          )
          .map((row, index) => ({
            sapCode: String(
              row[
                headers.findIndex(
                  (h) =>
                    h?.toLowerCase().includes("sap") ||
                    h?.toLowerCase().includes("code")
                )
              ] || `SAP${index.toString().padStart(3, "0")}`
            ).trim(),
            customerName: String(
              row[
                headers.findIndex(
                  (h) =>
                    h?.toLowerCase().includes("name") ||
                    h?.toLowerCase().includes("customer") ||
                    h?.toLowerCase().includes("party")
                )
              ] || ""
            ).trim(),
            address:
              [
                row[headers.findIndex((h) => h?.toLowerCase() === "street")],
                row[headers.findIndex((h) => h?.toLowerCase() === "street2")],
                row[headers.findIndex((h) => h?.toLowerCase() === "street3")],
                row[headers.findIndex((h) => h?.toLowerCase() === "street4")],
                row[
                  headers.findIndex((h) => h?.toLowerCase() === "postal code")
                ],
                row[headers.findIndex((h) => h?.toLowerCase() === "district")],
              ]
                .filter(Boolean) // Remove null/undefined/empty values
                .map(String) // Ensure all parts are strings
                .join(", ")
                .trim() || "Address not provided",
            gstin: String(
              row[
                headers.findIndex(
                  (h) =>
                    h?.toLowerCase().includes("gstin") ||
                    h?.toLowerCase().includes("gst")
                )
              ] || "GSTIN not provided"
            ).trim(),
            pan: String(
              row[headers.findIndex((h) => h?.toLowerCase().includes("pan"))] ||
                "PAN not provided"
            ).trim(),
            email: String(
              row[
                headers.findIndex((h) => h?.toLowerCase() === "e-mail address")
              ] || ""
            ).trim(),
            mobile: String(
              row[headers.findIndex((h) => h?.toLowerCase() === "mob_num")] ||
                ""
            ).trim(),
          }))
          .filter(
            (customer) => customer.customerName && customer.customerName !== ""
          );

        // Deduplicate customerData based on customerName
        const uniqueCustomerData = Array.from(
          new Map(
            customerData.map((customer) => [customer.customerName, customer])
          ).values()
        );

        onCustomerDataParsed(uniqueCustomerData);
        toast({
          title: "Customer Master Parsed Successfully",
          description: `Found ${uniqueCustomerData.length} unique customer records`,
        });
      } catch (error) {
        console.error("Error parsing customer master:", error);
        toast({
          title: "Error",
          description:
            "Failed to parse Customer Master file. Please check the format.",
          variant: "destructive",
        });
      } finally {
        onUploadComplete();
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Call the parsing function immediately when the component mounts or file prop changes
  // This component is designed to be called when a file is ready to be parsed
  parseCustomerMaster();

  return null; // This component doesn't render anything
};

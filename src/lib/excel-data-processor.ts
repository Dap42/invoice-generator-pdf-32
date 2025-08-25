import * as XLSX from "xlsx";

/**
 * Aggregates values from a specified column by party name from raw Excel data.
 * @param jsonData The raw JSON data from the Excel sheet (including headers).
 * @param headerRowIndex The index of the header row in jsonData.
 * @param columnHeaderToAggregate The header of the column whose values need to be aggregated.
 * @returns A Map where keys are party names (string) and values are their aggregated amounts (number).
 */
export const aggregateColumnByParty = (
  jsonData: any[][],
  headerRowIndex: number,
  columnHeaderToAggregate: string
): Map<string, number> => {
  const headers = jsonData[headerRowIndex] as string[];
  const dataRows = jsonData.slice(headerRowIndex + 1) as any[][];

  const aggregatedData = new Map<string, number>();
  const valueColIndex = headers.findIndex((h) =>
    h?.toLowerCase().includes(columnHeaderToAggregate.toLowerCase())
  );
  const billToPartyNameColIndex = headers.findIndex((h) =>
    h?.toLowerCase().includes("bill to party name")
  );

  if (valueColIndex === -1) {
    console.warn(
      `Column "${columnHeaderToAggregate}" not found in Excel data for aggregation.`
    );
    return aggregatedData;
  }
  if (billToPartyNameColIndex === -1) {
    console.warn(
      "Bill To Party Name column not found in Excel data for aggregation."
    );
    return aggregatedData;
  }

  dataRows.forEach((row) => {
    const partyName = String(row[billToPartyNameColIndex] || "")
      .trim()
      .toLowerCase();
    const value = parseFloat(String(row[valueColIndex] || 0)) || 0;
    if (partyName) {
      aggregatedData.set(
        partyName,
        (aggregatedData.get(partyName) || 0) + value
      );
    }
  });

  return aggregatedData;
};

/**
 * Exports summary data to an Excel file.
 * @param summaryData An object containing the summary totals.
 * @param filename The name of the Excel file to be generated.
 */
export const exportSummaryToExcel = (
  summaryData: {
    godownRentTotal: number;
    mainBillAmountTotal: number;
    freightBalanceTotal: number;
    combinedTotal: number;
  },
  filename: string
) => {
  const data = [
    ["Summary Category", "Total Value"],
    ["Godown Rent Total", summaryData.godownRentTotal],
    [
      "Main Bill Amount Total (Loading/Unloading/Local Transportation)",
      summaryData.mainBillAmountTotal,
    ],
    ["Freight Balance Total", summaryData.freightBalanceTotal],
    ["Combined Total", summaryData.combinedTotal],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Invoice Summary");
  XLSX.writeFile(wb, filename);
};

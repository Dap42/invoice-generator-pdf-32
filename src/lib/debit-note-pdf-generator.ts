import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { MergedInvoiceData } from "@/types/invoice";
import {
  convertNumberToIndianWords,
  extractStateFromAddress,
  otherMainStates,
} from "@/lib/utils";
import { JubilantDetails } from "@/components/JubilantDetails";

export const generateDebitNotePDF = (
  data: MergedInvoiceData,
  invoiceType: "godown" | "main" | "freight",
  formatNumber: (amount: number) => string
): Blob => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const yOffset = 15; // Offset to move content down

  const customerState = extractStateFromAddress(data.customer.address);

  // Name of Company - very top
  doc.setFontSize(9);
  doc.setFont(undefined, "bold");
  doc.text(data.customer.customerName, 20, 12 + yOffset);

  // DEBIT NOTE
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.setTextColor(255, 0, 0); // Set color to red for "DEBIT"
  doc.text("DEBIT ", pageWidth - 45, 12 + yOffset);
  doc.setTextColor(0, 0, 0); // Set color to black for "NOTE"
  doc.text("NOTE", pageWidth - 45 + 12, 12 + yOffset); // Position "NOTE" after "DEBIT"

  // Left side fields - dynamic content
  doc.setFontSize(7);

  // Add:
  doc.setFont(undefined, "bold");
  doc.text("Add:", 20, 22 + yOffset);
  doc.setFont(undefined, "normal");
  const addressLines = doc.splitTextToSize(data.customer.address, 60); // Wrap address to 60mm width
  doc.text(addressLines, 35, 22 + yOffset); // Adjust X-coordinate for address content
  let currentYPosition =
    22 +
    yOffset +
    (addressLines.length * doc.getLineHeight()) / doc.internal.scaleFactor; // Calculate Y after address

  // GSTIN
  doc.setFont(undefined, "bold");
  doc.text("GSTIN:", 20, currentYPosition + 2);
  doc.setFont(undefined, "normal");
  doc.text(data.customer.gstin, 35, currentYPosition + 2);
  currentYPosition += 2; // Move Y down for GSTIN line

  // PAN
  doc.setFont(undefined, "bold");
  doc.text("PAN:", 70, currentYPosition); // Adjusted X for PAN
  doc.setFont(undefined, "normal");
  doc.text(data.customer.pan, 80, currentYPosition); // Adjusted X for PAN content
  // currentYPosition doesn't change here as it's on the same line as GSTIN

  // EMAIL
  doc.setFont(undefined, "bold");
  doc.text("EMAIL:", 20, currentYPosition + 5);
  doc.setFont(undefined, "normal");
  doc.text(data.customer.email || "N/A", 35, currentYPosition + 5); // Use N/A if email is not available
  currentYPosition += 5; // Move Y down for EMAIL line

  // MOB
  doc.setFont(undefined, "bold");
  doc.text("MOB:", 70, currentYPosition); // Adjusted X for MOB
  doc.setFont(undefined, "normal");
  doc.text(data.customer.mobile || "N/A", 80, currentYPosition); // Use N/A if mobile is not available
  // currentYPosition doesn't change here as it's on the same line as EMAIL

  // Right side fields
  doc.setFont(undefined, "bold");
  doc.text("INVOICE NO :", pageWidth - 60, 22 + yOffset);
  doc.text("DATE :", pageWidth - 60, 27 + yOffset);
  doc.setFont(undefined, "normal");

  // To section - dynamic content using new component
  const jubilantDetailsFinalY = JubilantDetails({
    doc,
    customerAddress: data.customer.address,
    startY: currentYPosition + 5, // Dynamically set startY with padding
  });

  // Service description on right side - compact
  const serviceDescriptionStartY = jubilantDetailsFinalY + 5; // Start below JubilantDetails

  let serviceDescriptionLines: string[] = [];
  if (invoiceType === "godown") {
    serviceDescriptionLines = doc.splitTextToSize(
      `Rental or Leasing services involving own or leased non - residential property for ${customerState}`,
      50 // Adjust width as needed for the right side
    );
  } else if (invoiceType === "main") {
    serviceDescriptionLines = doc.splitTextToSize(
      "Clearing & Forwording Charges",
      50
    );
  } else if (invoiceType === "freight") {
    serviceDescriptionLines = [""]; // Leave blank as requested
  }

  serviceDescriptionLines.forEach((line, index) => {
    doc.text(line, pageWidth - 80, serviceDescriptionStartY + index * 4);
  });

  let serviceRows: any[] = [];
  let totalAmountBeforeTax = 0;

  switch (invoiceType) {
    case "godown":
      serviceRows.push([
        "Rental or Leasing services involving own or leased non - residential property",
        "997212", // HSN/SAC for Rental or Leasing services
        formatNumber(data.godownRent / 100), // Calculated Quantity
        formatNumber(100), // Rate
        formatNumber(data.godownRent), // Amount
      ]);
      totalAmountBeforeTax = data.godownRent;
      break;
    case "main":
      serviceRows.push(
        [
          "Loading Charges",
          "996519", // HSN/SAC for Loading/Unloading services
          formatNumber(data.loadingCharges / 75), // Calculated Quantity
          "75.00", // Rate from Excel header
          formatNumber(data.loadingCharges), // Amount
        ],
        [
          "Unloading Charges",
          "996519", // HSN/SAC for Loading/Unloading services
          formatNumber(data.unloadingCharges / 75), // Calculated Quantity
          "75.00", // Rate from Excel header
          formatNumber(data.unloadingCharges), // Amount
        ],
        [
          "Local Transportation",
          "996713", // HSN/SAC for Local Transportation services
          formatNumber(data.localTransportation / 200), // Calculated Quantity
          "200.00", // Rate from Excel header
          formatNumber(data.localTransportation), // Amount
        ]
      );
      totalAmountBeforeTax =
        data.loadingCharges + data.unloadingCharges + data.localTransportation;
      break;
    case "freight":
      serviceRows.push([
        "Secondary Freight",
        "996511", // HSN/SAC for Secondary Freight services
        formatNumber(data.freightBalance), // This is now the Amount column
      ]);
      totalAmountBeforeTax = data.freightBalance;
      break;
  }

  const interStateStates = [
    "Maharashtra",
    "Gujarat",
    "Chhattisgarh",
    "Uttarakhand",
  ];
  const isInterState = interStateStates.includes(customerState);

  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  let totalAmount = 0;

  // Define table head and column styles dynamically
  let tableHead: string[][] = [];
  let tableColumnStyles: any = {};

  if (invoiceType === "freight") {
    tableHead = [["Service Description", "HSN / SAC", "Amount"]];
    tableColumnStyles = {
      0: { halign: "left", cellWidth: 118 }, // Service Description
      1: { halign: "center", cellWidth: 22 }, // HSN / SAC
      2: { halign: "right", cellWidth: 30 }, // Amount
    };
  } else {
    tableHead = [["Service Description", "HSN / SAC", "Qty", "Rate", "Amount"]];
    tableColumnStyles = {
      0: { halign: "left", cellWidth: 70 },
      1: { halign: "center", cellWidth: 22 },
      2: { halign: "center", cellWidth: 18 },
      3: { halign: "right", cellWidth: 30 },
      4: { halign: "right", cellWidth: 30 },
    };
  }

  let taxRows: any[] = [];
  const emptyCellsCount = tableHead[0].length - 2; // Number of empty cells before "TOTAL" and "Amount"

  if (isInterState) {
    igst = totalAmountBeforeTax * 0.18; // 18% IGST
    totalAmount = totalAmountBeforeTax + igst;
    taxRows = [
      ["IGST @ 18%", ...Array(emptyCellsCount).fill(""), formatNumber(igst)],
    ];
  } else {
    cgst = totalAmountBeforeTax * 0.09; // 9% CGST
    sgst = totalAmountBeforeTax * 0.09; // 9% SGST
    totalAmount = totalAmountBeforeTax + cgst + sgst;
    taxRows = [
      ["CGST @ 9%", ...Array(emptyCellsCount).fill(""), formatNumber(cgst)],
      ["SGST @ 9%", ...Array(emptyCellsCount).fill(""), formatNumber(sgst)],
    ];
  }

  if (invoiceType === "freight") {
    tableHead = [["Service Description", "HSN / SAC", "Amount"]];
    tableColumnStyles = {
      0: { halign: "left", cellWidth: 118 }, // Service Description
      1: { halign: "center", cellWidth: 22 }, // HSN / SAC
      2: { halign: "right", cellWidth: 30 }, // Amount
    };
  } else {
    tableHead = [["Service Description", "HSN / SAC", "Qty", "Rate", "Amount"]];
    tableColumnStyles = {
      0: { halign: "left", cellWidth: 70 },
      1: { halign: "center", cellWidth: 22 },
      2: { halign: "center", cellWidth: 18 },
      3: { halign: "right", cellWidth: 30 },
      4: { halign: "right", cellWidth: 30 },
    };
  }

  // Combined service and tax table
  autoTable(doc, {
    startY: serviceDescriptionStartY + 20, // Dynamically set table start below service description
    head: tableHead,
    body: [
      ...serviceRows,
      ["", "", "", "", ""].slice(0, tableHead[0].length), // Empty row for spacing, adjusted for column count
      ...taxRows, // Dynamically add tax rows
      [
        {
          content: `Rupees: ${convertNumberToIndianWords(totalAmount)}`,
          colSpan: tableHead[0].length - 2,
        },
        "TOTAL",
        formatNumber(totalAmount),
      ],
    ],
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
      fontStyle: "bold", // Apply bold to all body cells by default
      textColor: 0, // Set text color to black (RGB 0,0,0)
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: 0,
      fontStyle: "bold",
      halign: "center",
      fontSize: 7,
    },
    columnStyles: tableColumnStyles,
    margin: { left: 20, right: 20 },
    theme: "grid", // Changed to 'grid' for full borders
    tableLineColor: [0, 0, 0],
    tableLineWidth: 0.3,
    didParseCell: function (data) {
      if (data.section === "body") {
        // Empty row for spacing between service and tax rows
        const emptyRowIndex = serviceRows.length;
        if (data.row.index === emptyRowIndex) {
          data.cell.styles.minCellHeight = 80; // Increased value for a larger gap
        }

        // The 'TOTAL' text and amount are now in the row after the empty spacing row.
        const totalRowIndex = serviceRows.length + taxRows.length + 1; // +1 for the single empty row
        if (data.row.index === totalRowIndex) {
          // Adjust column index check based on the number of columns
          if (invoiceType === "freight") {
            if (data.column.index === 1 || data.column.index === 2) {
              // "TOTAL" is index 1, Amount is index 2
              data.cell.styles.fontStyle = "bold";
            }
          } else {
            if (data.column.index === 3 || data.column.index === 4) {
              data.cell.styles.fontStyle = "bold";
            }
          }
        }
      }
    },
  });

  // TAX PAYABLE UNDER REVERSE CHARGE : NO
  const finalY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(7);
  doc.setFont(undefined, "bold");
  doc.setTextColor(255, 0, 0);
  doc.text("TAX PAYABLE UNDER REVERSE CHARGE : NO", 20, finalY);
  doc.setTextColor(0, 0, 0);

  // SIGNATURE/ DIGITAL SIGNATURE/
  doc.setFontSize(7);
  doc.setFont(undefined, "bold");
  doc.setTextColor(255, 0, 0);
  doc.text("SIGNATURE/ DIGITAL SIGNATURE", pageWidth - 50, finalY + 10);
  doc.setTextColor(0, 0, 0);

  return doc.output("blob");
};

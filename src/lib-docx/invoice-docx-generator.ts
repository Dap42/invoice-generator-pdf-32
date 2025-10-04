import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableCell,
  TableRow,
  WidthType,
  VerticalAlign,
  AlignmentType,
  BorderStyle,
  HeightRule,
} from "docx";
import type { DOCXMergedInvoiceData } from "../types-docx/invoice-docx";

export const generateInvoiceDOCX = async (
  data: DOCXMergedInvoiceData,
  invoiceType: "godown" | "main" | "freight",
  formatNumber: (amount: number) => string
): Promise<Blob> => {
  console.log("🎯 Starting DOCX generation for:", invoiceType);
  console.log("📊 Data received:", {
    godownRent: data.godownRent,
    loadingCharges: data.loadingCharges,
    unloadingCharges: data.unloadingCharges,
    localTransportation: data.localTransportation,
    freightBalance: data.freightBalance,
    customer: data.customer.customerName,
  });
  // Helper function to create table cell with text
  const createCell = (
    text: string,
    options: {
      bold?: boolean;
      fontSize?: number;
      alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
      width?: number;
      colSpan?: number;
    } = {}
  ): TableCell => {
    const {
      bold = false,
      fontSize = 16,
      alignment = AlignmentType.LEFT,
      width,
      colSpan,
    } = options;

    return new TableCell({
      width: width ? { size: width, type: WidthType.DXA } : undefined,
      columnSpan: colSpan,
      children: [
        new Paragraph({
          alignment,
          children: [
            new TextRun({
              text,
              bold,
              font: "Arial",
              size: fontSize * 2, // docx uses half-points
            }),
          ],
        }),
      ],
    });
  };

  // Helper function to create empty cell for spacing
  const createEmptyCell = (width?: number): TableCell => {
    return new TableCell({
      width: width ? { size: width, type: WidthType.DXA } : undefined,
      children: [new Paragraph({ children: [new TextRun({ text: "" })] })],
    });
  };

  const customerState = data.customer.address.includes("Maharashtra")
    ? "Maharashtra"
    : data.customer.address.includes("Gujarat")
    ? "Gujarat"
    : data.customer.address.includes("Chhattisgarh")
    ? "Chhattisgarh"
    : data.customer.address.includes("Uttarakhand")
    ? "Uttarakhand"
    : "Uttar Pradesh";

  // Calculate amounts
  let serviceRows: TableRow[] = [];
  let totalAmountBeforeTax = 0;

  switch (invoiceType) {
    case "godown":
      serviceRows.push(
        new TableRow({
          children: [
            createCell(
              "Rental or Leasing services involving own or leased non - residential property",
              {
                bold: false,
                fontSize: 14,
                width: 6000,
              }
            ),
            createCell("997212", {
              bold: false,
              fontSize: 14,
              alignment: AlignmentType.CENTER,
              width: 1500,
            }),
            createCell(formatNumber((data.godownRent || 0) / 100), {
              bold: false,
              fontSize: 14,
              alignment: AlignmentType.CENTER,
              width: 1500,
            }),
            createCell("100.00", {
              bold: false,
              fontSize: 14,
              alignment: AlignmentType.RIGHT,
              width: 1500,
            }),
            createCell(formatNumber(data.godownRent), {
              bold: false,
              fontSize: 14,
              alignment: AlignmentType.RIGHT,
              width: 1500,
            }),
          ],
        })
      );
      totalAmountBeforeTax = data.godownRent;
      break;

    case "main":
      serviceRows.push(
        new TableRow({
          children: [
            createCell("Loading Charges", {
              bold: false,
              fontSize: 14,
              width: 6000,
            }),
            createCell("996519", {
              bold: false,
              fontSize: 14,
              alignment: AlignmentType.CENTER,
              width: 1500,
            }),
            createCell(formatNumber((data.loadingCharges || 0) / 75), {
              bold: false,
              fontSize: 14,
              alignment: AlignmentType.CENTER,
              width: 1500,
            }),
            createCell("75.00", {
              bold: false,
              fontSize: 14,
              alignment: AlignmentType.RIGHT,
              width: 1500,
            }),
            createCell(formatNumber(data.loadingCharges), {
              bold: false,
              fontSize: 14,
              alignment: AlignmentType.RIGHT,
              width: 1500,
            }),
          ],
        }),
        new TableRow({
          children: [
            createCell("Unloading Charges", {
              bold: false,
              fontSize: 14,
              width: 6000,
            }),
            createCell("996519", {
              bold: false,
              fontSize: 14,
              alignment: AlignmentType.CENTER,
              width: 1500,
            }),
            createCell(formatNumber((data.unloadingCharges || 0) / 75), {
              bold: false,
              fontSize: 14,
              alignment: AlignmentType.CENTER,
              width: 1500,
            }),
            createCell("75.00", {
              bold: false,
              fontSize: 14,
              alignment: AlignmentType.RIGHT,
              width: 1500,
            }),
            createCell(formatNumber(data.unloadingCharges), {
              bold: false,
              fontSize: 14,
              alignment: AlignmentType.RIGHT,
              width: 1500,
            }),
          ],
        }),
        new TableRow({
          children: [
            createCell("Local Transportation", {
              bold: false,
              fontSize: 14,
              width: 6000,
            }),
            createCell("996713", {
              bold: false,
              fontSize: 14,
              alignment: AlignmentType.CENTER,
              width: 1500,
            }),
            createCell(formatNumber((data.localTransportation || 0) / 200), {
              bold: false,
              fontSize: 14,
              alignment: AlignmentType.CENTER,
              width: 1500,
            }),
            createCell("200.00", {
              bold: false,
              fontSize: 14,
              alignment: AlignmentType.RIGHT,
              width: 1500,
            }),
            createCell(formatNumber(data.localTransportation), {
              bold: false,
              fontSize: 14,
              alignment: AlignmentType.RIGHT,
              width: 1500,
            }),
          ],
        })
      );
      totalAmountBeforeTax =
        data.loadingCharges + data.unloadingCharges + data.localTransportation;
      break;

    case "freight":
      serviceRows.push(
        new TableRow({
          children: [
            createCell("Secondary Freight", {
              bold: false,
              fontSize: 14,
              width: 6000,
            }),
            createCell("996511", {
              bold: false,
              fontSize: 14,
              alignment: AlignmentType.CENTER,
              width: 1500,
            }),
            createCell(formatNumber(data.freightBalance), {
              bold: false,
              fontSize: 14,
              alignment: AlignmentType.RIGHT,
              width: 3000,
              colSpan: 2,
            }),
          ],
        })
      );
      totalAmountBeforeTax = data.freightBalance;
      break;
  }

  // Calculate taxes
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

  if (isInterState) {
    igst = totalAmountBeforeTax * 0.18;
    totalAmount = totalAmountBeforeTax + igst;
  } else {
    cgst = totalAmountBeforeTax * 0.09;
    sgst = totalAmountBeforeTax * 0.09;
    totalAmount = totalAmountBeforeTax + cgst + sgst;
  }

  // Create tax rows
  const taxRows: TableRow[] = [];

  if (isInterState) {
    taxRows.push(
      new TableRow({
        children: [
          createCell("IGST @ 18%", {
            bold: true,
            fontSize: 14,
            width: 7500,
            colSpan: 4,
          }),
          createCell(formatNumber(igst), {
            bold: true,
            fontSize: 14,
            alignment: AlignmentType.RIGHT,
            width: 1500,
          }),
        ],
      })
    );
  } else {
    taxRows.push(
      new TableRow({
        children: [
          createCell("CGST @ 9%", {
            bold: true,
            fontSize: 14,
            width: 7500,
            colSpan: 4,
          }),
          createCell(formatNumber(cgst), {
            bold: true,
            fontSize: 14,
            alignment: AlignmentType.RIGHT,
            width: 1500,
          }),
        ],
      }),
      new TableRow({
        children: [
          createCell("SGST @ 9%", {
            bold: true,
            fontSize: 14,
            width: 7500,
            colSpan: 4,
          }),
          createCell(formatNumber(sgst), {
            bold: true,
            fontSize: 14,
            alignment: AlignmentType.RIGHT,
            width: 1500,
          }),
        ],
      })
    );
  }

  // Create main table
  const table = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    },
    rows: [
      // Header row
      new TableRow({
        children: [
          createCell("Service Description", {
            bold: true,
            fontSize: 14,
            width: 6000,
          }),
          createCell("HSN / SAC", {
            bold: true,
            fontSize: 14,
            alignment: AlignmentType.CENTER,
            width: 1500,
          }),
          ...(invoiceType === "freight"
            ? [
                createCell("Amount", {
                  bold: true,
                  fontSize: 14,
                  alignment: AlignmentType.CENTER,
                  width: 3000,
                  colSpan: 2,
                }),
              ]
            : [
                createCell("Qty", {
                  bold: true,
                  fontSize: 14,
                  alignment: AlignmentType.CENTER,
                  width: 1500,
                }),
                createCell("Rate", {
                  bold: true,
                  fontSize: 14,
                  alignment: AlignmentType.CENTER,
                  width: 1500,
                }),
                createCell("Amount", {
                  bold: true,
                  fontSize: 14,
                  alignment: AlignmentType.CENTER,
                  width: 1500,
                }),
              ]),
        ],
      }),
      // Service rows
      ...serviceRows,
      // Empty row for spacing
      new TableRow({
        height: { value: 200, rule: HeightRule.ATLEAST },
        children: [
          createEmptyCell(6000),
          createEmptyCell(1500),
          createEmptyCell(1500),
          createEmptyCell(1500),
          createEmptyCell(1500),
        ],
      }),
      // Tax rows
      ...taxRows,
      // Total row
      new TableRow({
        children: [
          createCell(`Rupees: ${convertNumberToIndianWords(totalAmount)}`, {
            bold: true,
            fontSize: 14,
            width: 7500,
            colSpan: 4,
          }),
          createCell("TOTAL", {
            bold: true,
            fontSize: 14,
            alignment: AlignmentType.CENTER,
            width: 1500,
          }),
          createCell(formatNumber(totalAmount), {
            bold: true,
            fontSize: 14,
            alignment: AlignmentType.RIGHT,
            width: 1500,
          }),
        ],
      }),
    ],
  });

  // Helper function to convert number to Indian words
  function convertNumberToIndianWords(amount: number): string {
    // Simplified version - you might want to use a more comprehensive library
    let rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);

    if (rupees === 0) return "Zero";

    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    let words = "";

    if (rupees >= 10000000) {
      words +=
        convertNumberToIndianWords(Math.floor(rupees / 10000000)) + " Crore ";
      rupees %= 10000000;
    }

    if (rupees >= 100000) {
      words +=
        convertNumberToIndianWords(Math.floor(rupees / 100000)) + " Lakh ";
      rupees %= 100000;
    }

    if (rupees >= 1000) {
      words +=
        convertNumberToIndianWords(Math.floor(rupees / 1000)) + " Thousand ";
      rupees %= 1000;
    }

    if (rupees >= 100) {
      words += ones[Math.floor(rupees / 100)] + " Hundred ";
      rupees %= 100;
    }

    if (rupees >= 20) {
      words += tens[Math.floor(rupees / 10)] + " ";
      rupees %= 10;
    }

    if (rupees >= 10) {
      words += teens[rupees - 10] + " ";
      rupees = 0;
    }

    if (rupees > 0) {
      words += ones[rupees] + " ";
    }

    return words.trim();
  }

  // Create document sections - Test without tables first
  const children = [
    // Simple test first
    new Paragraph({
      children: [
        new TextRun({
          text: `Test Document - ${data.customer.customerName}`,
          bold: true,
          font: "Arial",
          size: 18,
        }),
      ],
      spacing: { after: 200 },
    }),

    // Multiple paragraphs test
    new Paragraph({
      children: [
        new TextRun({
          text: `Customer: ${data.customer.customerName}`,
          font: "Arial",
          size: 14,
        }),
      ],
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: `SAP Code: ${data.sapCode}`,
          font: "Arial",
          size: 14,
        }),
      ],
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: `Total Value: ₹${data.totalValue.toLocaleString("en-IN")}`,
          font: "Arial",
          size: 14,
        }),
      ],
    }),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  try {
    console.log("📝 Creating document structure...");
    console.log("🔧 Document created, children:", children.length);

    // Try to identify potential issues
    console.log("🔍 Checking table structure...");
    const tables = children.filter((child) => child instanceof Table);
    console.log("📊 Found tables:", tables.length);

    console.log("📝 Attempting to create buffer...");
    const buffer = await Packer.toBuffer(doc);
    console.log("✅ Document created successfully, size:", buffer.length);
    return new Blob([new Uint8Array(buffer)], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  } catch (error) {
    console.error("❌ Error creating DOCX document:", error);
    console.error("❌ Error stack:", error.stack);
    console.error("❌ Error details:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });

    // Try to create a minimal document to test if the library works at all
    console.log("🧪 Testing with minimal document...");
    try {
      const minimalDoc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Test document" })],
              }),
            ],
          },
        ],
      });
      const minimalBuffer = await Packer.toBuffer(minimalDoc);
      console.log("✅ Minimal document works, size:", minimalBuffer.length);
    } catch (minimalError) {
      console.error("❌ Even minimal document fails:", minimalError);
    }

    throw error;
  }
};

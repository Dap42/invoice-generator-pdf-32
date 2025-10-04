import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableCell,
  TableRow,
  WidthType,
  AlignmentType,
  BorderStyle,
} from "docx";
import type { DOCXMergedInvoiceData } from "../types-docx/invoice-docx";

export const generateDebitNoteDOCX = async (
  data: DOCXMergedInvoiceData,
  invoiceType: "godown" | "main" | "freight",
  formatNumber: (amount: number) => string
): Promise<Blob> => {
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
            createCell("REIMBURSEMENT OF RENT EXPENSES", {
              bold: false,
              fontSize: 14,
              width: 8000,
            }),
            createCell(formatNumber(data.godownRent / 100), {
              bold: false,
              fontSize: 14,
              alignment: AlignmentType.CENTER,
              width: 2000,
            }),
            createCell("100.00", {
              bold: false,
              fontSize: 14,
              alignment: AlignmentType.CENTER,
              width: 2000,
            }),
            createCell(formatNumber(data.godownRent), {
              bold: false,
              fontSize: 14,
              alignment: AlignmentType.RIGHT,
              width: 2000,
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
            createCell(
              "REIMBURSEMENT OF LOADING, UNLOADING & LOCAL TRANSPORTATION",
              {
                bold: false,
                fontSize: 14,
                width: 8000,
              }
            ),
            createCell(
              formatNumber(
                (data.loadingCharges || 0) / 75 +
                  (data.unloadingCharges || 0) / 75 +
                  (data.localTransportation || 0) / 200
              ),
              {
                bold: false,
                fontSize: 14,
                alignment: AlignmentType.CENTER,
                width: 2000,
              }
            ),
            createCell("NA", {
              bold: false,
              fontSize: 14,
              alignment: AlignmentType.CENTER,
              width: 2000,
            }),
            createCell(
              formatNumber(
                data.loadingCharges +
                  data.unloadingCharges +
                  data.localTransportation
              ),
              {
                bold: false,
                fontSize: 14,
                alignment: AlignmentType.RIGHT,
                width: 2000,
              }
            ),
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
            createCell("REIMBURSEMENT OF FREIGHT EXPENSES", {
              bold: false,
              fontSize: 14,
              width: 8000,
            }),
            createCell("NA", {
              bold: false,
              fontSize: 14,
              alignment: AlignmentType.CENTER,
              width: 2000,
            }),
            createCell("NA", {
              bold: false,
              fontSize: 14,
              alignment: AlignmentType.CENTER,
              width: 2000,
            }),
            createCell(formatNumber(data.freightBalance), {
              bold: false,
              fontSize: 14,
              alignment: AlignmentType.RIGHT,
              width: 2000,
            }),
          ],
        })
      );
      totalAmountBeforeTax = data.freightBalance;
      break;
  }

  // Get Jubilant address based on customer state
  const jubilantLocations: {
    [key: string]: { address: string[]; gstin: string };
  } = {
    "Uttar Pradesh": {
      address: [
        "ADD:- NH-24, JUBILANT AGRI AND CONSUMER PRODUCTS LIMITED UNIT-I,",
        "BHARTIAGRAM, GAJRAULA, Amroha, Uttar Pradesh, 244223",
      ],
      gstin: "09AADCC4657M1Z7",
    },
    Bihar: {
      address: [
        "ADD:- Word No.61, Khata No.402, Birua Chak, Ranipur Khidki, Patna, Patna, Bihar, 800008",
      ],
      gstin: "10AADCC4657M1ZO",
    },
    Punjab: {
      address: [
        "ADD:- Ground, Khasra no 730,31,32,33,708,722,723, Vlogis Warehouse, Zirakpur Patiala Highway, Nabha, Mohali, SAS Nagar, Punjab, 140603",
      ],
      gstin: "03AADCC4657M1ZJ",
    },
    "Madhya Pradesh": {
      address: [
        "ADD:- Ground Floor, 29/3,, Talavali Chanda, Indore, Indore, Madhya Pradesh, 452010",
      ],
      gstin: "23AADCC4657M1ZH",
    },
    Haryana: {
      address: [
        "ADD:- 3rd, 142, Chimes 142, Sector 44 Road, Sector 44, Gurugram, Gurugram, Haryana, 122003",
      ],
      gstin: "06AADCC4657M1ZD",
    },
    Rajasthan: {
      address: [
        "ADD:- Ground Floor, 1233-1235,1243, Kapasan road, Village Singhpur, Tehsil Kapasan, Chittorgarh, Rajasthan, 312207",
      ],
      gstin: "08AADCC4657M1Z9",
    },
    Maharashtra: {
      address: [
        "ADD:- Ground Floor, 1233-1235,1243, Kapasan road, Village Singhpur, Tehsil Kapasan, Chittorgarh, Rajasthan, 312207",
      ],
      gstin: "08AADCC4657M1Z9",
    },
    Gujarat: {
      address: [
        "ADD:- Ground Floor, 1233-1235,1243, Kapasan road, Village Singhpur, Tehsil Kapasan, Chittorgarh, Rajasthan, 312207",
      ],
      gstin: "08AADCC4657M1Z9",
    },
    Chhattisgarh: {
      address: [
        "ADD:- Ground Floor, 1233-1235,1243, Kapasan road, Village Singhpur, Tehsil Kapasan, Chittorgarh, Rajasthan, 312207",
      ],
      gstin: "08AADCC4657M1Z9",
    },
    Uttarakhand: {
      address: [
        "ADD:- Ground Floor, 1233-1235,1243, Kapasan road, Village Singhpur, Tehsil Kapasan, Chittorgarh, Rajasthan, 312207",
      ],
      gstin: "08AADCC4657M1Z9",
    },
  };

  const jubilantInfo =
    jubilantLocations[customerState] || jubilantLocations["Uttar Pradesh"];

  // Create document sections
  const children = [
    // Customer Name (centered)
    new Paragraph({
      children: [
        new TextRun({
          text: data.customer.customerName,
          bold: true,
          font: "Arial",
          size: 22,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),

    // Customer Address (centered)
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `ADDRESS: ${data.customer.address}`,
          bold: true,
          font: "Arial",
          size: 16,
        }),
      ],
      spacing: { after: 200 },
    }),

    // GSTIN, PAN, MOB (centered)
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `GSTIN: ${data.customer.gstin}   PAN: ${data.customer.pan}${
            data.customer.mobile ? `   MOB: ${data.customer.mobile}` : ""
          }`,
          bold: true,
          font: "Arial",
          size: 16,
        }),
      ],
      spacing: { after: 400 },
    }),

    // To: Section
    new Paragraph({
      children: [
        new TextRun({
          text: "To:",
          bold: true,
          font: "Arial",
          size: 22,
        }),
      ],
      spacing: { after: 200 },
    }),

    // The Sales Head
    new Paragraph({
      children: [
        new TextRun({
          text: "The Sales Head",
          font: "Arial",
          size: 16,
        }),
      ],
      spacing: { after: 100 },
    }),

    // Company Name
    new Paragraph({
      children: [
        new TextRun({
          text: "JUBILANT AGRI AND CONSUMER PRODUCTS LIMITED",
          bold: true,
          font: "Arial",
          size: 18,
        }),
      ],
      spacing: { after: 200 },
    }),

    // Jubilant Address
    ...jubilantInfo.address.map(
      (line) =>
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              font: "Arial",
              size: 16,
            }),
          ],
          spacing: { after: 100 },
        })
    ),

    // Jubilant GSTIN
    new Paragraph({
      children: [
        new TextRun({
          text: `GSTIN : ${jubilantInfo.gstin}`,
          bold: true,
          font: "Arial",
          size: 16,
        }),
      ],
      spacing: { after: 300 },
    }),

    // Subject
    new Paragraph({
      children: [
        new TextRun({
          text:
            invoiceType === "godown"
              ? "Subject: Reimbursement of Rent Expenses"
              : invoiceType === "main"
              ? "Subject: Reimbursement of Handling Expenses."
              : "Subject: Reimbursement of Secondary Freight.",
          font: "Arial",
          size: 22,
        }),
      ],
      spacing: { after: 300 },
    }),

    // Dear Sir
    new Paragraph({
      children: [
        new TextRun({
          text: "Dear Sir",
          font: "Arial",
          size: 22,
        }),
      ],
      spacing: { after: 300 },
    }),

    // Introductory Text
    new Paragraph({
      children: [
        new TextRun({
          text:
            invoiceType === "godown"
              ? "Requested to kindly reimburse the Godown Rent Expenses as per details given as under:"
              : invoiceType === "main"
              ? "Requested to kindly reimburse the Handling Expenses as per details given as under:"
              : "Requested to kindly reimburse the Secondary Freight Expenses as per details given as below:",
          font: "Arial",
          size: 16,
        }),
      ],
      spacing: { after: 300 },
    }),

    // Data Table
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        insideHorizontal: {
          style: BorderStyle.SINGLE,
          size: 1,
          color: "000000",
        },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      },
      rows: [
        // Header row
        new TableRow({
          children: [
            createCell("Particulars", {
              bold: true,
              fontSize: 20,
              width: 8000,
            }),
            createCell("Qty in MT", {
              bold: true,
              fontSize: 20,
              alignment: AlignmentType.CENTER,
              width: 2000,
            }),
            createCell("Rate/MT", {
              bold: true,
              fontSize: 20,
              alignment: AlignmentType.CENTER,
              width: 2000,
            }),
            createCell("Amt. In Ru.", {
              bold: true,
              fontSize: 20,
              alignment: AlignmentType.CENTER,
              width: 2000,
            }),
          ],
        }),
        // Service rows
        ...serviceRows,
        // Total row
        new TableRow({
          children: [
            createCell("Total", {
              bold: true,
              fontSize: 20,
              width: 8000,
            }),
            createEmptyCell(2000),
            createEmptyCell(2000),
            createCell(formatNumber(totalAmountBeforeTax), {
              bold: true,
              fontSize: 20,
              alignment: AlignmentType.RIGHT,
              width: 2000,
            }),
          ],
        }),
      ],
    }),

    new Paragraph({ children: [new TextRun({ text: "" })] }), // Spacing

    // Footer Section
    new Paragraph({
      children: [
        new TextRun({
          text: "Thanking You",
          font: "Arial",
          size: 20,
        }),
      ],
      spacing: { after: 200 },
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: "Yours Faithfully",
          font: "Arial",
          size: 20,
        }),
      ],
      spacing: { after: 200 },
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: "Authorised Signatory",
          font: "Arial",
          size: 20,
        }),
      ],
      spacing: { after: 400 },
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

  const buffer = await Packer.toBuffer(doc);
  return new Blob([new Uint8Array(buffer)], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
};

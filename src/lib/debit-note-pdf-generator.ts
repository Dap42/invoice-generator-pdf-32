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
  const yOffset = 25; // Increased offset to move content down for more top margin

  const customerState = extractStateFromAddress(data.customer.address);

  let currentYPosition = yOffset; // Initialize currentYPosition for consistent tracking

  // Receiver Details (Customer) - Centered for all types
  doc.setFontSize(11); // Increased font size
  doc.setFont(undefined, "bold");
  doc.text(data.customer.customerName, pageWidth / 2, currentYPosition, {
    align: "center",
  });
  currentYPosition += 10; // Increased spacing between customer name and address

  doc.setFont(undefined, "bold"); // Set font to bold for address
  const customerAddressLines = doc.splitTextToSize(data.customer.address, 150); // Increased width for centering
  const addressWithLabel = ["ADDRESS:", ...customerAddressLines]; // Add "ADDRESS:" label

  addressWithLabel.forEach((line) => {
    doc.text(line, pageWidth / 2, currentYPosition, {
      align: "center",
    });
    currentYPosition += 4.5; // Increased spacing for each line
  });
  // currentYPosition += customerAddressLines.length * 4.5; // This line is no longer needed as spacing is handled in the loop

  // GSTIN, PAN, MOB - Centered and condensed
  doc.setFont(undefined, "bold");
  const gstinPanMobText = `GSTIN: ${data.customer.gstin}   PAN: ${
    data.customer.pan
  }   MOB: ${data.customer.mobile || "N/A"}`;
  doc.text(gstinPanMobText, pageWidth / 2, currentYPosition + 2, {
    align: "center",
  });
  currentYPosition += 15; // Increased spacing between customer details and "To:"

  // To: Section (Sender Details - Jubilant) - Left Aligned for all types
  doc.setFontSize(11); // Increased font size
  doc.setFont(undefined, "bold");
  doc.text("To:", 20, currentYPosition);
  currentYPosition += 7; // Increased spacing

  // Dynamically determine Jubilant address based on customer state
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
    jubilantLocations[customerState] || jubilantLocations["Uttar Pradesh"]; // Fallback to UP

  doc.setFont(undefined, "normal");
  doc.text("The Sales Head", 20, currentYPosition);
  currentYPosition += 5;
  doc.text("JUBILANT AGRI AND CONSUMER PRODUCTS LIMITED", 20, currentYPosition);
  currentYPosition += 5;
  jubilantInfo.address.forEach((line) => {
    doc.text(line, 20, currentYPosition);
    currentYPosition += 4.5; // Adjusted spacing
  });
  doc.setFont(undefined, "bold"); // Make GSTIN bold
  doc.text(`GSTIN : ${jubilantInfo.gstin}`, 20, currentYPosition);
  currentYPosition += 7; // Adjusted spacing

  // Subject
  doc.setFontSize(11); // Increased font size
  doc.setFont(undefined, "normal");
  let subjectText = "";
  if (invoiceType === "godown") {
    subjectText = "Subject: Reimbursement of Rent Expenses";
  } else if (invoiceType === "main") {
    subjectText = "Subject: Reimbursement of Handling Expenses.";
  } else if (invoiceType === "freight") {
    subjectText = "Subject: Reimbursement of Secondary Freight.";
  }
  doc.text(subjectText, 20, currentYPosition + 7); // Increased spacing
  currentYPosition += 16; // Increased spacing

  // Dear Sir
  doc.setFontSize(11); // Increased font size
  doc.setFont(undefined, "normal");
  doc.text("Dear Sir", 20, currentYPosition);
  currentYPosition += 12; // Increased spacing

  // Introductory Text
  let introductoryText = "";
  if (invoiceType === "godown") {
    introductoryText =
      "Requested to kindly reimburse the Godown Rent Expenses as per details given as under:";
  } else if (invoiceType === "main") {
    introductoryText =
      "Requested to kindly reimburse me the Handling Expenses as per details given as under:";
  } else if (invoiceType === "freight") {
    introductoryText =
      "Requested to kindly reimburse me the Secondary Freight Expenses as per details given as below:";
  }
  doc.text(introductoryText, 20, currentYPosition);
  currentYPosition += 12; // Increased spacing

  let serviceRows: any[] = [];
  let totalAmountBeforeTax = 0;

  switch (invoiceType) {
    case "godown":
      serviceRows.push([
        "REIMBURSEMENT OF RENT EXPENSES", // Particulars
        formatNumber(data.godownRent / 100), // Qty in MT (dynamic)
        formatNumber(100), // Rate/MT (dynamic)
        formatNumber(data.godownRent), // Amt. In Ru. (dynamic)
      ]);
      totalAmountBeforeTax = data.godownRent;
      break;
    case "main":
      const mainParticularsText =
        "REIMBURSEMENT OF LOADING, UNLOADING & local Transportation";
      const wrappedMainParticulars = doc.splitTextToSize(
        mainParticularsText,
        85
      ); // Wrap text to 85 units width

      // Push the first line with all data
      serviceRows.push([
        wrappedMainParticulars[0], // First line of particulars
        formatNumber(
          data.loadingCharges / 75 +
            data.unloadingCharges / 75 +
            data.localTransportation / 200
        ), // Calculated Quantity
        "NA", // Rate from Excel header
        formatNumber(
          data.loadingCharges + data.unloadingCharges + data.localTransportation
        ), // Amount
      ]);

      // Push subsequent lines of particulars without other data
      for (let i = 1; i < wrappedMainParticulars.length; i++) {
        serviceRows.push([wrappedMainParticulars[i], "", "", ""]); // Empty strings for other columns
      }

      totalAmountBeforeTax =
        data.loadingCharges + data.unloadingCharges + data.localTransportation;
      break;
    case "freight":
      serviceRows.push([
        "REIMBURSEMENT OF FREIGHT EXPENSES", // Particulars
        formatNumber(data.freightBalance / 1000), // Qty in MT (dynamic)
        "NA", // Rate from Excel header
        formatNumber(data.freightBalance), // This is now the Amount column
      ]);
      totalAmountBeforeTax = data.freightBalance;
      break;
  }

  let totalAmount = totalAmountBeforeTax;

  // Manual positioning of data
  currentYPosition += 8; // Increased space before data section

  doc.setFontSize(10); // Increased font size for data section
  doc.setFont(undefined, "bold");

  // Headers
  doc.text("Particulars", 20, currentYPosition);
  // Reverting freight specific columns to match other types
  doc.text("Qty in MT", 110, currentYPosition, { align: "center" });
  doc.text("Rate/MT", 140, currentYPosition, { align: "center" });
  doc.text("Amt. In Ru.", 180, currentYPosition, { align: "right" });
  currentYPosition += 6; // Increased spacing

  doc.setFont(undefined, "normal");

  // Service Rows
  serviceRows.forEach((row) => {
    doc.text(row[0], 20, currentYPosition); // Always print particulars

    // Only print other columns if they are not empty (i.e., it's the first line of a wrapped item)
    if (row[1] !== "") {
      if (invoiceType === "freight") {
        doc.text(row[1], 110, currentYPosition, { align: "center" }); // Qty in MT
        doc.text("NA", 140, currentYPosition, { align: "center" }); // Rate/MT
        doc.text(row[3], 180, currentYPosition, { align: "right" }); // Amt. In Ru. (Corrected index from row[2] to row[3])
      } else {
        doc.text(row[1], 110, currentYPosition, { align: "center" });
        doc.text(row[2], 140, currentYPosition, { align: "center" });
        doc.text(row[3], 180, currentYPosition, { align: "right" });
      }
    }
    currentYPosition += 6; // Increased spacing
  });

  // Total Row
  currentYPosition += 4; // Increased gap before total
  doc.setFont(undefined, "bold");
  doc.text("Total", 20, currentYPosition);
  doc.text(formatNumber(totalAmount), 180, currentYPosition, {
    align: "right",
  });
  currentYPosition += 6; // Increased spacing

  // Footer Section
  const finalY = currentYPosition + 10; // Increased space before footer
  doc.setFontSize(10); // Increased font size for footer
  doc.setFont(undefined, "normal");
  doc.text("Thanking You", 20, finalY);
  doc.text("Yours Faithfully", 20, finalY + 6); // Increased spacing
  doc.text("Authorised Signatory", 20, finalY + 18); // Increased spacing

  return doc.output("blob");
};

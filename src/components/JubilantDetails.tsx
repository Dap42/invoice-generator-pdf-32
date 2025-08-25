import jsPDF from "jspdf";
import type { CustomerData } from "@/types/invoice";
import { extractStateFromAddress } from "@/lib/utils"; // Import the shared utility

interface JubilantDetailsProps {
  doc: jsPDF;
  customerAddress: string;
  startY: number;
}

export const JubilantDetails = ({
  doc,
  customerAddress,
  startY,
}: JubilantDetailsProps) => {
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

  const customerState = extractStateFromAddress(customerAddress);

  const jubilantInfo =
    jubilantLocations[customerState] || jubilantLocations["Uttar Pradesh"]; // Fallback to UP

  doc.setFont(undefined, "bold");
  doc.text("To :", 20, startY);
  doc.setFontSize(7);
  doc.text("JUBILANT AGRI AND CONSUMER PRODUCTS LIMITED", 20, startY + 5);
  doc.setFont(undefined, "normal");
  let currentY = startY + 10;
  jubilantInfo.address.forEach((line, index) => {
    doc.text(line, 20, currentY + index * 4);
  });
  doc.setFont(undefined, "bold"); // Make GSTIN bold
  doc.text(
    `GSTIN : ${jubilantInfo.gstin}`,
    20,
    currentY + jubilantInfo.address.length * 4
  );
  doc.setFont(undefined, "normal"); // Reset font style
  return currentY + jubilantInfo.address.length * 4; // Return the final Y position
};

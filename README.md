# 🚀 SmartInvoice Generator

A powerful web application that transforms Excel data into professional PDF invoices automatically. Built for businesses that need to generate multiple invoice types from spreadsheet data efficiently.

![SmartInvoice Generator Demo](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=SmartInvoice+Generator)

## ✨ Features

### 📊 Excel Data Processing

- **Dual File Upload**: Upload Customer Master and Invoice data Excel files
- **Intelligent Data Merging**: Automatically matches customers with invoice data
- **Real-time Preview**: See merged data before generating invoices
- **Error Handling**: Robust validation and error reporting

### 🧾 Invoice Generation

- **Multiple Invoice Types**:
  - Tax Invoices (for customer billing)
  - Debit Notes (for adjustments/credits)
- **Three Service Categories**:
  - Godown Rent invoices
  - Main Services (loading, unloading, local transportation)
  - Secondary Freight invoices
- **Professional PDF Output**: High-quality, branded invoice documents

### 🎨 User Experience

- **Step-by-Step Workflow**: Guided 3-step process (Upload → Preview → Generate)
- **Progress Indicators**: Real-time progress tracking during generation
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Toast Notifications**: User-friendly feedback for all actions

### 🛠️ Technical Features

- **TypeScript**: Full type safety and better development experience
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Form Validation**: React Hook Form with Zod schema validation
- **State Management**: React hooks for efficient state handling

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Dap42/invoice-generator-pdf-32.git
   cd invoice-generator-pdf-32
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to see the application

### Building for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

## 📋 How to Use

### Step 1: Upload Excel Files

1. Prepare two Excel files:

   - **Customer Master.xlsx**: Contains customer details (SAP code, name, GSTIN, PAN, address)
   - **Cases.xlsx**: Contains invoice data (amounts, quantities, taxes, freight)

2. Upload both files using the file upload interface

### Step 2: Preview Merged Data

- Review the automatically merged customer and invoice data
- Verify all information is correct before proceeding
- Check for any missing or mismatched data

### Step 3: Generate Invoices

Choose from three generation options:

- **Generate Tax Invoices**: Create customer billing documents
- **Generate Debit Notes**: Create adjustment/credit documents
- **Generate All Documents**: Create both types for complete documentation

### Step 4: Download PDFs

- Download individual invoices or all at once
- Files are automatically named with customer details and invoice types

## 🏗️ Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui components
│   ├── file-upload/     # Excel parsing components
│   └── *                # Feature-specific components
├── lib/                 # Utility functions and generators
│   ├── invoice-pdf-generator.ts    # Tax invoice PDF creation
│   ├── debit-note-pdf-generator.ts # Debit note PDF creation
│   └── excel-data-processor.ts     # Excel file processing
├── pages/               # Route components
├── types/               # TypeScript type definitions
└── hooks/               # Custom React hooks
```

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui (Radix UI + Tailwind CSS)
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **PDF Generation**: jsPDF + jspdf-autotable
- **Excel Processing**: ExcelJS + xlsx
- **Icons**: Lucide React
- **Routing**: React Router DOM

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Add any environment-specific configurations here
VITE_API_URL=your_api_url_here
```

### Customization

- **Invoice Templates**: Modify PDF generators in `src/lib/`
- **UI Styling**: Customize components in `src/components/`
- **Data Processing**: Update parsers in `src/components/file-upload/`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)
- PDF generation powered by [jsPDF](https://jspdf.kitchen/)
- Excel processing with [ExcelJS](https://github.com/exceljs/exceljs)

## 📞 Support

For support, email [your-email@example.com] or create an issue in the repository.

---

**Made with ❤️ for businesses that need efficient invoice generation**

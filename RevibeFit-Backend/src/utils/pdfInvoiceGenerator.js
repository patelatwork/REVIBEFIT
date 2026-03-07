import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const PdfPrinter = require("pdfmake/js/Printer").default;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// pdfmake font definitions (use built-in Roboto)
const fonts = {
  Roboto: {
    normal: path.join(__dirname, "../../node_modules/pdfmake/build/vfs_fonts.js")
      ? "Helvetica"
      : "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
};

// Use standard fonts that pdfmake supports out of the box
const printer = new PdfPrinter({
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
});

const formatCurrency = (amount) => {
  return `₹${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Generate a GST-compliant B2B tax invoice PDF.
 *
 * @param {Object} invoice - PlatformInvoice document
 * @param {Object} labPartner - Lab partner User document
 * @returns {Promise<string>} Path to the generated PDF file
 */
export const generateInvoicePdf = async (invoice, labPartner) => {
  return new Promise(async (resolve, reject) => {
    const invoicesDir = path.join(__dirname, "../../public/invoices");
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }

    const fileName = `${invoice.invoiceNumber.replace(/\//g, "-")}.pdf`;
    const filePath = path.join(invoicesDir, fileName);

    const gst = invoice.gstDetails || {};
    const isIntraState = gst.taxType === "intra_state";
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    const billingPeriodStr = `${months[invoice.billingPeriod.month - 1]} ${invoice.billingPeriod.year}`;

    // Build commission breakdown table rows
    const breakdownRows = [
      [
        { text: "#", style: "tableHeader" },
        { text: "Date", style: "tableHeader" },
        { text: "Customer", style: "tableHeader" },
        { text: "Tests", style: "tableHeader" },
        { text: "Booking Amt", style: "tableHeader", alignment: "right" },
        { text: "Commission", style: "tableHeader", alignment: "right" },
        { text: "GST", style: "tableHeader", alignment: "right" },
        { text: "Net Settled", style: "tableHeader", alignment: "right" },
      ],
    ];

    (invoice.commissionBreakdown || []).forEach((item, idx) => {
      breakdownRows.push([
        { text: String(idx + 1), alignment: "center" },
        { text: formatDate(item.bookingDate) },
        { text: item.fitnessEnthusiastName || "-" },
        { text: (item.testNames || []).join(", ") || "-" },
        { text: formatCurrency(item.totalAmount), alignment: "right" },
        { text: formatCurrency(item.commissionAmount), alignment: "right" },
        { text: formatCurrency(item.gstAmount), alignment: "right" },
        { text: formatCurrency(item.netSettlement), alignment: "right" },
      ]);
    });

    // Tax summary rows
    const taxSummaryRows = [
      [
        { text: "Description", style: "tableHeader" },
        { text: "Rate", style: "tableHeader", alignment: "right" },
        { text: "Amount", style: "tableHeader", alignment: "right" },
      ],
      [
        "Taxable Value (Commission)",
        "",
        { text: formatCurrency(gst.taxableValue), alignment: "right" },
      ],
    ];

    if (isIntraState) {
      taxSummaryRows.push(
        [
          "CGST",
          { text: `${gst.cgstRate}%`, alignment: "right" },
          { text: formatCurrency(gst.cgstAmount), alignment: "right" },
        ],
        [
          "SGST",
          { text: `${gst.sgstRate}%`, alignment: "right" },
          { text: formatCurrency(gst.sgstAmount), alignment: "right" },
        ]
      );
    } else {
      taxSummaryRows.push([
        "IGST",
        { text: `${gst.igstRate}%`, alignment: "right" },
        { text: formatCurrency(gst.igstAmount), alignment: "right" },
      ]);
    }

    taxSummaryRows.push([
      { text: "Total Tax", bold: true },
      "",
      { text: formatCurrency(gst.totalTaxAmount), alignment: "right", bold: true },
    ]);

    const docDefinition = {
      defaultStyle: { font: "Helvetica", fontSize: 9 },
      pageSize: "A4",
      pageMargins: [40, 40, 40, 60],

      content: [
        // Header
        {
          columns: [
            {
              width: "*",
              stack: [
                { text: "RevibeFit", style: "companyName" },
                { text: "TAX INVOICE", style: "invoiceTitle" },
              ],
            },
            {
              width: "auto",
              alignment: "right",
              stack: [
                { text: `Invoice No: ${invoice.invoiceNumber}`, bold: true },
                { text: `Date: ${formatDate(invoice.generatedDate)}` },
                { text: `Due Date: ${formatDate(invoice.dueDate)}` },
                { text: `Billing Period: ${billingPeriodStr}` },
              ],
            },
          ],
          margin: [0, 0, 0, 15],
        },

        // Divider
        { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }], margin: [0, 0, 0, 15] },

        // From / To
        {
          columns: [
            {
              width: "50%",
              stack: [
                { text: "From:", style: "sectionLabel" },
                { text: "RevibeFit Platform", bold: true },
                { text: `GSTIN: ${gst.platformGstin || "N/A"}` },
                { text: `SAC Code: ${gst.sacCode || "999316"}` },
              ],
            },
            {
              width: "50%",
              stack: [
                { text: "Bill To:", style: "sectionLabel" },
                { text: labPartner.laboratoryName || labPartner.name, bold: true },
                { text: labPartner.laboratoryAddress || "" },
                { text: `GSTIN: ${gst.labPartnerGstin || "N/A"}` },
                { text: `Place of Supply: ${gst.placeOfSupply || "N/A"}` },
              ],
            },
          ],
          margin: [0, 0, 0, 20],
        },

        // Summary
        {
          style: "summaryTable",
          table: {
            widths: ["*", "*", "*", "*"],
            body: [
              [
                { text: "Total Bookings", style: "summaryLabel" },
                { text: "Total Booking Value", style: "summaryLabel" },
                { text: "Commission Rate", style: "summaryLabel" },
                { text: "Total Commission", style: "summaryLabel" },
              ],
              [
                { text: String(invoice.numberOfBookings), alignment: "center", bold: true },
                { text: formatCurrency(invoice.totalBookingValue), alignment: "center", bold: true },
                { text: `${invoice.commissionRate}%`, alignment: "center", bold: true },
                { text: formatCurrency(invoice.totalCommission), alignment: "center", bold: true },
              ],
            ],
          },
          layout: "lightHorizontalLines",
          margin: [0, 0, 0, 15],
        },

        // Commission Breakdown
        { text: "Commission Breakdown", style: "sectionTitle" },
        {
          table: {
            headerRows: 1,
            widths: [20, 55, 70, "*", 60, 55, 40, 60],
            body: breakdownRows,
          },
          layout: {
            hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.5),
            vLineWidth: () => 0,
            hLineColor: (i) => (i <= 1 ? "#333" : "#ccc"),
            paddingTop: () => 4,
            paddingBottom: () => 4,
          },
          margin: [0, 0, 0, 15],
        },

        // Tax Summary
        { text: "Tax Summary", style: "sectionTitle" },
        {
          table: {
            headerRows: 1,
            widths: ["*", 60, 100],
            body: taxSummaryRows,
          },
          layout: "lightHorizontalLines",
          margin: [0, 0, 0, 15],
        },

        // Grand Total
        {
          columns: [
            { width: "*", text: "" },
            {
              width: "auto",
              table: {
                widths: [150, 100],
                body: [
                  [
                    { text: "Total Booking Value", alignment: "right" },
                    { text: formatCurrency(invoice.totalBookingValue), alignment: "right" },
                  ],
                  [
                    { text: "Commission Deducted", alignment: "right" },
                    { text: formatCurrency(invoice.totalCommission), alignment: "right" },
                  ],
                  [
                    { text: `GST on Commission (${isIntraState ? "CGST+SGST" : "IGST"})`, alignment: "right" },
                    { text: formatCurrency(gst.totalTaxAmount), alignment: "right" },
                  ],
                  [
                    { text: "Total Deductions", alignment: "right", bold: true },
                    { text: formatCurrency(gst.totalInvoiceAmount), alignment: "right", bold: true },
                  ],
                  [
                    { text: "Net Settled to Lab", alignment: "right", bold: true, fontSize: 11 },
                    {
                      text: formatCurrency(invoice.totalSettlementAmount),
                      alignment: "right",
                      bold: true,
                      fontSize: 11,
                    },
                  ],
                ],
              },
              layout: {
                hLineWidth: (i, node) => (i === node.table.body.length - 1 || i === node.table.body.length ? 1.5 : 0.5),
                vLineWidth: () => 0,
                hLineColor: (i, node) => (i >= node.table.body.length - 1 ? "#333" : "#ccc"),
              },
            },
          ],
          margin: [0, 0, 0, 20],
        },

        // Footer note
        {
          text: "This is a computer-generated invoice and does not require a signature.",
          style: "footerNote",
        },
        {
          text: `Payment terms: Due by ${formatDate(invoice.dueDate)}. Grace period until ${formatDate(invoice.gracePeriodEnd)}.`,
          style: "footerNote",
          margin: [0, 5, 0, 0],
        },
      ],

      styles: {
        companyName: { fontSize: 18, bold: true, color: "#2563eb" },
        invoiceTitle: { fontSize: 12, color: "#666", margin: [0, 3, 0, 0] },
        sectionLabel: { fontSize: 8, color: "#666", margin: [0, 0, 0, 3] },
        sectionTitle: { fontSize: 11, bold: true, margin: [0, 5, 0, 8] },
        tableHeader: { bold: true, fontSize: 8, fillColor: "#f3f4f6" },
        summaryLabel: { fontSize: 8, color: "#666", alignment: "center" },
        footerNote: { fontSize: 7, color: "#999", italics: true },
      },
    };

    const pdfDoc = await printer.createPdfKitDocument(docDefinition);
    const writeStream = fs.createWriteStream(filePath);

    pdfDoc.pipe(writeStream);
    pdfDoc.end();

    writeStream.on("finish", () => {
      resolve(`/invoices/${fileName}`);
    });

    writeStream.on("error", (error) => {
      reject(error);
    });
  });
};

export default { generateInvoicePdf };

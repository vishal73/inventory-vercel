import api from "./services/api";
import logger from "./Logger";
import { skaiLogo } from "./assets/skaiLogo";

/**
 * Save invoice to database through API
 * @param {Object} invoice - Invoice data to save
 * @returns {Promise<Object>} Saved invoice data
 */
export async function saveInvoiceToDatabase(invoice) {
  logger.info("Saving invoice to database", {
    items: invoice.items.length,
    userId: invoice.userId,
  });

  try {
    const invoiceData = {
      ...invoice,
      products: invoice.items.map((item) => ({
        productId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.price * item.quantity,
      })),
      totalAmount: invoice.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),
      totalQuantity: invoice.items.reduce(
        (total, item) => total + item.quantity,
        0
      ),
      status: "created",
      paymentStatus: "pending",
      createdBy: invoice.userId || "system",
    };

    const savedInvoice = await api.post("/invoices", invoiceData);
    logger.info("Invoice saved successfully", {
      invoiceId: savedInvoice.id,
      amount: savedInvoice.totalAmount,
    });

    return savedInvoice;
  } catch (error) {
    logger.error("Error saving invoice", {
      error: error.message,
      stack: error.stack,
      invoiceData: invoice,
    });
    throw error;
  }
}

/**
 * Update invoice status
 * @param {string} invoiceId - Invoice ID
 * @param {string} status - New status
 * @param {string} userId - User making the update
 * @returns {Promise<Object>} Updated invoice data
 */
export async function updateInvoiceStatus(
  invoiceId,
  status,
  userId = "system"
) {
  logger.info("Updating invoice status", {
    invoiceId,
    status,
    userId,
  });

  try {
    const updatedInvoice = await api.put(`/invoices/${invoiceId}`, {
      status,
      updatedBy: userId,
    });

    logger.info("Invoice status updated successfully", {
      invoiceId,
      status: updatedInvoice.status,
    });

    return updatedInvoice;
  } catch (error) {
    logger.error("Error updating invoice status", {
      error: error.message,
      invoiceId,
      status,
    });
    throw error;
  }
}

/**
 * Update invoice payment status
 * @param {string} invoiceId - Invoice ID
 * @param {string} paymentStatus - New payment status
 * @param {string} userId - User making the update
 * @returns {Promise<Object>} Updated invoice data
 */
export async function updatePaymentStatus(
  invoiceId,
  paymentStatus,
  userId = "system"
) {
  logger.info("Updating invoice payment status", {
    invoiceId,
    paymentStatus,
    userId,
  });

  try {
    const updatedInvoice = await api.put(`/invoices/${invoiceId}`, {
      paymentStatus,
      updatedBy: userId,
    });

    logger.info("Invoice payment status updated successfully", {
      invoiceId,
      paymentStatus: updatedInvoice.paymentStatus,
    });

    return updatedInvoice;
  } catch (error) {
    logger.error("Error updating invoice payment status", {
      error: error.message,
      invoiceId,
      paymentStatus,
    });
    throw error;
  }
}

/**
 * Print invoice
 * @param {string} invoiceId - Invoice ID to print
 * @returns {Promise<Object>} Invoice data and print status
 */
export async function printInvoice(invoiceId) {
  logger.info("Preparing invoice for printing", { invoiceId });

  try {
    // Get invoice data
    const invoice = await api.get(`/invoices/${invoiceId}`);

    // Generate HTML content
    const htmlContent = await generateInvoiceHTML(invoice);

    // Update invoice status to printed
    await updateInvoiceStatus(invoiceId, "printed");

    logger.info("Invoice printed successfully", { invoiceId });

    return {
      invoice,
      printContent: htmlContent,
      status: "success",
    };
  } catch (error) {
    logger.error("Error printing invoice", {
      error: error.message,
      invoiceId,
    });
    throw error;
  }
}

/**
 * Void an invoice
 * @param {string} invoiceId - Invoice ID to void
 * @param {string} reason - Reason for voiding
 * @param {string} userId - User making the void
 * @returns {Promise<Object>} Voided invoice data
 */
export async function voidInvoice(invoiceId, reason, userId = "system") {
  logger.info("Voiding invoice", {
    invoiceId,
    reason,
    userId,
  });

  try {
    const updatedInvoice = await api.put(`/invoices/${invoiceId}`, {
      status: "voided",
      voidReason: reason,
      voidedAt: new Date().toISOString(),
      voidedBy: userId,
      updatedBy: userId,
    });

    logger.info("Invoice voided successfully", {
      invoiceId,
      reason,
      voidedBy: userId,
    });

    return updatedInvoice;
  } catch (error) {
    logger.error("Error voiding invoice", {
      error: error.message,
      invoiceId,
      reason,
    });
    throw error;
  }
}

/**
 * Generate HTML content for invoice
 * @param {Object} invoice - Invoice data
 * @param {Object} buyerDetails - Optional buyer details
 * @returns {string} HTML content
 */
export const generateInvoiceHTML = (invoice, buyerDetails = {}) => {
  logger.debug("Generating invoice HTML", {
    invoiceId: invoice.id,
    hasBuyerDetails: !!buyerDetails,
  });

  try {
    return `
      <div class="invoice-container">
        <div class="header">
          <img src="${skaiLogo}" alt="SKAI Accessories" style="height: 60px;" />
          <div class="company-details">
            <h1>SKAI Accessories</h1>
            <p>Invoice #: ${invoice.id}</p>
            <p>Date: ${new Date(invoice.createdAt).toLocaleDateString()}</p>
            ${
              buyerDetails.name
                ? `
              <div class="buyer-details">
                <h2>Bill To:</h2>
                <p>${buyerDetails.name}</p>
                <p>${buyerDetails.address || ""}</p>
                <p>${buyerDetails.email || ""}</p>
                <p>${buyerDetails.phone || ""}</p>
              </div>
            `
                : ""
            }
          </div>
        </div>
        <div class="invoice-items">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.products
                .map(
                  (item) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.price.toFixed(2)}</td>
                  <td>$${item.totalPrice.toFixed(2)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3">Total</td>
                <td>$${invoice.totalAmount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Payment Status: ${invoice.paymentStatus}</p>
          ${
            invoice.status === "voided"
              ? `
            <div class="void-stamp">VOID</div>
            <p>Void Reason: ${invoice.voidReason}</p>
          `
              : ""
          }
        </div>
      </div>
    `;
  } catch (error) {
    logger.error("Error generating invoice HTML", {
      error: error.message,
      invoiceId: invoice.id,
    });
    throw error;
  }
};

/**
 * Get invoice analytics
 * @param {string} invoiceId - Invoice ID
 * @returns {Promise<Object>} Invoice analytics data
 */
export async function getInvoiceAnalytics(invoiceId) {
  logger.info("Fetching invoice analytics", { invoiceId });

  try {
    const analytics = await api.get(`/analytics/invoices/${invoiceId}`);

    logger.info("Invoice analytics retrieved successfully", {
      invoiceId,
      metrics: Object.keys(analytics),
    });

    return analytics;
  } catch (error) {
    logger.error("Error fetching invoice analytics", {
      error: error.message,
      invoiceId,
    });
    throw error;
  }
}

export default {
  saveInvoiceToDatabase,
  updateInvoiceStatus,
  updatePaymentStatus,
  printInvoice,
  voidInvoice,
  generateInvoiceHTML,
  getInvoiceAnalytics,
};

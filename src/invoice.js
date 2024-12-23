import Logger from "./Logger";
const { addInvoice, updateInvoice, getInvoice } = require("./database");

const logger = Logger;
export async function saveInvoiceToDatabase(invoice) {
  try {
    // Create a new invoice object with required fields
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

    const savedInvoice = await addInvoice(invoiceData);
    logger.info(`Invoice saved successfully: ${savedInvoice.id}`);
    return savedInvoice;
  } catch (error) {
    logger.error(`Error saving invoice: ${error.message}`);
    throw error;
  }
}

export async function updateInvoiceStatus(
  invoiceId,
  status,
  userId = "system"
) {
  try {
    const updatedInvoice = await updateInvoice(invoiceId, { status }, userId);
    logger.info(`Invoice status updated: ${invoiceId} -> ${status}`);
    return updatedInvoice;
  } catch (error) {
    logger.error(`Error updating invoice status: ${error.message}`);
    throw error;
  }
}

export async function updatePaymentStatus(
  invoiceId,
  paymentStatus,
  userId = "system"
) {
  try {
    const updatedInvoice = await updateInvoice(
      invoiceId,
      { paymentStatus },
      userId
    );
    logger.info(
      `Invoice payment status updated: ${invoiceId} -> ${paymentStatus}`
    );
    return updatedInvoice;
  } catch (error) {
    logger.error(`Error updating invoice payment status: ${error.message}`);
    throw error;
  }
}

export async function printInvoice(invoiceId) {
  try {
    const invoice = await getInvoice(invoiceId);
    logger.info(`Preparing invoice for printing: ${invoiceId}`);

    // Here you would implement your printing logic
    // For example, generating a PDF or sending to a printer service

    await updateInvoiceStatus(invoiceId, "printed");
    logger.info(`Invoice printed successfully: ${invoiceId}`);

    return invoice;
  } catch (error) {
    logger.error(`Error printing invoice: ${error.message}`);
    throw error;
  }
}

export async function voidInvoice(invoiceId, reason, userId = "system") {
  try {
    const updatedInvoice = await updateInvoice(
      invoiceId,
      {
        status: "voided",
        voidReason: reason,
        voidedAt: new Date().toISOString(),
        voidedBy: userId,
      },
      userId
    );
    logger.info(`Invoice voided: ${invoiceId}, Reason: ${reason}`);
    return updatedInvoice;
  } catch (error) {
    logger.error(`Error voiding invoice: ${error.message}`);
    throw error;
  }
}

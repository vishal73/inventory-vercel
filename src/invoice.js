const API_URL = "/api/invoices";

export async function saveInvoiceToDatabase(invoice) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(invoice),
  });
  // if (!response.ok) throw new Error("Failed to save invoice");
  // return response.json();
}

export async function printInvoice(invoice) {
  // For now, we'll just log the invoice. In a real application, you'd send this to a printing service.
  console.log("Sending invoice for printing:", invoice);
  return Promise.resolve();
}

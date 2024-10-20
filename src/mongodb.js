const API_URL = "/api/products";

export async function getProducts() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error("Failed to fetch products");
  return response.json();
}

export async function addProduct(product) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
  if (!response.ok) throw new Error("Failed to add product");
  return response.json();
}

export async function updateProduct(id, updates) {
  const response = await fetch(API_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...updates }),
  });
  if (!response.ok) throw new Error("Failed to update product");
  return response.json();
}

export async function deleteProduct(id) {
  const response = await fetch(`${API_URL}?id=${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to delete product");
  return response.json();
}

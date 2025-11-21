// src/reorderStore.js
import { ref } from "vue";

export const reorderItems = ref(null);

export function setReorderFromOrder(order) {
  // order.items comes from backend: { productId, productName, quantity, unitPrice }
  reorderItems.value = order.items.map((item) => ({
    productId: item.productId,
    name: item.productName || `Product ${item.productId}`,
    unitPrice: Number(item.unitPrice),
    quantity: item.quantity,
  }));
}

export function consumeReorderItems() {
  const items = reorderItems.value;
  reorderItems.value = null;
  return items;
}

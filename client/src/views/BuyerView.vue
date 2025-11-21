<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { authState } from "../auth";
import { consumeReorderItems } from "../reorderStore";

const products = ref([]);
const loading = ref(true);
const error = ref("");

// order creation state
const buyerName = ref(authState.user?.name || "");
const deliveryDate = ref("");
const deliveryMinDate = ref("");
const cartItems = ref([]);
const orderSubmitting = ref(false);
const orderMessage = ref("");
const orderError = ref("");

// cut-off UI
const cutoffInfo = ref("");
const cutoffPassed = ref(false);
let cutoffIntervalId = null;

// keep in sync with backend .env
const CUTOFF_HOUR = 16;
const CUTOFF_MINUTE = 0;

// helpers
const pad = (n) => n.toString().padStart(2, "0");

function computeTodayDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  return `${y}-${m}-${d}`;
}

function isProductActive(product) {
  // handle different possible field names, default true
  if (typeof product.isActive !== "undefined") return !!product.isActive;
  if (typeof product.is_active !== "undefined") return !!product.is_active;
  return true;
}

function stockClass(product) {
  if (!isProductActive(product) || product.stockQty === 0) return "danger";
  if (product.stockQty < 5) return "warning";
  return "success";
}

function stockText(product) {
  if (!isProductActive(product)) return "Unavailable";
  if (product.stockQty === 0) return "Out of stock";
  if (product.stockQty < 5) return `Low stock (${product.stockQty})`;
  return `${product.stockQty} in stock`;
}

function canAdd(product) {
  const qty = Number(product.quantityToOrder || 0);
  if (!isProductActive(product) || product.stockQty === 0) return false;
  if (!qty || qty <= 0) return false;
  if (qty > product.stockQty) return false;
  return true;
}

// lifecycle
onMounted(async () => {
  deliveryMinDate.value = computeTodayDate();

  await loadProducts();

  // if there is a reorder pending, prefill cart
  const itemsToReorder = consumeReorderItems();
  if (itemsToReorder && itemsToReorder.length > 0) {
    cartItems.value = itemsToReorder.map((item) => ({
      productId: item.productId,
      name: item.name,
      unitPrice: Number(item.unitPrice),
      quantity: item.quantity,
    }));
  }

  updateCutoffInfo();
  cutoffIntervalId = setInterval(updateCutoffInfo, 1000);
});

onUnmounted(() => {
  if (cutoffIntervalId) {
    clearInterval(cutoffIntervalId);
  }
});

function updateCutoffInfo() {
  const now = new Date();

  const cutoffToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    CUTOFF_HOUR,
    CUTOFF_MINUTE,
    0
  );

  if (now >= cutoffToday) {
    cutoffPassed.value = true;
    cutoffInfo.value =
      "Cut-off for next-day delivery has passed today. New orders will be delivered in 2+ days.";
    return;
  }

  cutoffPassed.value = false;
  const diffMs = cutoffToday.getTime() - now.getTime();

  const totalSeconds = Math.floor(diffMs / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  cutoffInfo.value = `Cut-off for next-day delivery in ${pad(h)}:${pad(
    m
  )}:${pad(s)} (today at ${pad(CUTOFF_HOUR)}:${pad(CUTOFF_MINUTE)}).`;
}

async function loadProducts() {
  loading.value = true;
  error.value = "";

  try {
    const response = await fetch("http://localhost:4000/api/products");

    if (!response.ok) {
      throw new Error("Failed to load products");
    }

    const data = await response.json();

    products.value = data.map((p) => ({
      ...p,
      quantityToOrder: 0,
      price: Number(p.price),
      stockQty: Number(p.stockQty),
    }));
  } catch (err) {
    console.error(err);
    error.value = err.message || "Unknown error";
  } finally {
    loading.value = false;
  }
}

function addToCart(product) {
  orderMessage.value = "";
  orderError.value = "";

  const qty = Number(product.quantityToOrder);

  if (!qty || qty <= 0) {
    alert("Please enter a quantity greater than 0.");
    return;
  }

  const existing = cartItems.value.find(
    (item) => item.productId === product.id
  );
  const alreadyInCart = existing ? existing.quantity : 0;
  const totalRequested = alreadyInCart + qty;

  // 🔴 FRONTEND CHECK: don't exceed current stock
  if (totalRequested > product.stockQty) {
    alert(
      `Not enough stock for "${product.name}". You already have ${alreadyInCart} in the cart and you tried to add ${qty}. Available: ${product.stockQty}.`
    );
    return;
  }

  if (existing) {
    existing.quantity += qty;
  } else {
    cartItems.value.push({
      productId: product.id,
      name: product.name,
      unitPrice: Number(product.price),
      quantity: qty,
    });
  }

  product.quantityToOrder = 0;
}

function removeFromCart(productId) {
  cartItems.value = cartItems.value.filter(
    (item) => item.productId !== productId
  );
}

function cartTotal() {
  return cartItems.value.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
}

async function submitOrder() {
  orderMessage.value = "";
  orderError.value = "";

  if (!deliveryDate.value) {
    orderError.value = "Please select a delivery date.";
    return;
  }

  if (cartItems.value.length === 0) {
    orderError.value = "Your cart is empty. Add some products first.";
    return;
  }

  if (!authState.token) {
    orderError.value = "You are not logged in.";
    return;
  }

  const payload = {
    deliveryDate: deliveryDate.value,
    items: cartItems.value.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
  };

  orderSubmitting.value = true;

  try {
    const response = await fetch("http://localhost:4000/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authState.token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      orderError.value = result?.message || "Failed to create order";
      return;
    }

    // SUCCESS
    orderMessage.value = `Order #${result.id} created successfully. Status: ${
      result.status
    }, total: € ${result.totalAmount.toFixed(2)}`;

    cartItems.value = [];

    // 🔄 reload products so stock values update on screen
    await loadProducts();
  } catch (err) {
    console.error(err);
    orderError.value = "Error while creating order.";
  } finally {
    orderSubmitting.value = false;
  }
}
</script>

<template>
  <div class="buyer-page">
    <header class="buyer-header">
      <div>
        <h2>Buyer – Create Order 🧺</h2>
        <p class="subtitle">
          Select fresh products, build your order and choose your delivery date.
        </p>
      </div>

      <div class="chips-row">
        <span class="chip chip-green">🥬 Live stock</span>
        <span class="chip chip-orange">🥕 Next-day delivery (before cut-off)</span>
      </div>
    </header>

    <div
      class="cutoff-banner"
      :class="{ passed: cutoffPassed }"
      v-if="cutoffInfo"
    >
      <span class="cutoff-icon">⏰</span>
      <span>{{ cutoffInfo }}</span>
    </div>

    <section class="layout">
      <!-- Products -->
      <div class="column column--products">
        <header class="column-header">
          <div>
            <h3>Available Products</h3>
            <p class="column-subtitle">
              Browse today’s catalog and add quantities to your order.
            </p>
          </div>
        </header>

        <div v-if="loading" class="info">Loading products…</div>
        <div v-else-if="error" class="error">Error: {{ error }}</div>

        <div v-else class="products-grid">
          <article
            v-for="product in products"
            :key="product.id"
            class="product-card"
          >
            <header class="product-card__header">
              <div>
                <h4>{{ product.name }}</h4>
                <div class="pill-row">
                  <span v-if="product.grade" class="pill">
                    {{ product.grade }}
                  </span>
                  <span v-if="product.origin" class="pill pill-soft">
                    {{ product.origin }}
                  </span>
                </div>
              </div>
              <span class="badge">{{ product.unit }}</span>
            </header>

            <div class="product-card__price">
              <span class="price">€ {{ product.price.toFixed(2) }}</span>
              <span class="price-unit"> / {{ product.unit }}</span>
            </div>

            <div class="product-card__stock">
              <span class="stock-dot" :class="stockClass(product)">
                ●
              </span>
              <span class="stock-text">
                {{ stockText(product) }}
              </span>
            </div>

            <div class="product-card__actions">
              <input
                v-model.number="product.quantityToOrder"
                type="number"
                min="0"
                :max="product.stockQty"
                class="qty-input"
                placeholder="Qty"
              />

              <button
                class="btn btn-add"
                :disabled="!canAdd(product)"
                @click="addToCart(product)"
              >
                Add
              </button>
            </div>

            <p v-if="!isProductActive(product)" class="hint danger">
              This product is currently unavailable.
            </p>
            <p v-else-if="product.stockQty === 0" class="hint danger">
              Out of stock.
            </p>
            <p v-else-if="product.stockQty < 5" class="hint warning">
              Limited stock – order soon.
            </p>
          </article>
        </div>
      </div>

      <!-- Order panel -->
      <div class="column column--order">
        <header class="column-header">
          <div>
            <h3>Create Order</h3>
            <p class="column-subtitle">
              Review your cart, choose a delivery date and submit your order.
            </p>
          </div>
        </header>

        <div class="field">
          <label>Buyer name</label>
          <input
            v-model="buyerName"
            type="text"
            disabled
            :placeholder="authState.user?.name || 'Logged-in buyer'"
          />
        </div>

        <div class="field">
          <label for="deliveryDate">Delivery date</label>
          <input
            id="deliveryDate"
            v-model="deliveryDate"
            type="date"
            :min="deliveryMinDate"
          />
        </div>

        <h4 class="order-items-title">Order items</h4>
        <p v-if="cartItems.length === 0" class="info small">
          No items in the order yet. Add some from the product list on the left.
        </p>

        <div v-else class="cart-list">
          <div
            v-for="item in cartItems"
            :key="item.productId"
            class="cart-row"
          >
            <div class="cart-row__info">
              <h5>{{ item.name }}</h5>
              <p class="cart-meta">
                {{ item.quantity }} × € {{ item.unitPrice.toFixed(2) }}
              </p>
            </div>
            <div class="cart-row__total">
              <span class="cart-total-line">
                € {{ (item.unitPrice * item.quantity).toFixed(2) }}
              </span>
              <button
                class="link-btn"
                @click="removeFromCart(item.productId)"
              >
                remove
              </button>
            </div>
          </div>
        </div>

        <div class="total-row" v-if="cartItems.length > 0">
          <span>Total:</span>
          <strong>€ {{ cartTotal().toFixed(2) }}</strong>
        </div>

        <div v-if="orderError" class="error">{{ orderError }}</div>
        <div v-if="orderMessage" class="success">{{ orderMessage }}</div>

        <button
          class="primary-btn"
          :disabled="orderSubmitting || cartItems.length === 0"
          @click="submitOrder"
        >
          {{ orderSubmitting ? "Placing order..." : "Place order" }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.buyer-page {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

/* Header */
.buyer-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}

.buyer-header h2 {
  margin: 0 0 0.2rem;
  font-size: 1.45rem;
  color: #2f3a2b;
}

.subtitle {
  margin: 0;
  color: #6f7569;
  font-size: 0.95rem;
}

/* Chips */
.chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: flex-end;
}

.chip {
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
}

.chip-green {
  background: #e3f3df;
  border-color: #c0e2bc;
  color: #356b3a;
}

.chip-orange {
  background: #fff2de;
  border-color: #f6c894;
  color: #8a5b1f;
}

/* Cutoff banner */
.cutoff-banner {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem 0.8rem;
  border-radius: 10px;
  background: #fff2de;
  color: #7a5a1c;
  font-size: 0.9rem;
  border: 1px solid #f6c894;
}

.cutoff-banner.passed {
  background: #ffe5e9;
  border-color: #f6b8c2;
  color: #a5394a;
}

.cutoff-icon {
  font-size: 1.1rem;
}

/* Layout */
.layout {
  display: grid;
  grid-template-columns: 2fr 1.4fr;
  gap: 1.25rem;
  align-items: flex-start;
}

/* Columns */
.column {
  background: rgba(242, 246, 238, 0.98);
  border-radius: 18px;
  padding: 1rem 1.1rem 1.1rem;
  border: 1px solid #cfdcbe;
  box-shadow: 0 10px 24px rgba(149, 170, 131, 0.3);
  color: #2f3a2b;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.8rem;
}

.column-header h3 {
  margin: 0;
  font-size: 1.08rem;
  color: #2f3a2b;
}

.column-subtitle {
  margin: 0.15rem 0 0;
  font-size: 0.85rem;
  color: #6f7569;
}

/* Products grid */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 0.8rem;
}

.product-card {
  background: #f8fbf4;
  border-radius: 14px;
  padding: 0.8rem 0.75rem;
  border: 1px solid #d7e4c7;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  font-size: 0.9rem;
  transition: transform 0.12s ease, box-shadow 0.15s ease,
    border-color 0.15s ease, background 0.2s ease;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 18px rgba(149, 170, 131, 0.4);
  border-color: #c3d7ae;
  background: #f3f8ec;
}

.product-card__header {
  display: flex;
  justify-content: space-between;
  gap: 0.6rem;
}

.product-card__header h4 {
  margin: 0 0 0.15rem;
  font-size: 0.98rem;
  color: #2f3a2b;
}

.pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.pill {
  padding: 0.12rem 0.45rem;
  border-radius: 999px;
  background: #f1e4ff;
  font-size: 0.7rem;
  color: #5d3a7a;
}

.pill-soft {
  background: #f7ebde;
  color: #7a5a36;
}

.badge {
  padding: 0.18rem 0.5rem;
  border-radius: 999px;
  border: 1px solid #d4ddc9;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #4e5b45;
  background: #edf4e8;
}

.product-card__price {
  margin-top: 0.1rem;
  font-size: 0.92rem;
}

.price {
  font-weight: 600;
  color: #2f3a2b;
}

.price-unit {
  color: #6f7569;
}

.product-card__stock {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: #5f6559;
}

.stock-dot {
  font-size: 0.85rem;
}

.stock-dot.success {
  color: #4caf6f;
}

.stock-dot.warning {
  color: #f2b546;
}

.stock-dot.danger {
  color: #e45d79;
}

/* Actions */
.product-card__actions {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-top: 0.2rem;
}

.qty-input {
  width: 72px;
  padding: 0.28rem 0.4rem;
  border-radius: 9px;
  border: 1px solid #cfdcc3;
  background: #fdfcf9;
  color: #2f3a2b;
  font-size: 0.8rem;
  outline: none;
}

.qty-input:focus {
  border-color: #8ac79e;
  box-shadow: 0 0 0 2px rgba(138, 199, 158, 0.35);
}

/* Buttons */
.btn {
  border: none;
  border-radius: 999px;
  padding: 0.3rem 0.75rem;
  font-size: 0.82rem;
  cursor: pointer;
  transition: transform 0.08s ease, box-shadow 0.15s ease, opacity 0.15s ease;
}

.btn-add {
  background: linear-gradient(135deg, #f2b075, #8ac79e);
  color: #2f3a2b;
}

.btn-add:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 14px rgba(153, 169, 140, 0.5);
}

.btn-add:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

/* Product hints */
.hint {
  margin: 0.1rem 0 0;
  font-size: 0.76rem;
}

.hint.warning {
  color: #c27c26;
}

.hint.danger {
  color: #c73f5b;
}

/* Order panel fields */
.field {
  margin-bottom: 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field label {
  font-size: 0.8rem;
  color: #4f5a43;
}

.field input {
  padding: 0.4rem 0.55rem;
  font-size: 0.88rem;
  border-radius: 9px;
  border: 1px solid #cfdcc3;
  background: #fdfcf9;
  color: #2f3a2b;
  outline: none;
}

.field input:focus {
  border-color: #8ac79e;
  box-shadow: 0 0 0 2px rgba(138, 199, 158, 0.35);
}

/* Cart */
.order-items-title {
  margin: 0.4rem 0 0.3rem;
  font-size: 0.96rem;
  color: #2f3a2b;
}

.cart-list {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin-bottom: 0.4rem;
  max-height: 260px;
  overflow-y: auto;
}

.cart-row {
  display: flex;
  justify-content: space-between;
  gap: 0.7rem;
  padding: 0.5rem 0.55rem;
  border-radius: 11px;
  background: #edf4e8;
}

.cart-row__info h5 {
  margin: 0 0 0.15rem;
  font-size: 0.9rem;
  color: #2f3a2b;
}

.cart-meta {
  margin: 0;
  font-size: 0.8rem;
  color: #6f7569;
}

.cart-row__total {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.cart-total-line {
  font-size: 0.86rem;
  color: #2f3a2b;
}

.link-btn {
  border: none;
  background: none;
  padding: 0;
  font-size: 0.78rem;
  color: #c73f5b;
  cursor: pointer;
  text-decoration: underline;
}

/* Info & messages */
.info {
  padding: 0.4rem 0;
  font-size: 0.86rem;
  color: #5c6157;
}

.info.small {
  font-size: 0.8rem;
  color: #8a8f84;
}

.error {
  color: #b3343f;
  background: #ffe5e9;
  border-radius: 10px;
  border: 1px solid #f6b8c2;
  padding: 0.45rem 0.6rem;
  margin: 0.4rem 0;
  font-size: 0.85rem;
}

.success {
  color: #356b3a;
  background: #e3f3df;
  border-radius: 10px;
  border: 1px solid #c0e2bc;
  padding: 0.45rem 0.6rem;
  margin: 0.4rem 0;
  font-size: 0.85rem;
}

/* Total + primary button */
.total-row {
  display: flex;
  justify-content: space-between;
  margin-top: 0.3rem;
  font-size: 0.92rem;
  color: #2f3a2b;
}

.primary-btn {
  margin-top: 0.7rem;
  width: 100%;
  padding: 0.55rem 1rem;
  font-size: 0.96rem;
  background: linear-gradient(135deg, #f2b075, #8ac79e);
  color: #2f3a2b;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.08s ease, box-shadow 0.15s ease, opacity 0.15s ease;
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 18px rgba(153, 169, 140, 0.5);
}

.primary-btn:disabled {
  opacity: 0.55;
  cursor: default;
  box-shadow: none;
}

/* Responsive */
@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .buyer-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .chips-row {
    justify-content: flex-start;
  }
}
</style>

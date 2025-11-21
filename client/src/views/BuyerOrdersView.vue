<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { authState } from "../auth";
import { setReorderFromOrder } from "../reorderStore";

const router = useRouter();

const orders = ref([]);
const loading = ref(false);
const error = ref("");

onMounted(() => {
  loadMyOrders();
});

async function loadMyOrders() {
  loading.value = true;
  error.value = "";

  if (!authState.token) {
    error.value = "Not authenticated.";
    loading.value = false;
    return;
  }

  try {
    const response = await fetch("http://localhost:4000/api/orders/my", {
      headers: {
        Authorization: `Bearer ${authState.token}`,
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to load orders");
    }

    const data = await response.json();
    orders.value = data;
  } catch (err) {
    console.error(err);
    error.value = err.message || "Unknown error loading orders.";
  } finally {
    loading.value = false;
  }
}

function reorder(order) {
  if (!order.items || order.items.length === 0) {
    alert("This order has no items to reorder.");
    return;
  }

  setReorderFromOrder(order);
  router.push("/buyer");
}

function statusClass(status) {
  if (!status) return "";
  const s = status.toUpperCase();
  if (s === "COMPLETED") return "badge--success";
  if (s === "OUT_FOR_DELIVERY") return "badge--warning";
  if (s === "PROCESSING") return "badge--info";
  if (s === "RECEIVED") return "badge--neutral";
  return "badge--neutral";
}

function statusIcon(status) {
  const s = (status || "").toUpperCase();
  if (s === "COMPLETED") return "✅";
  if (s === "OUT_FOR_DELIVERY") return "🚚";
  if (s === "PROCESSING") return "⚙️";
  if (s === "RECEIVED") return "📥";
  return "📦";
}
</script>

<template>
  <div class="orders-page">
    <header class="orders-header">
      <div>
        <h2>Buyer – My Orders 🧺</h2>
        <p class="subtitle">
          Review your previous orders and quickly reorder your usual picks.
        </p>
      </div>

      <button class="btn btn-refresh" @click="loadMyOrders" :disabled="loading">
        {{ loading ? "Refreshing..." : "Refresh" }}
      </button>
    </header>

    <div v-if="error" class="error">Error: {{ error }}</div>
    <div v-if="loading" class="info">Loading orders…</div>

    <section v-else>
      <div v-if="orders.length > 0" class="orders-grid">
        <article v-for="order in orders" :key="order.id" class="order-card">
          <header class="order-card__header">
            <div>
              <h3>#{{ order.id }}</h3>
              <p class="order-meta">
                Created:
                <span>{{ order.createdAt }}</span>
              </p>
              <p class="order-meta">
                Delivery date:
                <span>{{ order.deliveryDate }}</span>
              </p>
            </div>

            <span class="badge" :class="statusClass(order.status)">
              <span class="status-icon">{{ statusIcon(order.status) }}</span>
              <span>{{ order.status }}</span>
            </span>
          </header>

          <section class="order-card__body">
            <h4 class="items-title">Items</h4>
            <ul class="items-list">
              <li
                v-for="(item, idx) in order.items"
                :key="idx"
                class="item-row"
              >
                <div class="item-row__info">
                  <span class="item-name">
                    {{ item.productName || ("Product " + item.productId) }}
                  </span>
                  <span class="item-meta">
                    qty {{ item.quantity }} × €
                    {{ item.unitPrice.toFixed(2) }}
                  </span>
                </div>
                <div class="item-row__total">
                  € {{ (item.quantity * item.unitPrice).toFixed(2) }}
                </div>
              </li>
            </ul>
          </section>

          <footer class="order-card__footer">
            <div class="order-total">
              <span>Total</span>
              <strong>€ {{ Number(order.totalAmount).toFixed(2) }}</strong>
            </div>
            <button class="btn btn-reorder" @click="reorder(order)">
              Reorder
            </button>
          </footer>
        </article>
      </div>

      <p v-else class="info small">
        You don’t have any orders yet. Create one in the Buyer page.
      </p>
    </section>
  </div>
</template>

<style scoped>
.orders-page {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Header */
.orders-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}

.orders-header h2 {
  margin: 0 0 0.2rem;
  font-size: 1.45rem;
  color: #2f3a2b; /* darker, earthy */
}

.subtitle {
  margin: 0;
  color: #6f7569;
  font-size: 0.95rem;
}

/* Messages */
.error {
  color: #b3343f;
  background: #ffe5e9;
  border-radius: 10px;
  border: 1px solid #f6b8c2;
  padding: 0.45rem 0.6rem;
  margin: 0.4rem 0;
  font-size: 0.85rem;
}

.info {
  padding: 0.4rem 0;
  font-size: 0.86rem;
  color: #5c6157;
}

.info.small {
  font-size: 0.8rem;
  color: #8a8f84;
}

/* Buttons */
.btn {
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.32rem 0.9rem;
  transition: background 0.15s ease, box-shadow 0.15s ease,
    transform 0.08s ease, opacity 0.15s ease, color 0.15s ease;
}

/* refresh: soft herb outline */
.btn-refresh {
  background: transparent;
  color: #49624b;
  border: 1px solid rgba(142, 176, 135, 0.9);
}

.btn-refresh:hover:not(:disabled) {
  background: linear-gradient(135deg, #f5c58a, #8ac79e);
  color: #283124;
  box-shadow: 0 5px 14px rgba(154, 186, 151, 0.55);
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: default;
}

/* reorder: carrot + herb gradient */
.btn-reorder {
  background: linear-gradient(135deg, #f2b075, #8ac79e);
  color: #283124;
}

.btn-reorder:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 14px rgba(191, 170, 123, 0.55);
}

/* Orders grid */
.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 0.9rem;
}

/* Order cards – sage veggie tone */
.order-card {
  background: #f2f6ee; /* soft sage */
  border-radius: 16px;
  padding: 0.85rem 0.9rem 0.9rem;
  border: 1px solid #cfdcbe;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.9rem;
  transition: transform 0.12s ease, box-shadow 0.15s ease,
    border-color 0.15s ease, background 0.2s ease;
}

.order-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 18px rgba(149, 170, 131, 0.45);
  border-color: #bccf9f;
  background: #edf3e7;
}

.order-card__header {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.order-card__header h3 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
  color: #2f3a2b;
}

.order-meta {
  margin: 0;
  font-size: 0.8rem;
  color: #6f7569;
}

.order-meta span {
  color: #3e4a3c;
}

/* Status badge – veggie palette */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border: 1px solid transparent;
}

.status-icon {
  font-size: 0.9rem;
}

/* COMPLETED – herb green */
.badge--success {
  background: #e3f3df;
  border-color: #c0e2bc;
  color: #356b3a;
}

/* OUT_FOR_DELIVERY – carrot/orange */
.badge--warning {
  background: #fff2de;
  border-color: #f6c894;
  color: #8a5b1f;
}

/* PROCESSING – beet/eggplant */
.badge--info {
  background: #f5e7fb;
  border-color: #dfc1f2;
  color: #5d3a7a;
}

/* RECEIVED – root/earthy beige */
.badge--neutral {
  background: #f7eee3;
  border-color: #e3cfb4;
  color: #7a5a36;
}

/* Items list */
.order-card__body {
  border-radius: 12px;
  background: #e7efe0;
  padding: 0.55rem 0.6rem;
}

.items-title {
  margin: 0 0 0.35rem;
  font-size: 0.86rem;
  color: #2f3a2b;
}

.items-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
}

.item-row {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.84rem;
}

.item-row__info {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
}

.item-name {
  font-weight: 500;
  color: #2f3a2b;
}

.item-meta {
  font-size: 0.78rem;
  color: #6d7667;
}

.item-row__total {
  font-size: 0.84rem;
  color: #324030;
}

/* Footer */
.order-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.35rem;
}

.order-total {
  display: flex;
  flex-direction: column;
  font-size: 0.85rem;
  color: #5e6457;
}

.order-total strong {
  font-size: 0.96rem;
  color: #2f3a2b;
}

/* Responsive */
@media (max-width: 600px) {
  .orders-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .orders-header button {
    align-self: flex-start;
  }
}
</style>

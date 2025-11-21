<script setup>
import { ref, onMounted, computed } from "vue";
import { authState } from "../auth";

const orders = ref([]);
const ordersLoading = ref(false);
const ordersError = ref("");
const statusOptions = ["RECEIVED", "PICKING", "DELIVERED", "CANCELLED"];

onMounted(() => {
  loadOrders();
});

async function loadOrders() {
  ordersLoading.value = true;
  ordersError.value = "";

  if (!authState.token) {
    ordersError.value = "Not authenticated.";
    ordersLoading.value = false;
    return;
  }

  try {
    const response = await fetch("http://localhost:4000/api/orders", {
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
    ordersError.value = err.message || "Unknown error";
  } finally {
    ordersLoading.value = false;
  }
}

async function changeOrderStatus(order, newStatus) {
  if (!newStatus || newStatus === order.status) return;

  if (!authState.token) {
    alert("You are not logged in as admin.");
    return;
  }

  const previousStatus = order.status;
  order.status = newStatus; // optimistic update

  try {
    const response = await fetch(
      `http://localhost:4000/api/orders/${order.id}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authState.token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to update status");
    }

    const updatedOrder = await response.json();
    order.status = updatedOrder.status; // sync
  } catch (err) {
    console.error(err);
    alert(
      `Could not update status for order #${order.id}: ${
        err.message || "Unknown error"
      }`
    );
    order.status = previousStatus;
  }
}

const totalOrders = computed(() => orders.value.length);
const openOrders = computed(() =>
  orders.value.filter(
    (o) =>
      o.status !== "DELIVERED" &&
      o.status !== "CANCELLED" &&
      o.status !== "COMPLETED"
  ).length
);

function statusPillClass(status) {
  const s = (status || "").toUpperCase();
  if (s === "DELIVERED" || s === "COMPLETED") return "status-pill--success";
  if (s === "PICKING" || s === "PROCESSING") return "status-pill--info";
  if (s === "RECEIVED") return "status-pill--neutral";
  if (s === "CANCELLED") return "status-pill--danger";
  return "status-pill--neutral";
}

function statusEmoji(status) {
  const s = (status || "").toUpperCase();
  if (s === "DELIVERED" || s === "COMPLETED") return "✅";
  if (s === "PICKING" || s === "PROCESSING") return "⚙️";
  if (s === "RECEIVED") return "📥";
  if (s === "CANCELLED") return "✖️";
  return "📦";
}
</script>

<template>
  <div class="admin-page">
    <header class="admin-header">
      <div class="admin-title-block">
        <div class="icon-badge">📊</div>
        <div>
          <h2>Admin – Orders Overview</h2>
          <p class="subtitle">
            Monitor all buyer orders, adjust statuses, and keep operations flowing.
          </p>
        </div>
      </div>

      <div class="header-actions">
        <div class="summary-chips">
          <span class="chip chip--total">
            🧺 Total: <strong>{{ totalOrders }}</strong>
          </span>
          <span class="chip chip--open">
            ⚡ Open: <strong>{{ openOrders }}</strong>
          </span>
        </div>

        <button class="btn btn-refresh" @click="loadOrders" :disabled="ordersLoading">
          {{ ordersLoading ? "Refreshing..." : "Refresh orders" }}
        </button>
      </div>
    </header>

    <div v-if="ordersError" class="error">Error: {{ ordersError }}</div>

    <div v-if="ordersLoading" class="info">Loading orders…</div>

    <section v-else class="panel">
      <table v-if="orders.length > 0" class="orders-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Buyer</th>
            <th>Company</th>
            <th>Delivery</th>
            <th>Status</th>
            <th>Total</th>
            <th>Items</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id">
            <td class="col-id">#{{ order.id }}</td>
            <td>
              <div class="buyer-cell">
                <span class="avatar">
                  {{ order.buyerName?.charAt(0)?.toUpperCase() ?? "B" }}
                </span>
                <div class="buyer-meta">
                  <span class="buyer-name">{{ order.buyerName }}</span>
                  <span class="buyer-created">Created: {{ order.createdAt }}</span>
                </div>
              </div>
            </td>
            <td class="col-company">{{ order.buyerCompany }}</td>
            <td class="col-delivery">
              <span class="delivery-date">{{ order.deliveryDate }}</span>
            </td>
            <td class="col-status">
              <div class="status-cell">
                <span class="status-pill" :class="statusPillClass(order.status)">
                  <span class="status-emoji">{{ statusEmoji(order.status) }}</span>
                  <span class="status-text">{{ order.status }}</span>
                </span>

                <select
                  class="status-select"
                  :value="order.status"
                  @change="(event) => changeOrderStatus(order, event.target.value)"
                >
                  <option v-for="s in statusOptions" :key="s" :value="s">
                    {{ s }}
                  </option>
                </select>
              </div>
            </td>
            <td class="col-total">
              € {{ Number(order.totalAmount).toFixed(2) }}
            </td>
            <td class="col-items">
              <ul class="items-list">
                <li v-for="(item, idx) in order.items" :key="idx">
                  <span class="item-name">
                    {{ item.productName || ("Product " + item.productId) }}
                  </span>
                  <span class="item-meta">
                    {{ item.quantity }} × € {{ item.unitPrice.toFixed(2) }}
                  </span>
                </li>
              </ul>
            </td>
          </tr>
        </tbody>
      </table>

      <p v-else class="info small">
        No orders yet. Ask a buyer to create one.
      </p>
    </section>
  </div>
</template>

<style scoped>
/* Page on cream background – use dark text like AdminProducts */
.admin-page {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  color: #2f2737;
}

/* Header */
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.admin-title-block {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.icon-badge {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: radial-gradient(circle at 20% 20%, #8ad08f, #81567a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  box-shadow: 0 8px 18px rgba(110, 129, 107, 0.45);
}

.admin-header h2 {
  margin: 0 0 0.15rem;
  font-size: 1.45rem;
  color: #2f2737;
}

.subtitle {
  margin: 0;
  color: #7a748d;
  font-size: 0.95rem;
}

/* Header actions / chips */
.header-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.summary-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  justify-content: flex-end;
}

.chip {
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.78rem;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
}

.chip strong {
  font-weight: 600;
}

/* total: soft teal */
.chip--total {
  background: #e4f6f7;
  border-color: #94cbd4;
  color: #27636f;
}

/* open: soft amber */
.chip--open {
  background: #fff4df;
  border-color: #e2c08a;
  color: #7a5a1b;
}

/* Messages */
.error {
  color: #8b3b4a;
  background: #ffe7ed;
  border-radius: 10px;
  border: 1px solid #f3b5c2;
  padding: 0.45rem 0.6rem;
  margin: 0.4rem 0;
  font-size: 0.86rem;
}

.info {
  padding: 0.4rem 0;
  font-size: 0.86rem;
  color: #6d6e8c;
}

.info.small {
  font-size: 0.8rem;
  color: #9a9cb5;
}

/* Panel — same plum/basil card as AdminProducts */
.panel {
  background: radial-gradient(circle at top, #352d45 0%, #2b2636 55%, #262130 100%);
  border-radius: 22px;
  padding: 1rem 1.1rem 1.1rem;
  border: 1px solid #464059;
  box-shadow: 0 16px 32px rgba(34, 26, 46, 0.45);
  color: #f5f3ff;
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

.btn-refresh {
  background: #f4f0ff;
  color: #4b4c79;
  border: 1px solid #cbc4ef;
}

.btn-refresh:hover:not(:disabled) {
  background: #e5ddff;
  box-shadow: 0 4px 10px rgba(158, 146, 222, 0.5);
}

.btn-refresh:disabled {
  opacity: 0.65;
  cursor: default;
}

/* Table */
.orders-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.orders-table thead tr {
  background: rgba(24, 21, 34, 0.95);
}

.orders-table th,
.orders-table td {
  padding: 0.55rem 0.5rem;
  text-align: left;
}

.orders-table th {
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #b9b4d7;
  border-bottom: 1px solid #47425c;
}

.orders-table tbody tr {
  border-bottom: 1px solid #3a344a;
  background: #2a2535;
  transition: background 0.15s ease;
}

.orders-table tbody tr:nth-child(even) {
  background: #30293e;
}

.orders-table tbody tr:hover {
  background: #383149;
}

/* Column tweaks */
.col-id {
  font-weight: 600;
  color: #e3deff;
  white-space: nowrap;
}

.col-company {
  max-width: 160px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  color: #e0ddf8;
}

.col-delivery .delivery-date {
  font-size: 0.85rem;
  color: #e3e6a3;
}

.col-total {
  white-space: nowrap;
  font-weight: 500;
  color: #f6c991;
}

/* Buyer cell */
.buyer-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.avatar {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 20%, #ffcc71, #ff6f91);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  color: #1a0f19;
}

.buyer-meta {
  display: flex;
  flex-direction: column;
}

.buyer-name {
  font-size: 0.9rem;
  color: #f9f7ff;
}

.buyer-created {
  font-size: 0.75rem;
  color: #aaa7cf;
}

/* Status cell */
.col-status {
  min-width: 180px;
}

.status-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.74rem;
  border: 1px solid transparent;
  width: fit-content;
}

.status-emoji {
  font-size: 0.9rem;
}

/* NEW soft veggie colors for status pills */
.status-pill--success {
  background: #243b2b;
  border-color: #77c785;
  color: #c3f4ca;
}

.status-pill--info {
  background: #223549;
  border-color: #6fb7e6;
  color: #c3e7ff;
}

.status-pill--neutral {
  background: #343445;
  border-color: #5a5c77;
  color: #d4d5ee;
}

.status-pill--danger {
  background: #472431;
  border-color: #d6798e;
  color: #ffd0da;
}

/* Status select */
.status-select {
  margin-top: 0.05rem;
  width: 100%;
  padding: 0.25rem 0.4rem;
  font-size: 0.8rem;
  background: #221f2b;
  border-radius: 8px;
  border: 1px solid #524d67;
  color: #f5f3ff;
  outline: none;
}

.status-select:focus {
  border-color: #8ccf9a;
  box-shadow: 0 0 0 1px rgba(140, 207, 154, 0.4);
}

/* Items list */
.col-items {
  width: 260px;
}

.items-list {
  margin: 0;
  padding-left: 1rem;
  list-style: disc;
  font-size: 0.8rem;
  color: #d5d4f3;
}

.items-list li {
  margin-bottom: 0.1rem;
}

.items-list .item-name {
  display: block;
}

.items-list .item-meta {
  font-size: 0.76rem;
  color: #a6a3c9;
}

/* Responsive */
@media (max-width: 900px) {
  .admin-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    align-items: flex-start;
  }

  .panel {
    padding-inline: 0.7rem;
  }

  .orders-table {
    font-size: 0.8rem;
  }

  .col-items {
    width: 200px;
  }
}
</style>

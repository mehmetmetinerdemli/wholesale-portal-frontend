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
const openOrders = computed(
  () =>
    orders.value.filter(
      (o) =>
        o.status !== "DELIVERED" &&
        o.status !== "CANCELLED" &&
        o.status !== "COMPLETED"
    ).length
);

// Tailwind classes for status pill variants
function statusPillClass(status) {
  const s = (status || "").toUpperCase();
  if (s === "DELIVERED" || s === "COMPLETED")
    return "bg-[#243b2b] border-[#77c785] text-[#c3f4ca]";
  if (s === "PICKING" || s === "PROCESSING")
    return "bg-[#223549] border-[#6fb7e6] text-[#c3e7ff]";
  if (s === "RECEIVED")
    return "bg-[#343445] border-[#5a5c77] text-[#d4d5ee]";
  if (s === "CANCELLED")
    return "bg-[#472431] border-[#d6798e] text-[#ffd0da]";
  return "bg-[#343445] border-[#5a5c77] text-[#d4d5ee]";
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
  <!-- page wrapper -->
  <div class="flex flex-col gap-[0.9rem] text-[#2f2737]">
    <!-- header -->
    <header
      class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-[44px] w-[44px] items-center justify-center rounded-[14px] bg-[radial-gradient(circle_at_20%_20%,#8ad08f,#81567a)] text-[1.6rem] shadow-[0_8px_18px_rgba(110,129,107,0.45)]"
        >
          📊
        </div>
        <div>
          <h2 class="m-0 text-[1.45rem] font-semibold tracking-tight text-[#2f2737]">
            Admin – Orders Overview
          </h2>
          <p class="m-0 text-[0.95rem] text-[#7a748d]">
            Monitor all customer orders, adjust statuses, and keep operations
            flowing.
          </p>
        </div>
      </div>

      <div
        class="flex flex-col items-end gap-[0.5rem] md:items-end"
      >
        <!-- chips -->
        <div
          class="flex flex-wrap justify-end gap-[0.35rem]"
        >
          <span
            class="inline-flex items-center gap-[0.25rem] whitespace-nowrap rounded-full border border-[#94cbd4] bg-[#e4f6f7] px-[0.65rem] py-[0.25rem] text-[0.78rem] text-[#27636f]"
          >
            🧺 Total:
            <strong class="font-semibold">{{ totalOrders }}</strong>
          </span>
          <span
            class="inline-flex items-center gap-[0.25rem] whitespace-nowrap rounded-full border border-[#e2c08a] bg-[#fff4df] px-[0.65rem] py-[0.25rem] text-[0.78rem] text-[#7a5a1b]"
          >
            ⚡ Open:
            <strong class="font-semibold">{{ openOrders }}</strong>
          </span>
        </div>

        <!-- refresh button -->
        <button
          class="cursor-pointer rounded-full border border-[#cbc4ef] bg-[#f4f0ff] px-[0.9rem] py-[0.32rem] text-[0.85rem] text-[#4b4c79] transition hover:bg-[#e5ddff] hover:shadow-[0_4px_10px_rgba(158,146,222,0.5)] disabled:cursor-default disabled:opacity-65"
          @click="loadOrders"
          :disabled="ordersLoading"
        >
          {{ ordersLoading ? "Refreshing..." : "Refresh orders" }}
        </button>
      </div>
    </header>

    <!-- error -->
    <div
      v-if="ordersError"
      class="mt-1 rounded-[10px] border border-[#f3b5c2] bg-[#ffe7ed] px-[0.6rem] py-[0.45rem] text-[0.86rem] text-[#8b3b4a]"
    >
      Error: {{ ordersError }}
    </div>

    <!-- loading -->
    <div
      v-if="ordersLoading"
      class="py-[0.4rem] text-[0.86rem] text-[#6d6e8c]"
    >
      Loading orders…
    </div>

    <!-- main panel -->
    <section
      v-else
      class="rounded-[22px] border border-[#464059] px-[1.1rem] pt-[1rem] pb-[1.1rem] text-[#f5f3ff] shadow-[0_16px_32px_rgba(34,26,46,0.45)] bg-[radial-gradient(circle_at_top,#352d45_0%,#2b2636_55%,#262130_100%)]"
    >
      <!-- table -->
      <table
        v-if="orders.length > 0"
        class="w-full border-collapse text-[0.88rem]"
      >
        <thead>
          <tr class="bg-[rgba(24,21,34,0.95)]">
            <th
              class="border-b border-[#47425c] px-[0.5rem] py-[0.55rem] text-left text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-[#b9b4d7]"
            >
              ID
            </th>
            <th
              class="border-b border-[#47425c] px-[0.5rem] py-[0.55rem] text-left text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-[#b9b4d7]"
            >
              Customer
            </th>
            <th
              class="border-b border-[#47425c] px-[0.5rem] py-[0.55rem] text-left text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-[#b9b4d7]"
            >
              Company
            </th>
            <th
              class="border-b border-[#47425c] px-[0.5rem] py-[0.55rem] text-left text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-[#b9b4d7]"
            >
              Delivery
            </th>
            <th
              class="border-b border-[#47425c] px-[0.5rem] py-[0.55rem] text-left text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-[#b9b4d7]"
            >
              Status
            </th>
            <th
              class="border-b border-[#47425c] px-[0.5rem] py-[0.55rem] text-left text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-[#b9b4d7]"
            >
              Total
            </th>
            <th
              class="border-b border-[#47425c] px-[0.5rem] py-[0.55rem] text-left text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-[#b9b4d7]"
            >
              Items
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="order in orders"
            :key="order.id"
            class="border-b border-[#3a344a] bg-[#2a2535] transition-colors hover:bg-[#383149] even:bg-[#30293e]"
          >
            <!-- ID -->
            <td
              class="whitespace-nowrap px-[0.5rem] py-[0.55rem] font-semibold text-[#e3deff]"
            >
              #{{ order.id }}
            </td>

            <!-- Buyer -->
            <td class="px-[0.5rem] py-[0.55rem]">
              <div class="flex items-center gap-[0.5rem]">
                <span
                  class="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_20%,#ffcc71,#ff6f91)] text-[0.95rem] text-[#1a0f19]"
                >
                  {{ order.buyerName?.charAt(0)?.toUpperCase() ?? "B" }}
                </span>
                <div class="flex flex-col">
                  <span class="text-[0.9rem] text-[#f9f7ff]">
                    {{ order.buyerName }}
                  </span>
                  <span class="text-[0.75rem] text-[#aaa7cf]">
                    Created: {{ order.createdAt }}
                  </span>
                </div>
              </div>
            </td>

            <!-- Company -->
            <td
              class="max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap px-[0.5rem] py-[0.55rem] text-[#e0ddf8]"
            >
              {{ order.buyerCompany }}
            </td>

            <!-- Delivery -->
            <td class="px-[0.5rem] py-[0.55rem]">
              <span class="text-[0.85rem] text-[#e3e6a3]">
                {{ order.deliveryDate }}
              </span>
            </td>

            <!-- Status -->
            <td class="min-w-[180px] px-[0.5rem] py-[0.55rem]">
              <div class="flex flex-col gap-[0.25rem]">
                <span
                  class="inline-flex w-fit items-center gap-[0.3rem] rounded-full border px-[0.6rem] py-[0.15rem] text-[0.74rem]"
                  :class="statusPillClass(order.status)"
                >
                  <span class="text-[0.9rem]">
                    {{ statusEmoji(order.status) }}
                  </span>
                  <span class="uppercase tracking-[0.04em]">
                    {{ order.status }}
                  </span>
                </span>

                <select
                  class="mt-[0.05rem] w-full rounded-[8px] border border-[#524d67] bg-[#221f2b] px-[0.4rem] py-[0.25rem] text-[0.8rem] text-[#f5f3ff] outline-none focus:border-[#8ccf9a] focus:shadow-[0_0_0_1px_rgba(140,207,154,0.4)]"
                  :value="order.status"
                  @change="(event) => changeOrderStatus(order, event.target.value)"
                >
                  <option v-for="s in statusOptions" :key="s" :value="s">
                    {{ s }}
                  </option>
                </select>
              </div>
            </td>

            <!-- Total -->
            <td
              class="whitespace-nowrap px-[0.5rem] py-[0.55rem] font-medium text-[#f6c991]"
            >
              € {{ Number(order.totalAmount).toFixed(2) }}
            </td>

            <!-- Items -->
            <td class="px-[0.5rem] py-[0.55rem] align-top">
              <ul
                class="ml-4 list-disc text-[0.8rem] text-[#d5d4f3]"
              >
                <li
                  v-for="(item, idx) in order.items"
                  :key="idx"
                  class="mb-[0.1rem]"
                >
                  <span class="block">
                    {{ item.productName || ("Product " + item.productId) }}
                  </span>
                  <span class="text-[0.76rem] text-[#a6a3c9]">
                    {{ item.quantity }} × €
                    {{ item.unitPrice.toFixed(2) }}
                  </span>
                </li>
              </ul>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- no orders -->
      <p
        v-else
        class="py-[0.4rem] text-[0.8rem] text-[#9a9cb5]"
      >
        No orders yet. Ask a customer to create one.
      </p>
    </section>
  </div>
</template>

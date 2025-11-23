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

// Tailwind badge variants
function statusClass(status) {
  if (!status) return "";
  const s = status.toUpperCase();
  if (s === "COMPLETED") {
    // herb green
    return "bg-[#e3f3df] border-[#c0e2bc] text-[#356b3a]";
  }
  if (s === "OUT_FOR_DELIVERY") {
    // carrot/orange
    return "bg-[#fff2de] border-[#f6c894] text-[#8a5b1f]";
  }
  if (s === "PROCESSING") {
    // beet/eggplant
    return "bg-[#f5e7fb] border-[#dfc1f2] text-[#5d3a7a]";
  }
  if (s === "RECEIVED") {
    // earthy beige
    return "bg-[#f7eee3] border-[#e3cfb4] text-[#7a5a36]";
  }
  // default neutral
  return "bg-[#f7eee3] border-[#e3cfb4] text-[#7a5a36]";
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
  <!-- page wrapper -->
  <div class="flex flex-col gap-[0.75rem]">
    <!-- header -->
    <header
      class="mb-[0.25rem] flex items-center justify-between gap-[0.75rem] max-sm:flex-col max-sm:items-start"
    >
      <div>
        <h2 class="m-0 text-[1.45rem] font-semibold tracking-tight text-[#2f2737]">
          Buyer – My Orders 🧺
        </h2>
        <p class="m-0 text-[0.95rem] text-[#6f7569]">
          Review your previous orders and quickly reorder your usual picks.
        </p>
      </div>

      <button
        class="cursor-pointer rounded-full border border-[rgba(142,176,135,0.9)] bg-transparent px-[0.9rem] py-[0.32rem] text-[0.85rem] text-[#49624b] transition hover:bg-[linear-gradient(135deg,#f5c58a,#8ac79e)] hover:text-[#283124] hover:shadow-[0_5px_14px_rgba(154,186,151,0.55)] disabled:cursor-default disabled:opacity-60"
        @click="loadMyOrders"
        :disabled="loading"
      >
        {{ loading ? "Refreshing..." : "Refresh" }}
      </button>
    </header>

    <!-- error -->
    <div
      v-if="error"
      class="mt-[0.4rem] rounded-[10px] border border-[#f6b8c2] bg-[#ffe5e9] px-[0.6rem] py-[0.45rem] text-[0.85rem] text-[#b3343f]"
    >
      Error: {{ error }}
    </div>

    <!-- loading -->
    <div
      v-if="loading"
      class="py-[0.4rem] text-[0.86rem] text-[#5c6157]"
    >
      Loading orders…
    </div>

    <!-- content -->
    <section v-else>
      <!-- orders grid -->
      <div
        v-if="orders.length > 0"
        class="grid grid-cols-1 gap-[0.9rem] md:grid-cols-2 xl:grid-cols-3"
      >
        <article
          v-for="order in orders"
          :key="order.id"
          class="flex flex-col gap-[0.5rem] rounded-[16px] border border-[#cfdcbe] bg-[#f2f6ee] p-[0.85rem] pb-[0.9rem] text-[0.9rem] transition-transform transition-shadow transition-colors hover:-translate-y-[2px] hover:border-[#bccf9f] hover:bg-[#edf3e7] hover:shadow-[0_10px_18px_rgba(149,170,131,0.45)]"
        >
          <!-- card header -->
          <header class="flex justify-between gap-[0.5rem]">
            <div>
              <h3 class="m-0 mb-[0.25rem] text-[1rem] text-[#2f3a2b]">
                #{{ order.id }}
              </h3>
              <p class="m-0 text-[0.8rem] text-[#6f7569]">
                Created:
                <span class="text-[#3e4a3c]">
                  {{ order.createdAt }}
                </span>
              </p>
              <p class="m-0 text-[0.8rem] text-[#6f7569]">
                Delivery date:
                <span class="text-[#3e4a3c]">
                  {{ order.deliveryDate }}
                </span>
              </p>
            </div>

            <span
              class="inline-flex items-center gap-[0.3rem] rounded-full border px-[0.65rem] py-[0.2rem] text-[0.75rem] uppercase tracking-[0.08em]"
              :class="statusClass(order.status)"
            >
              <span class="text-[0.9rem]">
                {{ statusIcon(order.status) }}
              </span>
              <span>
                {{ order.status }}
              </span>
            </span>
          </header>

          <!-- items -->
          <section
            class="rounded-[12px] bg-[#e7efe0] px-[0.6rem] py-[0.55rem]"
          >
            <h4 class="m-0 mb-[0.35rem] text-[0.86rem] text-[#2f3a2b]">
              Items
            </h4>
            <ul class="m-0 flex list-none flex-col gap-[0.28rem] p-0">
              <li
                v-for="(item, idx) in order.items"
                :key="idx"
                class="flex justify-between gap-[0.5rem] text-[0.84rem]"
              >
                <div class="flex flex-col gap-[0.05rem]">
                  <span class="font-medium text-[#2f3a2b]">
                    {{ item.productName || ("Product " + item.productId) }}
                  </span>
                  <span class="text-[0.78rem] text-[#6d7667]">
                    qty {{ item.quantity }} × €
                    {{ item.unitPrice.toFixed(2) }}
                  </span>
                </div>
                <div class="text-[0.84rem] text-[#324030]">
                  € {{ (item.quantity * item.unitPrice).toFixed(2) }}
                </div>
              </li>
            </ul>
          </section>

          <!-- footer -->
          <footer
            class="mt-[0.35rem] flex items-center justify-between"
          >
            <div class="flex flex-col text-[0.85rem] text-[#5e6457]">
              <span>Total</span>
              <strong class="text-[0.96rem] text-[#2f3a2b]">
                € {{ Number(order.totalAmount).toFixed(2) }}
              </strong>
            </div>

            <button
  class="cursor-pointer rounded-full px-4 py-[0.45rem] text-[0.88rem] font-semibold
         bg-[linear-gradient(135deg,#d98968,#d25564)] text-[#3a1c1f]
         border border-[#f1737e]
         shadow-[0_10px_20px_rgba(210,85,100,0.55)]
         transition-all duration-150 ease-out
         hover:-translate-y-[1px] hover:shadow-[0_14px_26px_rgba(210,85,100,0.75)]
         disabled:opacity-60 disabled:cursor-default"
  @click="reorder(order)"
>
  Reorder
</button>



          </footer>
        </article>
      </div>

      <!-- no orders -->
      <p
        v-else
        class="py-[0.4rem] text-[0.8rem] text-[#8a8f84]"
      >
        You don’t have any orders yet. Create one in the Buyer page.
      </p>
    </section>
  </div>
</template>

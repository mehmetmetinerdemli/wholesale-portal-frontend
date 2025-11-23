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

const pad = (n) => n.toString().padStart(2, "0");

function computeTodayDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  return `${y}-${m}-${d}`;
}

function isProductActive(product) {
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

onMounted(async () => {
  deliveryMinDate.value = computeTodayDate();

  await loadProducts();

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

    orderMessage.value = `Order #${result.id} created successfully. Status: ${
      result.status
    }, total: € ${result.totalAmount.toFixed(2)}`;

    cartItems.value = [];
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
  <div class="flex flex-col gap-4">
    <!-- HEADER -->
    <header class="flex flex-col justify-between gap-3 md:flex-row md:items-start">
      <div>
        <h2 class="m-0 text-[1.45rem] font-semibold tracking-tight text-[#2f2737]">
          Buyer – Create Order 🧺
        </h2>
        <p class="m-0 text-[0.95rem] text-[#6f7569]">
          Select fresh products, build your order and choose your delivery date.
        </p>
      </div>

      <div class="flex flex-wrap items-center justify-end gap-2">
        <span
          class="inline-flex items-center gap-1 rounded-full border border-[#c0e2bc] bg-[#e3f3df] px-2.5 py-[0.15rem] text-[0.75rem] text-[#356b3a]"
        >
          🥬 Live stock
        </span>
        <span
          class="inline-flex items-center gap-1 rounded-full border border-[#f6c894] bg-[#fff2de] px-2.5 py-[0.15rem] text-[0.75rem] text-[#8a5b1f]"
        >
          🥕 Next-day delivery (before cut-off)
        </span>
      </div>
    </header>

    <!-- CUTOFF BANNER -->
    <div
      v-if="cutoffInfo"
      class="flex items-center gap-2 rounded-xl border px-3 py-2 text-[0.9rem]"
      :class="cutoffPassed
        ? 'border-[#f6b8c2] bg-[#ffe5e9] text-[#a5394a]'
        : 'border-[#f6c894] bg-[#fff2de] text-[#7a5a1c]'"
    >
      <span class="text-[1.1rem]">⏰</span>
      <span>{{ cutoffInfo }}</span>
    </div>

    <!-- LAYOUT -->
    <section
      class="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)] items-start"
    >
      <!-- CREATE ORDER PANEL (TOP / LEFT) -->
      <div
        class="order-1 flex flex-col rounded-2xl border border-[#cfdcbe] bg-[#f2f6ee] px-4 py-4 shadow-[0_10px_24px_rgba(149,170,131,0.30)] md:order-none"
      >
        <header class="mb-3 flex flex-col gap-1">
          <h3 class="m-0 text-[1.05rem] font-semibold text-[#2f3a2b]">
            Create Order
          </h3>
          <p class="m-0 text-[0.85rem] text-[#6f7569]">
            Review your cart, choose a delivery date and submit your order.
          </p>
        </header>

        <!-- BUYER NAME -->
        <div class="mb-3 flex flex-col gap-1">
          <label class="text-[0.8rem] text-[#4f5a43]">Buyer name</label>
          <input
            v-model="buyerName"
            type="text"
            disabled
            :placeholder="authState.user?.name || 'Logged-in buyer'"
            class="w-full rounded-lg border border-[#cfdcc3] bg-[#fdfcf9] px-3 py-2 text-[0.88rem] text-[#2f3a2b] outline-none focus:border-[#8ac79e] focus:ring-2 focus:ring-[#8ac79e]/40"
          />
        </div>

        <!-- DELIVERY DATE -->
        <div class="mb-3 flex flex-col gap-1">
          <label for="deliveryDate" class="text-[0.8rem] text-[#4f5a43]"
            >Delivery date</label
          >
          <input
            id="deliveryDate"
            v-model="deliveryDate"
            type="date"
            :min="deliveryMinDate"
            class="w-full rounded-lg border border-[#cfdcc3] bg-[#fdfcf9] px-3 py-2 text-[0.88rem] text-[#2f3a2b] outline-none focus:border-[#8ac79e] focus:ring-2 focus:ring-[#8ac79e]/40"
          />
        </div>

        <!-- CART ITEMS -->
        <h4 class="mt-1 mb-2 text-[0.96rem] font-semibold text-[#2f3a2b]">
          Order items
        </h4>

        <p v-if="cartItems.length === 0" class="text-[0.8rem] text-[#8a8f84]">
          No items in the order yet. Add some from the product list.
        </p>

        <div
          v-else
          class="mb-2 flex max-h-64 flex-col gap-2 overflow-y-auto"
        >
          <div
            v-for="item in cartItems"
            :key="item.productId"
            class="flex justify-between gap-3 rounded-xl bg-[#edf4e8] px-3 py-2"
          >
            <div>
              <h5 class="m-0 mb-[2px] text-[0.9rem] font-medium text-[#2f3a2b]">
                {{ item.name }}
              </h5>
              <p class="m-0 text-[0.8rem] text-[#6f7569]">
                {{ item.quantity }} × € {{ item.unitPrice.toFixed(2) }}
              </p>
            </div>

            <div class="flex flex-col items-end gap-1">
              <span class="text-[0.86rem] text-[#2f3a2b]">
                € {{ (item.unitPrice * item.quantity).toFixed(2) }}
              </span>
              <button
                class="cursor-pointer text-[0.78rem] text-[#c73f5b] underline"
                @click="removeFromCart(item.productId)"
              >
                remove
              </button>
            </div>
          </div>
        </div>

        <!-- TOTAL -->
        <div
          v-if="cartItems.length > 0"
          class="mt-1 flex items-center justify-between text-[0.92rem] text-[#2f3a2b]"
        >
          <span>Total:</span>
          <strong>€ {{ cartTotal().toFixed(2) }}</strong>
        </div>

        <!-- MESSAGES -->
        <div
          v-if="orderError"
          class="mt-2 rounded-xl border border-[#f6b8c2] bg-[#ffe5e9] px-3 py-2 text-[0.85rem] text-[#b3343f]"
        >
          {{ orderError }}
        </div>

        <div
          v-if="orderMessage"
          class="mt-2 rounded-xl border border-[#c0e2bc] bg-[#e3f3df] px-3 py-2 text-[0.85rem] text-[#356b3a]"
        >
          {{ orderMessage }}
        </div>

        <!-- PLACE ORDER BUTTON (same style family as create promotion) -->
        <button
  class="cursor-pointer rounded-full px-4 py-[0.55rem] text-[0.96rem] font-semibold
         bg-[linear-gradient(135deg,#d98968,#d25564)] text-[#3a1c1f]
         border border-[#f1737e]
         shadow-[0_10px_20px_rgba(210,85,100,0.55)]
         transition-all duration-150 ease-out
         hover:-translate-y-[1px] hover:shadow-[0_14px_26px_rgba(210,85,100,0.75)]
         disabled:cursor-default disabled:opacity-60 disabled:shadow-none w-full mt-3"
  :disabled="orderSubmitting || cartItems.length === 0"
  @click="submitOrder"
>
  {{ orderSubmitting ? "Placing order..." : "Place order" }}
</button>

      </div>

      <!-- PRODUCTS LIST -->
      <div
        class="rounded-2xl border border-[#cfdcbe] bg-[#f2f6ee] px-4 py-4 shadow-[0_10px_24px_rgba(149,170,131,0.30)]"
      >
        <header class="mb-3 flex items-start justify-between gap-2">
          <div>
            <h3 class="m-0 text-[1.08rem] font-semibold text-[#2f3a2b]">
              Available Products
            </h3>
            <p class="m-0 mt-[2px] text-[0.85rem] text-[#6f7569]">
              Browse today’s catalog and add quantities to your order.
            </p>
          </div>
        </header>

        <div v-if="loading" class="text-[0.86rem] text-[#5c6157]">
          Loading products…
        </div>
        <div
          v-else-if="error"
          class="mt-2 rounded-xl border border-[#f6b8c2] bg-[#ffe5e9] px-3 py-2 text-[0.85rem] text-[#b3343f]"
        >
          Error: {{ error }}
        </div>

        <div
          v-else
          class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
        >
          <article
            v-for="product in products"
            :key="product.id"
            class="flex flex-col gap-2 rounded-2xl border border-[#d7e4c7] bg-[#f8fbf4] px-3.5 py-3 text-[0.9rem] shadow-[0_6px_14px_rgba(149,170,131,0.25)] transition-all duration-150 hover:-translate-y-[2px] hover:border-[#c3d7ae] hover:bg-[#f3f8ec] hover:shadow-[0_10px_18px_rgba(149,170,131,0.40)]"
          >
            <!-- HEADER with KG badge, no weird empty space -->
            <header
              class="flex items-start justify-between gap-2"
            >
              <div class="flex flex-col">
                <h4
                  class="m-0 mb-[3px] text-[0.98rem] font-semibold text-[#2f3a2b]"
                >
                  {{ product.name }}
                </h4>

                <div class="flex flex-wrap gap-1">
                  <span
                    v-if="product.grade"
                    class="rounded-full bg-[#f1e4ff] px-2 py-[2px] text-[0.7rem] text-[#5d3a7a]"
                  >
                    {{ product.grade }}
                  </span>
                  <span
                    v-if="product.origin"
                    class="rounded-full bg-[#f7ebde] px-2 py-[2px] text-[0.7rem] text-[#7a5a36]"
                  >
                    {{ product.origin }}
                  </span>
                </div>
              </div>

              <span
                class="inline-flex items-center justify-center rounded-full border border-[#d4ddc9] bg-[#edf4e8] px-3 py-1 text-[0.75rem] text-[#4e5b45]"
              >
                {{ product.unit }}
              </span>
            </header>

            <!-- PRICE -->
            <div class="mt-[2px] text-[0.92rem]">
              <span class="font-semibold text-[#2f3a2b]">
                € {{ product.price.toFixed(2) }}
              </span>
              <span class="text-[#6f7569]"> / {{ product.unit }}</span>
            </div>

            <!-- STOCK -->
            <div class="flex items-center gap-1 text-[0.8rem] text-[#5f6559]">
              <span
                class="text-[0.85rem]"
                :class="{
                  'text-[#4caf6f]': stockClass(product) === 'success',
                  'text-[#f2b546]': stockClass(product) === 'warning',
                  'text-[#e45d79]': stockClass(product) === 'danger'
                }"
              >
                ●
              </span>
              <span>{{ stockText(product) }}</span>
            </div>

            <!-- ACTIONS -->
            <div class="mt-1 flex items-center gap-2">
              <input
                v-model.number="product.quantityToOrder"
                type="number"
                min="0"
                :max="product.stockQty"
                placeholder="Qty"
                class="w-[80px] rounded-xl border border-[#cfdcc3] bg-[#fdfcf9] px-2 py-2 text-[0.8rem] text-[#2f3a2b] outline-none focus:border-[#8ac79e] focus:ring-2 focus:ring-[#8ac79e]/40"
              />

              <!-- ADD BUTTON – SAME STYLE AS REORDER -->
              <button
                class="cursor-pointer rounded-full px-4 py-[0.45rem] text-[0.88rem] font-semibold
                       bg-[linear-gradient(135deg,#d98968,#d25564)] text-[#3a1c1f]
                       border border-[#f1737e]
                       shadow-[0_10px_20px_rgba(210,85,100,0.55)]
                       transition-all duration-150 ease-out
                       hover:-translate-y-[1px] hover:shadow-[0_14px_26px_rgba(210,85,100,0.75)]
                       disabled:cursor-default disabled:opacity-60 disabled:shadow-none"
                :disabled="!canAdd(product)"
                @click="addToCart(product)"
              >
                Add
              </button>
            </div>

            <!-- HINTS -->
            <p
              v-if="!isProductActive(product)"
              class="m-0 mt-[2px] text-[0.76rem] text-[#c73f5b]"
            >
              This product is currently unavailable.
            </p>
            <p
              v-else-if="product.stockQty === 0"
              class="m-0 mt-[2px] text-[0.76rem] text-[#c73f5b]"
            >
              Out of stock.
            </p>
            <p
              v-else-if="product.stockQty < 5"
              class="m-0 mt-[2px] text-[0.76rem] text-[#c27c26]"
            >
              Limited stock – order soon.
            </p>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

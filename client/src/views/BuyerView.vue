<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { authState } from "../auth";
import { consumeReorderItems } from "../reorderStore";

const products = ref([]);
const loading = ref(true);
const error = ref("");

const buyerName = ref(authState.user?.name || "");
const deliveryDate = ref("");
const deliveryMinDate = ref("");
const cartItems = ref([]);
const orderSubmitting = ref(false);
const orderMessage = ref("");
const orderError = ref("");

const cutoffInfo = ref("");
const cutoffPassed = ref(false);
let cutoffIntervalId = null;

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
  if (cutoffIntervalId) clearInterval(cutoffIntervalId);
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
    if (!response.ok) throw new Error("Failed to load products");

    const data = await response.json();

    products.value = data
      .map((p) => ({
        ...p,
        quantityToOrder: 0,
        price: Number(p.price),
        stockQty: Number(p.stock_qty ?? p.stockQty),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
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
      `Not enough stock for "${product.name}". You already have ${alreadyInCart} in the cart and tried to add ${qty}. Available: ${product.stockQty}.`
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

    orderMessage.value = `Order #${result.id} created. Status: ${result.status}, total: € ${result.totalAmount.toFixed(
      2
    )}`;

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
        <h2 class="text-[1.45rem] font-semibold text-[#2f2737] m-0">
          Customer – Create Order 🧺
        </h2>
        <p class="text-[0.95rem] text-[#6f7569] m-0">
          Select products, build your order and choose your delivery date.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <span class="rounded-full border border-[#c0e2bc] bg-[#e3f3df] px-2.5 py-[0.15rem] text-[0.75rem] text-[#356b3a]">
          🥬 Live stock
        </span>
        <span class="rounded-full border border-[#f6c894] bg-[#fff2de] px-2.5 py-[0.15rem] text-[0.75rem] text-[#8a5b1f]">
          🥕 Next-day delivery (before cut-off)
        </span>
      </div>
    </header>

    <!-- CUT-OFF INFO -->
    <div
      v-if="cutoffInfo"
      class="flex items-center gap-2 rounded-xl border px-3 py-2 text-[0.9rem]"
      :class="cutoffPassed
        ? 'border-[#f6b8c2] bg-[#ffe5e9] text-[#a5394a]'
        : 'border-[#f6c894] bg-[#fff2de] text-[#7a5a1c]'"
    >
      <span>⏰</span>
      <span>{{ cutoffInfo }}</span>
    </div>

    <!-- MAIN LAYOUT -->
    <section class="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)]">
      
      <!-- LEFT: CREATE ORDER PANEL -->
      <div class="rounded-2xl border border-[#cfdcbe] bg-[#f2f6ee] p-4 shadow">
        
        <h3 class="text-[1.05rem] font-semibold text-[#2f3a2b] m-0">Create Order</h3>
        <p class="text-[0.85rem] text-[#6f7569] mb-3">
          Review your cart, choose a delivery date and submit.
        </p>

        <!-- BUYER NAME -->
        <div class="mb-3">
          <label class="text-[0.8rem] text-[#4f5a43]">Customer name</label>
          <input
            v-model="buyerName"
            disabled
            class="w-full rounded-lg border bg-white px-3 py-2 text-[0.88rem]"
          />
        </div>

        <!-- DELIVERY DATE -->
        <div class="mb-3">
          <label class="text-[0.8rem] text-[#4f5a43]">Delivery date</label>
          <input
            v-model="deliveryDate"
            type="date"
            :min="deliveryMinDate"
            class="w-full rounded-lg border bg-white px-3 py-2 text-[0.88rem]"
          />
        </div>

        <!-- CART ITEMS -->
        <h4 class="text-[0.96rem] font-semibold text-[#2f3a2b]">Order items</h4>

        <p v-if="cartItems.length === 0" class="text-[0.8rem] text-[#8a8f84]">
          No items yet. Add some from the product list.
        </p>

        <div
          v-else
          class="max-h-64 overflow-y-auto flex flex-col gap-2 mb-2"
        >
          <div
            v-for="item in cartItems"
            :key="item.productId"
            class="flex justify-between bg-[#edf4e8] rounded-xl px-3 py-2"
          >
            <div>
              <h5 class="text-[0.9rem] text-[#2f3a2b] m-0">{{ item.name }}</h5>
              <p class="text-[0.8rem] text-[#6f7569] m-0">
                {{ item.quantity }} × € {{ item.unitPrice.toFixed(2) }}
              </p>
            </div>

            <div class="flex flex-col items-end">
              <span>€ {{ (item.unitPrice * item.quantity).toFixed(2) }}</span>
              <button class="text-[#c73f5b] underline text-[0.78rem]" @click="removeFromCart(item.productId)">
                remove
              </button>
            </div>
          </div>
        </div>

        <!-- TOTAL -->
        <div
          v-if="cartItems.length > 0"
          class="flex justify-between text-[0.92rem] text-[#2f3a2b]"
        >
          <span>Total:</span>
          <strong>€ {{ cartTotal().toFixed(2) }}</strong>
        </div>

        <!-- ERRORS -->
        <div v-if="orderError" class="text-red-600 border bg-red-50 rounded p-2 mt-2">
          {{ orderError }}
        </div>
        <div v-if="orderMessage" class="text-green-700 border bg-green-50 rounded p-2 mt-2">
          {{ orderMessage }}
        </div>

        <!-- PLACE ORDER BUTTON (updated to Reorder style) -->
        <button
          class="w-full mt-3 rounded-full px-4 py-2 text-[1rem] font-semibold
                 bg-white text-[#3a1c1f]
                 border border-[#f2cfd4]
                 shadow-[0_10px_20px_rgba(210,85,100,0.25)]
                 hover:shadow-[0_14px_26px_rgba(210,85,100,0.35)]
                 transition-all duration-150
                 disabled:opacity-60 disabled:cursor-default"
          :disabled="orderSubmitting || cartItems.length === 0"
          @click="submitOrder"
        >
          {{ orderSubmitting ? "Placing order..." : "Place order" }}
        </button>
      </div>

      <!-- RIGHT: PRODUCT LIST -->
      <div class="rounded-2xl border border-[#cfdcbe] bg-[#f2f6ee] p-4 shadow">
        
        <h3 class="text-[1.08rem] font-semibold text-[#2f3a2b] m-0 mb-1">Available Products</h3>
        <p class="text-[0.85rem] text-[#6f7569] m-0 mb-3">
          Browse today’s catalog and add quantities.
        </p>

        <!-- LOADING -->
        <div v-if="loading" class="text-[#5c6157]">Loading products…</div>

        <!-- ERROR -->
        <div
          v-else-if="error"
          class="border bg-red-50 text-red-700 rounded p-2"
        >
          {{ error }}
        </div>

        <!-- PRODUCT GRID -->
        <div v-else class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          
          <article
            v-for="product in products"
            :key="product.id"
            class="flex flex-col gap-3 rounded-2xl border border-[#d7e4c7] bg-[#f8fbf4] px-3.5 py-3
                   shadow transition duration-150 hover:-translate-y-[2px] hover:border-[#c3d7ae] hover:bg-[#f3f8ec]"
          >
            
            <!-- IMAGE -->
            <div class="w-full h-36 rounded-xl overflow-hidden border border-[#d7e4c7] bg-[#eef3e8]">
              <img
                v-if="product.image_url"
                :src="`http://localhost:4000${product.image_url}`"
                class="w-full h-full object-cover"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center text-[#8a8f84]"
              >
                No image
              </div>
            </div>

            <!-- HEADER -->
            <header class="flex justify-between">
              <div>
                <h4 class="font-semibold text-[#2f3a2b] m-0">{{ product.name }}</h4>
                <div class="flex gap-1 mt-1">
                  <span v-if="product.grade" class="bg-purple-100 text-purple-700 px-2 rounded-full text-xs">{{ product.grade }}</span>
                  <span v-if="product.origin" class="bg-yellow-100 text-yellow-700 px-2 rounded-full text-xs">{{ product.origin }}</span>
                </div>
              </div>

              <span class="border bg-green-50 border-green-200 text-green-800 px-2 rounded-full text-xs flex items-center">
                {{ product.unit }}
              </span>
            </header>

            <!-- PRICE -->
            <div class="text-[#2f3a2b]">
              <strong>€ {{ product.price.toFixed(2) }}</strong>
              <span class="text-[#6f7569]">/ {{ product.unit }}</span>
            </div>

            <!-- STOCK -->
            <div class="flex items-center gap-1 text-sm text-[#5f6559]">
              <span
                :class="{
                  'text-green-600': stockClass(product) === 'success',
                  'text-yellow-500': stockClass(product) === 'warning',
                  'text-red-500': stockClass(product) === 'danger'
                }"
              >
                ●
              </span>
              <span>{{ stockText(product) }}</span>
            </div>

            <!-- ACTIONS -->
            <div class="flex gap-2">
              <input
                v-model.number="product.quantityToOrder"
                type="number"
                min="0"
                :max="product.stockQty"
                placeholder="Qty"
                class="w-[80px] rounded-xl border bg-white px-2 py-1 text-sm"
              />

              <!-- ADD BUTTON — updated to match Reorder style -->
              <button
                class="rounded-full px-4 py-1.5 text-[0.88rem] font-semibold
                       bg-white text-[#3a1c1f]
                       border border-[#f2cfd4]
                       shadow-[0_6px_14px_rgba(210,85,100,0.25)]
                       hover:shadow-[0_10px_20px_rgba(210,85,100,0.45)]
                       transition-all duration-150"
                :disabled="!canAdd(product)"
                @click="addToCart(product)"
              >
                Add
              </button>
            </div>

            <!-- HINTS -->
            <p v-if="!isProductActive(product)" class="text-red-500 text-xs m-0">
              This product is unavailable.
            </p>
            <p v-else-if="product.stockQty === 0" class="text-red-500 text-xs m-0">
              Out of stock.
            </p>
            <p v-else-if="product.stockQty < 5" class="text-yellow-600 text-xs m-0">
              Limited stock.
            </p>

          </article>
        </div>
      </div>

    </section>
  </div>
</template>

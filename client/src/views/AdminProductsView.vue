<script setup>
import { ref, onMounted } from "vue";
import { authState } from "../auth";

const products = ref([]);
const loading = ref(false);
const error = ref("");

// which row is currently saving / deleting
const savingId = ref(null);
const deletingId = ref(null);

onMounted(() => {
  loadProducts();
});

async function loadProducts() {
  loading.value = true;
  error.value = "";

  try {
    const response = await fetch("http://localhost:4000/api/products", {
      headers: {
        Authorization: authState.token ? `Bearer ${authState.token}` : "",
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to load products");
    }

    const data = await response.json();
    products.value = data.map((p) => ({
      ...p,
      price: Number(p.price),
      stockQty: Number(p.stockQty),
    }));
  } catch (err) {
    console.error(err);
    error.value = err.message || "Error loading products.";
  } finally {
    loading.value = false;
  }
}

async function saveProduct(product) {
  if (!authState.token) {
    alert("You must be logged in as admin to edit products.");
    return;
  }

  savingId.value = product.id;

  try {
    const response = await fetch(
      `http://localhost:4000/api/products/${product.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authState.token}`,
        },
        body: JSON.stringify({
          name: product.name,
          grade: product.grade,
          origin: product.origin,
          unit: product.unit,
          price: Number(product.price),
          stockQty: Number(product.stockQty),
          isActive: product.isActive ?? 1,
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to update product");
    }

    const updated = await response.json();

    const idx = products.value.findIndex((p) => p.id === updated.id);
    if (idx !== -1) {
      products.value[idx] = {
        ...updated,
        price: Number(updated.price),
        stockQty: Number(updated.stockQty),
      };
    }
  } catch (err) {
    console.error(err);
    alert(err.message || "Error updating product.");
  } finally {
    savingId.value = null;
  }
}

async function deleteProduct(product) {
  if (!authState.token) {
    alert("You must be logged in as admin to delete products.");
    return;
  }

  if (!confirm(`Deactivate product "${product.name}"?`)) return;

  deletingId.value = product.id;

  try {
    const response = await fetch(
      `http://localhost:4000/api/products/${product.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to delete product");
    }

    products.value = products.value.filter((p) => p.id !== product.id);
  } catch (err) {
    console.error(err);
    alert(err.message || "Error deleting product.");
  } finally {
    deletingId.value = null;
  }
}
</script>

<template>
  <!-- page wrapper -->
  <div class="flex flex-col gap-4 text-[#2f2737]">
    <!-- header row (icon + title + refresh) -->
    <header
      class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-11 w-11 items-center justify-center rounded-2xl text-2xl shadow-[0_8px_18px_rgba(110,129,107,0.4)] bg-[radial-gradient(circle_at_20%_20%,#8ad08f,#81567a)]"
        >
          🥒
        </div>
        <div>
          <h2 class="m-0 mb-1 text-[1.45rem] font-semibold text-[#2f2737]">
            Admin – Products
          </h2>
          <p class="m-0 text-[0.95rem] text-[#7b748e]">
            Manage the catalog: update prices and stock, add new items, and
            deactivate products.
          </p>
        </div>
      </div>

      <button
        class="inline-flex items-center justify-center rounded-full border border-[#c0b9ec] bg-[#f4f0ff] px-4 py-1.5 text-[0.85rem] font-medium text-[#4b4c79] shadow-sm transition hover:bg-[#e5ddff] hover:shadow-[0_4px_10px_rgba(158,146,222,0.5)] disabled:cursor-default disabled:opacity-60"
        @click="loadProducts"
        :disabled="loading"
      >
        {{ loading ? "Refreshing..." : "Refresh" }}
      </button>
    </header>

    <!-- error -->
    <div
      v-if="error"
      class="mt-1 rounded-[10px] border border-[#f4bac7] bg-[#ffe6eb] px-[0.6rem] py-[0.45rem] text-[0.86rem] text-[#933241]"
    >
      Error: {{ error }}
    </div>

    <!-- main card, centered by App.vue max-w-5xl -->
    <section
      class="rounded-[22px] border border-[#464059] bg-[radial-gradient(circle_at_top,#352d45_0%,#2b2636_55%,#262130_100%)] px-5 pt-4 pb-5 text-[#f5f3ff] shadow-[0_16px_32px_rgba(34,26,46,0.45)]"
    >
      <!-- card header -->
      <div class="mb-3 flex items-center justify-between">
        <h3 class="m-0 text-[1.05rem] text-[#fdfcff]">
          All Products
        </h3>
        <span
          class="inline-flex items-center rounded-full border border-[#5a5670] bg-[rgba(16,15,26,0.45)] px-3 py-1 text-[0.75rem] text-[#d7d2ff]"
        >
          {{ products.length }} item{{ products.length === 1 ? "" : "s" }}
        </span>
      </div>

      <!-- loading state -->
      <div
        v-if="loading"
        class="py-2 text-[0.9rem] text-[#c2bfec]"
      >
        Loading products…
      </div>

      <!-- table -->
      <table
        v-else-if="products.length > 0"
        class="w-full border-collapse text-[0.9rem]"
      >
        <thead>
          <tr class="bg-[rgba(24,21,34,0.95)]">
            <th
              class="border-b border-[#47425c] px-3 py-2 text-left text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-[#b9b4d7]"
            >
              ID
            </th>
            <th
              class="border-b border-[#47425c] px-3 py-2 text-left text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-[#b9b4d7]"
            >
              Name
            </th>
            <th
              class="border-b border-[#47425c] px-3 py-2 text-left text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-[#b9b4d7]"
            >
              Origin
            </th>
            <th
              class="border-b border-[#47425c] px-3 py-2 text-left text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-[#b9b4d7]"
            >
              Grade
            </th>
            <th
              class="border-b border-[#47425c] px-3 py-2 text-left text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-[#b9b4d7]"
            >
              Unit
            </th>
            <th
              class="border-b border-[#47425c] px-3 py-2 text-left text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-[#b9b4d7]"
            >
              Price (€)
            </th>
            <th
              class="border-b border-[#47425c] px-3 py-2 text-left text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-[#b9b4d7]"
            >
              Stock
            </th>
            <th
              class="border-b border-[#47425c] px-3 py-2 text-left text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-[#b9b4d7]"
            >
              Active
            </th>
            <th
              class="border-b border-[#47425c] px-3 py-2 text-left text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-[#b9b4d7]"
            >
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="product in products"
            :key="product.id"
            class="border-b border-[#3a344a] bg-[#2a2535] transition hover:bg-[#383149] odd:bg-[#2a2535] even:bg-[#30293e]"
          >
            <!-- ID -->
            <td class="whitespace-nowrap px-3 py-2 font-semibold text-[#e3deff]">
              #{{ product.id }}
            </td>

            <!-- Name -->
            <td class="px-3 py-2">
              <input
                v-model="product.name"
                class="w-full rounded-full border border-[#5a5670] bg-[#251f31] px-4 py-1 text-[0.9rem] text-[#f7f5ff] outline-none shadow-inner shadow-black/40 focus:border-[#8ccf9a] focus:shadow-[0_0_0_1px_rgba(140,207,154,0.5)]"
              />
            </td>

            <!-- Origin -->
            <td class="px-3 py-2">
              <input
                v-model="product.origin"
                class="w-full rounded-full border border-[#5a5670] bg-[#251f31] px-4 py-1 text-[0.9rem] text-[#f7f5ff] outline-none shadow-inner shadow-black/40 focus:border-[#8ccf9a] focus:shadow-[0_0_0_1px_rgba(140,207,154,0.5)]"
              />
            </td>

            <!-- Grade -->
            <td class="px-3 py-2">
              <input
                v-model="product.grade"
                class="w-20 rounded-full border border-[#5a5670] bg-[#251f31] px-3 py-1 text-center text-[0.9rem] text-[#f7f5ff] outline-none shadow-inner shadow-black/40 focus:border-[#8ccf9a] focus:shadow-[0_0_0_1px_rgba(140,207,154,0.5)]"
              />
            </td>

            <!-- Unit -->
            <td class="px-3 py-2">
              <input
                v-model="product.unit"
                class="w-20 rounded-full border border-[#5a5670] bg-[#251f31] px-3 py-1 text-center text-[0.9rem] text-[#f7f5ff] outline-none shadow-inner shadow-black/40 focus:border-[#8ccf9a] focus:shadow-[0_0_0_1px_rgba(140,207,154,0.5)]"
              />
            </td>

            <!-- Price -->
            <td class="px-3 py-2">
              <input
                v-model.number="product.price"
                type="number"
                step="0.01"
                class="w-24 rounded-full border border-[#5a5670] bg-[#251f31] px-3 py-1 text-center text-[0.9rem] text-[#f7f5ff] outline-none shadow-inner shadow-black/40 focus:border-[#8ccf9a] focus:shadow-[0_0_0_1px_rgba(140,207,154,0.5)]"
              />
            </td>

            <!-- Stock -->
            <td class="px-3 py-2">
              <input
                v-model.number="product.stockQty"
                type="number"
                class="w-24 rounded-full border border-[#5a5670] bg-[#251f31] px-3 py-1 text-center text-[0.9rem] text-[#f7f5ff] outline-none shadow-inner shadow-black/40 focus:border-[#8ccf9a] focus:shadow-[0_0_0_1px_rgba(140,207,154,0.5)]"
              />
            </td>

            <!-- Active pill -->
            <td class="px-3 py-2">
              <span
                class="inline-flex items-center rounded-full border px-3 py-[0.2rem] text-[0.78rem] font-semibold"
                :class="
                  product.isActive
                    ? 'border-[#5ad47c] bg-[#1e3b29] text-[#e4ffe9]'
                    : 'border-[#f29cae] bg-[#4b1f2b] text-[#ffe3ea]'
                "
              >
                {{ product.isActive ? "Active" : "Inactive" }}
              </span>
            </td>

            <!-- Actions -->
            <td class="px-3 py-2">
              <div class="flex flex-wrap gap-2">
                <button
                  class="inline-flex items-center justify-center rounded-full bg-[#2f7b47] px-4 py-[0.35rem] text-[0.82rem] font-semibold text-white shadow-[0_4px_10px_rgba(29,95,55,0.6)] transition hover:bg-[#369957] hover:-translate-y-[1px] disabled:cursor-default disabled:opacity-60 disabled:shadow-none"
                  @click="saveProduct(product)"
                  :disabled="savingId === product.id"
                >
                  {{ savingId === product.id ? "Saving..." : "Save" }}
                </button>
                <button
                  class="inline-flex items-center justify-center rounded-full bg-[#c53b4a] px-4 py-[0.35rem] text-[0.82rem] font-semibold text-white shadow-[0_4px_10px_rgba(148,27,45,0.6)] transition hover:bg-[#e0495c] hover:-translate-y-[1px] disabled:cursor-default disabled:opacity-60 disabled:shadow-none"
                  @click="deleteProduct(product)"
                  :disabled="deletingId === product.id"
                >
                  {{ deletingId === product.id ? "Deleting..." : "Delete" }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- no products -->
      <p
        v-else
        class="py-2 text-[0.86rem] text-[#c2bfec]"
      >
        No products yet.
      </p>
    </section>
  </div>
</template>

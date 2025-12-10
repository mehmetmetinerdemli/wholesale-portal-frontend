<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { authState } from "../auth";

const router = useRouter();

const newProduct = ref({
  name: "",
  grade: "",
  origin: "",
  unit: "",
  price: 0,
  stockQty: 0,
});

const selectedImage = ref(null);
const imagePreview = ref(null);

const creating = ref(false);
const error = ref("");
const success = ref("");

function resetForm() {
  newProduct.value = {
    name: "",
    grade: "",
    origin: "",
    unit: "",
    price: 0,
    stockQty: 0,
  };
  selectedImage.value = null;
  imagePreview.value = null;
}

function handleImage(e) {
  const file = e.target.files[0];
  if (!file) return;

  selectedImage.value = file;
  imagePreview.value = URL.createObjectURL(file);
}

async function createProduct() {
  error.value = "";
  success.value = "";

  if (!authState.token) {
    error.value = "You must be logged in as admin to create products.";
    return;
  }

  const p = newProduct.value;

  if (!p.name || !p.grade || !p.origin || !p.unit) {
    error.value = "Please fill in Name, Grade, Origin, and Unit.";
    return;
  }

  if (p.price < 0 || p.stockQty < 0) {
    error.value = "Price and Stock quantity cannot be negative.";
    return;
  }

  // Build FormData instead of JSON
  const formData = new FormData();
  formData.append("name", p.name);
  formData.append("grade", p.grade);
  formData.append("origin", p.origin);
  formData.append("unit", p.unit);
  formData.append("price", p.price);
  formData.append("stock_qty", p.stockQty);
  formData.append("is_active", 1);

  if (selectedImage.value) {
    formData.append("image", selectedImage.value);
  }

  creating.value = true;

  try {
    const response = await fetch("http://localhost:4000/api/products", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authState.token}`,
      },
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Failed to create product");
    }

    success.value = `Product "${p.name}" created successfully.`;
    resetForm();
  } catch (err) {
    console.error(err);
    error.value = err.message || "Error creating product.";
  } finally {
    creating.value = false;
  }
}

function goToProducts() {
  router.push("/admin/products");
}
</script>

<template>
  <div class="flex flex-col gap-4 text-[#2f2737]">
    <header
      class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-11 w-11 items-center justify-center rounded-2xl text-2xl shadow-[0_8px_18px_rgba(110,129,107,0.4)] bg-[radial-gradient(circle_at_20%_20%,#8ad08f,#81567a)]"
        >
          🧺
        </div>
        <div>
          <h2 class="m-0 text-[1.45rem] font-semibold tracking-tight text-[#2f2737]">
            Admin – Add Product
          </h2>
          <p class="m-0 text-[0.95rem] text-[#7b748e]">
            Add a new item to the catalog with price, stock and origin details.
          </p>
        </div>
      </div>

      <button
        class="inline-flex items-center justify-center rounded-full border border-[rgba(144,177,137,0.95)] bg-transparent px-4 py-1.5 text-[0.85rem] font-medium text-[#3f5b41] shadow-sm transition hover:bg-gradient-to-r hover:from-[#f5c58a] hover:to-[#8ac79e] hover:text-[#263121] hover:shadow-[0_5px_14px_rgba(177,179,132,0.6)]"
        type="button"
        @click="goToProducts"
      >
        ← Back to products
      </button>
    </header>

    <div
      v-if="error"
      class="rounded-[10px] border border-[#f4bac7] bg-[#ffe6eb] px-[0.6rem] py-[0.45rem] text-[0.86rem] text-[#933241]"
    >
      {{ error }}
    </div>

    <div
      v-if="success"
      class="rounded-[10px] border border-[#b4ddc0] bg-[#e0f3e6] px-[0.6rem] py-[0.45rem] text-[0.86rem] text-[#25633e]"
    >
      {{ success }}
    </div>

    <section
      class="grid gap-5 rounded-[22px] border border-[#464059] bg-[radial-gradient(circle_at_top,#352d45_0%,#2b2636_55%,#262130_100%)] px-5 pt-4 pb-5 text-[#f5f3ff] shadow-[0_16px_32px_rgba(34,26,46,0.45)] md:grid-cols-[1.4fr_1fr]"
    >
      <form class="flex flex-col" @submit.prevent="createProduct">
        <h3 class="mb-2 text-[1.05rem] text-[#fdfcff]">
          New product details
        </h3>

        <!-- Name -->
        <div class="mb-3 flex flex-col gap-[0.3rem]">
          <label class="text-[0.8rem] text-[#e1ddff]">Name</label>
          <input
            v-model="newProduct.name"
            type="text"
            placeholder="Banana"
            class="rounded-[9px] border border-[#524d67] bg-[#241f30] px-[0.7rem] py-[0.48rem] text-[0.92rem] text-[#f7f5ff] outline-none"
          />
        </div>

        <!-- Grade / Unit -->
        <div class="mb-3 grid gap-3 md:grid-cols-2">
          <div class="flex flex-col">
            <label class="text-[0.8rem] text-[#e1ddff]">Grade</label>
            <input
              v-model="newProduct.grade"
              type="text"
              class="rounded-[9px] border border-[#524d67] bg-[#241f30] px-[0.7rem] py-[0.48rem]"
            />
          </div>

          <div class="flex flex-col">
            <label class="text-[0.8rem] text-[#e1ddff]">Unit</label>
            <input
              v-model="newProduct.unit"
              type="text"
              class="rounded-[9px] border border-[#524d67] bg-[#241f30] px-[0.7rem] py-[0.48rem]"
            />
          </div>
        </div>

        <!-- Origin -->
        <div class="mb-3 flex flex-col">
          <label class="text-[0.8rem] text-[#e1ddff]">Origin</label>
          <input
            v-model="newProduct.origin"
            type="text"
            class="rounded-[9px] border border-[#524d67] bg-[#241f30] px-[0.7rem] py-[0.48rem]"
          />
        </div>

        <!-- Price / Stock -->
        <div class="mb-3 grid gap-3 md:grid-cols-2">
          <div class="flex flex-col">
            <label class="text-[0.8rem] text-[#e1ddff]">Price (€)</label>
            <input
              v-model.number="newProduct.price"
              type="number"
              min="0"
              step="0.01"
              class="rounded-[9px] border border-[#524d67] bg-[#241f30] px-[0.7rem] py-[0.48rem]"
            />
          </div>

          <div class="flex flex-col">
            <label class="text-[0.8rem] text-[#e1ddff]">Stock quantity</label>
            <input
              v-model.number="newProduct.stockQty"
              type="number"
              min="0"
              class="rounded-[9px] border border-[#524d67] bg-[#241f30] px-[0.7rem] py-[0.48rem]"
            />
          </div>
        </div>

        <!-- Image upload -->
        <div class="mb-4 flex flex-col">
          <label class="text-[0.8rem] text-[#e1ddff]">Product image</label>
          <input
            type="file"
            accept="image/*"
            @change="handleImage"
            class="rounded-[9px] border border-[#524d67] bg-[#241f30] px-[0.7rem] py-[0.48rem] text-[#cfcbe8]"
          />
        </div>

        <!-- Submit -->
        <button
          class="mt-[0.35rem] inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#8ccf9a,#4fa4d9)] px-[0.8rem] py-[0.6rem] text-[0.92rem] font-medium text-white"
          type="submit"
          :disabled="creating"
        >
          {{ creating ? "Creating..." : "Create product" }}
        </button>
      </form>

      <!-- Preview -->
      <div
        class="mt-4 flex flex-col gap-3 rounded-[18px] border border-[#514563] bg-[radial-gradient(circle_at_top,#3d324d_0%,#2a2435_55%,#221d2b_100%)] p-4 text-sm"
      >
        <p class="text-[#a9a3d0] text-xs uppercase tracking-widest">
          Preview
        </p>

        <!-- Preview image -->
        <div
          v-if="imagePreview"
          class="w-full h-40 rounded-xl overflow-hidden border border-[#6b6281]"
        >
          <img :src="imagePreview" class="w-full h-full object-cover" />
        </div>

        <div class="flex items-center justify-between mt-3">
          <div>
            <p class="text-xs text-[#9b95c0]">Product name</p>
            <p class="text-[1.1rem] font-semibold">
              {{ newProduct.name || "Example product" }}
            </p>
          </div>

          <span
            class="inline-flex items-center rounded-full bg-[#1e3b29] px-3 py-[0.2rem] text-[0.78rem] font-semibold text-[#e4ffe9]"
          >
            Active
          </span>
        </div>

        <div class="mt-3 grid grid-cols-2 gap-3 text-xs text-[#c1bddf]">
          <div>
            <p class="text-[#8c86b2] text-[0.7rem] uppercase">Origin</p>
            <p>{{ newProduct.origin || "—" }}</p>
          </div>

          <div>
            <p class="text-[#8c86b2] text-[0.7rem] uppercase">Grade / Unit</p>
            <p>
              {{ newProduct.grade || "—" }}
              <span v-if="newProduct.unit">·</span>
              {{ newProduct.unit || "" }}
            </p>
          </div>

          <div>
            <p class="text-[#8c86b2] text-[0.7rem] uppercase">Price</p>
            <p>€ {{ newProduct.price }}</p>
          </div>

          <div>
            <p class="text-[#8c86b2] text-[0.7rem] uppercase">Stock</p>
            <p>
              {{ newProduct.stockQty }} {{ newProduct.unit }}
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

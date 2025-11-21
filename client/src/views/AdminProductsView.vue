<script setup>
import { ref, onMounted } from "vue";
import { authState } from "../auth";

const products = ref([]);
const loading = ref(false);
const error = ref("");

// new product form
const newProduct = ref({
  name: "",
  grade: "",
  origin: "",
  unit: "",
  price: 0,
  stockQty: 0,
});

const savingId = ref(null);
const creating = ref(false);
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

async function createProduct() {
  if (!authState.token) {
    alert("You must be logged in as admin to create products.");
    return;
  }

  const p = newProduct.value;

  if (!p.name || !p.grade || !p.origin || !p.unit) {
    alert("Please fill in name, grade, origin and unit.");
    return;
  }

  creating.value = true;

  try {
    const response = await fetch("http://localhost:4000/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authState.token}`,
      },
      body: JSON.stringify({
        name: p.name,
        grade: p.grade,
        origin: p.origin,
        unit: p.unit,
        price: Number(p.price),
        stockQty: Number(p.stockQty),
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to create product");
    }

    const created = await response.json();
    products.value.push({
      ...created,
      price: Number(created.price),
      stockQty: Number(created.stockQty),
    });

    newProduct.value = {
      name: "",
      grade: "",
      origin: "",
      unit: "",
      price: 0,
      stockQty: 0,
    };
  } catch (err) {
    console.error(err);
    alert(err.message || "Error creating product.");
  } finally {
    creating.value = false;
  }
}
</script>

<template>
  <div class="admin-products-page">
    <header class="admin-header">
      <div class="admin-title-block">
        <div class="icon-badge">
          🥒
        </div>
        <div>
          <h2>Admin – Products</h2>
          <p class="subtitle">
            Manage the catalog: update prices and stock, add new items, and deactivate products.
          </p>
        </div>
      </div>

      <button class="btn btn-refresh" @click="loadProducts" :disabled="loading">
        {{ loading ? "Refreshing..." : "Refresh" }}
      </button>
    </header>

    <div v-if="error" class="error">Error: {{ error }}</div>

    <section class="layout">
      <!-- LEFT: product list -->
      <div class="column column--table">
        <div class="column-header">
          <h3>All Products</h3>
          <span class="tag-count">
            {{ products.length }} item{{ products.length === 1 ? "" : "s" }}
          </span>
        </div>

        <div>
          <div v-if="loading" class="info">Loading products…</div>

          <table v-else-if="products.length > 0" class="products-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Origin</th>
                <th>Grade</th>
                <th>Unit</th>
                <th>Price (€)</th>
                <th>Stock</th>
                <th>Active</th>
                <th style="width: 190px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in products" :key="product.id">
                <td class="col-id">#{{ product.id }}</td>
                <td>
                  <input v-model="product.name" class="cell-input" />
                </td>
                <td>
                  <input v-model="product.origin" class="cell-input" />
                </td>
                <td>
                  <input v-model="product.grade" class="cell-input small" />
                </td>
                <td>
                  <input v-model="product.unit" class="cell-input small" />
                </td>
                <td>
                  <input
                    v-model.number="product.price"
                    type="number"
                    step="0.01"
                    class="cell-input small"
                  />
                </td>
                <td>
                  <input
                    v-model.number="product.stockQty"
                    type="number"
                    class="cell-input small"
                  />
                </td>
                <td class="col-active">
                  <span
                    class="active-pill"
                    :class="product.isActive ? 'active-pill--on' : 'active-pill--off'"
                  >
                    {{ product.isActive ? "Active" : "Inactive" }}
                  </span>
                </td>
                <td class="col-actions">
                  <button
                    class="btn btn-save"
                    @click="saveProduct(product)"
                    :disabled="savingId === product.id"
                  >
                    {{ savingId === product.id ? "Saving..." : "Save" }}
                  </button>
                  <button
                    class="btn btn-delete"
                    @click="deleteProduct(product)"
                    :disabled="deletingId === product.id"
                  >
                    {{ deletingId === product.id ? "Deleting..." : "Delete" }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <p v-else class="info small">
            No products yet. Add a new item using the form on the right.
          </p>
        </div>
      </div>

      <!-- RIGHT: create product -->
      <div class="column column--form">
        <h3>Add new product</h3>
        <p class="column-subtitle">
          Quickly add fresh items to the catalog.
        </p>

        <form class="form" @submit.prevent="createProduct">
          <div class="field">
            <label>Name</label>
            <input v-model="newProduct.name" type="text" />
          </div>
          <div class="field">
            <label>Grade</label>
            <input v-model="newProduct.grade" type="text" placeholder="e.g. A" />
          </div>
          <div class="field">
            <label>Origin</label>
            <input v-model="newProduct.origin" type="text" placeholder="e.g. Spain" />
          </div>
          <div class="field">
            <label>Unit</label>
            <input v-model="newProduct.unit" type="text" placeholder="e.g. kg" />
          </div>
          <div class="field">
            <label>Price (€)</label>
            <input
              v-model.number="newProduct.price"
              type="number"
              step="0.01"
            />
          </div>
          <div class="field">
            <label>Stock quantity</label>
            <input v-model.number="newProduct.stockQty" type="number" />
          </div>

          <button class="primary-btn" type="submit" :disabled="creating">
            {{ creating ? "Creating..." : "Create product" }}
          </button>
        </form>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Page-level text now dark enough to read on the light cream background */
.admin-products-page {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  color: #2f2737;
}

/* Header on cream background */
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  border-radius: 16px;
  background: radial-gradient(circle at 20% 20%, #8ad08f, #81567a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  box-shadow: 0 8px 18px rgba(110, 129, 107, 0.4);
}

.admin-header h2 {
  margin: 0 0 0.15rem;
  font-size: 1.45rem;
  color: #2f2737; /* dark plum -> clearly visible */
}

.subtitle {
  margin: 0;
  color: #7b748e;
  font-size: 0.95rem;
}

/* Generic button base */
.btn {
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.32rem 0.9rem;
  transition: background 0.15s ease, box-shadow 0.15s ease,
    transform 0.08s ease, opacity 0.15s ease, color 0.15s ease;
}

/* Refresh button – softer */
.btn-refresh {
  background: #f4f0ff;
  color: #4b4c79;
  border: 1px solid #c0b9ec;
}

.btn-refresh:hover:not(:disabled) {
  background: #e5ddff;
  box-shadow: 0 4px 10px rgba(158, 146, 222, 0.5);
}

.btn-refresh:disabled {
  opacity: 0.65;
  cursor: default;
}

/* Messages */
.error {
  color: #933241;
  background: #ffe6eb;
  border-radius: 10px;
  border: 1px solid #f4bac7;
  padding: 0.45rem 0.6rem;
  margin: 0.4rem 0;
  font-size: 0.86rem;
}

.info {
  padding: 0.4rem 0;
  font-size: 0.86rem;
  color: #6f708f;
}

.info.small {
  font-size: 0.8rem;
  color: #9a9cb5;
}

/* Layout: dark cards on soft cream */
.layout {
  display: grid;
  grid-template-columns: 2fr 1.15fr;
  gap: 1.1rem;
  align-items: flex-start;
}

/* Soft plum-basil cards (lighter than before) */
.column {
  background: radial-gradient(circle at top, #352d45 0%, #2b2636 55%, #262130 100%);
  border-radius: 22px;
  padding: 1rem 1.1rem 1.1rem;
  border: 1px solid #464059;
  box-shadow: 0 16px 32px rgba(34, 26, 46, 0.45);
  color: #f5f3ff;
}

/* Column headers */
.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
}

.column-header h3,
.column--form h3 {
  margin: 0;
  font-size: 1.05rem;
  color: #fdfcff;
}

.tag-count {
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  background: rgba(16, 15, 26, 0.45);
  border: 1px solid #5a5670;
  color: #d7d2ff;
}

.column--form .column-subtitle {
  margin: 0.25rem 0 0.7rem;
  font-size: 0.85rem;
  color: #bbb7d4;
}

/* Table */
.products-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.86rem;
}

.products-table thead tr {
  background: rgba(24, 21, 34, 0.95);
}

.products-table th,
.products-table td {
  padding: 0.5rem 0.45rem;
  text-align: left;
}

.products-table th {
  font-weight: 600;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #b9b4d7;
  border-bottom: 1px solid #47425c;
}

.products-table tbody tr {
  border-bottom: 1px solid #3a344a;
  background: #2a2535;
  transition: background 0.15s ease;
}

.products-table tbody tr:nth-child(even) {
  background: #30293e;
}

.products-table tbody tr:hover {
  background: #383149;
}

/* Table columns / cells */
.col-id {
  white-space: nowrap;
  color: #e3deff;
  font-weight: 600;
}

.col-active {
  white-space: nowrap;
}

.col-actions {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

/* Active pill */
.active-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.12rem 0.6rem;
  border-radius: 999px;
  font-size: 0.7rem;
  border: 1px solid transparent;
}

.active-pill--on {
  background: #243b2b;
  border-color: #77c785;
  color: #c3f4ca;
}

.active-pill--off {
  background: #472431;
  border-color: #d6798e;
  color: #ffd0da;
}

/* Inputs in table */
.cell-input {
  width: 100%;
  padding: 0.25rem 0.4rem;
  font-size: 0.8rem;
  border-radius: 8px;
  border: 1px solid #524d67;
  background: #221f2b;
  color: #f7f5ff;
  outline: none;
}

.cell-input.small {
  max-width: 90px;
}

.cell-input:focus {
  border-color: #8ccf9a;
  box-shadow: 0 0 0 1px rgba(140, 207, 154, 0.4);
}

/* Row buttons */
.btn-save {
  background: #284936;
  color: #d3f8dc;
  border: 1px solid #71bc82;
}

.btn-save:hover:not(:disabled) {
  background: #2f5d42;
  box-shadow: 0 5px 14px rgba(113, 188, 130, 0.55);
}

.btn-delete {
  background: #4c2a34;
  color: #ffd4dd;
  border: 1px solid #d77c91;
}

.btn-delete:hover:not(:disabled) {
  background: #5d2f3f;
  box-shadow: 0 5px 14px rgba(199, 111, 133, 0.6);
}

.btn-save:disabled,
.btn-delete:disabled {
  opacity: 0.6;
  cursor: default;
  box-shadow: none;
}

/* Form */
.form {
  display: flex;
  flex-direction: column;
}

.field {
  margin-bottom: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.field label {
  font-size: 0.8rem;
  color: #e1ddff;
}

.field input {
  padding: 0.42rem 0.55rem;
  font-size: 0.88rem;
  border-radius: 9px;
  border: 1px solid #524d67;
  background: #241f30;
  color: #f7f5ff;
  outline: none;
}

.field input::placeholder {
  color: #928eb0;
}

.field input:focus {
  border-color: #8ccf9a;
  box-shadow: 0 0 0 1px rgba(140, 207, 154, 0.4);
}

/* Primary create button */
.primary-btn {
  margin-top: 0.35rem;
  padding: 0.6rem 0.8rem;
  font-size: 0.92rem;
  background: linear-gradient(135deg, #8ccf9a, #4fa4d9);
  color: #101018;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.08s ease, box-shadow 0.15s ease, opacity 0.15s ease;
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(79, 164, 217, 0.55);
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: default;
  box-shadow: none;
}

/* Responsive */
@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .admin-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .column {
    padding-inline: 0.85rem;
  }

  .products-table {
    font-size: 0.8rem;
  }
}
</style>

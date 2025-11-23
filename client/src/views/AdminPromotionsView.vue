<script setup>
import { ref, onMounted } from "vue";
import { authState } from "../auth";

const promotions = ref([]);
const loading = ref(false);
const error = ref("");

// new promotion form
const newPromotion = ref({
  name: "",
  description: "",
  type: "DAILY",
  discountPercent: 0,
  startDate: "",
  endDate: "",
  isActive: true,
});

const savingId = ref(null);
const creating = ref(false);
const deletingId = ref(null);

onMounted(() => {
  loadPromotions();
});

async function loadPromotions() {
  loading.value = true;
  error.value = "";

  try {
    const response = await fetch("http://localhost:4000/api/promotions", {
      headers: {
        Authorization: authState.token ? `Bearer ${authState.token}` : "",
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to load promotions");
    }

    const data = await response.json();
    promotions.value = (data.promotions || []).map((p) => ({
      ...p,
      discountPercent: Number(p.discountPercent ?? 0),
      isActive: !!p.isActive,
      startDate: p.startDate || "",
      endDate: p.endDate || "",
    }));
  } catch (err) {
    console.error(err);
    error.value = err.message || "Error loading promotions.";
  } finally {
    loading.value = false;
  }
}

async function savePromotion(promo) {
  if (!authState.token) {
    alert("You must be logged in as admin to edit promotions.");
    return;
  }

  savingId.value = promo.id;

  try {
    const response = await fetch(
      `http://localhost:4000/api/promotions/${promo.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authState.token}`,
        },
        body: JSON.stringify({
          name: promo.name,
          description: promo.description,
          type: promo.type,
          discountPercent: Number(promo.discountPercent),
          startDate: promo.startDate || null,
          endDate: promo.endDate || null,
          isActive: promo.isActive,
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to update promotion");
    }

    const data = await response.json();
    const updated = data.promotion;

    const idx = promotions.value.findIndex((p) => p.id === updated.id);
    if (idx !== -1) {
      promotions.value[idx] = {
        ...updated,
        discountPercent: Number(updated.discountPercent ?? 0),
        isActive: !!updated.isActive,
        startDate: updated.startDate || "",
        endDate: updated.endDate || "",
      };
    }
  } catch (err) {
    console.error(err);
    alert(err.message || "Error updating promotion.");
  } finally {
    savingId.value = null;
  }
}

async function deletePromotion(promo) {
  if (!authState.token) {
    alert("You must be logged in as admin to delete promotions.");
    return;
  }

  if (!confirm(`Delete promotion "${promo.name}"?`)) return;

  deletingId.value = promo.id;

  try {
    const response = await fetch(
      `http://localhost:4000/api/promotions/${promo.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to delete promotion");
    }

    promotions.value = promotions.value.filter((p) => p.id !== promo.id);
  } catch (err) {
    console.error(err);
    alert(err.message || "Error deleting promotion.");
  } finally {
    deletingId.value = null;
  }
}

async function createPromotion() {
  if (!authState.token) {
    alert("You must be logged in as admin to create promotions.");
    return;
  }

  const p = newPromotion.value;

  if (!p.name || !p.type) {
    alert("Please fill in name and type.");
    return;
  }

  creating.value = true;

  try {
    const response = await fetch("http://localhost:4000/api/promotions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authState.token}`,
      },
      body: JSON.stringify({
        name: p.name,
        description: p.description || null,
        type: p.type,
        discountPercent: Number(p.discountPercent),
        startDate: p.startDate || null,
        endDate: p.endDate || null,
        isActive: p.isActive,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to create promotion");
    }

    const data = await response.json();
    const created = data.promotion;

    promotions.value.push({
      ...created,
      discountPercent: Number(created.discountPercent ?? 0),
      isActive: !!created.isActive,
      startDate: created.startDate || "",
      endDate: created.endDate || "",
    });

    newPromotion.value = {
      name: "",
      description: "",
      type: "DAILY",
      discountPercent: 0,
      startDate: "",
      endDate: "",
      isActive: true,
    };
  } catch (err) {
    console.error(err);
    alert(err.message || "Error creating promotion.");
  } finally {
    creating.value = false;
  }
}
</script>

<template>
  <!-- page wrapper -->
  <div class="flex flex-col gap-[0.9rem] text-[#2f2737]">
    <!-- header -->
    <header
      class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-[44px] w-[44px] items-center justify-center rounded-[16px] bg-[radial-gradient(circle_at_20%_20%,#ffc48d,#f0778a)] text-[1.6rem] shadow-[0_8px_18px_rgba(173,117,102,0.5)]"
        >
          🎉
        </div>
        <div>
          <h2 class="m-0 mb-[0.15rem] text-[1.45rem] text-[#2f2737]">
            Admin – Promotions
          </h2>
          <p class="m-0 text-[0.95rem] text-[#7b748e]">
            Create and manage daily, weekly and monthly promotions for your buyers.
          </p>
        </div>
      </div>

      <button
        class="cursor-pointer rounded-full border border-[#f3c0a2] bg-[#fef0e8] px-[0.9rem] py-[0.32rem] text-[0.85rem] text-[#8b4d3b] transition hover:bg-[#ffe0cf] hover:shadow-[0_4px_10px_rgba(214,149,104,0.5)] disabled:cursor-default disabled:opacity-65"
        @click="loadPromotions"
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

    <!-- layout: create on top, table below -->
    <section class="flex flex-col gap-[1.1rem]">
      <!-- TOP: create promotion card -->
      <div
        class="rounded-[22px] border border-[#464059] px-[1.1rem] pt-[1rem] pb-[1.1rem] text-[#f5f3ff] shadow-[0_16px_32px_rgba(34,26,46,0.45)] bg-[radial-gradient(circle_at_top,#352d45_0%,#2b2636_55%,#262130_100%)]"
      >
        <h3
          class="m-0 text-[1.35rem] font-semibold tracking-[0.3px] text-white"
        >
          Create new promotion
        </h3>
        <p class="mt-[0.25rem] mb-[0.7rem] text-[0.95rem] text-[#d8d4f0]">
          Configure a promotion and choose its visibility period.
        </p>

        <form class="flex flex-col" @submit.prevent="createPromotion">
          <div class="mb-[0.8rem] flex flex-col gap-[0.3rem]">
            <label class="text-[0.8rem] text-[#e1ddff]">Name</label>
            <input
              v-model="newPromotion.name"
              type="text"
              class="rounded-[9px] border border-[#524d67] bg-[#241f30] px-[0.55rem] py-[0.42rem] text-[0.88rem] text-[#f7f5ff] outline-none placeholder:text-[#928eb0] focus:border-[#ffb88f] focus:shadow-[0_0_0_1px_rgba(255,184,143,0.45)]"
            />
          </div>

          <div class="mb-[0.8rem] flex flex-col gap-[0.3rem]">
            <label class="text-[0.8rem] text-[#e1ddff]">Type</label>
            <select
              v-model="newPromotion.type"
              class="rounded-[9px] border border-[#524d67] bg-[#241f30] px-[0.55rem] py-[0.42rem] text-[0.88rem] text-[#f7f5ff] outline-none focus:border-[#ffb88f] focus:shadow-[0_0_0_1px_rgba(255,184,143,0.45)]"
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>

          <div class="mb-[0.8rem] flex flex-col gap-[0.3rem]">
            <label class="text-[0.8rem] text-[#e1ddff]">Discount %</label>
            <input
              v-model.number="newPromotion.discountPercent"
              type="number"
              step="0.01"
              class="rounded-[9px] border border-[#524d67] bg-[#241f30] px-[0.55rem] py-[0.42rem] text-[0.88rem] text-[#f7f5ff] outline-none placeholder:text-[#928eb0] focus:border-[#ffb88f] focus:shadow-[0_0_0_1px_rgba(255,184,143,0.45)]"
            />
          </div>

          <div class="mb-[0.8rem] flex flex-col gap-[0.3rem]">
            <label class="text-[0.8rem] text-[#e1ddff]">Start date</label>
            <input
              v-model="newPromotion.startDate"
              type="date"
              class="rounded-[9px] border border-[#524d67] bg-[#241f30] px-[0.55rem] py-[0.42rem] text-[0.88rem] text-[#f7f5ff] outline-none focus:border-[#ffb88f] focus:shadow-[0_0_0_1px_rgba(255,184,143,0.45)]"
            />
          </div>

          <div class="mb-[0.8rem] flex flex-col gap-[0.3rem]">
            <label class="text-[0.8rem] text-[#e1ddff]">End date</label>
            <input
              v-model="newPromotion.endDate"
              type="date"
              class="rounded-[9px] border border-[#524d67] bg-[#241f30] px-[0.55rem] py-[0.42rem] text-[0.88rem] text-[#f7f5ff] outline-none focus:border-[#ffb88f] focus:shadow-[0_0_0_1px_rgba(255,184,143,0.45)]"
            />
          </div>

          <div class="mb-[0.8rem] flex flex-col gap-[0.3rem]">
            <label class="text-[0.8rem] text-[#e1ddff]">Description</label>
            <input
              v-model="newPromotion.description"
              type="text"
              placeholder="Short description for buyers"
              class="rounded-[9px] border border-[#524d67] bg-[#241f30] px-[0.55rem] py-[0.42rem] text-[0.88rem] text-[#f7f5ff] outline-none placeholder:text-[#928eb0] focus:border-[#ffb88f] focus:shadow-[0_0_0_1px_rgba(255,184,143,0.45)]"
            />
          </div>

          <div
            class="mb-[0.8rem] flex flex-row items-center gap-[0.4rem]"
          >
            <label class="text-[0.8rem] text-[#e1ddff]">Active</label>
            <input
              id="isActive"
              v-model="newPromotion.isActive"
              type="checkbox"
              class="h-4 w-4 accent-[#ffb88f]"
            />
            <span class="text-[0.8rem] text-[#cbc7e8]">
              Promotion is active
            </span>
          </div>

          <button
            class="mt-[0.35rem] inline-flex w-full items-center justify-center rounded-full border border-[#f1737e] bg-[linear-gradient(135deg,#ffb88f,#ff8c94)] px-[0.8rem] py-[0.6rem] text-[0.96rem] font-semibold text-white text-shadow-sm shadow-[0_10px_20px_rgba(255,140,148,0.55)] transition hover:-translate-y-[1px] hover:shadow-[0_14px_26px_rgba(255,140,148,0.75)] disabled:cursor-default disabled:opacity-60 disabled:shadow-none"
            type="submit"
            :disabled="creating"
          >
            {{ creating ? "Creating..." : "Create promotion" }}
          </button>
        </form>
      </div>

      <!-- BOTTOM: promotion list card -->
      <div
        class="rounded-[22px] border border-[#464059] px-[1.1rem] pt-[1rem] pb-[1.1rem] text-[#f5f3ff] shadow-[0_16px_32px_rgba(34,26,46,0.45)] bg-[radial-gradient(circle_at_top,#352d45_0%,#2b2636_55%,#262130_100%)]"
      >
        <div class="mb-[0.6rem] flex items-center justify-between">
          <h3 class="m-0 text-[1.35rem] font-semibold tracking-[0.3px] text-white">
            All Promotions
          </h3>
          <span
            class="inline-flex items-center rounded-full border border-[#5a5670] bg-[rgba(16,15,26,0.45)] px-[0.6rem] py-[0.15rem] text-[0.75rem] text-[#d7d2ff]"
          >
            {{ promotions.length }} promo{{ promotions.length === 1 ? "" : "s" }}
          </span>
        </div>

        <div>
          <!-- loading state -->
          <div
            v-if="loading"
            class="py-[0.4rem] text-[0.86rem] text-[#6f708f]"
          >
            Loading promotions…
          </div>

          <!-- table -->
          <table
            v-else-if="promotions.length > 0"
            class="w-full border-collapse text-[0.86rem]"
          >
            <thead>
              <tr class="bg-[rgba(24,21,34,0.95)]">
                <th
                  class="border-b border-[#47425c] px-[0.45rem] py-[0.5rem] text-left text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-[#b9b4d7]"
                >
                  ID
                </th>
                <th
                  class="border-b border-[#47425c] px-[0.45rem] py-[0.5rem] text-left text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-[#b9b4d7]"
                >
                  Name
                </th>
                <th
                  class="border-b border-[#47425c] px-[0.45rem] py-[0.5rem] text-left text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-[#b9b4d7]"
                >
                  Type
                </th>
                <th
                  class="border-b border-[#47425c] px-[0.45rem] py-[0.5rem] text-left text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-[#b9b4d7]"
                >
                  Discount %
                </th>
                <th
                  class="border-b border-[#47425c] px-[0.45rem] py-[0.5rem] text-left text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-[#b9b4d7]"
                >
                  Start
                </th>
                <th
                  class="border-b border-[#47425c] px-[0.45rem] py-[0.5rem] text-left text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-[#b9b4d7]"
                >
                  End
                </th>
                <th
                  class="border-b border-[#47425c] px-[0.45rem] py-[0.5rem] text-left text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-[#b9b4d7]"
                >
                  Active
                </th>
                <th
                  class="w-[210px] border-b border-[#47425c] px-[0.45rem] py-[0.5rem] text-left text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-[#b9b4d7]"
                >
                  Actions
                </th>
              </tr>
              <tr>
                <th
                  colspan="8"
                  class="border-b border-[#47425c] bg-[#292235] px-[0.45rem] py-[0.5rem] text-left text-[0.72rem] uppercase tracking-[0.08em] text-[#a8a3c7]"
                >
                  Description
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="promo in promotions"
                :key="promo.id"
                class="border-b border-[#3a344a] bg-[#2a2535] transition-colors hover:bg-[#383149] even:bg-[#30293e]"
              >
                <td class="whitespace-nowrap px-[0.45rem] py-[0.5rem] font-semibold text-[#e3deff]">
                  #{{ promo.id }}
                </td>
                <td class="px-[0.45rem] py-[0.5rem]">
                  <input
                    v-model="promo.name"
                    class="w-full rounded-[8px] border border-[#524d67] bg-[#221f2b] px-[0.4rem] py-[0.25rem] text-[0.8rem] text-[#f7f5ff] outline-none focus:border-[#ffb88f] focus:shadow-[0_0_0_1px_rgba(255,184,143,0.45)]"
                  />
                </td>
                <td class="px-[0.45rem] py-[0.5rem]">
                  <select
                    v-model="promo.type"
                    class="w-full max-w-[110px] rounded-[8px] border border-[#524d67] bg-[#221f2b] px-[0.4rem] py-[0.25rem] text-[0.8rem] text-[#f7f5ff] outline-none focus:border-[#ffb88f] focus:shadow-[0_0_0_1px_rgba(255,184,143,0.45)]"
                  >
                    <option value="DAILY">DAILY</option>
                    <option value="WEEKLY">WEEKLY</option>
                    <option value="MONTHLY">MONTHLY</option>
                  </select>
                </td>
                <td class="px-[0.45rem] py-[0.5rem]">
                  <input
                    v-model.number="promo.discountPercent"
                    type="number"
                    step="0.01"
                    class="w-full max-w-[110px] rounded-[8px] border border-[#524d67] bg-[#221f2b] px-[0.4rem] py-[0.25rem] text-[0.8rem] text-[#f7f5ff] outline-none focus:border-[#ffb88f] focus:shadow-[0_0_0_1px_rgba(255,184,143,0.45)]"
                  />
                </td>
                <td class="px-[0.45rem] py-[0.5rem]">
                  <input
                    v-model="promo.startDate"
                    type="date"
                    class="w-full max-w-[110px] rounded-[8px] border border-[#524d67] bg-[#221f2b] px-[0.4rem] py-[0.25rem] text-[0.8rem] text-[#f7f5ff] outline-none focus:border-[#ffb88f] focus:shadow-[0_0_0_1px_rgba(255,184,143,0.45)]"
                  />
                </td>
                <td class="px-[0.45rem] py-[0.5rem]">
                  <input
                    v-model="promo.endDate"
                    type="date"
                    class="w-full max-w-[110px] rounded-[8px] border border-[#524d67] bg-[#221f2b] px-[0.4rem] py-[0.25rem] text-[0.8rem] text-[#f7f5ff] outline-none focus:border-[#ffb88f] focus:shadow-[0_0_0_1px_rgba(255,184,143,0.45)]"
                  />
                </td>
                <td class="whitespace-nowrap px-[0.45rem] py-[0.5rem]">
                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-full border px-[0.6rem] py-[0.12rem] text-[0.7rem]"
                    :class="promo.isActive
                      ? 'border-[#77c785] bg-[#243b2b] text-[#c3f4ca]'
                      : 'border-[#d6798e] bg-[#472431] text-[#ffd0da]'"
                    @click="promo.isActive = !promo.isActive"
                  >
                    {{ promo.isActive ? "Active" : "Inactive" }}
                  </button>
                </td>
                <td class="px-[0.45rem] py-[0.5rem]">
                  <div class="flex flex-wrap gap-[0.4rem]">
                    <button
                      class="rounded-full border border-[#71bc82] bg-[#284936] px-[0.9rem] py-[0.32rem] text-[0.85rem] text-[#d3f8dc] transition hover:bg-[#2f5d42] hover:shadow-[0_5px_14px_rgba(113,188,130,0.55)] disabled:cursor-default disabled:opacity-60 disabled:shadow-none"
                      @click="savePromotion(promo)"
                      :disabled="savingId === promo.id"
                    >
                      {{ savingId === promo.id ? "Saving..." : "Save" }}
                    </button>
                    <button
                      class="rounded-full border border-[#d77c91] bg-[#4c2a34] px-[0.9rem] py-[0.32rem] text-[0.85rem] text-[#ffd4dd] transition hover:bg-[#5d2f3f] hover:shadow-[0_5px_14px_rgba(199,111,133,0.6)] disabled:cursor-default disabled:opacity-60 disabled:shadow-none"
                      @click="deletePromotion(promo)"
                      :disabled="deletingId === promo.id"
                    >
                      {{ deletingId === promo.id ? "Deleting..." : "Delete" }}
                    </button>
                  </div>
                </td>
              </tr>

              <!-- description rows -->
              <tr
                v-for="promo in promotions"
                :key="promo.id + '-desc'"
                class="border-b border-[#3a344a] bg-[#2a2535] hover:bg-[#383149] transition-colors even:bg-[#30293e]"
              >
                <td
                  colspan="8"
                  class="px-[0.45rem] pt-[0.25rem] pb-[0.7rem]"
                >
                  <label
                    class="mb-[0.25rem] block text-[0.75rem] text-[#ccc7f1]"
                  >
                    Description
                  </label>
                  <input
                    v-model="promo.description"
                    class="w-full rounded-[8px] border border-[#524d67] bg-[#221f2b] px-[0.4rem] py-[0.25rem] text-[0.8rem] text-[#f7f5ff] outline-none placeholder:text-[#928eb0] focus:border-[#ffb88f] focus:shadow-[0_0_0_1px_rgba(255,184,143,0.45)]"
                    placeholder="Short description of this promotion"
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <!-- no promotions -->
          <p
            v-else
            class="py-[0.4rem] text-[0.8rem] text-[#9a9cb5]"
          >
            No promotions yet. Add a new promotion using the form above.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { authState } from "../auth";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const error = ref("");
const promotions = ref([]);

const promoType = computed(() => route.meta.promoType || "DAILY");

const heading = computed(() => {
  switch (promoType.value) {
    case "WEEKLY":
      return "Weekly Promotions";
    case "MONTHLY":
      return "Monthly Promotions";
    default:
      return "Daily Promotions";
  }
});

const subtitle = computed(() => {
  switch (promoType.value) {
    case "WEEKLY":
      return "Hand-picked weekly deals to keep your menu stable.";
    case "MONTHLY":
      return "Longer-running campaigns to help you plan ahead.";
    default:
      return "Short-lived hot offers on the freshest produce.";
  }
});

const activeTab = computed(() => promoType.value);

function goToTab(type) {
  if (type === "DAILY") router.push("/promotions/daily");
  if (type === "WEEKLY") router.push("/promotions/weekly");
  if (type === "MONTHLY") router.push("/promotions/monthly");
}

async function loadPromotions() {
  loading.value = true;
  error.value = "";
  promotions.value = [];

  try {
    const res = await fetch(
      `http://localhost:4000/api/promotions?type=${promoType.value}&activeOnly=true`,
      {
        headers: {
          Authorization: authState.token ? `Bearer ${authState.token}` : "",
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Failed to load promotions");
    }

    const data = await res.json();
    promotions.value = data.promotions || [];
  } catch (err) {
    console.error(err);
    error.value = err.message || "Error loading promotions.";
  } finally {
    loading.value = false;
  }
}

/** Format backend date string to a simple nice date, e.g. "26 Nov 2025" */
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) {
    return dateStr;
  }
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

onMounted(loadPromotions);
watch(promoType, () => {
  loadPromotions();
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Header with tabs -->
    <header
      class="flex flex-col gap-4 rounded-2xl border border-[#f4d2be] bg-[linear-gradient(135deg,#fff3ea_0%,#fff7f0_45%,#ffe7da_100%)] px-4 py-3 shadow-[0_10px_24px_rgba(201,155,116,0.25)] md:flex-row md:items-end md:justify-between"
    >
      <div>
        <h2 class="m-0 text-[1.6rem] font-semibold text-[#4b3325]">
          {{ heading }}
        </h2>
        <p class="mt-1 text-[0.95rem] text-[#8a6a52]">
          {{ subtitle }}
        </p>
      </div>

      <!-- Tabs -->
      <div
        class="inline-flex items-center gap-1 rounded-full border border-[rgba(244,201,166,0.9)] bg-white/70 p-[3px]"
      >
        <button
          class="rounded-full px-3 py-[6px] text-[0.85rem] text-[#965746] transition-all duration-150 ease-out"
          :class="
            activeTab === 'DAILY'
              ? 'bg-[linear-gradient(135deg,#ffcf9b,#ffb3a3)] text-[#4c2c25] shadow-[0_6px_14px_rgba(206,137,103,0.55)] -translate-y-[1px]'
              : 'hover:bg-[#ffe7d5]'
          "
          @click="goToTab('DAILY')"
        >
          Daily
        </button>

        <button
          class="rounded-full px-3 py-[6px] text-[0.85rem] text-[#965746] transition-all duration-150 ease-out"
          :class="
            activeTab === 'WEEKLY'
              ? 'bg-[linear-gradient(135deg,#ffcf9b,#ffb3a3)] text-[#4c2c25] shadow-[0_6px_14px_rgba(206,137,103,0.55)] -translate-y-[1px]'
              : 'hover:bg-[#ffe7d5]'
          "
          @click="goToTab('WEEKLY')"
        >
          Weekly
        </button>

        <button
          class="rounded-full px-3 py-[6px] text-[0.85rem] text-[#965746] transition-all duration-150 ease-out"
          :class="
            activeTab === 'MONTHLY'
              ? 'bg-[linear-gradient(135deg,#ffcf9b,#ffb3a3)] text-[#4c2c25] shadow-[0_6px_14px_rgba(206,137,103,0.55)] -translate-y-[1px]'
              : 'hover:bg-[#ffe7d5]'
          "
          @click="goToTab('MONTHLY')"
        >
          Monthly
        </button>
      </div>
    </header>

    <!-- Alerts / states -->
    <div
      v-if="error"
      class="rounded-xl border border-[#f2c2c7] bg-[#ffe6e8] px-3 py-2 text-[0.9rem] text-[#7f2730]"
    >
      {{ error }}
    </div>

    <div v-else-if="loading" class="text-[0.95rem] text-[#8a6a52]">
      Loading promotions…
    </div>

    <div v-else>
      <p
        v-if="promotions.length === 0"
        class="text-[0.95rem] italic text-[#8a6a52]"
      >
        No promotions available for this period right now.
      </p>

      <div
        v-else
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <article
          v-for="promo in promotions"
          :key="promo.id"
          class="flex flex-col justify-between gap-2 rounded-2xl border border-[#f1d6c0] bg-[linear-gradient(180deg,#fffaf5_0%,#fff3eb_100%)] px-3.5 py-3 shadow-[0_8px_18px_rgba(201,149,102,0.18)]"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <h3 class="m-0 text-[1rem] font-semibold text-[#4b3325]">
                {{ promo.name }}
              </h3>
              <p
                v-if="promo.description"
                class="mt-1 text-[0.9rem] text-[#7b5b46]"
              >
                {{ promo.description }}
              </p>
            </div>

            <span
              class="inline-flex items-center rounded-full bg-[linear-gradient(135deg,#ffb88f,#ff8c94)] px-2.5 py-1 text-[0.8rem] font-semibold text-[#4b2525] whitespace-nowrap"
            >
              -{{ promo.discountPercent }}%
            </span>
          </div>

          <div class="mt-1 flex items-center justify-between gap-2">
            <p class="m-0 text-[0.8rem] text-[#a27657]">
              <span v-if="promo.startDate">
                from {{ formatDate(promo.startDate) }}
              </span>
              <span v-if="promo.endDate">
                &nbsp;to {{ formatDate(promo.endDate) }}
              </span>
            </p>

            <span
              v-if="!promo.isActive"
              class="inline-flex rounded-full bg-[rgba(238,171,171,0.3)] px-2 py-[3px] text-[0.78rem] font-semibold text-[#7f2730]"
            >
              Inactive
            </span>
            <span
              v-else
              class="inline-flex rounded-full bg-[rgba(152,209,142,0.28)] px-2 py-[3px] text-[0.78rem] font-semibold text-[#375635]"
            >
              Active
            </span>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

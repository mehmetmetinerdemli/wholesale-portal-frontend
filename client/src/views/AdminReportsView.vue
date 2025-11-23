<script setup>
import { ref, onMounted } from "vue";
import VueApexCharts from "vue3-apexcharts";
import { authState } from "../auth";

const apexchart = VueApexCharts;

// data
const topProducts = ref([]);
const lowStock = ref([]);
const dailySummary = ref([]);

const loadingTop = ref(false);
const loadingLow = ref(false);
const loadingDaily = ref(false);

const topError = ref("");
const lowError = ref("");
const dailyError = ref("");

const lowThreshold = ref(50);
const topDays = ref(30);
const summaryDays = ref(14);

// chart state
const topBarOptions = ref({});
const topBarSeries = ref([]);
const topPieOptions = ref({});
const topPieSeries = ref([]);

const lowBarOptions = ref({});
const lowBarSeries = ref([]);

const dailyLineOptions = ref({});
const dailyLineSeries = ref([]);

// helper: pretty date for table
function formatDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

onMounted(() => {
  initChartDefaults();
  loadTopProducts();
  loadLowStock();
  loadDailySummary();
});

// ---------- chart defaults ----------
function initChartDefaults() {
  // TOP PRODUCTS BAR
  topBarOptions.value = {
    chart: {
      toolbar: { show: false },
      foreColor: "#ecebff",
    },
    grid: { borderColor: "#2f3144" },
    xaxis: {
      categories: [],
      labels: {
        style: { colors: "#d5d2f3", fontSize: "11px" },
        rotate: -90, // vertical labels
        trim: false,
        hideOverlappingLabels: false,
      },
    },
    yaxis: {
      labels: { style: { colors: "#d5d2f3", fontSize: "11px" } },
    },
    plotOptions: {
      bar: {
        borderRadius: 5,
        columnWidth: "45%",
      },
    },
    dataLabels: { enabled: false },
    tooltip: {
      theme: "dark",
    },
    colors: ["#8edb72"],
  };
  topBarSeries.value = [{ name: "Qty sold", data: [] }];

  // TOP PRODUCTS PIE
  topPieOptions.value = {
    chart: { foreColor: "#ecebff" },
    labels: [],
    legend: {
      position: "bottom",
      labels: { colors: "#ecebff" },
    },
    tooltip: { theme: "dark" },
    colors: ["#8edb72", "#5ec9ff", "#ffc96b", "#f28ba8", "#c6a7ff"],
  };
  topPieSeries.value = [];

  // LOW STOCK BAR
  lowBarOptions.value = {
    chart: {
      toolbar: { show: false },
      foreColor: "#ecebff",
    },
    grid: { borderColor: "#2f3144" },
    xaxis: {
      categories: [],
      labels: {
        style: { colors: "#d5d2f3", fontSize: "11px" },
        rotate: -90,
        trim: false,
        hideOverlappingLabels: false,
      },
    },
    yaxis: {
      labels: { style: { colors: "#d5d2f3", fontSize: "11px" } },
    },
    plotOptions: {
      bar: {
        borderRadius: 5,
        columnWidth: "45%",
      },
    },
    dataLabels: { enabled: false },
    tooltip: { theme: "dark" },
    colors: ["#ffc96b"],
  };
  lowBarSeries.value = [{ name: "Stock", data: [] }];

  // DAILY LINE
  dailyLineOptions.value = {
    chart: {
      toolbar: { show: false },
      foreColor: "#ecebff",
    },
    grid: { borderColor: "#2f3144" },
    xaxis: {
      categories: [],
      labels: {
        style: { colors: "#d5d2f3", fontSize: "11px" },
        rotate: -20,
      },
    },
    yaxis: {
      labels: { style: { colors: "#d5d2f3", fontSize: "11px" } },
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    dataLabels: { enabled: false },
    tooltip: {
      theme: "dark",
      y: { formatter: (val) => `€ ${val.toFixed(2)}` },
    },
    colors: ["#87d4ff"],
  };
  dailyLineSeries.value = [{ name: "Revenue", data: [] }];
}

// ---------- loaders + wiring ----------
async function loadTopProducts() {
  loadingTop.value = true;
  topError.value = "";

  try {
    const response = await fetch(
      `http://localhost:4000/api/reports/top-products?days=${topDays.value}`,
      {
        headers: { Authorization: `Bearer ${authState.token}` },
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to load top products");
    }

    topProducts.value = await response.json();
    const names = topProducts.value.map((p) => p.name);
    const qty = topProducts.value.map((p) => Number(p.totalQty || 0));

    topBarOptions.value = {
      ...topBarOptions.value,
      xaxis: { ...(topBarOptions.value.xaxis || {}), categories: names },
    };
    topBarSeries.value = [{ name: "Qty sold", data: qty }];

    topPieOptions.value = {
      ...topPieOptions.value,
      labels: names,
    };
    topPieSeries.value = qty;
  } catch (err) {
    console.error(err);
    topError.value = err.message || "Error loading top products.";
  } finally {
    loadingTop.value = false;
  }
}

async function loadLowStock() {
  loadingLow.value = true;
  lowError.value = "";

  try {
    const response = await fetch(
      `http://localhost:4000/api/reports/low-stock?threshold=${lowThreshold.value}`,
      {
        headers: { Authorization: `Bearer ${authState.token}` },
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to load low stock");
    }

    lowStock.value = await response.json();
    const names = lowStock.value.map((p) => p.name);
    const stocks = lowStock.value.map((p) => Number(p.stockQty || 0));

    lowBarOptions.value = {
      ...lowBarOptions.value,
      xaxis: { ...(lowBarOptions.value.xaxis || {}), categories: names },
    };
    lowBarSeries.value = [{ name: "Stock", data: stocks }];
  } catch (err) {
    console.error(err);
    lowError.value = err.message || "Error loading low stock.";
  } finally {
    loadingLow.value = false;
  }
}

async function loadDailySummary() {
  loadingDaily.value = true;
  dailyError.value = "";

  try {
    const response = await fetch(
      `http://localhost:4000/api/reports/daily-summary?days=${summaryDays.value}`,
      {
        headers: { Authorization: `Bearer ${authState.token}` },
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to load daily summary");
    }

    dailySummary.value = await response.json();

    const days = dailySummary.value.map((r) => formatDate(r.day));
    const revenue = dailySummary.value.map((r) => Number(r.totalRevenue || 0));

    dailyLineOptions.value = {
      ...dailyLineOptions.value,
      xaxis: { ...(dailyLineOptions.value.xaxis || {}), categories: days },
    };
    dailyLineSeries.value = [{ name: "Revenue", data: revenue }];
  } catch (err) {
    console.error(err);
    dailyError.value = err.message || "Error loading daily summary.";
  } finally {
    loadingDaily.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- HEADER -->
    <header
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_20%_20%,#9ef5d5,#3e7b6f)] text-[1.7rem]"
        >
          📊
        </div>
        <div>
          <h2 class="m-0 text-[1.45rem] font-semibold tracking-tight text-[#2f2737]">
            Admin – Reports Overview
          </h2>
          <p class="m-0 mt-[0.2rem] text-[0.95rem] text-[#6c6882]">
            Insights: top-selling products, low inventory alerts, and daily revenue.
          </p>
        </div>
      </div>
    </header>

    <!-- GRID -->
    <section class="grid gap-6 md:grid-cols-2">
      <!-- TOP PRODUCTS -->
      <div
        class="min-w-0 rounded-[22px] border border-[#4a445c] bg-[radial-gradient(circle_at_top,#352d45_0%,#2b2636_55%,#262130_100%)] px-5 py-4 text-[#f5f3ff] shadow-[0_14px_32px_rgba(34,26,46,0.45)]"
      >
        <div class="mb-3 flex items-center justify-between gap-2">
          <h3 class="m-0 text-[1.05rem] text-[#f6f3ff]">
            Top products
          </h3>
          <div
            class="flex flex-wrap items-center gap-2 text-[0.85rem] text-[#d4d2eb]"
          >
            <label class="flex items-center gap-1">
              <span>Days:</span>
              <input
                type="number"
                v-model.number="topDays"
                min="1"
                max="365"
                @change="loadTopProducts"
                class="w-[70px] rounded-[8px] border border-[#5c566c] bg-[#2e2938] px-[0.45rem] py-[0.3rem] text-[0.85rem] text-[#f5f3ff] outline-none focus:border-[#8ccf9a] focus:shadow-[0_0_0_1px_rgba(140,207,154,0.35)]"
              />
            </label>
            <button
                  class="rounded-[10px] border-none bg-[linear-gradient(120deg,#a8f0ad,#87d4ff)] px-2.5 py-[0.3rem] text-[0.78rem] font-medium **text-[#1a1a2e]** transition-transform transition-shadow hover:-translate-y-[1px] hover:shadow-[0_4px_10px_rgba(152,235,195,0.4)] disabled:opacity-45 disabled:shadow-none"
                  @click="loadTopProducts"
                  :disabled="loadingTop"
              >
                  {{ loadingTop ? "Loading…" : "Refresh" }}
              </button>
          </div>
        </div>

        <div
          v-if="topError"
          class="mb-2 rounded-[10px] border border-[#e8a1b0] bg-[#ffe6eb] px-[0.6rem] py-[0.45rem] text-[0.86rem] text-[#6d2635]"
        >
          Error: {{ topError }}
        </div>
        <div
          v-else-if="loadingTop"
          class="py-2 text-[0.9rem] text-[#bfbce5]"
        >
          Loading top products…
        </div>

        <div v-else>
          <div
            v-if="topProducts.length"
            class="mb-[0.9rem] grid gap-[0.9rem] md:grid-cols-2"
          >
            <div
              class="w-full rounded-[14px] border border-[#4f4965] bg-[#241f30] p-[0.4rem]"
            >
              <apexchart
                type="bar"
                height="260"
                :options="topBarOptions"
                :series="topBarSeries"
              />
            </div>
            <div
              class="w-full rounded-[14px] border border-[#4f4965] bg-[#241f30] p-[0.4rem]"
            >
              <apexchart
                type="pie"
                height="260"
                :options="topPieOptions"
                :series="topPieSeries"
              />
            </div>
          </div>

          <table
            v-if="topProducts.length"
            class="w-full border-collapse text-[0.88rem] text-[#f5f3ff]"
          >
            <thead>
              <tr class="bg-[rgba(24,21,34,0.85)]">
                <th
                  class="border-b border-[#49435b] px-[0.6rem] py-[0.55rem] text-left text-[0.78rem] font-semibold uppercase tracking-[0.07em] text-[#bcb6da]"
                >
                  #
                </th>
                <th
                  class="border-b border-[#49435b] px-[0.6rem] py-[0.55rem] text-left text-[0.78rem] font-semibold uppercase tracking-[0.07em] text-[#bcb6da]"
                >
                  Product
                </th>
                <th
                  class="border-b border-[#49435b] px-[0.6rem] py-[0.55rem] text-left text-[0.78rem] font-semibold uppercase tracking-[0.07em] text-[#bcb6da]"
                >
                  Qty sold
                </th>
                <th
                  class="border-b border-[#49435b] px-[0.6rem] py-[0.55rem] text-left text-[0.78rem] font-semibold uppercase tracking-[0.07em] text-[#bcb6da]"
                >
                  Revenue (€)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(p, idx) in topProducts"
                :key="p.productId"
                class="bg-[#2d2838] even:bg-[#332d41] hover:bg-[#3a334a] transition-colors"
              >
                <td class="border-b border-[#3e394d] px-[0.6rem] py-[0.5rem]">
                  {{ idx + 1 }}
                </td>
                <td class="border-b border-[#3e394d] px-[0.6rem] py-[0.5rem]">
                  {{ p.name }}
                </td>
                <td class="border-b border-[#3e394d] px-[0.6rem] py-[0.5rem]">
                  {{ p.totalQty }}
                </td>
                <td class="border-b border-[#3e394d] px-[0.6rem] py-[0.5rem]">
                  € {{ p.totalRevenue.toFixed(2) }}
                </td>
              </tr>
            </tbody>
          </table>

          <p
            v-else
            class="py-2 text-[0.85rem] text-[#a8a5c9]"
          >
            No product sales in the selected period.
          </p>
        </div>
      </div>

      <!-- LOW STOCK -->
      <div
        class="min-w-0 rounded-[22px] border border-[#4a445c] bg-[radial-gradient(circle_at_top,#352d45_0%,#2b2636_55%,#262130_100%)] px-5 py-4 text-[#f5f3ff] shadow-[0_14px_32px_rgba(34,26,46,0.45)]"
      >
        <div class="mb-3 flex items-center justify-between gap-2">
          <h3 class="m-0 text-[1.05rem] text-[#f6f3ff]">
            Low stock
          </h3>
          <div
            class="flex flex-wrap items-center gap-2 text-[0.85rem] text-[#d4d2eb]"
          >
            <label class="flex items-center gap-1">
              <span>Threshold:</span>
              <input
                type="number"
                v-model.number="lowThreshold"
                min="0"
                @change="loadLowStock"
                class="w-[70px] rounded-[8px] border border-[#5c566c] bg-[#2e2938] px-[0.45rem] py-[0.3rem] text-[0.85rem] text-[#f5f3ff] outline-none focus:border-[#8ccf9a] focus:shadow-[0_0_0_1px_rgba(140,207,154,0.35)]"
              />
            </label>
            <button
                  class="rounded-[10px] border-none bg-[linear-gradient(120deg,#a8f0ad,#87d4ff)] px-2.5 py-[0.3rem] text-[0.78rem] font-medium **text-[#1a1a2e]** transition-transform transition-shadow hover:-translate-y-[1px] hover:shadow-[0_4px_10px_rgba(152,235,195,0.4)] disabled:opacity-45 disabled:shadow-none"
                  @click="loadTopProducts"
                  :disabled="loadingTop"
              >
                  {{ loadingTop ? "Loading…" : "Refresh" }}
              </button>
          </div>
        </div>

        <div
          v-if="lowError"
          class="mb-2 rounded-[10px] border border-[#e8a1b0] bg-[#ffe6eb] px-[0.6rem] py-[0.45rem] text-[0.86rem] text-[#6d2635]"
        >
          Error: {{ lowError }}
        </div>
        <div
          v-else-if="loadingLow"
          class="py-2 text-[0.9rem] text-[#bfbce5]"
        >
          Loading low stock…
        </div>

        <div v-else>
          <div
            v-if="lowStock.length"
            class="mb-[0.9rem] w-full rounded-[14px] border border-[#4f4965] bg-[#241f30] p-[0.4rem]"
          >
            <apexchart
              type="bar"
              height="260"
              :options="lowBarOptions"
              :series="lowBarSeries"
            />
          </div>

          <table
            v-if="lowStock.length"
            class="w-full border-collapse text-[0.88rem] text-[#f5f3ff]"
          >
            <thead>
              <tr class="bg-[rgba(24,21,34,0.85)]">
                <th
                  class="border-b border-[#49435b] px-[0.6rem] py-[0.55rem] text-left text-[0.78rem] font-semibold uppercase tracking-[0.07em] text-[#bcb6da]"
                >
                  ID
                </th>
                <th
                  class="border-b border-[#49435b] px-[0.6rem] py-[0.55rem] text-left text-[0.78rem] font-semibold uppercase tracking-[0.07em] text-[#bcb6da]"
                >
                  Product
                </th>
                <th
                  class="border-b border-[#49435b] px-[0.6rem] py-[0.55rem] text-left text-[0.78rem] font-semibold uppercase tracking-[0.07em] text-[#bcb6da]"
                >
                  Stock
                </th>
                <th
                  class="border-b border-[#49435b] px-[0.6rem] py-[0.55rem] text-left text-[0.78rem] font-semibold uppercase tracking-[0.07em] text-[#bcb6da]"
                >
                  Unit
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="p in lowStock"
                :key="p.id"
                class="bg-[#2d2838] even:bg-[#332d41] hover:bg-[#3a334a] transition-colors"
              >
                <td class="border-b border-[#3e394d] px-[0.6rem] py-[0.5rem]">
                  {{ p.id }}
                </td>
                <td class="border-b border-[#3e394d] px-[0.6rem] py-[0.5rem]">
                  {{ p.name }}
                </td>
                <td class="border-b border-[#3e394d] px-[0.6rem] py-[0.5rem]">
                  {{ p.stockQty }}
                </td>
                <td class="border-b border-[#3e394d] px-[0.6rem] py-[0.5rem]">
                  {{ p.unit }}
                </td>
              </tr>
            </tbody>
          </table>

          <p
            v-else
            class="py-2 text-[0.85rem] text-[#a8a5c9]"
          >
            No products below the threshold.
          </p>
        </div>
      </div>

      <!-- DAILY SUMMARY -->
      <div
        class="min-w-0 rounded-[22px] border border-[#4a445c] bg-[radial-gradient(circle_at_top,#352d45_0%,#2b2636_55%,#262130_100%)] px-5 py-4 text-[#f5f3ff] shadow-[0_14px_32px_rgba(34,26,46,0.45)] md:col-span-2"
      >
        <div class="mb-3 flex items-center justify-between gap-2">
          <h3 class="m-0 text-[1.05rem] text-[#f6f3ff]">
            Daily summary
          </h3>
          <div
            class="flex flex-wrap items-center gap-2 text-[0.85rem] text-[#d4d2eb]"
          >
            <label class="flex items-center gap-1">
              <span>Days:</span>
              <input
                type="number"
                v-model.number="summaryDays"
                min="1"
                max="365"
                @change="loadDailySummary"
                class="w-[70px] rounded-[8px] border border-[#5c566c] bg-[#2e2938] px-[0.45rem] py-[0.3rem] text-[0.85rem] text-[#f5f3ff] outline-none focus:border-[#8ccf9a] focus:shadow-[0_0_0_1px_rgba(140,207,154,0.35)]"
              />
            </label>
            <button
                  class="rounded-[10px] border-none bg-[linear-gradient(120deg,#a8f0ad,#87d4ff)] px-2.5 py-[0.3rem] text-[0.78rem] font-medium **text-[#1a1a2e]** transition-transform transition-shadow hover:-translate-y-[1px] hover:shadow-[0_4px_10px_rgba(152,235,195,0.4)] disabled:opacity-45 disabled:shadow-none"
                  @click="loadTopProducts"
                  :disabled="loadingTop"
              >
                  {{ loadingTop ? "Loading…" : "Refresh" }}
              </button>
          </div>
        </div>

        <div
          v-if="dailyError"
          class="mb-2 rounded-[10px] border border-[#e8a1b0] bg-[#ffe6eb] px-[0.6rem] py-[0.45rem] text-[0.86rem] text-[#6d2635]"
        >
          Error: {{ dailyError }}
        </div>
        <div
          v-else-if="loadingDaily"
          class="py-2 text-[0.9rem] text-[#bfbce5]"
        >
          Loading daily summary…
        </div>

        <div v-else>
          <div
            v-if="dailySummary.length"
            class="mb-[0.9rem] w-full rounded-[14px] border border-[#4f4965] bg-[#241f30] p-[0.4rem]"
          >
            <apexchart
              type="line"
              height="260"
              :options="dailyLineOptions"
              :series="dailyLineSeries"
            />
          </div>

          <table
            v-if="dailySummary.length"
            class="w-full border-collapse text-[0.88rem] text-[#f5f3ff]"
          >
            <thead>
              <tr class="bg-[rgba(24,21,34,0.85)]">
                <th
                  class="border-b border-[#49435b] px-[0.6rem] py-[0.55rem] text-left text-[0.78rem] font-semibold uppercase tracking-[0.07em] text-[#bcb6da]"
                >
                  Date
                </th>
                <th
                  class="border-b border-[#49435b] px-[0.6rem] py-[0.55rem] text-left text-[0.78rem] font-semibold uppercase tracking-[0.07em] text-[#bcb6da]"
                >
                  Orders
                </th>
                <th
                  class="border-b border-[#49435b] px-[0.6rem] py-[0.55rem] text-left text-[0.78rem] font-semibold uppercase tracking-[0.07em] text-[#bcb6da]"
                >
                  Revenue (€)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in dailySummary"
                :key="row.day"
                class="bg-[#2d2838] even:bg-[#332d41] hover:bg-[#3a334a] transition-colors"
              >
                <td class="border-b border-[#3e394d] px-[0.6rem] py-[0.5rem]">
                  {{ formatDate(row.day) }}
                </td>
                <td class="border-b border-[#3e394d] px-[0.6rem] py-[0.5rem]">
                  {{ row.orderCount }}
                </td>
                <td class="border-b border-[#3e394d] px-[0.6rem] py-[0.5rem]">
                  € {{ row.totalRevenue.toFixed(2) }}
                </td>
              </tr>
            </tbody>
          </table>

          <p
            v-else
            class="py-2 text-[0.85rem] text-[#a8a5c9]"
          >
            No orders in the selected period.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

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
        rotate: -90,          // vertical labels
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
  <div class="reports-page">
    <!-- HEADER: same style as Admin – Products -->
    <header class="reports-header">
      <div class="title-wrap">
        <div class="icon-badge">📊</div>
        <div>
          <h2>Admin – Reports</h2>
          <p class="subtitle">
            Insights: top-selling products, low inventory alerts, and daily revenue.
          </p>
        </div>
      </div>
    </header>

    <section class="grid">
      <!-- TOP PRODUCTS -->
      <div class="card">
        <div class="card-header">
          <h3>Top products</h3>
          <div class="controls">
            <label>
              Days:
              <input
                type="number"
                v-model.number="topDays"
                min="1"
                max="365"
                @change="loadTopProducts"
              />
            </label>
            <button class="small-btn" @click="loadTopProducts" :disabled="loadingTop">
              {{ loadingTop ? "Loading…" : "Refresh" }}
            </button>
          </div>
        </div>

        <div v-if="topError" class="error">Error: {{ topError }}</div>
        <div v-else-if="loadingTop" class="info">Loading top products…</div>

        <div v-else>
          <div v-if="topProducts.length" class="charts-row">
            <div class="chart-wrapper">
              <apexchart
                type="bar"
                height="260"
                :options="topBarOptions"
                :series="topBarSeries"
              />
            </div>
            <div class="chart-wrapper">
              <apexchart
                type="pie"
                height="260"
                :options="topPieOptions"
                :series="topPieSeries"
              />
            </div>
          </div>

          <table v-if="topProducts.length" class="report-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Qty sold</th>
                <th>Revenue (€)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(p, idx) in topProducts" :key="p.productId">
                <td>{{ idx + 1 }}</td>
                <td>{{ p.name }}</td>
                <td>{{ p.totalQty }}</td>
                <td>€ {{ p.totalRevenue.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>

          <p v-else class="info small">No product sales in the selected period.</p>
        </div>
      </div>

      <!-- LOW STOCK -->
      <div class="card">
        <div class="card-header">
          <h3>Low stock</h3>
          <div class="controls">
            <label>
              Threshold:
              <input
                type="number"
                v-model.number="lowThreshold"
                min="0"
                @change="loadLowStock"
              />
            </label>
            <button class="small-btn" @click="loadLowStock" :disabled="loadingLow">
              {{ loadingLow ? "Loading…" : "Refresh" }}
            </button>
          </div>
        </div>

        <div v-if="lowError" class="error">Error: {{ lowError }}</div>
        <div v-else-if="loadingLow" class="info">Loading low stock…</div>

        <div v-else>
          <div v-if="lowStock.length" class="chart-wrapper chart-wrapper--wide">
            <apexchart
              type="bar"
              height="260"
              :options="lowBarOptions"
              :series="lowBarSeries"
            />
          </div>

          <table v-if="lowStock.length" class="report-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Stock</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in lowStock" :key="p.id">
                <td>{{ p.id }}</td>
                <td>{{ p.name }}</td>
                <td>{{ p.stockQty }}</td>
                <td>{{ p.unit }}</td>
              </tr>
            </tbody>
          </table>

          <p v-else class="info small">
            No products below the threshold.
          </p>
        </div>
      </div>

      <!-- DAILY SUMMARY -->
      <div class="card full-width">
        <div class="card-header">
          <h3>Daily summary</h3>
          <div class="controls">
            <label>
              Days:
              <input
                type="number"
                v-model.number="summaryDays"
                min="1"
                max="365"
                @change="loadDailySummary"
              />
            </label>
            <button
              class="small-btn"
              @click="loadDailySummary"
              :disabled="loadingDaily"
            >
              {{ loadingDaily ? "Loading…" : "Refresh" }}
            </button>
          </div>
        </div>

        <div v-if="dailyError" class="error">Error: {{ dailyError }}</div>
        <div v-else-if="loadingDaily" class="info">Loading daily summary…</div>

        <div v-else>
          <div v-if="dailySummary.length" class="chart-wrapper chart-wrapper--wide">
            <apexchart
              type="line"
              height="260"
              :options="dailyLineOptions"
              :series="dailyLineSeries"
            />
          </div>

          <table v-if="dailySummary.length" class="report-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Orders</th>
                <th>Revenue (€)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in dailySummary" :key="row.day">
                <td>{{ formatDate(row.day) }}</td>
                <td>{{ row.orderCount }}</td>
                <td>€ {{ row.totalRevenue.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>

          <p v-else class="info small">No orders in the selected period.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.reports-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* HEADER – same vibe as Admin Products */
.reports-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.icon-badge {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: radial-gradient(circle at 20% 20%, #9ef5d5, #3e7b6f);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.7rem;
}

.reports-header h2 {
  margin: 0;
  font-size: 1.7rem;
  font-weight: 700;
  color: #1b1825;
}

.subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.95rem;
  color: #6c6882;
}

/* GRID */
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.4rem;
}

.card.full-width {
  grid-column: 1 / -1;
}

/* CARD */
.card {
  background: radial-gradient(circle at top, #352d45 0%, #2b2636 55%, #262130 100%);
  border-radius: 22px;
  padding: 1.1rem 1.2rem;
  border: 1px solid #4a445c;
  box-shadow: 0 14px 32px rgba(34, 26, 46, 0.45);
  color: #f5f3ff;
  min-width: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.card-header h3 {
  margin: 0;
  font-size: 1.05rem;
  color: #f6f3ff;
}

/* CONTROLS */
.controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #d4d2eb;
}

.controls label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.controls input {
  width: 70px;
  padding: 0.3rem 0.45rem;
  border-radius: 8px;
  background: #2e2938;
  border: 1px solid #5c566c;
  color: #f5f3ff;
  outline: none;
  font-size: 0.85rem;
}

.controls input:focus {
  border-color: #8ccf9a;
  box-shadow: 0 0 0 1px rgba(140, 207, 154, 0.35);
}

/* BUTTON */
.small-btn {
  padding: 0.28rem 0.6rem;
  font-size: 0.78rem;
  cursor: pointer;
  border-radius: 10px;
  border: none;
  color: #262130;
  background: linear-gradient(120deg, #a8f0ad, #87d4ff);
  font-weight: 500;
  transition: transform 0.1s ease, box-shadow 0.15s ease;
}

.small-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(152, 235, 195, 0.4);
}

.small-btn:disabled {
  opacity: 0.45;
  cursor: default;
}

/* CHARTS */
.charts-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
  margin-bottom: 0.9rem;
}

.chart-wrapper,
.chart-wrapper--wide {
  background: #241f30;
  border-radius: 14px;
  padding: 0.4rem;
  border: 1px solid #4f4965;
  min-width: 0;
}

.chart-wrapper--wide {
  margin-bottom: 0.9rem;
}

/* APEX width */
:deep(.apexcharts-canvas) {
  width: 100% !important;
}

/* TABLES */
.report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
  color: #f5f3ff;
}

.report-table thead tr {
  background: rgba(24, 21, 34, 0.85);
}

.report-table th {
  font-weight: 600;
  padding: 0.55rem 0.6rem;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #bcb6da;
  border-bottom: 1px solid #49435b;
}

.report-table td {
  padding: 0.5rem 0.6rem;
  border-bottom: 1px solid #3e394d;
}

.report-table tbody tr {
  background: #2d2838;
}

.report-table tbody tr:nth-child(even) {
  background: #332d41;
}

.report-table tbody tr:hover {
  background: #3a334a;
}

/* MESSAGES */
.info {
  padding: 0.5rem 0;
  color: #bfbce5;
}

.info.small {
  font-size: 0.85rem;
  color: #a8a5c9;
}

.error {
  background: #ffe6eb;
  border: 1px solid #e8a1b0;
  color: #6d2635;
  padding: 0.45rem 0.6rem;
  font-size: 0.86rem;
  border-radius: 10px;
  margin-bottom: 0.6rem;
}

/* RESPONSIVE */
@media (max-width: 1200px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 900px) {
  .charts-row {
    grid-template-columns: minmax(0, 1fr);
  }

  .controls {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

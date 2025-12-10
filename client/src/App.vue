<script setup>
import { RouterLink, RouterView, useRouter } from "vue-router";
import { authState, clearAuth, isAdmin, isLoggedIn } from "./auth";

const router = useRouter();

function handleLogout() {
  clearAuth();
  router.push("/login");
}
</script>

<template>
  <div
    class="flex min-h-screen w-full text-[#2f3a2b] bg-[radial-gradient(circle_at_top_left,#f9f2e3_0%,#f2f6ee_45%,#fbeee5_100%)] font-sans"
  >
    <!-- Sidebar -->
    <aside
      v-if="isLoggedIn()"
      class="hidden md:flex w-60 flex-col gap-5 border-r border-[rgba(179,191,158,0.6)] bg-gradient-to-b from-[#f6f3e8] to-[#edf4e8] px-4 py-4 shadow-[4px_0_18px_rgba(133,146,115,0.18)]"
    >
      <!-- Brand -->
      <div class="flex items-center gap-3">
        <span
          class="flex h-10 w-10 items-center justify-center rounded-full text-xl text-white bg-[radial-gradient(circle_at_30%_20%,#9fd39f_0,#7fb786_50%,#5d9466_100%)]"
        >
          🍅
        </span>

        <div class="space-y-0.5">
          <h2 class="m-0 text-[15px] font-semibold text-[#333c2f]">
            ELSO
          </h2>
          <p class="m-0 text-[11px] text-[#767f70]">
            Elite Solutions
          </p>

          <!-- Buyer company badge -->
          <p
            v-if="authState.user?.role === 'BUYER' && authState.user?.companyName"
            class="inline-block mt-[6px] rounded-full bg-[rgba(172,201,163,0.38)] px-2.5 py-0.5 text-[11px] font-semibold text-[#3e5140]"
          >
            {{ authState.user.companyName }}
          </p>

          <!-- Admin badge -->
          <p
            v-else-if="authState.user?.role === 'ADMIN'"
            class="inline-block mt-[6px] rounded-full bg-[rgba(241,190,160,0.45)] px-2.5 py-0.5 text-[11px] font-semibold text-[#6c3426]"
          >
            Admin Panel
          </p>
        </div>
      </div>

      <!-- NAVIGATION -->
      <nav class="mt-2 flex flex-col gap-1.5">

        <!-- BUYER ONLY SECTION -->
        <template v-if="authState.user?.role === 'BUYER'">
          <p
            class="mx-1 mt-2 mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8d947f]"
          >
            Customer
          </p>

          <RouterLink
            to="/buyer"
            class="block rounded-full px-3 py-1.5 text-[13px] text-[#435040] transition hover:bg-[rgba(176,205,155,0.35)] hover:translate-x-[2px] hover:shadow-[0_4px_10px_rgba(139,164,117,0.4)]"
            active-class="bg-gradient-to-r from-[#f2b075] to-[#8ac79e] text-[#263121] shadow-[0_8px_16px_rgba(191,170,123,0.55)]"
          >
            Product Catalog
          </RouterLink>

          <RouterLink
            to="/buyer/orders"
            class="block rounded-full px-3 py-1.5 text-[13px] text-[#435040] transition hover:bg-[rgba(176,205,155,0.35)] hover:translate-x-[2px] hover:shadow-[0_4px_10px_rgba(139,164,117,0.4)]"
            active-class="bg-gradient-to-r from-[#f2b075] to-[#8ac79e] text-[#263121] shadow-[0_8px_16px_rgba(191,170,123,0.55)]"
          >
            My Orders
          </RouterLink>

          <!-- Promotions -->
          <p
            class="mx-1 mt-4 mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8d947f]"
          >
            Promotions
          </p>

          <RouterLink
            to="/promotions/daily"
            class="block rounded-full px-3 py-1.5 text-[13px] text-[#435040] transition hover:bg-[rgba(176,205,155,0.35)] hover:translate-x-[2px] hover:shadow-[0_4px_10px_rgba(139,164,117,0.4)]"
            active-class="bg-gradient-to-r from-[#f2b075] to-[#8ac79e] text-[#263121] shadow-[0_8px_16px_rgba(191,170,123,0.55)]"
          >
            Daily Promotions
          </RouterLink>

          <RouterLink
            to="/promotions/weekly"
            class="block rounded-full px-3 py-1.5 text-[13px] text-[#435040] transition hover:bg-[rgba(176,205,155,0.35)] hover:translate-x-[2px] hover:shadow-[0_4px_10px_rgba(139,164,117,0.4)]"
            active-class="bg-gradient-to-r from-[#f2b075] to-[#8ac79e] text-[#263121] shadow-[0_8px_16px_rgba(191,170,123,0.55)]"
          >
            Weekly Promotions
          </RouterLink>

          <RouterLink
            to="/promotions/monthly"
            class="block rounded-full px-3 py-1.5 text-[13px] text-[#435040] transition hover:bg-[rgba(176,205,155,0.35)] hover:translate-x-[2px] hover:shadow-[0_4px_10px_rgba(139,164,117,0.4)]"
            active-class="bg-gradient-to-r from-[#f2b075] to-[#8ac79e] text-[#263121] shadow-[0_8px_16px_rgba(191,170,123,0.55)]"
          >
            Monthly Promotions
          </RouterLink>
        </template>

        <!-- ADMIN SECTION -->
        <template v-if="isAdmin()">
          <p
            class="mx-1 mt-4 mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8d947f]"
          >
            Admin
          </p>

          <RouterLink
            to="/admin"
            class="block rounded-full px-3 py-1.5 text-[13px] text-[#435040] transition hover:bg-[rgba(176,205,155,0.35)] hover:translate-x-[2px] hover:shadow-[0_4px_10px_rgba(139,164,117,0.4)]"
            active-class="bg-gradient-to-r from-[#f2b075] to-[#8ac79e] text-[#263121] shadow-[0_8px_16px_rgba(191,170,123,0.55)]"
          >
            Admin Orders
          </RouterLink>

          <RouterLink
            to="/admin/products"
            class="block rounded-full px-3 py-1.5 text-[13px] text-[#435040] transition hover:bg-[rgba(176,205,155,0.35)] hover:translate-x-[2px] hover:shadow-[0_4px_10px_rgba(139,164,117,0.4)]"
            active-class="bg-gradient-to-r from-[#f2b075] to-[#8ac79e] text-[#263121] shadow-[0_8px_16px_rgba(191,170,123,0.55)]"
          >
            Admin Products
          </RouterLink>

          <RouterLink
            to="/admin/products/add"
            class="block rounded-full px-3 py-1.5 text-[13px] text-[#435040] transition hover:bg-[rgba(176,205,155,0.35)] hover:translate-x-[2px] hover:shadow-[0_4px_10px_rgba(139,164,117,0.4)]"
            active-class="bg-gradient-to-r from-[#f2b075] to-[#8ac79e] text-[#263121] shadow-[0_8px_16px_rgba(191,170,123,0.55)]"
          >
            Add Product
          </RouterLink>

          <RouterLink
            to="/admin/promotions"
            class="block rounded-full px-3 py-1.5 text-[13px] text-[#435040] transition hover:bg-[rgba(176,205,155,0.35)] hover:translate-x-[2px] hover:shadow-[0_4px_10px_rgba(139,164,117,0.4)]"
            active-class="bg-gradient-to-r from-[#f2b075] to-[#8ac79e] text-[#263121] shadow-[0_8px_16px_rgba(191,170,123,0.55)]"
          >
            Add Promotion
          </RouterLink>

          <RouterLink
            to="/admin/reports"
            class="block rounded-full px-3 py-1.5 text-[13px] text-[#435040] transition hover:bg-[rgba(176,205,155,0.35)] hover:translate-x-[2px] hover:shadow-[0_4px_10px_rgba(139,164,117,0.4)]"
            active-class="bg-gradient-to-r from-[#f2b075] to-[#8ac79e] text-[#263121] shadow-[0_8px_16px_rgba(191,170,123,0.55)]"
          >
            Admin Reports
          </RouterLink>
        </template>

      </nav>
    </aside>

    <!-- MAIN CONTENT -->
    <div class="flex flex-1 flex-col">
      <header
        class="sticky top-0 z-10 flex items-center justify-between border-b border-[rgba(215,200,177,0.9)] bg-[rgba(252,245,233,0.96)] px-4 py-3 backdrop-blur-md md:px-7"
      >
        <div>
          <h1 class="m-0 text-[18px] font-semibold text-[#313927]">
            ELSO - Wholesale Tracking Portal
          </h1>
          <p class="mt-[2px] text-[12px] text-[#7a806a]">
            Elite Solutions • Orders, Inventory & Reports
          </p>
        </div>

        <div class="flex items-center gap-3">
          <RouterLink
            v-if="!isLoggedIn()"
            to="/login"
            class="rounded-full border border-[rgba(144,177,137,0.95)] bg-transparent px-3 py-1.5 text-[12px] text-[#3f5b41] transition hover:bg-gradient-to-r hover:from-[#f5c58a] hover:to-[#8ac79e] hover:text-[#263121] hover:shadow-[0_5px_14px_rgba(177,179,132,0.6)]"
          >
            Login
          </RouterLink>

          <div
            v-else
            class="flex items-center gap-2 rounded-full border border-[rgba(210,197,167,0.9)] bg-gradient-to-r from-[#fdf7ea] to-[#eef5eb] px-2.5 py-1.5 shadow-[0_4px_12px_rgba(156,151,118,0.3)]"
          >
            <div
              class="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-gradient-to-br from-[#f2b075] to-[#8ac79e] text-[14px] text-[#283124]"
            >
              {{ authState.user?.name?.charAt(0)?.toUpperCase() ?? "U" }}
            </div>

            <div class="mr-1 flex flex-col">
              <span class="text-[12px] font-medium text-[#333c2f]">
                {{ authState.user?.name }}
              </span>

              <span
                v-if="authState.user?.role === 'BUYER' && authState.user?.companyName"
                class="-mt-0.5 text-[10px] text-[#65715e]"
              >
                {{ authState.user?.companyName }}
              </span>

              <span
                class="mt-[2px] inline-flex w-fit items-center justify-center rounded-full px-1.5 py-[2px] text-[10px] font-semibold uppercase tracking-[0.04em]"
                :class="{
                  'bg-[#f5b0b6] text-[#6f2330]': authState.user?.role === 'ADMIN',
                  'bg-[#cbe8c9] text-[#2f3a2b]': authState.user?.role === 'BUYER'
                }"
              >
                {{ authState.user?.role === 'BUYER' ? 'CUSTOMER' : authState.user?.role}}
              </span>
            </div>

            <button
              class="rounded-full border border-[#e6a3af] bg-[#f7c6cc] px-3.5 py-1.5 text-[12px] font-semibold text-[#5a2730] shadow-[0_3px_8px_rgba(214,132,145,0.45)] transition hover:-translate-y-[1px] hover:bg-[#f8d2d7] hover:shadow-[0_6px_14px_rgba(214,132,145,0.7)]"
              @click="handleLogout"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main class="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-7">
        <RouterView />
      </main>
    </div>
  </div>
</template>

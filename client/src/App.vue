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
  <div class="app-shell">
    <!-- Sidebar (only when logged in) -->
    <aside v-if="isLoggedIn()" class="sidebar">
      <div class="sidebar__brand">
        <span class="brand-logo">🥦</span>
        <div class="brand-text">
          <h2>Wholesale Portal</h2>
          <p>Orders &amp; Inventory</p>
        </div>
      </div>

      <nav class="sidebar__nav">
        <p class="nav-label">Buyer</p>

        <RouterLink
          to="/buyer"
          class="nav-link"
          active-class="nav-link--active"
        >
          Product Catalog
        </RouterLink>

        <RouterLink
          to="/buyer/orders"
          class="nav-link"
          active-class="nav-link--active"
        >
          My Orders
        </RouterLink>

        <template v-if="isAdmin()">
          <p class="nav-label nav-label--spaced">Admin</p>

          <RouterLink
            to="/admin"
            class="nav-link"
            active-class="nav-link--active"
          >
            Admin Orders
          </RouterLink>

          <RouterLink
            to="/admin/products"
            class="nav-link"
            active-class="nav-link--active"
          >
            Admin Products
          </RouterLink>

          <RouterLink
            to="/admin/reports"
            class="nav-link"
            active-class="nav-link--active"
          >
            Admin Reports
          </RouterLink>
        </template>
      </nav>
    </aside>

    <!-- Main area -->
    <div class="app-main">
      <header class="topbar">
        <div class="topbar__left">
          <h1>Wholesale Tracking Portal</h1>
          <p class="subtitle">
            Manage fresh produce orders, inventory &amp; reports.
          </p>
        </div>

        <div class="topbar__right">
          <!-- Show Login link when NOT logged in -->
          <RouterLink
            v-if="!isLoggedIn()"
            to="/login"
            class="btn btn-login"
            active-class="btn-login--active"
          >
            Login
          </RouterLink>

          <!-- User info + Logout when logged in -->
          <div v-else class="user-pill">
            <div class="user-avatar">
              {{ authState.user?.name?.charAt(0)?.toUpperCase() ?? "U" }}
            </div>
            <div class="user-meta">
              <span class="user-name">
                {{ authState.user?.name || "User" }}
              </span>
              <span class="user-role">
                {{ authState.user?.role }}
              </span>
            </div>
            <button class="btn btn-logout" @click="handleLogout">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* ------------------------------
   Overall layout + background
------------------------------ */
.app-shell {
  display: flex;
  min-height: 100vh;
  width: 100%;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    Roboto, Helvetica, Arial, sans-serif;
  /* warm veggie-market background */
  background: radial-gradient(
      circle at top left,
      #f9f2e3 0%,
      #f2f6ee 45%,
      #fbeee5 100%
    );
  color: #2f3a2b;
}

/* ------------------------------
   Sidebar - soft sage / cream
------------------------------ */
.sidebar {
  width: 235px;
  padding: 18px 16px;
  background: linear-gradient(180deg, #f6f3e8 0%, #edf4e8 100%);
  border-right: 1px solid rgba(179, 191, 158, 0.6);
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: 4px 0 18px rgba(133, 146, 115, 0.18);
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo {
  font-size: 26px;
  background: radial-gradient(
    circle at 30% 20%,
    #9fd39f 0,
    #7fb786 50%,
    #5d9466 100%
  );
  color: #ffffff;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-text h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #333c2f;
}

.brand-text p {
  margin: 0;
  font-size: 11px;
  color: #767f70;
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
}

.nav-label {
  margin: 10px 4px 3px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #8d947f;
}

.nav-label--spaced {
  margin-top: 16px;
}

.nav-link {
  display: block;
  padding: 7px 10px;
  border-radius: 999px;
  font-size: 13px;
  text-decoration: none;
  color: #435040;
  background: transparent;
  transition: background 0.16s ease, color 0.16s ease, transform 0.08s ease,
    box-shadow 0.16s ease;
}

.nav-link:hover {
  background: rgba(176, 205, 155, 0.35);
  transform: translateX(2px);
  box-shadow: 0 4px 10px rgba(139, 164, 117, 0.4);
}

/* active: carrot + herb gradient */
.nav-link--active {
  background: linear-gradient(135deg, #f2b075, #8ac79e);
  color: #263121;
  box-shadow: 0 8px 16px rgba(191, 170, 123, 0.55);
}

/* ------------------------------
   Main area
------------------------------ */
.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* ------------------------------
   Topbar - warm light bar
------------------------------ */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 28px;
  border-bottom: 1px solid rgba(215, 200, 177, 0.9);
  background: rgba(252, 245, 233, 0.96);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 10;
}

.topbar__left h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #313927;
}

.subtitle {
  margin: 2px 0 0;
  font-size: 12px;
  color: #7a806a;
}

/* right side */
.topbar__right {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ------------------------------
   User pill
------------------------------ */
.user-pill {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 4px 7px 4px 4px;
  border-radius: 999px;
  background: linear-gradient(90deg, #fdf7ea 0%, #eef5eb 100%);
  border: 1px solid rgba(210, 197, 167, 0.9);
  box-shadow: 0 4px 12px rgba(156, 151, 118, 0.3);
}

.user-avatar {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  background: linear-gradient(135deg, #f2b075, #8ac79e);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #283124;
}

.user-meta {
  display: flex;
  flex-direction: column;
  margin-right: 4px;
}

.user-name {
  font-size: 12px;
  font-weight: 500;
  color: #333c2f;
}

.user-role {
  font-size: 11px;
  color: #777e6c;
}

/* ------------------------------
   Buttons
------------------------------ */
.btn {
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-size: 12px;
  padding: 6px 12px;
  transition: background 0.15s ease, box-shadow 0.15s ease, transform 0.08s ease,
    color 0.15s ease;
}

/* login: herb outline */
.btn-login {
  background: transparent;
  color: #3f5b41;
  border: 1px solid rgba(144, 177, 137, 0.95);
}

.btn-login--active,
.btn-login:hover {
  background: linear-gradient(135deg, #f5c58a, #8ac79e);
  color: #263121;
  box-shadow: 0 5px 14px rgba(177, 179, 132, 0.6);
}

/* logout: beet / tomato */
.btn-logout {
  background: #f5b0b6;
  color: #6f2330;
  border: 1px solid rgba(238, 163, 172, 0.95);
}

.btn-logout:hover {
  background: #f398a1;
  transform: translateY(-1px);
  box-shadow: 0 5px 14px rgba(214, 132, 145, 0.55);
}

/* ------------------------------
   Content area
------------------------------ */
.content {
  padding: 24px 32px 32px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
}

/* ------------------------------
   Responsive
------------------------------ */
@media (max-width: 900px) {
  .sidebar {
    display: none;
  }

  .topbar {
    padding-inline: 16px;
  }

  .content {
    padding-inline: 16px;
    max-width: 100%;
  }
}
</style>

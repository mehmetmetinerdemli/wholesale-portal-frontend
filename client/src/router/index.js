import { createRouter, createWebHistory } from "vue-router";
import BuyerView from "../views/BuyerView.vue";
import AdminView from "../views/AdminView.vue";
import LoginView from "../views/LoginView.vue";
import AdminProductsView from "../views/AdminProductsView.vue";
import { authState, isLoggedIn, isAdmin } from "../auth";
import BuyerOrdersView from "../views/BuyerOrdersView.vue";
import AdminReportsView from "../views/AdminReportsView.vue";
import AdminAddProductsView from "../views/AdminAddProductsView.vue";

// BUYER PROMOTIONS PAGE
import PromotionsView from "../views/PromotionsView.vue";

// ADMIN PROMOTIONS PAGE
import AdminPromotionsView from "../views/AdminPromotionsView.vue";

const routes = [
  { path: "/login", component: LoginView },

  // Buyer pages
  {
    path: "/buyer",
    component: BuyerView,
    meta: { requiresAuth: true },
  },
  {
    path: "/buyer/orders",
    component: BuyerOrdersView,
    meta: { requiresAuth: true },
  },

  // Promotions (Buyer View)
  {
    path: "/promotions/daily",
    component: PromotionsView,
    meta: { requiresAuth: true, promoType: "DAILY" },
  },
  {
    path: "/promotions/weekly",
    component: PromotionsView,
    meta: { requiresAuth: true, promoType: "WEEKLY" },
  },
  {
    path: "/promotions/monthly",
    component: PromotionsView,
    meta: { requiresAuth: true, promoType: "MONTHLY" },
  },

  // Admin pages
  {
    path: "/admin",
    component: AdminView,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/admin/products",
    component: AdminProductsView,
    meta: { requiresAuth: true, requiresAdmin: true },
  },

  {
    path: "/admin/products/add",
    component: AdminAddProductsView,
    meta: { requiresAuth: true },
  },

  {
    path: "/admin/reports",
    component: AdminReportsView,
    meta: { requiresAuth: true, requiresAdmin: true },
  },

  // ⭐ NEW: Admin Promotions Page
  {
    path: "/admin/promotions",
    component: AdminPromotionsView,
    meta: { requiresAuth: true, requiresAdmin: true },
  },

  { path: "/", redirect: "/login" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const loggedIn = isLoggedIn();

  if (to.meta.requiresAuth && !loggedIn) {
    return next("/login");
  }

  if (to.meta.requiresAdmin && !isAdmin()) {
    return next(loggedIn ? "/buyer" : "/login");
  }

  if (to.path === "/login" && loggedIn) {
    return next(isAdmin() ? "/admin" : "/buyer");
  }

  next();
});

export default router;

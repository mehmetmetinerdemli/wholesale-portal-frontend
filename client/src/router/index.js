import { createRouter, createWebHistory } from "vue-router";
import BuyerView from "../views/BuyerView.vue";
import AdminView from "../views/AdminView.vue";
import LoginView from "../views/LoginView.vue";
import AdminProductsView from "../views/AdminProductsView.vue";
import { authState, isLoggedIn, isAdmin } from "../auth";
import BuyerOrdersView  from "../views/BuyerOrdersView.vue";
import AdminReportsView from "../views/AdminReportsView.vue";



const routes = [
  { path: "/login", component: LoginView },
  {
    path: "/buyer",
    component: BuyerView,
    meta: { requiresAuth: true },
  },

  {path: "/buyer/orders",
    component: BuyerOrdersView,
    meta: {requiresAuth:true},
  },

  {
    path: "/admin",
    component: AdminView, // orders overview
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/admin/products",
    component: AdminProductsView,
    meta: { requiresAuth: true, requiresAdmin: true },
  },

  {
    path: "/admin/reports",
    component: AdminReportsView,
    meta: {requiresAuth: true, requiresAdmin: true},
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
    // if user is logged in but not admin → send to buyer page
    if (loggedIn) {
      return next("/buyer");
    }
    return next("/login");
  }

  // If user is already logged in and goes to /login, send them somewhere useful
  if (to.path === "/login" && loggedIn) {
    if (isAdmin()) return next("/admin");
    return next("/buyer");
  }

  next();
});

export default router;

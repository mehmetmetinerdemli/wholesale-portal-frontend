// src/auth.js
import { reactive } from "vue";

const stored = localStorage.getItem("auth");

const initialState = stored
  ? JSON.parse(stored)
  : {
      user: null,
      token: null,
    };

export const authState = reactive(initialState);

function saveToStorage() {
  localStorage.setItem(
    "auth",
    JSON.stringify({
      user: authState.user,
      token: authState.token,
    })
  );
}

export function setAuth(user, token) {
  authState.user = user;
  authState.token = token;
  saveToStorage();
}

export function clearAuth() {
  authState.user = null;
  authState.token = null;
  localStorage.removeItem("auth");
}

export function isLoggedIn() {
  return !!authState.token;
}

export function isAdmin() {
  return authState.user?.role === "ADMIN";
}

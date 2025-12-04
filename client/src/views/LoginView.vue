<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { setAuth } from "../auth";

const router = useRouter();

// mode: "login" or "register"
const mode = ref("login");

const email = ref("");
const password = ref("");
const name = ref("");
const confirmPassword = ref("");
const companyName = ref("");

const loading = ref(false);
const error = ref("");
const info = ref("");

async function handleLogin() {
  error.value = "";
  info.value = "";

  if (!email.value || !password.value) {
    error.value = "Please fill in email and password.";
    return;
  }

  loading.value = true;

  try {
    const response = await fetch("http://localhost:4000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "Login failed");
    }

    const data = await response.json();
    setAuth(data.user, data.token);

    // Always go to product catalog first (for both admin and buyer)
    router.push("/buyer");
  } catch (err) {
    console.error(err);
    error.value = err.message || "Error while logging in.";
  } finally {
    loading.value = false;
  }
}

async function handleRegister() {
  error.value = "";
  info.value = "";

  if (!name.value || !email.value || !password.value || !confirmPassword.value) {
    error.value = "Please fill in all required fields.";
    return;
  }

  if (password.value !== confirmPassword.value) {
    error.value = "Passwords do not match.";
    return;
  }

  if (password.value.length < 6) {
    error.value = "Password must be at least 6 characters.";
    return;
  }

  loading.value = true;

  try {
    const response = await fetch("http://localhost:4000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.value,
        email: email.value,
        password: password.value,
        companyName: companyName.value || null,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Registration failed");
    }

    // backend returns { user, token } → auto-login
    if (data.user && data.token) {
      setAuth(data.user, data.token);

      // Always go to product catalog first (for both admin and buyer)
      router.push("/buyer");
      return;
    }

    // fallback: show message and switch to login
    info.value = data.message || "Registration successful! You can now log in.";
    mode.value = "login";
    password.value = "";
    confirmPassword.value = "";
  } catch (err) {
    console.error(err);
    error.value = err.message || "Error while registering.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="w-full flex justify-center py-7 px-4">
    <div
      class="w-full max-w-md rounded-2xl border border-amber-200/70 bg-gradient-to-b from-amber-50 to-emerald-50 shadow-xl shadow-amber-200/60 px-7 py-6"
    >
      <!-- Header -->
      <div class="text-center mb-5">
        <div
          class="mx-auto mb-3 flex h-18 w-18 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-emerald-300 text-3xl shadow-lg shadow-amber-300/60"
          style="width: 72px; height: 72px;"
        >
          🍅
        </div>
        <h2 class="m-0 text-[1.55rem] font-semibold text-[#2f3a2b]">
          {{ mode === "login" ? "Welcome back" : "Create your account" }}
        </h2>
        <p class="mt-1 text-[0.95rem] text-[#747c69]">
          {{
            mode === "login"
              ? "Sign in to continue"
              : "Register as a customer to start ordering"
          }}
        </p>
      </div>

      <!-- LOGIN FORM -->
      <form
        v-if="mode === 'login'"
        @submit.prevent="handleLogin"
        class="flex flex-col gap-4"
      >
        <div class="flex flex-col gap-1">
          <label
            for="email"
            class="text-[0.85rem] text-[#4f5a43]"
          >
            📧 Email
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="customer@example.com"
            class="rounded-[10px] border border-[#cfdcc3] bg-[#fdfcf9] px-3 py-2 text-[0.95rem] text-[#2f3a2b] outline-none transition focus:border-[#8ac79e] focus:bg-white focus:ring-2 focus:ring-[#8ac79e55]"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label
            for="password"
            class="text-[0.85rem] text-[#4f5a43]"
          >
            🔑 Password
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Your password"
            class="rounded-[10px] border border-[#cfdcc3] bg-[#fdfcf9] px-3 py-2 text-[0.95rem] text-[#2f3a2b] outline-none transition focus:border-[#8ac79e] focus:bg-white focus:ring-2 focus:ring-[#8ac79e55]"
          />
        </div>

        <div
          v-if="error"
          class="rounded-[10px] border border-[#f3c5c9] bg-[#ffe7e8] px-3 py-2 text-[0.86rem] text-center text-[#8b323a]"
        >
          {{ error }}
        </div>

        <div
          v-if="info"
          class="rounded-[10px] border border-[#b4ddc0] bg-[#e0f3e6] px-3 py-2 text-[0.86rem] text-center text-[#25633e]"
        >
          {{ info }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="mt-1 w-full rounded-full border-none bg-gradient-to-br from-[#f2b075] to-[#8ac79e] px-4 py-2.5 text-[1rem] font-medium text-[#2f3a2b] shadow-md shadow-[#99a98c66] transition hover:-translate-y-[2px] hover:shadow-xl disabled:cursor-default disabled:opacity-55"
        >
          {{ loading ? "Logging in..." : "Login" }}
        </button>

        <!-- divider -->
        <div
          class="mt-2 mb-1 flex items-center justify-center gap-3 text-[0.78rem] uppercase tracking-[0.08em] text-[#a0a797]"
        >
          <span class="h-px flex-1 bg-gradient-to-r from-transparent via-[#beb8a0cc] to-transparent" />
          <span>or</span>
          <span class="h-px flex-1 bg-gradient-to-r from-transparent via-[#beb8a0cc] to-transparent" />
        </div>

        <button
          type="button"
          class="w-full rounded-full border-none bg-gradient-to-br from-[#f2b075a6] to-[#8ac79ea6] px-4 py-2.5 text-[0.95rem] font-medium text-[#2f3a2b] shadow-md shadow-[#99a98c66] transition hover:-translate-y-[2px] hover:shadow-xl"
          @click="
            mode = 'register';
            error = '';
            info = '';
          "
        >
          Create a customer account
        </button>
      </form>

      <!-- REGISTER FORM -->
      <form
        v-else
        @submit.prevent="handleRegister"
        class="flex flex-col gap-4"
      >
        <div class="flex flex-col gap-1">
          <label
            for="name"
            class="text-[0.85rem] text-[#4f5a43]"
          >
            👤 Name
          </label>
          <input
            id="name"
            v-model="name"
            type="text"
            placeholder="Your full name"
            class="rounded-[10px] border border-[#cfdcc3] bg-[#fdfcf9] px-3 py-2 text-[0.95rem] text-[#2f3a2b] outline-none transition focus:border-[#8ac79e] focus:bg-white focus:ring-2 focus:ring-[#8ac79e55]"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label
            for="company"
            class="text-[0.85rem] text-[#4f5a43]"
          >
            🏬 Company name (optional)
          </label>
          <input
            id="company"
            v-model="companyName"
            type="text"
            placeholder="Your company"
            class="rounded-[10px] border border-[#cfdcc3] bg-[#fdfcf9] px-3 py-2 text-[0.95rem] text-[#2f3a2b] outline-none transition focus:border-[#8ac79e] focus:bg-white focus:ring-2 focus:ring-[#8ac79e55]"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label
            for="reg-email"
            class="text-[0.85rem] text-[#4f5a43]"
          >
            📧 Email
          </label>
          <input
            id="reg-email"
            v-model="email"
            type="email"
            placeholder="you@company.com"
            class="rounded-[10px] border border-[#cfdcc3] bg-[#fdfcf9] px-3 py-2 text-[0.95rem] text-[#2f3a2b] outline-none transition focus:border-[#8ac79e] focus:bg-white focus:ring-2 focus:ring-[#8ac79e55]"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label
            for="reg-password"
            class="text-[0.85rem] text-[#4f5a43]"
          >
            🔑 Password
          </label>
          <input
            id="reg-password"
            v-model="password"
            type="password"
            placeholder="Choose a password"
            class="rounded-[10px] border border-[#cfdcc3] bg-[#fdfcf9] px-3 py-2 text-[0.95rem] text-[#2f3a2b] outline-none transition focus:border-[#8ac79e] focus:bg-white focus:ring-2 focus:ring-[#8ac79e55]"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label
            for="reg-confirm"
            class="text-[0.85rem] text-[#4f5a43]"
          >
            ✅ Confirm password
          </label>
          <input
            id="reg-confirm"
            v-model="confirmPassword"
            type="password"
            placeholder="Repeat your password"
            class="rounded-[10px] border border-[#cfdcc3] bg-[#fdfcf9] px-3 py-2 text-[0.95rem] text-[#2f3a2b] outline-none transition focus:border-[#8ac79e] focus:bg-white focus:ring-2 focus:ring-[#8ac79e55]"
          />
        </div>

        <div
          v-if="error"
          class="rounded-[10px] border border-[#f3c5c9] bg-[#ffe7e8] px-3 py-2 text-[0.86rem] text-center text-[#8b323a]"
        >
          {{ error }}
        </div>

        <div
          v-if="info"
          class="rounded-[10px] border border-[#b4ddc0] bg-[#e0f3e6] px-3 py-2 text-[0.86rem] text-center text-[#25633e]"
        >
          {{ info }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="mt-1 w-full rounded-full border-none bg-gradient-to-br from-[#f2b075] to-[#8ac79e] px-4 py-2.5 text-[1rem] font-medium text-[#2f3a2b] shadow-md shadow-[#99a98c66] transition hover:-translate-y-[2px] hover:shadow-xl disabled:cursor-default disabled:opacity-55"
        >
          {{ loading ? "Creating account..." : "Register" }}
        </button>

        <p class="mt-2 text-center text-[0.82rem] text-[#6b7460]">
          Already have an account?
          <button
            type="button"
            class="ml-1 cursor-pointer border-none bg-transparent p-0 text-[0.82rem] font-semibold text-[#4c8f6a] underline underline-offset-2"
            @click="
              mode = 'login';
              error = '';
              info = '';
            "
          >
            Log in
          </button>
        </p>
      </form>

      <p class="mt-4 text-center text-[0.8rem] text-[#6b7460]">
        Testing accounts: <br />
        <code
          class="mt-1 inline-block rounded-[6px] border border-[#d4d0bf] bg-[#f3f0e6] px-2 py-1 text-[0.82rem]"
        >
          admin@example.com / admin123
        </code>
        <br />
        <code
          class="mt-1 inline-block rounded-[6px] border border-[#d4d0bf] bg-[#f3f0e6] px-2 py-1 text-[0.82rem]"
        >
          customer@example.com / customer123
        </code>
      </p>
    </div>
  </div>
</template>

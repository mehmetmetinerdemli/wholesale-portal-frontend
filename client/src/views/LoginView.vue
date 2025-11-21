<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { setAuth } from "../auth";

const router = useRouter();

const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

async function handleLogin() {
  error.value = "";
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

    if (data.user.role === "ADMIN") {
      router.push("/admin");
    } else {
      router.push("/buyer");
    }
  } catch (err) {
    console.error(err);
    error.value = err.message || "Error while logging in.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-wrapper">
    <div class="login-card">

      <div class="card-header">
        <div class="logo-circle">🥕</div>
        <h2>Welcome back</h2>
        <p class="subtitle">Sign in to continue</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="field">
          <label for="email">📧 Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="buyer@example.com"
          />
        </div>

        <div class="field">
          <label for="password">🔑 Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Your password"
          />
        </div>

        <div v-if="error" class="error">{{ error }}</div>

        <button class="btn-login" type="submit" :disabled="loading">
          {{ loading ? "Logging in..." : "Login" }}
        </button>
      </form>

      <p class="hint">
        Testing accounts: <br />
        <code>admin@example.com / admin123</code><br />
        <code>buyer@example.com / buyer123</code>
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Wrapper (inside App.vue content area) */
.login-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 28px 0 34px;
}

/* Card */
.login-card {
  width: 100%;
  max-width: 420px;
  padding: 26px 26px 20px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f6f3e8 0%, #edf4e8 100%);
  border: 1px solid #dcd8c7;
  box-shadow: 0 10px 20px rgba(180, 167, 140, 0.25);
}

/* Header */
.card-header {
  text-align: center;
  margin-bottom: 1.4rem;
}

.logo-circle {
  width: 72px;
  height: 72px;
  margin: 0 auto 0.8rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #f2b075, #8ac79e);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2.3rem;
  color: #2f3a2b;
  box-shadow: 0 6px 18px rgba(143, 155, 132, 0.4);
}

h2 {
  margin: 0;
  font-size: 1.55rem;
  color: #2f3a2b;
  font-weight: 600;
}

.subtitle {
  margin: 0.25rem 0 0;
  color: #747c69;
  font-size: 0.95rem;
}

/* Form */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field label {
  font-size: 0.85rem;
  color: #4f5a43;
}

.field input {
  padding: 0.58rem 0.7rem;
  font-size: 0.95rem;
  border-radius: 10px;
  border: 1px solid #cfdcc3;
  background: #fdfcf9;
  color: #2f3a2b;
  outline: none;
  transition: border 0.15s ease, background 0.15s ease, box-shadow 0.2s ease;
}

.field input:focus {
  border-color: #8ac79e;
  background: #ffffff;
  box-shadow: 0 0 0 2px rgba(138, 199, 158, 0.35);
}

/* Error */
.error {
  color: #8b323a;
  background: #ffe7e8;
  border: 1px solid #f3c5c9;
  padding: 0.5rem 0.6rem;
  border-radius: 10px;
  font-size: 0.86rem;
  text-align: center;
}

/* Login button */
.btn-login {
  width: 100%;
  padding: 0.7rem;
  font-size: 1rem;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #f2b075, #8ac79e);
  color: #2f3a2b;
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.15s ease;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(153, 169, 140, 0.4);
}

.btn-login:disabled {
  opacity: 0.55;
  cursor: default;
}

/* Hint text */
.hint {
  margin-top: 1rem;
  text-align: center;
  font-size: 0.8rem;
  color: #6b7460;
}

.hint code {
  background: #f3f0e6;
  padding: 0.15rem 0.35rem;
  border-radius: 6px;
  font-size: 0.82rem;
  border: 1px solid #d4d0bf;
}
</style>

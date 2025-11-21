import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

import "./style.css"; // if it exists in your project

createApp(App).use(router).mount("#app");

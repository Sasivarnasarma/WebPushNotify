<p align="center">
  <h1 align="center">🔔 WebPushNotify</h1>
  <p align="center">
    <strong>A production-ready demo for web push notifications with user isolation & broadcast features 🚀</strong>
  </p>
  <p align="center">
    🌍 <strong>This branch is used to power the live demo at: <a href="https://wpn.sasivarnasarma.me/">https://wpn.sasivarnasarma.me/</a></strong>
  </p>
</p>

---

## 📝 Overview

The **WebPushNotify Demo Branch** is specifically designed for multi-tenant and demonstration environments. It focuses on **User Isolation**, ensuring that demonstration users only view and interact with their own subscriptions and notification history, while still allowing a **Super Admin** to maintain global control.

### 🌟 Key Highlights
- **👤 Multi-Tenant Isolation**: Each browser session is treated as a unique "Owner," isolating their data.
- **🛡️ Dual-Secret Security**: Use `ADMIN_SECRET` for isolated access or `SUPER_ADMIN_SECRET` for global broadcast.
- **✨ Auto-Fill Login**: The demo admin login is pre-filled for a seamless trial experience.
- **📱 PWA Support**: Fully installable as a Progressive Web App on any device.

---

## 👥 User Isolation

In this branch, the frontend automatically generates a persistent `owner_id`. This ensures a private experience for every visitor:
- **Private Stats**: See only the count of devices you have personally subscribed.
- **Private History**: View and manage only the notifications you have created.
- **Targeted Delivery**: Standard notifications only reach the devices registered in your current session.

---

## 👑 Super Admin Mode

For global management, the `SUPER_ADMIN_SECRET` provides elevated privileges:
- **Global Visibility**: Bypasses all isolation to see **all** registered devices.
- **Full Audit**: View every notification sent through the system globally.
- **Global Broadcast**: Send notifications to **every single device** in the database at once.

---

## 📂 Project Structure

- **Backend**: FastAPI with dual-secret authentication and owner-scoped delivery logic.
- **Frontend**: React + Vite featuring automatic `owner_id` injection and a tailored demo UI.
- **PWA**: Service worker implementation for background notification delivery.

---

<h3 align="center">Made with ❤️ and ☕ By @Sasivarnasarma</h3>

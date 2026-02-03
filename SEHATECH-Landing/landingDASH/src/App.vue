<template>
  <div class="container">
    <header class="header">
      <div class="brand">
        <img src="/src/assets/logo.png" alt="SEHATECH" />
        <div>
          <div class="title">SEHATECH</div>
          <div class="subtitle">Page d’accès pour tests — Web & Mobile</div>
        </div>
      </div>
    </header>

    <section class="card">
      <table class="table">
        <thead class="thead">
          <tr>
            <th>Application</th>
            <th>Identifiants</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="app in apps" :key="app.name" class="row">
            <td class="cell app-name">{{ app.name }}</td>
            <td class="cell">
              <div class="cred">
                <input :value="app.email" readonly aria-label="email" />
                <input :value="app.password" readonly aria-label="password" />
                <button class="btn" @click="copyCreds(app)">Copier</button>
              </div>
            </td>
            <td class="cell">
              <div class="buttons">
                <a :href="app.url" target="_blank" rel="noopener" class="btn primary">
                  Ouvrir l’application
                </a>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <footer class="footer">
      <span class="badge">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        </svg>
        Vite + Vue 3
      </span>
      <span>Mettez à jour les URLs si vous déployez sur des domaines distincts.</span>
    </footer>
  </div>
</template>

<script setup>
const apps = [
  {
    name: 'Admin Dash',
    email: 'bourek@hospital.dz',
    password: 'qwertyqwerty',
    url: 'https://sehatech-admin.vercel.app/',
  },
  {
    name: 'Medecin Dash',
    email: 'bourek@medecin.dz',
    password: 'qwertyqwerty',
    url: 'https://sehatech-medecin.vercel.app/',
  },
  {
    name: 'Technicien Dash',
    email: 'bourek@tech.dz',
    password: 'qwertyqwerty',
    url: 'https://sehatech-tech.vercel.app/',
  },
  {
    name: 'Soin application',
    email: 'bourek@soin.dz',
    password: 'qwertyqwerty',
    url: 'https://drive.google.com/file/d/1B6handXIxrS7HzA48TnpBo75Dh4XD1c9/view?usp=drive_link',
  },
]

function copyCreds(app) {
  const text = `email: ${app.email}\npassword: ${app.password}`
  navigator.clipboard?.writeText(text)
}
</script>

<style>
</style>

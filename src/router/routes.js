const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [{ path: "", component: () => import("pages/IndexPage.vue") }],
  },
  {
    path: "/jogos",
    component: () => import("layouts/GamesLayout.vue"),
    children: [
      { path: "2048", meta:{title:'2048 - Offline', id: '2048'}, component: () => import("pages/jogos/2048/2048Page.vue") },
      { path: "2048-classic", meta:{title:'2048 - Clássico', id: '2048_classic'}, component: () => import("pages/jogos/2048/2048Classic.vue") },
      { path: "2048-lapse", meta:{title:'2048 - Lapse', id: '2048_lapse'}, component: () => import("pages/jogos/2048/2048Lapse.vue") },
      { path: "2048-connect", meta:{title:'2048 - Conecção', id: '2048_connect'}, component: () => import("pages/jogos/2048/2048Connect.vue") },

    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;

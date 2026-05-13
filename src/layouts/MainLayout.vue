<template>
  <q-layout view="hHh Lpr lFf">
    <q-header class="bg-transparent text-primary">
      <q-toolbar>
        <q-btn
          v-if="$q.screen.md || $q.screen.lg || $q.screen.xl"
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title> 
          <Logo />
        </q-toolbar-title>

        <div>Total de jogos: {{ totalDeJogos }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      behavior="desktop"
      elevated
      overlay
      bordered
    >
      <q-list>
        <q-item-label header> Essential Links </q-item-label>

        <EssentialLink
          v-for="link in linksList"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
    <q-footer
      class="bg-transparent text-primary"
      v-if="$q.screen.xs || $q.screen.sm"
    >
      <q-tabs>
        <q-route-tab
          v-for="link in linksList"
          :key="link.title"
          :name="link.title"
          :icon="link.icon"
          :to="link.link"
        />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { ref, computed } from "vue";
import EssentialLink from "components/EssentialLink.vue";
import { useStorage } from "@vueuse/core";
import Logo from "components/Logo.vue";
import { useQuasar } from "quasar";
import { useStoreJogos } from "stores/jogos";''

const $q = useQuasar();
const storeJogos = useStoreJogos();
const totalDeJogos = computed(() => storeJogos.getTotalJogos);
const linksList = [
  {
    title: "Docs",
    caption: "quasar.dev",
    icon: "school",
    link: "https://quasar.dev",
  },
  {
    title: "Github",
    caption: "github.com/quasarframework",
    icon: "code",
    link: "https://github.com/quasarframework",
  },
  {
    title: "Discord Chat Channel",
    caption: "chat.quasar.dev",
    icon: "chat",
    link: "https://chat.quasar.dev",
  },
  {
    title: "Forum",
    caption: "forum.quasar.dev",
    icon: "record_voice_over",
    link: "https://forum.quasar.dev",
  },
  {
    title: "Twitter",
    caption: "@quasarframework",
    icon: "rss_feed",
    link: "https://twitter.quasar.dev",
  },
  {
    title: "Facebook",
    caption: "@QuasarFramework",
    icon: "public",
    link: "https://facebook.quasar.dev",
  },
  {
    title: "Quasar Awesome",
    caption: "Community Quasar projects",
    icon: "favorite",
    link: "https://awesome.quasar.dev",
  },
];

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>

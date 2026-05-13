<template>
  <q-page class="flex flex-center">
    <!-- <h1>Bem-vindo ao CR Jogos Offline!</h1>
    <p>
      Este é o seu ponto de partida para explorar o mundo dos jogos offline.
    </p>
    <p>
      Use o menu para navegar pelos jogos disponíveis e aproveite a diversão!
    </p>
    <div>Total de jogos: {{ totalDeJogos }}</div> -->
    <div
      :style="{
        display: 'grid',
        'grid-template-columns': `repeat(${$q.screen.md ? 3 : $q.screen.lg ? 4 : $q.screen.xl ? 5 : 2},1fr)`,
        gap: '16px',
      }"
    >
      <!-- Lista de Jogos -->
      <q-item v-for="jogo in jogos" :key="jogo.id" clickable style="padding: 0" :to="jogo.url">
        <button class="bg-white text-primary card-game">
          <q-img :src="jogo.imagem" :alt="jogo.nome" />
          <div
            class="text-h6 text-center text-uppercase text-weight-bold q-px-sm q-py-sm"
          >
            {{ jogo.nome }}
          </div>
          <q-tooltip
            :content="jogo.descricao"
            anchor="top middle"
            self="bottom middle"
          >
            <p>{{ jogo.descricao }}</p>
          </q-tooltip>
        </button>
      </q-item>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed } from "vue";
import { useStoreJogos } from "stores/jogos";
const jogosStore = useStoreJogos();
const jogos = computed(() => jogosStore.jogos);
const totalDeJogos = computed(() => jogosStore.getTotalJogos);
import { useQuasar } from "quasar";
const $q = useQuasar();
</script>
<style scoped>

</style>

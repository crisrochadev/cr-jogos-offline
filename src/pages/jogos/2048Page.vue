<template>
  <q-page padding class="game-page">
    <q-card class="game-card full-width full-height">
      <div class="desktop-layout">
        <div class="hero-banner">
          <img :src="jogo.imagem" :alt="jogo.nome" class="hero-img" />
          <div class="hero-overlay">
            <h2>{{ jogo.nome }}</h2>
            <p>{{ jogo.descricao }}</p>
          </div>
        </div>

        <q-card-section class="game-content">
          <div class="version-list">
            <button
              v-for="version in jogo.versions"
              :key="version.id"
              class="version-card"
              @click="router.push(version.url)"
            >
              <img :src="version.imagem" :alt="version.nome" />
              <span>{{ version.nome.replace("2048 - ", "") }}</span>
            </button>
          </div>
        </q-card-section>
      </div>
    </q-card>
  </q-page>
</template>

<script setup>
import { useRouter } from "vue-router";
import { useStoreJogos } from "stores/jogos";
const router = useRouter();
const storeJogos = useStoreJogos();
const jogo = storeJogos.getJogo("2048");
</script>

import { defineStore, acceptHMRUpdate } from "pinia";
import { useStorage } from "@vueuse/core";

export const useStoreJogos = defineStore("jogos", {
  state: () => ({
    totalDeJogos: useStorage("totalDeJogos", 0),
    jogos: [
      {
        id: "2048",
        nome: "2048 - Offline",
        descricao:
          "Jogo de quebra-cabeça onde o objetivo é combinar blocos com números iguais para criar um bloco com o número 2048.",
        url: "/jogos/2048",
        imagem: "/img-games/2048.png",
        versions: [
          {
            id: "2048_classic",
            nome: "2048 - Clássico",
            descricao:
              "Jogo de quebra-cabeça onde o objetivo é combinar blocos com números iguais para criar um bloco com o número 2048, utilizando a mecânica de deslizar os blocos.",
            url: "/jogos/2048-classic",
            imagem: "/img-games/2048Classico.png",
            difficulty: 1,
          },

          {
            id: "2048_lapse",
            nome: "2048 - Lapse",
            descricao:
              "Jogo de quebra-cabeça onde o objetivo é combinar blocos com números iguais para criar um bloco com o número 2048, conforme seleciona as peças para cairem no tabuleiro",
            url: "/jogos/2048-lapse",
            imagem: "/img-games/2048Lapse.png",
            difficulty: 1,
          },
          {
            id: "2048_connect",
            nome: "2048 - Conecção",
            descricao:
              "Jogo de quebra-cabeça onde o objetivo é combinar blocos com números iguais para criar um bloco com o número 2048, conforme seleciona as peças ao deslisar o dedo sobre elas",
            url: "/jogos/2048-connect",
            imagem: "/img-games/2048Lapse.png",
            difficulty: 1,
          },
        ],
      },
    ],
  }),

  getters: {
    getTotalJogos: (state) => {
      const total = state.jogos.length;
      state.totalDeJogos = total;
      return total;
    },
    getJogo: (state) => {
      return (id) => state.jogos.find((jogo) => jogo.id === id);
    },
  },

  actions: {
    addJogo() {
      this.totalDeJogos++;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStoreJogos, import.meta.hot));
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      let reg;
      reg = await navigator.serviceWorker.register('/sw.js', { type: "module" });
      console.log('Service worker registrado! 😎', reg);
    } catch (err) {
      console.log('😥 Service worker registro falhou: ', err);
    }
  });
}

let posicaoInicial;
const capturarlocalizacao = document.getElementById('localizacaoo');
const latitude = document.getElementById('latitude');
const longitude = document.getElementById('longitude');

const sucesso = (posicao) => {
  posicaoInicial = posicao;
  latitude.textContent = posicaoInicial.coords.latitude;
  longitude.textContent = posicaoInicial.coords.longitude;
};

const erro = (error) => {
  let errorMessage;
  switch (error.code) {
    case 0:
      errorMessage = "Erro desconhecido";
      break;
    case 1:
      errorMessage = "Permissão negada!";
      break;
    case 2:
      errorMessage = "Captura de posição indisponível!";
      break;
    case 3:
      errorMessage = "Tempo de solicitação excedido!";
      break;
  }
  console.log('Ocorreu um erro: ' + errorMessage);
};

capturarlocalizacao.addEventListener('click', () => {
  navigator.geolocation.getCurrentPosition(sucesso, erro);
});

import { openDB } from "https://unpkg.com/idb?module";

let db;

async function criarDB() {
  try {
    db = await openDB('banco', 1, {
      upgrade(db, oldVersion, newVersion, transaction) {
        const store = db.createObjectStore('localizacao', {
          keyPath: 'nome'
        });
        store.createIndex('id', 'id', { unique: true });
        console.log("Banco de dados criado!");
      }
    });
    console.log("Banco de dados aberto!");
  } catch (e) {
    console.log('Erro ao criar/abrir banco: ' + e.message);
  }
}

window.addEventListener('DOMContentLoaded', async (event) => {
  criarDB();
  document.getElementById('btnCadastrar').addEventListener('click', cadastrarCliente);
  document.getElementById('btnListar').addEventListener('click', buscarTodosOsClientes);
  document.getElementById('btnRemover').addEventListener('click', removerClientes);
});

async function cadastrarCliente() {
  let nome = document.getElementById("nome").value;
  let email = document.getElementById("email").value;
  let data = document.getElementById("data").value;
  let hora = document.getElementById("hora").value;
  let tipo = document.getElementById("tipo").value;

  let geolocalizacao = null;
  if (posicaoInicial) {
    geolocalizacao = {
      latitude: posicaoInicial.coords.latitude,
      longitude: posicaoInicial.coords.longitude
    };
  }

  const tx = await db.transaction('localizacao', 'readwrite');
  const store = tx.objectStore('localizacao');

  try {
    await store.add({
      nome: nome,
      email: email,
      data: data,
      hora: hora,
      tipo: tipo,
      geolocalizacao: geolocalizacao
    });
    limparCampos();
    console.log('Cliente cadastrado com sucesso!');
  } catch (error) {
    console.error('Erro ao cadastrar cliente:', error);
    tx.abort();
  }
}

async function buscarTodosOsClientes() {
  if (db == undefined) {
    console.log("O banco de dados está fechado.");
    return;
  }

  const tx = await db.transaction('localizacao', 'readonly');
  const store = tx.objectStore('localizacao');
  const localizacoes = await store.getAll();

  if (localizacoes && localizacoes.length > 0) {
    const divLista = localizacoes.map((localizacao) => {
      return `<div class="item">
              <h2>Cliente:</h2>
              <p>${localizacao.nome}</p>
              <p>${localizacao.email}</p>
              <p>${localizacao.data}</p>
              <p>${localizacao.hora}</p>
              <p>Modelo: ${localizacao.tipo}</p>
              <p>Geolocalização: ${localizacao.geolocalizacao ? `Lat: ${localizacao.geolocalizacao.latitude}, Long: ${localizacao.geolocalizacao.longitude}` : 'N/A'}</p>
              </div>`;
    });
    listagem(divLista.join(' '));
  } else {
    listagem('<p>Nenhum cliente cadastrado.</p>');
  }
}

async function removerClientes() {
  const nomeRemover = prompt('Qual localizacao deseja excluir:');
  if (!nomeRemover) {
    console.log('Remoção cancelada.');
    return;
  }

  const tx = await db.transaction('localizacao', 'readwrite');
  const store = tx.objectStore('localizacao');

  try {
    await store.delete(nomeRemover);
    console.log('Localização excluída com sucesso!');
    buscarTodosOsClientes();
  } catch (error) {
    console.error('Erro ao excluir localizacao.', error);
    tx.abort();
  }
}

function limparCampos() {
  document.getElementById("nome").value = '';
  document.getElementById("email").value = '';
  document.getElementById("data").value = '';
  document.getElementById("hora").value = '';
  document.getElementById("tipo").value = '';
}

function listagem(text) {
  document.getElementById('resultados').innerHTML = text;
}

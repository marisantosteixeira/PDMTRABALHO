import { openDB } from "idb";

let db;
async function criarDB(){
    try {
        db = await openDB('banco', 1, {
            upgrade(db, oldVersion, newVersion, transaction){
                switch  (oldVersion) {
                    case 0:
                    case 1:
                        const store = db.createObjectStore('clientes', {
                            keyPath: 'nome'
                        });
                        store.createIndex('id', 'id');
                        console.log("banco de dados criado!");
                }
            }
        });
        console.log("banco de dados aberto!");
    }catch (e) {
        console.log('Erro ao criar/abrir banco: ' + e.message);
    }
}

window.addEventListener('DOMContentLoaded', async event =>{
    criarDB();
    document.getElementById('btnCadastrar').addEventListener('click', cadastrarCliente);
    document.getElementById('btnListar').addEventListener('click', buscarTodosOsClientes);
    document.getElementById('btnRemover').addEventListener('click', removerLocalizacao);
});


async function cadastrarCliente() {
    let nome = document.getElementById("nome").value;
    let email = document.getElementById("email").value;
    let data = document.getElementById("data").value;
    let hora = document.getElementById("hora").value;
    let tipo = document.getElementById("tipo").value;
    const tx = await db.transaction('localizacao', 'readwrite')
    const store = tx.objectStore('localizacao');
    try {
        await store.add({ nome: nome, email: email, data: data, hora: hora, tipo:tipo });
        await tx.done;
        limparCampos();
        console.log('Cliente cadastrado com sucesso!');
    } catch (error) {
        console.error('Erro ao cadastrar cliente:', error);
        tx.abort();
    }
}


async function buscarTodosOsClientes(){
    if(db == undefined){
        console.log("O banco de dados está fechado.");
    }
    const tx = await db.transaction('localizacao', 'readonly');
    const store = await tx.objectStore('localizacao');
    const localizacoes = await store.getAll();
    if(localizacoes){
        const divLista = localizacoes.map(localizacao => {
            return `<div class="item">
                    <h2>Cliente:</h2>
                    <p>${localizacao.nome}</p>
                    <p>${localizacao.email}</p>
                    <p>${localizacao.data}</p>
                    <p>${localizacao.hora}</p>
                   <p>Modelo: ${localizacao.tipo}</p>
                   </div>`;
        });
        listagem(divLista.join(' '));
    }
}

async function removerLocalizacao() {
    const tituloRemover = prompt('Qual localizacao deseja excluir:');
    if (!tituloRemover) {
        console.log('Remoção cancelada.');
        return;
    }
    const tx = await db.transaction('localizacao', 'readwrite');
    const store = tx.objectStore('localizacao');
    try {
        await store.delete(tituloRemover);
        await tx.done;
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

function listagem(text){
    document.getElementById('resultados').innerHTML = text;
}
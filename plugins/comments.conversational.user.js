// ==UserScript==
// @name         Analisi conversazionale UTube
// @namespace    https://www.youtube.com/
// @version      1.0
// @description  Sottopone a una intelligenza artificiale un analisi conversazionale di utenti
// @author       Ale
// @match        *://www.youtube.com/*
// @grant        none
// @require      	https://alessandromodica.com/plugins/framework-plugins.js
// ==/UserScript==

/**
 * Inietta il pulsante "Analisi Risposte" in ciascun commento che possiede risposte.
 * Viene analizzato ogni elemento ytd-comment-renderer e se al suo interno è presente un
 * ytd-comment-replies-renderer viene creato un container dedicato al pulsante.
 */
function injectAnalysisButtonToReplies(commentsContainer) {
    const commentElements = commentsContainer.querySelectorAll('ytd-comment-thread-renderer');
    commentElements.forEach(comment => {
        // Se il commento ha un container per le risposte...
        if (comment.querySelector('ytd-comment-replies-renderer')) {
            let buttonContainer = comment.querySelector('.analysis-button-container');
            console.log("Trovato un commento risposte");

            if (!buttonContainer) {
                buttonContainer = document.createElement('div');
                buttonContainer.className = 'analysis-button-container';
                // Impostiamo uno stile base per armonizzare la posizione nel commento
                buttonContainer.style.marginTop = '4px';
                // Aggiungiamo il container alla fine del commento (o in una posizione opportuna)
                comment.appendChild(buttonContainer);
            }
            // Evita duplicazioni: se il pulsante non esiste ancora lo inietta
            if (!buttonContainer.querySelector('.analisi-risposte-button')) {
                const button = document.createElement('button');
                button.textContent = 'Analisi Risposte';
                button.className = 'analisi-risposte-button';
                // Aggiunge le classi di stile di YouTube per un'integrazione perfetta
                button.classList.add(
                    'yt-spec-button-shape-next',
                    'yt-spec-button-shape-next--tonal',
                    'yt-spec-button-shape-next--mono',
                    'yt-spec-button-shape-next--size-m',
                    'yt-spec-button-shape-next--icon-leading'
                );
                // Associa un evento al click
                button.addEventListener('click', (event) => {
                    event.stopPropagation();
                    alert('Analisi risposte per questo commento!');
                });
                buttonContainer.appendChild(button);
            }
        }
    });
}

/**
 * Crea e inietta un container per l'app Vue all'interno del container dei pulsanti di YouTube.
 * Il container è configurato per avere un layout inline in modo da integrarsi accanto agli altri pulsanti.
 */
function createContainer(referenceElement) {
    const container = document.createElement('div');
    container.id = 'vue-app';
    // Imposta il container come blocco e definisce uno positioning relativo
    container.style.display = 'block';
    container.style.position = 'relative';
    container.style.width = '100%';
    container.style.marginTop = '8px';
    referenceElement.appendChild(container);
    //referenceElement.insertAdjacentElement('afterend', container);
}


/**
 * Funzione di inizializzazione dell'applicazione Vue.
 * Definisce un componente con un pulsante che, al click,
 * invoca una funzione per mostrare un alert.
 */
function initVueApp() {
    // Crea il container se non esiste già
    if (!document.getElementById('vue-app')) {
        createContainer();
    }

    // Definiamo il componente principale con template e metodi
    const App = {
        template: `
                <div>
                    <button
                        @click="showAlert"
                        class="yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-leading"
                        aria-label="Vue Alert Button">
                        <span class="yt-spec-button-shape-next__button-text-content">Analizza commenti</span>
                    </button>
                </div>
            `,
        methods: {
            showAlert() {
                alert('Questo è un alert generato da Vue.js!');
            }
        }
    };

    // Utilizziamo Vue.createApp se stiamo lavorando con Vue 3
    const { createApp } = Vue;
    createApp(App).mount('#vue-app');
}

/**
* Funzione principale che esegue il caricamento di Vue.js (se non presente)
* e avvia l'applicazione Vue.
*/
async function main() {
    // Verifica se Vue è già definito per evitare conflitti
    if (typeof Vue === 'undefined') {
        // Carica Vue.js dal CDN (versione globale di Vue 3)
        await loadScript('https://unpkg.com/vue@3/dist/vue.global.prod.js');
    }
    try {
        // Attende che il container dei pulsanti (quello che ospita il pulsante Like) sia disponibile.
        //const containerLocation = await waitForElement('#top-level-buttons-computed');
        const containerLocation = await waitForElement('#bottom-row');
        createContainer(containerLocation);
        initVueApp();
        initializeScript();

    } catch (err) {
        console.error('Impossibile trovare il container per i pulsanti:', err);
    }


}

// Funzione principale dello script
function initializeScript() {

    //TODO: si inizializza vue.js prima del caricamento dei commenti
    //il caricamentop dei commenti deve avvenire solo on demand a fronte di opportuni eventi
    //gli eventi sono:
    //click al pulsante su un commento per estrapolare la conversazione da quel commento
    //click sul pulsante globale che elenca i commenti presenti al primo livello (senza navigare su ciascun commento)
    //click deep che recupera tutti i commenti anche annidati (forse inutile per ora)

    // Attendi che il container dei commenti sia disponibile
    waitForCommentsContainer(container => {
        //console.log("Container dei commenti trovato:", container);

        // Qui puoi aggiungere il tuo codice di scraping o inizializzare Vue.js
        injectAnalysisButtonToReplies(container);
    });
}

function observData(callbackInit) {

    // Osserva i cambiamenti nel DOM per rilevare la navigazione dinamica
    const observer = new MutationObserver(() => {
        const appContainer = document.querySelector('ytd-app');
        if (appContainer) {
            //console.log("Navigazione rilevata, inizializzo lo script...");
            callbackInit();
        }
    });

    // Configura l'osservatore per monitorare cambiamenti nel body
    observer.observe(document.body, { childList: true, subtree: true });
}

(function () {

    'use strict';

    console.log("Analisi conversazionale plugin avviato!");

    // Creazione di una Trusted Types policy di default per bypassare l'errore di TrustedScriptURL.
    // ATTENZIONE: Questa policy ritorna il valore inalterato, quindi non esegue sanitizzazione.
    // Valuta attentamente l'impatto in base al contesto di sicurezza della tua applicazione.
    createTrustPolicy();

    observData(initializeScript);

    // Esegui lo script inizialmente quando la pagina viene caricata
    //initializeScript();

    // Avvia il main e gestisce eventuali errori
    main().catch(err => console.error('Errore nell\'inizializzazione dell\'app Vue:', err));

})();



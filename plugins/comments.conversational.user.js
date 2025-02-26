// ==UserScript==
// @name         Analisi conversazionale UTube
// @namespace    https://www.youtube.com/
// @version      1.0
// @description  Sottopone a una intelligenza artificiale un analisi conversazionale di utenti
// @author       Ale
// @match        *://www.youtube.com/*
// @grant        GM_xmlhttpRequest
// @require      https://alessandromodica.com/plugins/framework-plugins.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.7.4/lottie.min.js
// @connect      alessandromodica.com
// ==/UserScript==


// 5. Funzione principale di invio dati
async function sendAnalysisRequest(comments) {

    //const rawPayload = JSON.stringify(comments);
    //let base64Payload = safeBase64Encode(rawPayload);
    const payload = {
        payload: comments,
        modelname: 'llama3.2'
    };

    const overlay = showLoadingSpinner();

    try {
        const response = await new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: HOSTDOMAIN + 'chatbot/api/v1/features/analisicommenti/ollama',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify(payload),
                onload: resolve,
                onerror: reject
            });
        });

        //const responseData = JSON.parse(response.answer);
        showResultsDialog(response.responseText); // Decodifica la risposta base64
    } catch (error) {
        showResultsDialog(`Errore nell'analisi: ${error.message}`);
    } finally {
        overlay.remove();
    }
}

// 4. Funzione per mostrare i risultati
function showResultsDialog(content) {
    const overlay = document.createElement('div');
    overlay.className = 'analysis-overlay';

    overlay.innerHTML = `
            <div class="analysis-dialog">
                <div class="analysis-content">${content}</div>
                <button class="yt-button" onclick="this.parentElement.parentElement.remove()">Chiudi</button>
            </div>
        `;

    document.body.appendChild(overlay);
}

// 3. Funzione per mostrare lo spinner
function showLoadingSpinner() {
    const overlay = document.createElement('div');
    overlay.className = 'analysis-overlay';

    overlay.innerHTML = `
            <div class="analysis-dialog">
                <div class="analysis-spinner">
                    <svg viewBox="0 0 50 50">
                        <circle cx="25" cy="25" r="20" fill="none" stroke="#3ea6ff" stroke-width="4" stroke-linecap="round">
                            <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/>
                        </circle>
                    </svg>
                </div>
                <div style="text-align: center; color: #606060;">Analisi in corso...</div>
            </div>
        `;

    document.body.appendChild(overlay);
    return overlay;
}

// 1. Stili CSS personalizzati (simili a YouTube)
const styles = `
        .analysis-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .analysis-dialog {
            background: #ffffff;
            border-radius: 12px;
            padding: 24px;
            width: 80%;
            max-width: 600px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            font-family: 'Roboto', sans-serif;
        }

        .analysis-spinner {
            animation: rotate 1s linear infinite;
            width: 50px;
            height: 50px;
            margin: 20px auto;
        }

        @keyframes rotate {
            100% { transform: rotate(360deg); }
        }

        .analysis-content {
            color: #0f0f0f;
            font-size: 14px;
            line-height: 1.5;
            white-space: pre-wrap;
        }

        .yt-button {
            background: #f8f9fa;
            border: 1px solid #dadce0;
            border-radius: 18px;
            color: #3ea6ff;
            padding: 0 16px;
            height: 36px;
            font-weight: 500;
            cursor: pointer;
            margin-top: 16px;
        }
    `;


/**
 * Funzione di inizializzazione dell'applicazione Vue.
 * Definisce un componente con un pulsante che, al click,
 * invoca una funzione per mostrare un alert.
 */
function initVueApp() {
    // Crea il container se non esiste già
    if (!document.getElementById('vue-app')) {
        createVueContainer();
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
                const comments = getCommentsUTube(document.querySelector('ytd-comments'));
                console.log(JSON.stringify(comments));
                sendAnalysisRequest(comments);
                //alert('Questo è un alert generato da Vue.js!');
            }
        }
    };

    // Utilizziamo Vue.createApp se stiamo lavorando con Vue 3
    const { createApp } = Vue;
    createApp(App).mount('#vue-app');
}

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
                    const comments = getCommentsUTube(comment, 'ytd-comment-view-model');
                    console.log(JSON.stringify(comments));
                    sendAnalysisRequest(comments);
                    //alert('Analisi risposte per questo commento!');
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
function createContainer(parent) {
    const container = document.createElement('div');
    container.id = 'vue-app';
    // Imposta il container come blocco e definisce uno positioning relativo
    container.style.display = 'block';
    container.style.position = 'relative';
    container.style.width = '100%';
    container.style.marginTop = '8px';
    parent.appendChild(container);
    //referenceElement.insertAdjacentElement('afterend', container);
}

/**
 * Crea ed inietta un container dedicato per l'app Vue.
 */
function createVueContainer() {
    const container = document.createElement('div');
    container.id = 'vue-app';
    container.style.position = 'fixed';
    container.style.bottom = '10px';
    container.style.right = '10px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
}

function getCommentsUTube(commentsContainer, replies) {
    const commentElements = commentsContainer.querySelectorAll(replies == null ? 'ytd-comment-thread-renderer' : replies);
    const comments = [];
    commentElements.forEach(commentEl => {

        // Estrae il nome dell'autore
        const authorEl = commentEl.querySelector('#author-text span');
        const author = authorEl ? authorEl.textContent.trim() : '';

        // Estrae il contenuto del commento
        const contentEl = commentEl.querySelector('#content-text');
        const content = contentEl ? contentEl.textContent.trim() : '';

        // Estrae il numero di like (voto)
        const likesEl = commentEl.querySelector('#vote-count-middle');
        const likes = likesEl ? likesEl.textContent.trim() : '0';

        // Estrae il timestamp del commento
        const timestampEl = commentEl.querySelector('yt-formatted-string.published-time-text');
        const timestamp = timestampEl ? timestampEl.textContent.trim() : '';

        // Estrae il numero di risposte eventualmente presenti
        const repliesIndicator = commentEl.querySelector('ytd-button-renderer#more-replies');
        let repliesCount = 0;
        if (repliesIndicator) {
            // Estrae i numeri rimuovendo tutti i caratteri non numerici
            const repliesText = repliesIndicator.textContent.trim();
            repliesCount = parseInt(repliesText.replace(/\D/g, '')) || 0;
        }

        // Costruisce il POJO per il commento
        comments.push({
            author,
            content,
            likes,
            timestamp,
            repliesCount
        });

    });

    return comments;

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

(function () {

    'use strict';

    console.log("Analisi conversazionale plugin avviato!");

    // 2. Aggiungi gli stili al documento
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);


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


// ==UserScript==
// @name         Analisi conversazionale UTube
// @namespace    https://www.youtube.com/
// @version      2.0.19
// @description  Sottopone a una intelligenza artificiale un analisi conversazionale di utenti
// @author       Ale
// @match        *://www.youtube.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @require      https://alessandromodica.com/plugins/framework-plugins.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.7.4/lottie.min.js
// @resource     EXT_CSS https://alessandromodica.com/plugins/styles.css
// @connect      alessandromodica.com
// @require      https://unpkg.com/markdown-it@13.0.2/dist/markdown-it.min.js
// @require      https://cdn.jsdelivr.net/npm/dompurify@3.0.5/dist/purify.min.js
// ==/UserScript==


// Componente Vue per il rendering Markdown
const MarkdownRenderer = {
    props: ['content'],
    setup(props) {
        const md = window.markdownit({
            html: true,
            linkify: true,
            typographer: true,
            breaks: true
        });

        const renderMarkdown = Vue.computed(() => {
            const normalizedContent = props.content
                .replace(/\r\n/g, '<br/>')  // Windows -> Unix
                .replace(/\r/g, '<br/>');   // Mac -> Unix
            const rawHtml = md.render(normalizedContent);
            return DOMPurify.sanitize(rawHtml);
        });

        return { renderMarkdown };
    },
    template: `
        <div class="markdown-content" v-html="renderMarkdown"></div>
    `
};

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

function showConfirmationDialog() {
    return new Promise((resolve) => {
        const container = document.createElement('div');
        container.className = 'analysis-container';
        container.innerHTML = `
            <div class="analysis-confirm-dialog">
                <div style="margin-bottom: 16px; color: #606060;">
                    Stai per inviare i commenti per l'analisi. L'operazione potrebbe richiedere alcuni minuti.
                </div>
                <div class="dialog-footer">
                    <button class="yt-button confirm-btn">Conferma</button>
                    <button class="yt-button cancel-btn">Annulla</button>
                </div>
            </div>
        `;

        document.body.appendChild(container);

        container.querySelector('.confirm-btn').addEventListener('click', () => {
            container.remove();
            resolve(true);
        });

        container.querySelector('.cancel-btn').addEventListener('click', () => {
            container.remove();
            resolve(false);
        });
    });
}


// 4. Funzione per mostrare i risultati
function showResultsDialog(content) {
    const container = document.createElement('div');
    container.className = 'analysis-container';
    container.innerHTML = `
        <div class="analysis-dialog">
            <div class="dialog-header">
                <span>Risultati analisi</span>
                <button class="yt-button" @click="close">Chiudi</button>
            </div>
            <div class="dialog-content">
                <markdown-renderer :content="content"></markdown-renderer>
            </div>
        </div>
    `;

    const app = Vue.createApp({
        data() {
            return {
                content: content
            }
        },
        methods: {
            close() {
                container.remove()
            }
        }
    });
    app.component('markdown-renderer', MarkdownRenderer);
    app.mount(container);

    document.body.appendChild(container);
}

// 3. Funzione per mostrare lo spinner
function showLoadingSpinner() {
    const container = document.createElement('div');
    container.className = 'analysis-container';

    container.innerHTML = `
        <div class="analysis-dialog">
            <div class="dialog-header">
                <span>Analisi in corso</span>
            </div>
            <div class="analysis-spinner">
                <svg viewBox="0 0 50 50" width="40" height="40">
                    <circle cx="25" cy="25" r="20" fill="none" stroke="#3ea6ff" stroke-width="4" stroke-linecap="round">
                        <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/>
                    </circle>
                </svg>
            </div>
        </div>
    `;

    document.body.appendChild(container);
    return container;
}


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
                @click="handleAnalysis"
                class="yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-leading"
                aria-label="Vue Alert Button">
                <span class="yt-spec-button-shape-next__button-text-content">Analizza commenti</span>
            </button>
        </div>
            `,
        methods: {
            async handleAnalysis() {
                const confirmed = await showConfirmationDialog();
                if (!confirmed) return;

                const comments = getCommentsUTube(document.querySelector('ytd-comments'));
                console.log('Commenti da analizzare:', comments);
                sendAnalysisRequest(comments);
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
                button.addEventListener('click', async (event) => {

                    const confirmed = await showConfirmationDialog();
                    if (!confirmed) return;

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
    //const styleSheet = document.createElement('style');
    //styleSheet.textContent = styles;
    //document.head.appendChild(styleSheet);
    // 1. Carica il CSS esterno
    const externalCSS = GM_getResourceText("EXT_CSS");
    GM_addStyle(externalCSS);

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


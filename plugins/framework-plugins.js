function createTrustPolicy() {
    console.log("Inizializzazione trust policy...");
    if (window.trustedTypes && window.trustedTypes.createPolicy) {
        window.trustedTypes.createPolicy('default', {
            createHTML: (input) => input,
            createScript: (input) => input,
            createScriptURL: (input) => input
        });
    }
    console.log("... trust policy completato!");
}

/**
* Funzione per caricare uno script esterno dinamicamente.
* Ritorna una Promise che viene risolta quando lo script è caricato.
*/
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Impossibile caricare lo script: ${src}`));
        document.head.appendChild(script);
        console.log("Script " + src + " installato con successo!")
    });
}

/**
* Funzione per attendere la comparsa di un elemento nel DOM.
*/
function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const intervalTime = 100;
        let elapsed = 0;
        const interval = setInterval(() => {
            const el = document.querySelector(selector);
            if (el) {
                clearInterval(interval);
                resolve(el);
            }
            elapsed += intervalTime;
            if (elapsed >= timeout) {
                clearInterval(interval);
                reject(new Error(`Elemento ${selector} non trovato entro ${timeout}ms`));
            }
        }, intervalTime);
    });
}

// Funzione per attendere il caricamento del container dei commenti
function waitForCommentsContainer(scrapeCallback) {
    const interval = setInterval(() => {
        const container = document.querySelector('ytd-comments');
        if (container) {
            clearInterval(interval);
            scrapeCallback(container);
        }
    }, 1000);
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
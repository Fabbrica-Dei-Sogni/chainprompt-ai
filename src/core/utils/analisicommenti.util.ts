
/**
 * La classe rappresenta il business specifico per il clickbait features.
 per ora cè lo scraping da un uri web in una certa forma.
 potrebbe evolversi per qualsiasi altra necessita di tale feature.
 per policy, per ora, si assegna un controller per ogni successiva feature inserita.
 
 */
// Definisci un'interfaccia per il risultato dello scraping
export interface YouTubeComment {
    id?: string; // Aggiunto campo ID
    author: string;
    content: string;
    likes: string;
    timestamp: string;
    repliesCount: number;
    parentId?: string; // Nuovo campo per gerarchia
}


// Funzione di formattazione avanzata
export function formatCommentsForPrompt(comments: YouTubeComment[]): string {
    let prompt = "=== INIZIO COMMENTI YOUTUBE ===\n\n";

    comments.forEach((comment, index) => {
        prompt += `[COMMENT #${index + 1}]\n` +
            `Autore: ${comment.author}\n` +
            `Contenuto: ${comment.content}\n` +
            `Like: ${comment.likes || "N/A"}\n` +
            `Data: ${comment.timestamp}\n` +
            `Risposte: ${comment.repliesCount}\n` +
            "-----------------------------\n\n";
    });

    prompt += "=== FINE COMMENTI YOUTUBE ===";
    return prompt;
}

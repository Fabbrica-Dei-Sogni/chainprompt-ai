import axios from "axios";
import * as cheerio from "cheerio";
/**
 * La classe rappresenta il business specifico per il clickbait features.
 per ora cè lo scraping da un uri web in una certa forma.
 potrebbe evolversi per qualsiasi altra necessita di tale feature.
 per policy, per ora, si assegna un controller per ogni successiva feature inserita.
 
 */
// Definisci un'interfaccia per il risultato dello scraping
interface ScrapeResult {
    title: string | null;
    content: string | null;
}

// Funzione principale di scraping
async function scrapeArticle(url: string): Promise<ScrapeResult> {
    try {
        // Esegui la richiesta HTTP e ottieni il contenuto HTML
        const { data }: { data: string } = await axios.get(url);

        const $ = cheerio.load(data);

        // Estrapola il titolo e il contenuto
        const title: string | null = extractTitle($);
        const content: string | null = extractContent($);

        // Stampa il risultato
        console.log('Titolo:', title || 'Non trovato');
        console.log('Contenuto:', content || 'Non trovato');
        return { title, content };
    } catch (error) {
        console.error('Errore durante lo scraping:', error);
        throw error;
    }
}

// Funzione per estrarre il titolo dell'articolo
function extractTitle($: any): string | null {
    const title: string = $('h1').first().text() ||
        $('meta[property="og:title"]').attr('content') ||
        $('title').text();
    return title.trim() || null;
}

// Funzione per estrarre il contenuto dell'articolo
function extractContent($: any): string | null {
    // Cerca in tag comuni come <article> o <div> con classi specifiche
    const article: string = $('article').text() ||
        $('div[class*="content"], div[class*="article-body"], div[class*="post-content"]').text();

    if (article.trim()) return article.trim();

    // Se non trova nulla, prova a raccogliere i paragrafi
    const paragraphs: string[] = [];
    $('p').each((_index: number, element: any) => {
        const text: string = $(element).text().trim();
        if (text.length > 0) {
            paragraphs.push(text);
        }
    });

    return paragraphs.length ? paragraphs.join('\n\n') : null;
}

export {
    scrapeArticle
};
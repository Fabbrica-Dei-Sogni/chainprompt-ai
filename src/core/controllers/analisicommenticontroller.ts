import axios from "axios";
import { load } from 'cheerio';
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

async function scrapeCommentsYouTube(videoUrl: string): Promise<YouTubeComment[]> {
    try {
        const response = await axios.get(videoUrl);
        const $ = load(response.data);

        const comments: YouTubeComment[] = [];

        // Selettore per i container dei commenti
        $('ytd-comment-thread-renderer').each((index, element) => {
            const commentElement = $(element);

            // Estrazione dati con selettori specifici
            const author = commentElement.find('#author-text span').text().trim();
            const content = commentElement.find('#content-text').text().trim();
            const likes = commentElement.find('#vote-count-middle').text().trim();
            const timestamp = commentElement.find('yt-formatted-string.published-time-text').text().trim();
            const repliesCount = parseInt(commentElement.find('ytd-button-renderer#more-replies').text().replace(/\D/g, '')) || 0;

            comments.push({
                author,
                content,
                likes,
                timestamp,
                repliesCount
            });
        });

        return comments;
    } catch (error) {
        console.error('Errore durante lo scraping:', error);
        return [];
    }
}

async function scrapeCommentBranch(
    videoUrl: string,
    targetCommentId: string
): Promise<YouTubeComment[]> {
    try {
        const response = await axios.get(videoUrl);
        const $ = load(response.data);

        const branchComments: YouTubeComment[] = [];
        let foundTarget = false;

        // Funzione ricorsiva per estrarre i commenti
        const extractComments = (
            element: any,
            parentId?: string
        ): void => {
            const commentId = $(element).attr('data-comment-id');

            // Estrazione dati del commento
            const author = $(element).find('#author-text span').text().trim();
            const content = $(element).find('#content-text').text().trim();
            const likes = $(element).find('#vote-count-middle').text().trim();
            const timestamp = $(element).find('yt-formatted-string.published-time-text').text().trim();
            const repliesCount = parseInt(
                $(element).find('ytd-button-renderer#more-replies').text().replace(/\D/g, '')
            ) || 0;

            const comment: YouTubeComment = {
                id: commentId || '',
                author,
                content,
                likes,
                timestamp,
                repliesCount,
                parentId
            };

            // Aggiungi solo se è il target o discendente
            if (commentId === targetCommentId || foundTarget) {
                if (!foundTarget) foundTarget = true;
                branchComments.push(comment);
            }

            // Processa le risposte ricorsivamente
            $(element)
                .find('ytd-comment-replies-renderer ytd-comment-renderer')
                .each((i, el) => extractComments(el, commentId));
        };

        // Cerca il commento target
        $('ytd-comment-thread-renderer').each((i, el) => {
            if (!foundTarget) extractComments(el);
        });

        return branchComments;
    } catch (error) {
        console.error('Errore durante lo scraping:', error);
        return [];
    }
}


export {
    scrapeCommentsYouTube, scrapeCommentBranch
};
import { createMiddleware, ToolMessage, summarizationMiddleware } from "langchain";

export class MiddlewareService {
    private static instance: MiddlewareService;

    private constructor() { }

    public static getInstance(): MiddlewareService {
        if (!MiddlewareService.instance) {
            MiddlewareService.instance = new MiddlewareService();
        }
        return MiddlewareService.instance;
    }

    /**
     * Gestione errore dei tool
     */
    public handleToolErrors = createMiddleware({
        name: "HandleToolErrors",
        wrapToolCall: (request, handler) => {
            try {
                return handler(request);
            } catch (error) {
                // Return a custom error message to the model
                return new ToolMessage({
                    content: `Tool error: Please check your input and try again. (${error})`,
                    tool_call_id: request.toolCall.id!,
                });
            }
        },
    });

    /**
     * Metodo per eseguire un summary nativamente usando il modello supportato dal provider (lo stesso ma in futuro parametrizzabile)
     * @param modelname 
     * @returns 
     */
    public createSummaryMemoryMiddleware(modelname: string, maxTokensBeforeSummary: number = 4000, messagesToKeep: number = 20) {
        const result = summarizationMiddleware({
            model: modelname,
            trigger: { tokens: maxTokensBeforeSummary },
            keep: { messages: messagesToKeep }
        });

        return result;
    };
}

export const middlewareService = MiddlewareService.getInstance();
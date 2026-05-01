import { SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

export class AIService {
    private supabase: SupabaseClient;
    private genAI: GoogleGenAI | null = null;

    constructor(supabase: SupabaseClient, apiKey?: string) {
        this.supabase = supabase;
        if (apiKey) {
            this.genAI = new GoogleGenAI({ apiKey });
        }
    }

    /**
     * Gera embeddings para um texto usando o modelo do Google
     */
    async generateEmbedding(text: string): Promise<number[]> {
        if (!this.genAI) throw new Error('AI Service not initialized with API Key');
        
        const response = await this.genAI.models.embedContent({ 
            model: "text-embedding-004",
            contents: text
        });
        
        const values = response.embeddings?.[0]?.values;
        if (!values) throw new Error("Falha ao gerar embeddings");
        
        return values;
    }

    /**
     * Sincroniza o conteúdo de uma aula com a tabela de embeddings (RAG)
     */
    async syncLessonEmbeddings(lessonId: string, content?: string, title?: string): Promise<void> {
        let textToSync = content;
        let lessonTitle = title || 'Aula';

        if (!textToSync) {
            const { data } = await this.supabase
                .from('lessons')
                .select('title, rich_text_content')
                .eq('id', lessonId)
                .single();
            if (data) {
                textToSync = data.rich_text_content;
                lessonTitle = data.title;
            }
        }

        if (!textToSync) return;

        // Divide o conteúdo em chunks menores para melhor recuperação
        const chunks = this.splitIntoChunks(textToSync, 1000); // 1000 caracteres por chunk
        
        // Remove embeddings antigos da aula
        await this.supabase.from('lesson_embeddings').delete().eq('lesson_id', lessonId);

        // Gera e salva novos embeddings
        for (const chunk of chunks) {
            const embedding = await this.generateEmbedding(chunk);
            await this.supabase.from('lesson_embeddings').insert({
                lesson_id: lessonId,
                content: chunk,
                embedding,
                metadata: { title: lessonTitle, sync_date: new Date().toISOString() }
            });
        }
    }

    /**
     * Gera um quiz automaticamente baseado no conteúdo da aula
     */
    async generateQuizFromLesson(lessonId: string, numQuestions: number = 5): Promise<any> {
        const { data } = await this.supabase
            .from('lessons')
            .select('title, rich_text_content')
            .eq('id', lessonId)
            .single();
            
        if (!data || !data.rich_text_content) throw new Error('Conteúdo da aula não encontrado para gerar quiz.');

        const content = data.rich_text_content;
        const title = data.title;

        if (!this.genAI) throw new Error('AI Service not initialized with API Key');

        const prompt = `
            Você é um professor criando um quiz de validação de conhecimento sobre a aula "${title}".
            Com base no conteúdo abaixo, gere um quiz com ${numQuestions} questões de múltipla escolha.
            Retorne APENAS um JSON válido seguindo este formato EXATO:
            {
                "title": "Quiz sobre a aula ${title}",
                "description": "Teste rápido sobre os conceitos apresentados.",
                "questions": [
                    {
                        "questionText": "Texto da pergunta",
                        "options": [
                            {"optionText": "Opção 1", "isCorrect": true},
                            {"optionText": "Opção 2", "isCorrect": false},
                            {"optionText": "Opção 3", "isCorrect": false},
                            {"optionText": "Opção 4", "isCorrect": false}
                        ]
                    }
                ]
            }

            Conteúdo:
            ${content}
        `;

        const result = await this.genAI.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt
        });
        const responseText = result.text;
        
        if (!responseText) throw new Error('Falha ao gerar quiz estruturado.');

        try {
            const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error('Failed to parse AI Quiz JSON:', responseText);
            throw new Error('Falha ao gerar quiz estruturado.');
        }
    }

    /**
     * Análise Preditiva de Desempenho (Buddy Recommendation)
     * Recebe as questões que o aluno errou e gera um resumo explicativo do porquê e como melhorar.
     */
    async analyzeQuizPerformance(lessonTitle: string, wrongAnswers: Array<{question: string, userAnswer: string, correctAnswer: string}>): Promise<string> {
        if (!this.genAI) throw new Error('AI Service not initialized with API Key');

        const errorsContext = wrongAnswers.map(w => 
            `- Pergunta: ${w.question}\n  Resposta do Aluno: ${w.userAnswer}\n  Resposta Correta: ${w.correctAnswer}`
        ).join('\n\n');

        const prompt = `
            Você é o "Buddy", um tutor virtual encorajador e especialista.
            O aluno acabou de terminar o quiz da aula "${lessonTitle}" e errou algumas questões.
            
            Com base nestes erros, gere um resumo amigável, direto e em português do Brasil explicando brevemente os conceitos que o aluno se confundiu.
            Não seja punitivo. Aja como um mentor. Sugira que ele revise esses conceitos.
            Mantenha a resposta curta (máximo 3 parágrafos) usando markdown (negritos para os conceitos).

            Erros do aluno:
            ${errorsContext}
        `;

        const result = await this.genAI.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt
        });
        return result.text || 'Continue estudando! Não conseguimos gerar a recomendação agora.';
    }

    private splitIntoChunks(text: string, size: number): string[] {
        const chunks: string[] = [];
        let i = 0;
        while (i < text.length) {
            chunks.push(text.slice(i, i + size));
            i += size;
        }
        return chunks;
    }
}

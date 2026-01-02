
import { prisma } from '../lib/prisma';
import { crawlForPapers } from '../lib/firecrawl';
import { generateAssistantResponse } from '../lib/gemini';

export const crawlPapers = async (query: string): Promise<any[]> => {
    console.log(`Crawling papers for: ${query}`);

    try {
        const results = await crawlForPapers(query);

        const savedPapers = [];
        for (const p of results) {
            const saved = await prisma.paper.create({
                data: {
                    title: p.title || 'Untitled',
                    abstract: p.abstract || '',
                    url: p.url || '',
                    authors: [], // Firecrawl search might not return authors directly
                    publishedDate: new Date().toISOString(),
                    content: p.content || ''
                }
            });
            savedPapers.push(saved);
        }

        return savedPapers;
    } catch (error) {
        console.error('Failed to crawl papers:', error);
        throw error;
    }
};

export const chatWithGemini = async (userId: string, message: string, contextPapersIds: string[] = []) => {
    // 1. Fetch Context
    const papers = await prisma.paper.findMany({
        where: { id: { in: contextPapersIds } }
    });
    const contextText = papers.map(p => `Title: ${p.title}\nContent: ${p.content}`).join('\n\n---\n\n');

    // 2. Call Gemini API
    const responseText = await generateAssistantResponse(message, contextText);

    // 3. Save Session & Message
    let session = await prisma.chatSession.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' }
    });

    if (!session) {
        session = await prisma.chatSession.create({
            data: { userId, title: message.substring(0, 30) + (message.length > 30 ? '...' : '') }
        });
    }

    // Save User Message
    await prisma.message.create({
        data: {
            sessionId: session.id,
            role: 'user',
            content: message
        }
    });

    // Save AI Message
    await prisma.message.create({
        data: {
            sessionId: session.id,
            role: 'assistant',
            content: responseText
        }
    });

    return { response: responseText, sessionId: session.id };
};

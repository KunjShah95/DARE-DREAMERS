const API_URL = '/api';

export const api = {
    // AI Assistant
    crawlPapers: async (query: string) => {
        const res = await fetch(`${API_URL}/ai/crawl`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        return await res.json();
    },
    chatWithAI: async (userId: string, message: string, contextPapersIds: string[]) => {
        const res = await fetch(`${API_URL}/ai/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, message, contextPapersIds })
        });
        return await res.json();
    },

    // Pathways
    getPathways: async () => {
        const res = await fetch(`${API_URL}/pathways`);
        return await res.json();
    },
    joinPathway: async (userId: string, pathwayId: string) => {
        const res = await fetch(`${API_URL}/pathways/${pathwayId}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        return await res.json();
    },
    updateProgress: async (userId: string, pathwayId: string, progress: number) => {
        const res = await fetch(`${API_URL}/pathways/${pathwayId}/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, progress })
        });
        return await res.json();
    },

    // User / Score
    getUserScore: async (userId: string) => {
        const res = await fetch(`${API_URL}/users/${userId}/score`);
        return await res.json();
    }
};

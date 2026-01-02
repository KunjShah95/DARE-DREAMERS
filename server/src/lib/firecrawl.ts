
import FirecrawlApp from '@mendable/firecrawl-js';

const firecrawl = new FirecrawlApp({
    apiKey: process.env.FIRECRAWL_API_KEY || ""
});

export const crawlForPapers = async (query: string) => {
    try {
        // We use crawl or map to find relevant research URLs
        // For this implementation, we'll search for PDFs or journal pages
        const searchResult = await firecrawl.search(query, {
            limit: 5,
        });

        if (!(searchResult as any).success) {
            throw new Error((searchResult as any).error || 'Firecrawl search failed');
        }

        return (searchResult as any).data.map((item: any) => ({
            title: item.title,
            url: item.url,
            abstract: item.description || item.markdown?.substring(0, 200) || '',
            content: item.markdown || item.text || ''
        }));
    } catch (error) {
        console.error('Firecrawl Error:', error);
        throw error;
    }
};

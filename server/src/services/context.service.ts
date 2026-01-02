
interface GithubData {
    followers: number;
    public_repos: number;
    created_at: string;
}

export const fetchGithubData = async (handle: string): Promise<GithubData | null> => {
    try {
        const response = await fetch(`https://api.github.com/users/${handle}`);
        if (!response.ok) return null;
        return await response.json() as GithubData;
    } catch (error) {
        console.error('Error fetching GitHub data:', error);
        return null;
    }
};

export const fetchSocialData = async (platform: string, handle: string) => {
    // SIMULATION for demo purposes
    // In a real app, this would call LinkedIn/Twitter/Medium APIs
    // We generate deterministic but realistic-looking stats based on the handle
    const seed = handle.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const base = (seed % 50) + 20;

    const platforms: any = {
        linkedin: {
            followers: base * 15,
            engagement: (base / 10).toFixed(1),
            posts: Math.floor(base / 4),
            connections: base * 12
        },
        twitter: {
            followers: base * 25,
            engagement: (base / 8).toFixed(1),
            posts: base * 5,
            verified: seed % 7 === 0
        },
        medium: {
            followers: base * 5,
            engagement: (base / 12).toFixed(1),
            posts: Math.floor(base / 8),
            claps: base * 100
        }
    };

    return platforms[platform] || { followers: 0, engagement: 0, posts: 0 };
};

import { prisma } from '../lib/prisma';
import { fetchGithubData, fetchSocialData } from './context.service';

export const calculateUserScore = async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    let totalScore = 0;
    const breakdown: any = {};

    // 1. GitHub Score
    if (user.githubHandle) {
        const ghData = await fetchGithubData(user.githubHandle);
        if (ghData) {
            const ghScore = (ghData.public_repos * 10) + (ghData.followers * 5);
            totalScore += ghScore;
            breakdown.github = { ...ghData, score: ghScore };

            await prisma.socialScore.create({
                data: {
                    userId,
                    platform: 'github',
                    rawScore: ghScore,
                    details: ghData as any
                }
            });
        }
    }

    // 2. LinkedIn (Simulated)
    if (user.linkedinHandle) {
        const liData = await fetchSocialData('linkedin', user.linkedinHandle);
        const liScore = liData.followers / 10; // Simple logic
        totalScore += liScore;
        breakdown.linkedin = { ...liData, score: liScore };

        await prisma.socialScore.create({
            data: {
                userId,
                platform: 'linkedin',
                rawScore: Math.floor(liScore),
                details: liData as any
            }
        });
    }

    // Save Total Score
    await prisma.score.create({
        data: {
            userId,
            totalScore: Math.floor(totalScore),
            breakdown
        }
    });

    return { totalScore, breakdown };
};

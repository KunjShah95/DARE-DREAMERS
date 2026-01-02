
import { prisma } from '../lib/prisma';

export const getAllPathways = async () => {
    return await prisma.pathway.findMany();
};

export const getPathwayById = async (id: string) => {
    return await prisma.pathway.findUnique({ where: { id } });
};

export const joinPathway = async (userId: string, pathwayId: string) => {
    return await prisma.userPathwayProgress.create({
        data: {
            userId,
            pathwayId,
            status: 'STARTED',
            progress: 0
        }
    });
};

export const updatePathwayProgress = async (userId: string, pathwayId: string, progress: number) => {
    return await prisma.userPathwayProgress.update({
        where: {
            userId_pathwayId: { userId, pathwayId }
        },
        data: {
            progress,
            status: progress >= 100 ? 'COMPLETED' : 'STARTED'
        }
    });
};


import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const pathways = [
    {
        title: 'Full Stack Mastery',
        description: 'Master the PERN stack (Postgres, Express, React, Node) from scratch.',
        steps: [
            { id: 1, title: 'Introduction to React', content: 'Learn the basics of React hooks and components.' },
            { id: 2, title: 'Backend with Node & Express', content: 'Build RESTful APIs and handle database connections.' },
            { id: 3, title: 'Database Mastery with Prisma', content: 'Learn ORM basics and schema design.' }
        ]
    },
    {
        title: 'AI Engineering 101',
        description: 'Learn to build LLM-powered applications using Gemini and Vector DBs.',
        steps: [
            { id: 1, title: 'LLM Basics', content: 'Understanding tokens, prompts, and context windows.' },
            { id: 2, title: 'RAG Architectures', content: 'Combining external data with LLMs.' },
            { id: 3, title: 'Vector Databases', content: 'Storing and retrieving embeddings.' }
        ]
    },
    {
        title: 'System Design',
        description: 'Architect scalable distributed systems like a Senior Engineer.',
        steps: [
            { id: 1, title: 'Load Balancing', content: 'Distributing traffic across multiple servers.' },
            { id: 2, title: 'Caching Strategies', content: 'Using Redis and Memcached for performance.' },
            { id: 3, title: 'Microservices', content: 'Designing decoupled systems.' }
        ]
    }
];

async function main() {
    console.log('Seeding pathways...');
    for (const p of pathways) {
        await prisma.pathway.create({
            data: {
                title: p.title,
                description: p.description,
                steps: p.steps as any
            }
        });
    }
    console.log('Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

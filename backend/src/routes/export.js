"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportRoutes = exportRoutes;
const prisma_1 = require("../prisma");
async function exportRoutes(fastify) {
    fastify.get('/export', async () => {
        const ideas = await prisma_1.prisma.idea.findMany({
            include: {
                scheduledPosts: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        // Flatten scheduled posts for easier import. Include idea title/platform
        // so imports can match scheduled posts to ideas even when original IDs changed.
        const scheduledPosts = ideas.flatMap(idea => idea.scheduledPosts.map(post => ({
            ...post,
            ideaId: idea.id,
            ideaTitle: idea.title,
            ideaPlatform: idea.platform,
        })));
        return {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            ideas,
            scheduledPosts,
        };
    });
    fastify.post('/import', async (request, reply) => {
        try {
            const body = request.body;
            if (!body.ideas || !Array.isArray(body.ideas)) {
                return reply.status(400).send({ message: 'Invalid import format: expected { ideas: [] }' });
            }
            // Narrow types: use local variables so TypeScript knows they're defined
            const ideas = body.ideas;
            const scheduledPostsInput = Array.isArray(body.scheduledPosts) ? body.scheduledPosts : undefined;
            const mode = body.mode === 'sync' ? 'sync' : 'replace';
            if (mode === 'replace') {
                // Perform destructive replace (existing behavior)
                const result = await prisma_1.prisma.$transaction(async (tx) => {
                    const delPosts = await tx.scheduledPost.deleteMany({});
                    const delIdeas = await tx.idea.deleteMany({});
                    let importedIdeas = 0;
                    let skippedIdeas = 0;
                    let importedPosts = 0;
                    let skippedPosts = 0;
                    const idMap = new Map();
                    for (const idea of ideas) {
                        try {
                            if (!idea.title || !idea.platform) {
                                skippedIdeas++;
                                continue;
                            }
                            const newIdea = await tx.idea.create({
                                data: {
                                    title: idea.title,
                                    description: idea.description || null,
                                    platform: idea.platform,
                                    status: idea.status || 'IDEA',
                                    difficulty: idea.difficulty || 2,
                                    createdAt: idea.createdAt ? new Date(idea.createdAt) : undefined,
                                    updatedAt: idea.updatedAt ? new Date(idea.updatedAt) : undefined,
                                },
                            });
                            if (idea.id)
                                idMap.set(idea.id, newIdea.id);
                            importedIdeas++;
                        }
                        catch {
                            skippedIdeas++;
                        }
                    }
                    const postsSource = scheduledPostsInput && Array.isArray(scheduledPostsInput)
                        ? scheduledPostsInput
                        : ideas.flatMap((i) => (Array.isArray(i.scheduledPosts) ? i.scheduledPosts : []).map((p) => ({ ...p, ideaId: i.id, ideaTitle: i.title, ideaPlatform: i.platform })));
                    for (const post of postsSource) {
                        try {
                            if (!post.date) {
                                skippedPosts++;
                                continue;
                            }
                            // Resolve the idea id for this post.
                            // Priority: idMap mapping -> direct existing id -> lookup by title+platform
                            let mappedIdeaId = undefined;
                            if (post.ideaId && idMap.get(post.ideaId)) {
                                mappedIdeaId = idMap.get(post.ideaId);
                            }
                            else if (post.ideaId) {
                                const maybe = await tx.idea.findUnique({ where: { id: post.ideaId } });
                                if (maybe)
                                    mappedIdeaId = post.ideaId;
                            }
                            if (!mappedIdeaId && post.ideaTitle && post.ideaPlatform) {
                                const found = await tx.idea.findFirst({ where: { title: post.ideaTitle, platform: post.ideaPlatform } });
                                if (found)
                                    mappedIdeaId = found.id;
                            }
                            if (!mappedIdeaId) {
                                skippedPosts++;
                                continue;
                            }
                            await tx.scheduledPost.create({
                                data: {
                                    ideaId: mappedIdeaId,
                                    date: new Date(post.date),
                                    description: post.description || null,
                                    status: post.status || 'NOT_STARTED',
                                    createdAt: post.createdAt ? new Date(post.createdAt) : undefined,
                                },
                            });
                            importedPosts++;
                        }
                        catch {
                            skippedPosts++;
                        }
                    }
                    return { importedIdeas, skippedIdeas, importedPosts, skippedPosts, deletedPosts: delPosts.count, deletedIdeas: delIdeas.count };
                });
                return {
                    message: `Import replaced DB: ${result.importedIdeas} ideas, ${result.importedPosts} posts created. ${result.skippedIdeas} ideas skipped, ${result.skippedPosts} posts skipped.`,
                    ...result,
                };
            }
            // mode === 'sync' -> update existing items and add missing ones (non-destructive)
            const syncResult = await prisma_1.prisma.$transaction(async (tx) => {
                let importedIdeas = 0;
                let updatedIdeas = 0;
                let skippedIdeas = 0;
                let importedPosts = 0;
                let updatedPosts = 0;
                let skippedPosts = 0;
                const idMap = new Map();
                const targetIdeaIds = [];
                const keepMap = new Map(); // mappedIdeaId -> set of ISO date strings to keep
                // Upsert-ish logic for ideas: prefer matching by id, then by title+platform
                for (const idea of ideas) {
                    try {
                        if (!idea.title || !idea.platform) {
                            skippedIdeas++;
                            continue;
                        }
                        let existing = null;
                        if (idea.id) {
                            existing = await tx.idea.findUnique({ where: { id: idea.id } });
                        }
                        if (!existing) {
                            existing = await tx.idea.findFirst({ where: { title: idea.title, platform: idea.platform } });
                        }
                        if (existing) {
                            await tx.idea.update({
                                where: { id: existing.id },
                                data: {
                                    title: idea.title,
                                    description: idea.description || null,
                                    platform: idea.platform,
                                    status: idea.status || existing.status,
                                    difficulty: typeof idea.difficulty === 'number' ? idea.difficulty : existing.difficulty,
                                    updatedAt: idea.updatedAt ? new Date(idea.updatedAt) : undefined,
                                },
                            });
                            if (idea.id)
                                idMap.set(idea.id, existing.id);
                            targetIdeaIds.push(existing.id);
                            updatedIdeas++;
                        }
                        else {
                            const created = await tx.idea.create({
                                data: {
                                    title: idea.title,
                                    description: idea.description || null,
                                    platform: idea.platform,
                                    status: idea.status || 'IDEA',
                                    difficulty: idea.difficulty || 2,
                                    createdAt: idea.createdAt ? new Date(idea.createdAt) : undefined,
                                    updatedAt: idea.updatedAt ? new Date(idea.updatedAt) : undefined,
                                },
                            });
                            if (idea.id)
                                idMap.set(idea.id, created.id);
                            targetIdeaIds.push(created.id);
                            importedIdeas++;
                        }
                    }
                    catch {
                        skippedIdeas++;
                    }
                }
                const postsSource = scheduledPostsInput && Array.isArray(scheduledPostsInput)
                    ? scheduledPostsInput
                    : ideas.flatMap((i) => (Array.isArray(i.scheduledPosts) ? i.scheduledPosts : []).map((p) => ({ ...p, ideaId: i.id, ideaTitle: i.title, ideaPlatform: i.platform })));
                for (const post of postsSource) {
                    try {
                        if (!post.date) {
                            skippedPosts++;
                            continue;
                        }
                        // Resolve the idea id for this post. Try idMap -> direct id -> title+platform lookup
                        let mappedIdeaId = undefined;
                        if (post.ideaId && idMap.get(post.ideaId)) {
                            mappedIdeaId = idMap.get(post.ideaId);
                        }
                        else if (post.ideaId) {
                            const maybe = await tx.idea.findUnique({ where: { id: post.ideaId } });
                            if (maybe)
                                mappedIdeaId = post.ideaId;
                        }
                        if (!mappedIdeaId && post.ideaTitle && post.ideaPlatform) {
                            const found = await tx.idea.findFirst({ where: { title: post.ideaTitle, platform: post.ideaPlatform } });
                            if (found)
                                mappedIdeaId = found.id;
                        }
                        if (!mappedIdeaId) {
                            skippedPosts++;
                            continue;
                        }
                        // record that this date for mappedIdeaId should be kept if pruning
                        const iso = new Date(post.date).toISOString();
                        let s = keepMap.get(mappedIdeaId);
                        if (!s) {
                            s = new Set();
                            keepMap.set(mappedIdeaId, s);
                        }
                        s.add(iso);
                        // scheduledPost unique constraint is (date, ideaId)
                        const existingPost = await tx.scheduledPost.findFirst({ where: { date: new Date(post.date), ideaId: mappedIdeaId } });
                        if (existingPost) {
                            await tx.scheduledPost.update({
                                where: { id: existingPost.id },
                                data: {
                                    date: new Date(post.date),
                                    description: post.description || null,
                                    status: post.status || existingPost.status,
                                },
                            });
                            updatedPosts++;
                        }
                        else {
                            await tx.scheduledPost.create({
                                data: {
                                    ideaId: mappedIdeaId,
                                    date: new Date(post.date),
                                    description: post.description || null,
                                    status: post.status || 'NOT_STARTED',
                                    createdAt: post.createdAt ? new Date(post.createdAt) : undefined,
                                },
                            });
                            importedPosts++;
                        }
                    }
                    catch {
                        skippedPosts++;
                    }
                }
                // If requested, prune scheduled posts that are not present in the import.
                // We'll iterate all ideas in the DB and remove scheduled posts whose (ideaId,date)
                // pair is not listed in the incoming data (keepMap).
                let deletedPostsTotal = 0;
                if (body.prune) {
                    const allIdeas = await tx.idea.findMany({ select: { id: true } });
                    for (const { id: tid } of allIdeas) {
                        const keepSet = keepMap.get(tid);
                        if (!keepSet || keepSet.size === 0) {
                            // delete all scheduled posts for this idea
                            const del = await tx.scheduledPost.deleteMany({ where: { ideaId: tid } });
                            deletedPostsTotal += del.count;
                        }
                        else {
                            const dates = Array.from(keepSet).map(d => new Date(d));
                            const del = await tx.scheduledPost.deleteMany({ where: { ideaId: tid, date: { notIn: dates } } });
                            deletedPostsTotal += del.count;
                        }
                    }
                }
                return { importedIdeas, updatedIdeas, skippedIdeas, importedPosts, updatedPosts, skippedPosts, deletedPosts: deletedPostsTotal };
            });
            return {
                message: `Sync import completed: ${syncResult.importedIdeas} ideas created, ${syncResult.updatedIdeas} ideas updated; ${syncResult.importedPosts} posts created, ${syncResult.updatedPosts} posts updated. ${syncResult.skippedIdeas} ideas skipped, ${syncResult.skippedPosts} posts skipped.`,
                ...syncResult,
            };
        }
        catch {
            return reply.status(400).send({ message: 'Invalid import data or transaction failed' });
        }
    });
}

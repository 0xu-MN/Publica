import { supabase, publishCard } from './db-service';
import { generateCard } from './ai-generator';
import { findRelatedArticles } from './link-finder';

async function forceScienceCardsIgnoreUsed() {
    console.log('🔬 Forcing Science Card Generation (ignoring used flag)...\n');

    // Get RECENT science articles (ignore used flag)
    const { data: articles, error } = await supabase
        .from('articles')
        .select('*')
        .eq('category', 'science')
        .order('pub_date', { ascending: false })
        .limit(5);

    if (error || !articles || articles.length === 0) {
        console.log('❌ No science articles found:', error);
        return;
    }

    console.log(`✅ Found ${articles.length} science articles (recent)\n`);

    let generated = 0;
    for (const article of articles) {
        if (generated >= 2) break;

        console.log(`\n[${generated + 1}] Processing: ${article.title}`);
        console.log(`   Source: ${article.source || 'Unknown'}`);
        console.log(`   Used: ${article.used ? 'YES' : 'NO'}`);

        try {
            // Generate card
            console.log('  🤖 Generating AI content...');
            const card = await generateCard(article);

            console.log(`  ✓ Generated: ${card.headline}`);
            console.log(`  ✓ Category: ${card.category}`);
            console.log(`  ✓ Tags: ${card.tags?.join(', ') || 'none'}`);
            console.log(`  ✓ Body preview: ${card.body?.substring(0, 50)}...`);

            if (!card.tags || card.tags.length === 0) {
                console.log('  ⚠️  Warning: No tags generated, retrying...');
                continue;
            }

            // Find related links
            console.log('  🔗 Finding related articles...');
            const relatedMaterials = await findRelatedArticles(article.title, article.description);

            // Get image URL
            const imageUrl = article.image_url || 'https://picsum.photos/seed/science/800/600';

            // Publish
            const now = new Date();
            const cardData = {
                headline: card.headline,
                body: card.body,
                teaser: card.teaser,
                tags: card.tags,
                category: card.category,
                imageUrl,
                related_materials: relatedMaterials,
                timestamp: now.toISOString(),
                source: article.source || 'Science News',
                sourceUrl: article.link,
                created_at: now.toISOString()
            };

            console.log('  📤 Publishing to database...');
            await publishCard(cardData);

            // Mark as used
            await supabase
                .from('articles')
                .update({ used: true })
                .eq('id', article.id);

            console.log('  ✅ Published successfully!');
            generated++;

        } catch (error: any) {
            console.error(`  ❌ Error:`, error.message);
            console.error(`  Stack:`, error.stack?.substring(0, 200));
        }
    }

    console.log(`\n🎉 Generated ${generated} science cards!`);
    console.log('👉 Refresh localhost:8081 to see them!');
}

forceScienceCardsIgnoreUsed().catch(console.error);

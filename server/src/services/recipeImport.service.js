const UNIT_PHRASES = [
    "cuillères à café", "cuillère à café", "cuillères à soupe", "cuillère à soupe",
    "c. à café", "c. à soupe", "c à café", "c à soupe",
    "pincées", "pincée", "sachets", "sachet", "gousses", "gousse",
    "tranches", "tranche", "bottes", "botte", "pots", "pot",
    "verres", "verre", "tasses", "tasse", "brins", "brin",
    "feuilles", "feuille", "bouquets", "bouquet", "boîtes", "boîte",
    "pièces", "pièce", "kg", "mg", "cl", "ml", "g", "l",
].sort((a, b) => b.length - a.length);

const DIET_TAG_MAP = {
    "https://schema.org/VeganDiet": "Vegan",
    "https://schema.org/VegetarianDiet": "Vegetarian",
    "https://schema.org/GlutenFreeDiet": "Gluten-Free",
    "https://schema.org/LowLactoseDiet": "Dairy-Free",
    "https://schema.org/LowFatDiet": "Low-Fat",
};

function parseQuantity(token) {
    if (/^\d+\/\d+$/.test(token)) {
        const [num, den] = token.split('/').map(Number);
        return den ? num / den : null;
    }
    const value = parseFloat(token.replace(',', '.'));
    return Number.isNaN(value) ? null : value;
}

// Marmiton ingredients are free text (e.g. "300 g de farine de blé"). This is a
// best-effort split into quantity/unit/name — it won't be perfect for every phrasing.
export function parseIngredientLine(line) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(\d+(?:[.,]\d+)?(?:\/\d+)?)\s+(.*)$/);

    if (!match) {
        // No leading number (e.g. "Poivre") — quantity is stored as 0 and the
        // frontend skips rendering a quantity/unit when it's 0.
        return {name: trimmed, quantity: 0};
    }

    const quantity = parseQuantity(match[1]) ?? 0;
    let rest = match[2].trim();
    let unit;

    for (const phrase of UNIT_PHRASES) {
        // \b doesn't recognize accented letters (é, à...) as word characters, so it
        // silently fails to match after French unit words — use a lookahead instead.
        const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`^${escaped}\\.?(?=\\s|$)`, 'i');
        const phraseMatch = rest.match(re);
        if (phraseMatch) {
            unit = phrase;
            rest = rest.slice(phraseMatch[0].length).trim();
            break;
        }
    }

    rest = rest.replace(/^(de |d')/i, '').trim();

    return unit ? {name: rest, quantity, unit} : {name: rest, quantity};
}

export function parseIsoDurationToMinutes(duration) {
    if (!duration) return 0;
    const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    return hours * 60 + minutes;
}

export function parseServings(yieldValue) {
    const text = Array.isArray(yieldValue) ? yieldValue[0] : yieldValue;
    const match = String(text ?? '').match(/\d+/);
    return match ? parseInt(match[0], 10) : 4;
}

export function normalizeInstructions(instructions) {
    if (!instructions) return [];
    const list = Array.isArray(instructions) ? instructions : [instructions];

    const steps = [];
    for (const item of list) {
        if (typeof item === 'string') {
            steps.push(item.trim());
        } else if (item?.['@type'] === 'HowToSection' && Array.isArray(item.itemListElement)) {
            for (const sub of item.itemListElement) {
                if (sub?.text) steps.push(sub.text.trim());
            }
        } else if (item?.text) {
            steps.push(item.text.trim());
        }
    }
    return steps.filter((step) => step !== "");
}

function extractTags(recipeJson) {
    const diets = Array.isArray(recipeJson.suitableForDiet)
        ? recipeJson.suitableForDiet
        : (recipeJson.suitableForDiet ? [recipeJson.suitableForDiet] : []);

    return diets
        .map((diet) => DIET_TAG_MAP[typeof diet === 'string' ? diet : diet?.['@id']])
        .filter(Boolean);
}

function extractImageUrl(recipeJson) {
    const image = recipeJson.image;
    if (!image) return null;
    if (typeof image === 'string') return image;
    if (Array.isArray(image)) return typeof image[0] === 'string' ? image[0] : (image[0]?.url ?? null);
    return image.url ?? null;
}

function findRecipeJsonLd(html) {
    const scriptRegex = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
    let match;
    while ((match = scriptRegex.exec(html))) {
        let parsed;
        try {
            parsed = JSON.parse(match[1]);
        } catch {
            continue;
        }

        const items = Array.isArray(parsed) ? parsed : (parsed['@graph'] || [parsed]);
        for (const item of items) {
            const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
            if (types.includes('Recipe')) return item;
        }
    }
    return null;
}

export async function fetchMarmitonRecipe(url) {
    let parsedUrl;
    try {
        parsedUrl = new URL(url);
    } catch {
        throw new Error("URL invalide");
    }

    if (!/(^|\.)marmiton\.org$/i.test(parsedUrl.hostname)) {
        throw new Error("Seuls les liens Marmiton sont pris en charge pour le moment");
    }

    const response = await fetch(url, {
        headers: {"User-Agent": "Mozilla/5.0 (compatible; SupmealBot/1.0)"},
    });
    if (!response.ok) {
        throw new Error(`Impossible de récupérer la page (${response.status})`);
    }

    const html = await response.text();
    const recipeJson = findRecipeJsonLd(html);
    if (!recipeJson) {
        throw new Error("Aucune recette trouvée sur cette page");
    }

    const ingredientLines = recipeJson.recipeIngredient || [];

    return {
        title: (recipeJson.name || "Recette importée").slice(0, 100),
        description: recipeJson.description || "",
        prepTime: parseIsoDurationToMinutes(recipeJson.prepTime),
        cookTime: parseIsoDurationToMinutes(recipeJson.cookTime),
        servings: parseServings(recipeJson.recipeYield),
        ingredients: ingredientLines.map(parseIngredientLine),
        steps: normalizeInstructions(recipeJson.recipeInstructions).map((description, index) => ({
            step_number: index + 1,
            description,
        })),
        tags: extractTags(recipeJson),
        imageUrl: extractImageUrl(recipeJson),
    };
}

import Tag from "./Tag.jsx";

const CATEGORY_LABELS = {
    "Régime": "Régime alimentaire",
    "Allergies": "Allergies & intolérances",
    "Éviter": "Aliments à éviter",
    "Favoris": "Aliments favoris",
    "Cuisines": "Cuisines préférées",
    "Préparation": "Préférences de cuisine",
};

export const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS);

function groupByCategory(tags) {
    const groups = new Map();
    for (const tag of tags) {
        const category = tag.category || "";
        if (!groups.has(category)) groups.set(category, []);
        groups.get(category).push(tag);
    }

    return [...groups.entries()].sort(([a], [b]) => {
        const indexA = CATEGORY_ORDER.indexOf(a);
        const indexB = CATEGORY_ORDER.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });
}

export default function TagCategoryList({tags, isSelected, onToggle}) {
    const categories = groupByCategory(tags);

    return (
        <div className={"flex flex-col gap-7"}>
            {categories.map(([category, categoryTags]) => {
                const colorIndex = CATEGORY_ORDER.indexOf(category);
                return (
                    <div key={category} className={"flex flex-col gap-2.5"}>
                        <h3 className={"text-black text-lg font-bold font-primary"}>{CATEGORY_LABELS[category] || category}</h3>
                        <div className={"flex flex-wrap gap-2.5"}>
                            {categoryTags.map((tag) => (
                                <Tag
                                    key={tag.id ?? tag.name}
                                    text={tag.name}
                                    colorIndex={colorIndex === -1 ? 0 : colorIndex}
                                    selected={isSelected(tag)}
                                    onClick={() => onToggle(tag)}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    )
}

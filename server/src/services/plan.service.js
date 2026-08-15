import {query} from "../database/db.js";

export async function createPlan(userId=null, cookbookId=null) {
    if (cookbookId){
        const result = await query(
            `INSERT INTO meal_plans (cookbook_id) VALUES ($1) RETURNING *`,
            [cookbookId]
        )
        return result.rows[0]
    } else {
        const result = await query(
            `INSERT INTO meal_plans (user_id) VALUES ($1) RETURNING *`,
            [userId]
        )
        return result.rows[0]
    }
}

export async function getPlanById(id) {
    const result = await query(
        `
            SELECT
                meal_plans.*,
                COALESCE(
                                json_agg(
                                json_build_object(
                                        'id', meal_plan_items.id,
                                        'meal_plan_id', meal_plan_items.meal_plan_id,
                                        'recipe_id', meal_plan_items.recipe_id,
                                        'date', meal_plan_items.date,
                                        'created_at', meal_plan_items.created_at,
                                        'updated_at', meal_plan_items.updated_at
                                ) ORDER BY meal_plan_items.date
                                        ) FILTER (WHERE meal_plan_items.id IS NOT NULL),
                                '[]'
                ) AS items
            FROM
                meal_plans
                    LEFT JOIN
                meal_plan_items ON meal_plan_items.meal_plan_id = meal_plans.id
            WHERE
                meal_plans.id = $1
            GROUP BY
                meal_plans.id;`,
        [id]
    )
    return result.rows[0]
}

export async function getPlanByUserId(userId) {
    const result = await query(
        `
            SELECT
                meal_plans.*,
                COALESCE(
                                json_agg(
                                json_build_object(
                                        'id', meal_plan_items.id,
                                        'meal_plan_id', meal_plan_items.meal_plan_id,
                                        'recipe_id', meal_plan_items.recipe_id,
                                        'date', meal_plan_items.date,
                                        'created_at', meal_plan_items.created_at,
                                        'updated_at', meal_plan_items.updated_at
                                ) ORDER BY meal_plan_items.date
                                        ) FILTER (WHERE meal_plan_items.id IS NOT NULL),
                                '[]'
                ) AS items
            FROM
                meal_plans
                    LEFT JOIN
                meal_plan_items ON meal_plan_items.meal_plan_id = meal_plans.id
            WHERE
                meal_plans.user_id = $1
            GROUP BY
                meal_plans.id;`,
        [userId]
    )
    return result.rows[0]
}

export async function addItemToPlan(planId, date, recipeId) {
    const result = await query(
        `INSERT INTO meal_plan_items (meal_plan_id, recipe_id, date) VALUES ($1, $2, $3) RETURNING *`,
        [planId, recipeId, date]
    )
    return result.rows[0]
}

export async function getPlanItemById(id) {
    const result = await query(
        `SELECT * FROM meal_plan_items WHERE id = $1`,
        [id]
    )
    return result.rows[0]
}

export async function updatePlanItem(itemId, updatedItem) {
    const fields = [];
    const values = [];
    let index = 1;

    for (const [key, value] of Object.entries(updatedItem)) {
        fields.push(`${key} = $${index}`);
        values.push(value);
        index++;
    }

    if (fields.length === 0) {
        return getPlanItemById(itemId);
    }

    values.push(itemId);

    const result = await query(
        `UPDATE meal_plan_items SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`,
        values
    )
    return result.rows[0]
}

export async function deletePlanItem(itemId) {
    await query(
        `DELETE FROM meal_plan_items WHERE id = $1`,
        [itemId]
    )
}
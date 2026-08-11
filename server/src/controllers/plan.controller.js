import * as planService from "../services/plan.service.js";

export async function createPlanItem(planId, date, recipeId) {
    try {
        return await planService.addItemToPlan(planId, date, recipeId);
    } catch (error) {
        console.error("Error creating plan item:", error);
        throw error;
    }
}

export async function getPlanById(planId) {
        const result = await planService.getPlanById(planId);
        if (!result) {
            throw new Error("Plan not found");
        }
        return result;
}

const UPDATABLE_PLAN_ITEM_FIELDS = { date: "date", recipeId: "recipe_id" };

export async function updatePlanItem(itemId, updatedItem) {
    const fieldsToUpdate = {};

    for (const [bodyField, column] of Object.entries(UPDATABLE_PLAN_ITEM_FIELDS)) {
        if (updatedItem[bodyField] !== undefined) {
            fieldsToUpdate[column] = updatedItem[bodyField];
        }
    }

    try {
        return await planService.updatePlanItem(itemId, fieldsToUpdate);
    } catch (error) {
        console.error("Error updating plan item:", error);
        throw error;
    }
}

export async function deletePlanItem(itemId) {
    try {
        return await planService.deletePlanItem(itemId);
    } catch (error) {
        console.error("Error deleting plan item:", error);
        throw error;
    }
}
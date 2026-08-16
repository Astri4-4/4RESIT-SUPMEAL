import client from "./client.js";

export const planApi = {
    "getMyPlan": () => client.get("/plans/mine", {}),
    addItem: (planId, date, recipeId) => client.post(`/plans/${planId}`, {date, recipeId}),
    removeItem: (planId, itemId) => client.delete(`/plans/${planId}/items/${itemId}`),
}

export default planApi;

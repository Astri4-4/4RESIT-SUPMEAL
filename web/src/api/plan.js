import client from "./client.js";

export const planApi = {
    "getMyPlan": () => client.get("/plans/mine", {})
}

export default planApi;

import client from "./client.js";

export const tagApi = {
    "getAll": () => client.get("/tags", {})
}

export default tagApi;

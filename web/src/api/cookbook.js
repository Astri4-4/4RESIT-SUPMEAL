import client from "./client.js";

const cookbookApi = {
    "getUserCookbook": () => client.get("/cookbooks/", {}),
    "getMemberCookbook": (id) => client.get("/cookbooks/" + id + "/users/", {}),
}

export default cookbookApi;
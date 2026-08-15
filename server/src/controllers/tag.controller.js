import * as tagService from "../services/tag.service.js";

export async function getAllTags() {
    return await tagService.getAll();
}
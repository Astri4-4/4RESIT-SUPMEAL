import {param} from "express-validator";
import {getShoppingListItemById} from "../services/shoppingList.service.js";

export const deleteShoppingListItemValidator = [
    param("itemId")
        .notEmpty().withMessage("itemId is required")
        .isInt({min: 1}).withMessage("itemId must be a positive number")
];

export async function doShoppingListItemExists(req, res, next) {
    const id = req.params.itemId;

    try {
        const item = await getShoppingListItemById(id);
        if (!item) {
            return res.status(404).send({error: "Could not find shopping list item"});
        }
        next()
    } catch (e) {
        res.status(500).send({error: e.message});
    }

}

export async function isOwnerOfShoppingListItem(req, res, next) {
    const userId = req.user.id;

    try {
        const item = await getShoppingListItemById(req.params.itemId);
        if (item.user_id !== userId) {
            res.status(403).send({error: "You are not the owner of this shopping list item"});
        } else {
            next();
        }
    } catch (e) {
        res.status(500).send({error: e.message});
    }

}

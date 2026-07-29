import multer from 'multer';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COOKBOOK_IMAGE_DIR = path.join(__dirname, '..', 'public', 'cookbook_image');
const RECIPE_IMAGE_DIR = path.join(__dirname, '..', 'public', 'recipe_image');

fs.mkdirSync(COOKBOOK_IMAGE_DIR, { recursive: true });
fs.mkdirSync(RECIPE_IMAGE_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, COOKBOOK_IMAGE_DIR);
    },
    filename(req, file, cb) {
        // Never trust the client-supplied filename/extension; derive it from the
        // sniffed mimetype and generate a random name to prevent overwrites/traversal.
        cb(null, `${randomUUID()}${ALLOWED_MIME_TYPES[file.mimetype]}`);
    },
});

function fileFilter(req, file, cb) {
    if (!Object.prototype.hasOwnProperty.call(ALLOWED_MIME_TYPES, file.mimetype)) {
        return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
    }
    cb(null, true);
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE_BYTES,
        files: 1,
    },
}).single('image');

const recipeStorage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, RECIPE_IMAGE_DIR);
    },
    filename(req, file, cb) {
        cb(null, `${randomUUID()}${ALLOWED_MIME_TYPES[file.mimetype]}`);
    },
});

const uploadRecipe = multer({
    storage: recipeStorage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE_BYTES,
        files: 1,
    },
}).single('image');

export function uploadCookbookImage(req, res, next) {
    upload(req, res, (error) => {
        if (error instanceof multer.MulterError) {
            return res.status(400).json({ message: `Upload error: ${error.message}` });
        }
        if (error) {
            return res.status(400).json({ message: error.message });
        }
        // The image is optional; routes that require one should check req.file themselves.
        next();
    });
}

export function uploadRecipeImage(req, res, next) {
    uploadRecipe(req, res, (error) => {
        if (error instanceof multer.MulterError) {
            return res.status(400).json({ message: `Upload error: ${error.message}` });
        }
        if (error) {
            return res.status(400).json({ message: error.message });
        }
        // The image is optional; routes that require one should check req.file themselves.
        next();
    });
}

export async function deleteCookbookImage(imageUrl) {
    if (!imageUrl) return;
    // Only the basename is trusted; this keeps the deletion confined to COOKBOOK_IMAGE_DIR
    // even if imageUrl was ever tampered with.
    const filePath = path.join(COOKBOOK_IMAGE_DIR, path.basename(imageUrl));
    await fs.promises.unlink(filePath).catch(() => {});
}

export async function deleteRecipeImage(imageUrl) {
    if (!imageUrl) return;
    // Only the basename is trusted; this keeps the deletion confined to RECIPE_IMAGE_DIR
    // even if imageUrl was ever tampered with.
    const filePath = path.join(RECIPE_IMAGE_DIR, path.basename(imageUrl));
    await fs.promises.unlink(filePath).catch(() => {});
}

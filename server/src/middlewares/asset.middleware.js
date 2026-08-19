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

const MULTER_ERROR_MESSAGES = {
    LIMIT_FILE_SIZE: "L'image dépasse la taille maximale autorisée (5 Mo)",
    LIMIT_UNEXPECTED_FILE: "Format d'image non pris en charge (formats acceptés : .jpeg, .jpg, .png, .webp)",
};

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
            return res.status(400).json({ message: MULTER_ERROR_MESSAGES[error.code] || `Erreur lors de l'upload : ${error.message}` });
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
            return res.status(400).json({ message: MULTER_ERROR_MESSAGES[error.code] || `Erreur lors de l'upload : ${error.message}` });
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

export async function saveRecipeImageFromUrl(imageUrl) {
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`Échec du téléchargement de l'image (${response.status})`);
    }

    const contentType = response.headers.get('content-type')?.split(';')[0].trim();
    const extension = ALLOWED_MIME_TYPES[contentType];
    if (!extension) {
        throw new Error(`Type d'image non pris en charge : ${contentType}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
        throw new Error('L\'image dépasse la taille maximale autorisée');
    }

    const filename = `${randomUUID()}${extension}`;
    await fs.promises.writeFile(path.join(RECIPE_IMAGE_DIR, filename), buffer);

    return `/public/recipe_image/${filename}`;
}

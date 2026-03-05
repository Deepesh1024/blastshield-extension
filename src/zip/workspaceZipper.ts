import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';

const IGNORE_DIRS = new Set([
    'node_modules',
    '.git',
    'build',
    'dist',
    '__pycache__',
    'venv',
    '.venv',
    'env',
    '.env',
    '.vscode',
    '.idea',
    'coverage',
    '.next',
    '.nuxt',
    'out',
    '.DS_Store',
]);

const IGNORE_EXTENSIONS = new Set([
    '.pyc',
    '.pyo',
    '.class',
    '.o',
    '.so',
    '.dll',
    '.exe',
    '.zip',
    '.tar',
    '.gz',
    '.rar',
    '.7z',
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file

function shouldIgnore(name: string, fullPath: string): boolean {
    if (IGNORE_DIRS.has(name)) {
        return true;
    }
    if (name.startsWith('.') && name !== '.env') {
        return true;
    }
    const ext = path.extname(name).toLowerCase();
    if (IGNORE_EXTENSIONS.has(ext)) {
        return true;
    }
    try {
        const stats = fs.statSync(fullPath);
        if (stats.size > MAX_FILE_SIZE) {
            return true;
        }
    } catch {
        return true;
    }
    return false;
}

function addFilesToZip(zip: AdmZip, dirPath: string, basePath: string): void {
    const entries = fs.readdirSync(dirPath);

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry);

        if (shouldIgnore(entry, fullPath)) {
            continue;
        }

        try {
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                addFilesToZip(zip, fullPath, basePath);
            } else if (stats.isFile()) {
                const relativePath = path.relative(basePath, fullPath);
                const content = fs.readFileSync(fullPath);
                zip.addFile(relativePath, content);
            }
        } catch {
            // Skip files we can't read
            continue;
        }
    }
}

export async function zipWorkspace(rootPath: string): Promise<Buffer> {
    const zip = new AdmZip();
    addFilesToZip(zip, rootPath, rootPath);
    return zip.toBuffer();
}

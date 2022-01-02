#!/usr/bin/env node

import FS from "fs";
import Path from "path";

const processPath = Path.parse(process.argv[1])
const publicDir = Path.join(processPath.dir, "..", "public")
const notebooksDir = Path.join(publicDir, "notebooks")

const titleFromFile = (fileName) => {
    const content = FS.readFileSync(fileName, 'utf-8').split(/\r?\n/);

    let index = 0;
    while (index < content.length) {
        const line = content[index];

        if (/^#+ */.test(line))
            return /^#+ (.*)$/.exec(line)[1];

        index += 1;
    }

    return undefined;
};

const titleFromName = (name) =>
    name.replace(/.md$/, '').replace(/-/g, ' ').split(' ').map(s => s[0].toUpperCase() + s.slice(1)).join(' ');

const nameToDir = (dir, name) => {
    const fullPath = Path.join(dir, name)

    const title = titleFromFile(fullPath) || titleFromName(name);

    return {
        label: title,
        resource: fullPath.slice(publicDir.length)
    }
};

const readNotebooksDir = (dir) => {
    const entries = FS.readdirSync(dir, { withFileTypes: true });

    const directories = entries
        .filter(e => e.isDirectory())
        .map(e => ({
            node: titleFromName(e.name),
            children: readNotebooksDir(Path.join(dir, e.name))
        }))
        .filter(n => n.children.length > 0);

    return [...entries.filter(e => e.isFile() && /\.md$/.test(e.name)).map(e => nameToDir(dir, e.name)), ...directories]
        .sort((a, b) => {
            const aName = a.label || a.node;
            const bName = b.label || b.node;

            return bName < aName ? 1 : bName > aName ? -1 : 0
        });
};

FS.writeFileSync(Path.join(publicDir, 'directory.json'), JSON.stringify(readNotebooksDir(notebooksDir), null, 2), 'utf-8')
// console.log(readNotebooksDir(notebooksDir))

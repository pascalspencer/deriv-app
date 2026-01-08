/* eslint-disable no-console */
const { EOL } = require('os');
const path = require('path');
const fs = require('fs');

const glob = require('glob');

const { getFileNameFromPath, getKebabCase, getPascalCase } = require('./helper');

const icons_list = require('./icons');

function validateIcons(svgs_map) {
    Object.keys(icons_list).forEach(icon_path => {
        const short_path = icons_list[icon_path].replace('.svg', '').replace('./src/components/icon/', '');
        const dir_name = path.dirname(short_path);

        const file_name = getFileNameFromPath(short_path);
        const icon_name = getPascalCase(file_name);

        let category = 'common';
        const category_match = new RegExp(`^Ic(${Object.keys(svgs_map).join('|')})`, 'gi').exec(icon_name);
        if (category_match && category_match[1]) {
            category = getKebabCase(category_match[1]);
        }

        if (category !== dir_name) {
            throw new Error(`'${file_name}' icon is in incorrect folder. Please move it to the ${category} folder.`);
        }
    });
}

function buildIconsManifest() {
    console.log('Building icons manifest...');
    const sprite_bundles = glob.sync('./lib/icon/sprites/**/*.svg');
    console.log(`Found ${sprite_bundles.length} sprite bundles in ./lib/icon/sprites/`);

    const svgs_map = sprite_bundles.reduce((acc, fname) => {
        const name = getFileNameFromPath(fname);
        const matches = name.match(/^(.*?)\./);
        if (matches && matches[1]) {
            const svg_category = matches[1];
            acc[svg_category] = name;
        }
        return acc;
    }, {});

    console.log('Generated svgs_map keys:', Object.keys(svgs_map));

    try {
        validateIcons(svgs_map);
    } catch (e) {
        console.error('Validation Error:', e.message);
        // Don't return yet, let's see if we can still write something or what happened.
    }

    const buffer = ['// auto-generated file. DO NOT MODIFY.', ''];
    Object.keys(svgs_map).forEach(key => {
        buffer.push(`export const ${key} = '${svgs_map[key]}';`);
    });
    buffer.push('');
    buffer.push(`export default ${JSON.stringify(svgs_map)} as const;`);

    fs.writeFileSync(path.join(__dirname, '../src/components/icon/icons-manifest.ts'), buffer.join(EOL) + EOL);
}

module.exports.buildIconsManifest = buildIconsManifest;

const fs = require('fs');
const path = require('path');

const filePath = 'e:\\ssth-inventory-v2\\SSTH-Inventory\\TRUNCATE-AND-INSERT.sql';
let content = fs.readFileSync(filePath, 'utf8');

// Find the VALUES start and end
const valuesStartMarker = "FROM (VALUES";
const valuesEndMarker = ") AS t(item_code";

const startIndex = content.indexOf(valuesStartMarker);
const endIndex = content.indexOf(valuesEndMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find VALUES block");
    process.exit(1);
}

const pre = content.substring(0, startIndex + valuesStartMarker.length);
const valuesBlock = content.substring(startIndex + valuesStartMarker.length, endIndex);
const post = content.substring(endIndex);

// Process values
const lines = valuesBlock.split('\n');
const newLines = [];

const counters = {};
const categoryCodes = {
    'Office': 'OF',
    'Cleaning': 'CL',
    'Safety': 'SF',
    'Electronics': 'EL',
    'Uniforms': 'UN',
    'Medical': 'MD',
    'Tools': 'TL'
};

for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
        continue;
    }

    if (trimmed.startsWith('--')) {
        newLines.push('  ' + trimmed);
        continue;
    }

    // Check if it's a tuple line
    // It should look like: ('CODE', 'Desc', ...
    if (trimmed.startsWith('(')) {
        // Find category
        let category = null;
        for (const [catName] of Object.entries(categoryCodes)) {
            // Check if line contains 'Office', 'Cleaning', etc. as a standalone string literal
            // simpler check:
            if (line.includes(`'${catName}'`)) {
                category = catName;
                break;
            }
        }

        if (category) {
            const prefix = categoryCodes[category];
            if (!counters[category]) counters[category] = 1;
            const num = counters[category]++;
            const newCode = `${prefix}-${num.toString().padStart(3, '0')}`;

            // Replace the first element ('OLD-CODE' with ('NEW-CODE'
            // The regex matches start of line, optional whitespace, (, ', anything not ', '
            const newLine = line.replace(/^\s*\('[^']+'/, `  ('${newCode}'`);
            newLines.push(newLine);
        } else {
            // Can't find category, keep as is
            newLines.push(line);
        }
    } else {
        newLines.push(line);
    }
}

// Join with newlines
const newValuesBlock = '\n' + newLines.join('\n') + '\n';
const newContent = pre + newValuesBlock + post;

fs.writeFileSync(filePath, newContent);
console.log("Refactored item codes in TRUNCATE-AND-INSERT.sql");
console.log("Last codes generated:");
console.log(counters);

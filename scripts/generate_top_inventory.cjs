const XLSX = require('xlsx');
const fs = require('fs');

// List of items provided by user
const items = [
    "A4 Copy Paper 70 Grams", "A4 - red", "A4 - blue", "A4 - green", "A4 - yellow", "A4 - pink", "A4 - purple", "A4 - green (เขียวอ่อน)", "A4- green (QA) เขียวแก่",
    "A3 Copy Paper",
    "Ballpen - blue", "Ballpen - red", "Pencil", "Eraser", "Sharpener", "Ruler", "Scissors", "Glue Stick", "Stapler",
    "Staples no.10", "Staples no.10-1M", "Staples no.3(24/6)", "Staples no.23/10-M", "Staples no.23/13-H", "Steple Remover", "Paper Clip",
    "Binder Clip No.108 (Very Big)", "Binder Clip No.109 (Big)", "Binder Clip No.110 (Middle)", "Binder Clip No.112 (Small)",
    "Cutter (BIG)", "Cutter Spare Blade A-100", "Cutter Spare Blade A-150",
    "Fastenner", "L-Holder",
    "Marker - red", "Marker - blue", "Marker - black", "Highlighter",
    "Whiteboard - black", "Whiteboard - blue", "Whiteboard - red", "Board Eraser",
    "Permanent - Black", "Permanent - Blue", "Permanent - Red",
    "Paint Marker (Orange)", "Paint Marker (Pink)", "Paint Marker (Yellow)", "Paint Marker (Green)", "Paint Marker (White)", "Paint Marker (Blue)", "Paint Marker (Red)", "Paint Marker (Black)",
    "Dermatograph Pencil - black", "Dermatograph Pencil - red",
    "Liquid Paper & Correction Tape",
    "Stamp Pad - blue", "Stamp Pad Ink - blue", "Stamp Pad Ink - red", "Refill Ink - blue", "Date Stamp", "Date Stamp (แบบยาง)",
    "Post-it Small", "Post-it 3*3",
    "Sheet Protector - 11 holes", "Seminar File A4", "Laminating Pouch Film - A3", "Laminating Pouch Film - A4",
    "Transparent Tape - Big Roll", "Transparent Tape - Small Roll", "Double Sided Tissue Tape", "Double Sided Foam Tape", "Anti Slip Tape", "Reflective tape Yellow/Black", "Reflective tape White/Red", "Self Adhesive Rings",
    "Cotton Glove", "Microtex Glove", "PU Glove - Black", "PU Glove - orange", "PU Glove - White", "Rubber Glove", "Cut Resistant gloves level 5", "Cut Resistant gloves level 5 (Dot)", "Welding leather gloves",
    "safety glasses", "Visor Bracket", "Face Sheild",
    "N95 Mask 3M", "Carbon Mask 5 Layers", "Cotton Mask", "KF94",
    "Ear Plug - wire", "Ear Plug - wireless(refill)",
    "Safety Shoes NO.39", "Safety Shoes NO.40", "Safety Shoes NO.41", "HMT-AYL Safety helmet", "ARM-GN - Hand Protection", "APN-AP04 - Apron Leather", "MDC CAP",
    "Dishwashing Cleaner", "Floor Cleaner", "Handwashing Cleaner", "Mirror Cleaner", "Toilet Cleaner (Ped Pro)", "Washing Powder", "Dust Mop Liquid", "Sponge for washing dishes",
    "Garbage bag 18*20", "Garbage bag 24*28", "Garbage bag 30*40", "Garbage bag 36*45", "Red garbage bags",
    "Tissue - mouth", "Tissue - Face",
    "Mop", "Mop 10\"", "tatter(Mop)", "Spare Dust Mop", "Dust Mop", "Dustpan", "Soft Broom", "Coconut Broom", "Cobweb broom", "Water broom 24\"", "Long handle floor brush", "Toilet brush", "Duster",
    "2A Battery", "3A Battery", "Lithium Battery (3V) 2025", "Lithium Battery (3V) 2032", "Lithium Battery (1.5V) LR44", "Microphone Battery (9V)", "Panasonic 23A", "Lithium Battery LR41"
];

// Helper to guess category and UOM
function guessDetails(description) {
    const lower = description.toLowerCase();
    let category = "General";
    let uom = "PCS";

    if (lower.includes("paper") || lower.includes("a4") || lower.includes("a3")) {
        category = "Paper";
        if (lower.includes("copy paper")) uom = "REAM";
    }
    else if (lower.includes("pen") || lower.includes("marker") || lower.includes("pencil") || lower.includes("highlighter")) {
        category = "Writing Instruments";
        uom = "PCS";
    }
    else if (lower.includes("clip") || lower.includes("staple") || lower.includes("tape") || lower.includes("glue") || lower.includes("cutter") || lower.includes("scissors")) {
        category = "Office Supplies";
        if (lower.includes("staples")) uom = "BOX";
        else if (lower.includes("clip")) uom = "BOX";
        else uom = "PCS";
    }
    else if (lower.includes("glove")) {
        category = "Safety Equipment";
        uom = "PAIR";
    }
    else if (lower.includes("safety") || lower.includes("mask") || lower.includes("helmet") || lower.includes("ear plug")) {
        category = "Safety Equipment";
        if (lower.includes("shoes")) uom = "PAIR";
        else uom = "PCS";
    }
    else if (lower.includes("cleaner") || lower.includes("washing") || lower.includes("mop") || lower.includes("broom") || lower.includes("garbage bag") || lower.includes("tissue")) {
        category = "Cleaning Supplies";
        if (lower.includes("liquid")) uom = "BOTTLE";
        else if (lower.includes("bag")) uom = "PACK";
        else uom = "PCS";
    }
    else if (lower.includes("battery")) {
        category = "Electronics/Batteries";
        uom = "PCS";
    }

    return { category, uom };
}

// Category prefixes
const categoryPrefixes = {
    'Paper': 'OF',
    'Writing Instruments': 'OF',
    'Office Supplies': 'OF',
    'Safety Equipment': 'SF',
    'Cleaning Supplies': 'CL',
    'Electronics/Batteries': 'EL',
    'General': 'OF'
};

const counters = {};

// Generate data rows
const data = items.map((desc) => {
    const { category, uom } = guessDetails(desc);

    // Determine prefix
    const prefix = categoryPrefixes[category] || 'OF';

    // Increment counter for this prefix
    if (!counters[prefix]) counters[prefix] = 1;
    const count = counters[prefix]++;

    // Generate Item Code: OF-001, CL-001...
    const itemCode = `${prefix}-${count.toString().padStart(3, '0')}`;

    return {
        "Item Code": itemCode,
        "Description": desc,
        "Description (TH)": "",
        "Category": category,
        "UOM": uom,
        "Ordering UOM": "",
        "Outermost UOM": "",
        "Unit Cost": 0,
        "Reorder Level": 10,
        "Quantity": 0, // Initial stock 0 as requested
        "PO Number": ""
    };
});

// Create Workbook
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(data);

// Set column widths
ws['!cols'] = [
    { wch: 15 }, // Item Code
    { wch: 40 }, // Description
    { wch: 40 }, // Description (TH)
    { wch: 20 }, // Category
    { wch: 10 }, // UOM
    { wch: 10 }, // Ordering UOM
    { wch: 10 }, // Outermost UOM
    { wch: 10 }, // Unit Cost
    { wch: 10 }, // Reorder Level
    { wch: 10 }, // Quantity
    { wch: 15 }  // PO Number
];

XLSX.utils.book_append_sheet(wb, ws, "Inventory Items");

// Save file
XLSX.writeFile(wb, "top_inventory_import.xlsx");
console.log("✅ Generated top_inventory_import.xlsx with " + items.length + " items.");

const fs = require("fs");
const path = require("path");

const files = [
  "app/panel/gonderi-olustur/page.tsx",
  "components/ui/input.tsx",
  "components/ui/card.tsx",
  "components/ui/floating-field.tsx",
  "components/ui/searchable-select.tsx"
];

for (const file of files) {
  const fullPath = path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) continue;
  
  let content = fs.readFileSync(fullPath, "utf8");
  
  // page.tsx
  content = content.replace(/rounded-\[var\(--radius-lg\)\]/g, "rounded-2xl");
  content = content.replace(/rounded-\[var\(--radius-md\)\]/g, "rounded-2xl");
  content = content.replace(/rounded-\[var\(--radius-sm\)\]/g, "rounded-md"); // keep sm a bit smaller or rounded-2xl
  
  // Others
  content = content.replace(/rounded-\[5px\]/g, "rounded-2xl");
  content = content.replace(/rounded-xl/g, "rounded-2xl");
  
  // Make sure we didn't double up
  content = content.replace(/rounded-2xl-2xl/g, "rounded-2xl");

  fs.writeFileSync(fullPath, content, "utf8");
}
console.log("Replaced successfully!");

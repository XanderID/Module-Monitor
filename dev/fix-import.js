import fs from "fs";
import path from "path";

const distDir = path.resolve("dist");

function fixImportExtensions(code) {
  return code.replace(
    /(import|export)([\s\S]*?from\s*['"])(\.{1,2}\/.*?)(['"])/g,
    (match, keyword, fromPart, pathPart, quote) => {
      if (path.extname(pathPart)) return match;
      return `${keyword}${fromPart}${pathPart}.js${quote}`;
    }
  );
}

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      let content = fs.readFileSync(fullPath, "utf8");
      const fixed = fixImportExtensions(content);
      fs.writeFileSync(fullPath, fixed, "utf8");
      console.log(`Updated: ${fullPath}`);
    }
  }
}

processDir(distDir);

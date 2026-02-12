const { execSync } = require("child_process");

const modules = ["dashboard", "expenses", "income"];

for (const m of modules) {
  console.log(`Building ${m}...`);
  execSync("npm run build", { cwd: m, stdio: "inherit" });
}

console.log("Full application build successful");

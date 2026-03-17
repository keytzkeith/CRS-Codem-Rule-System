const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const releasePath = path.join(root, 'config', 'release.json');
const siteIdentityPath = path.join(root, 'config', 'siteIdentity.json');
const frontendPackagePath = path.join(root, 'frontend', 'package.json');
const backendPackagePath = path.join(root, 'backend', 'package.json');
const docsPackagePath = path.join(root, 'docs-site', 'package.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function sync() {
  const release = readJson(releasePath);
  const siteIdentity = readJson(siteIdentityPath);
  const frontendPackage = readJson(frontendPackagePath);
  const backendPackage = readJson(backendPackagePath);
  const docsPackage = readJson(docsPackagePath);

  siteIdentity.release = {
    version: release.version,
    stage: release.stage,
    billing: release.billing
  };

  frontendPackage.version = release.version;
  backendPackage.version = release.version;
  docsPackage.version = release.version;

  writeJson(siteIdentityPath, siteIdentity);
  writeJson(frontendPackagePath, frontendPackage);
  writeJson(backendPackagePath, backendPackage);
  writeJson(docsPackagePath, docsPackage);

  console.log(`Synced release version ${release.version} (${release.stage})`);
}

sync();

import * as fs from 'fs';
import * as path from 'path';

const packageJsonPath = path.resolve(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

export const APP_CONFIG = {
  name: packageJson.name || 'AgentArum AI',
  version: packageJson.version || '0.0.0',
  description:
    packageJson.description ||
    'Lead with Intelligence. Decide with Confidence.',
};

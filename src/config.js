import { readFileSync } from 'fs';
import toml from 'toml';

const configFile = readFileSync('./config.toml', 'utf-8');
const config = toml.parse(configFile);

export { config }; 
import { LiveConnectConfig } from '@google/genai';
import * as fs from 'fs';

// To inspect typescript types indirectly, let's just grep or use tsx if possible?
// Let's create a script that just reads node_modules/@google/genai/dist/index.d.ts and searches for LiveConnectConfig
const dts = fs.readFileSync('./node_modules/@google/genai/dist/index.d.ts', 'utf-8');
const index = dts.indexOf('interface LiveConnectConfig');
console.log(dts.substring(index, index + 1000));

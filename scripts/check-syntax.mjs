import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const files=['sw.js',...['assets/js','scripts','tests'].flatMap(walk)].filter(f=>/\.(m?js)$/.test(f));
for(const file of files)execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
console.log(files.length+' JavaScript files passed syntax checks.');

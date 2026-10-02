import {spawn} from 'node:child_process';
const children=[spawn(process.execPath,['server.js'],{stdio:'inherit'}),spawn(process.execPath,['node_modules/vite/bin/vite.js'],{stdio:'inherit'})];
let ending=false;
function stop(code=0){if(ending)return;ending=true;for(const child of children)child.kill();process.exit(code);}
for(const child of children)child.on('exit',code=>stop(code??0));
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop());

import path from 'node:path'
import fs from 'node:fs/promises'
import child_process from "node:child_process";

const abbyy = String.raw`C:\Program Files (x86)\ABBYY FineReader 15\FineCmd.exe`
const outPath = String.raw`C:\Users\win\Downloads\copyed`

const dirPath = String.raw`C:\Users\win\Downloads\kodbox - Copy`
const fileList = await fs.readdir(dirPath)

const batchSize = 10
const fileBatch = [];
for (let i = 0; i < fileList.length; i += batchSize) fileBatch.push(fileList.slice(i, i + batchSize))
let currentIdx = 0

async function exec(fileName) {
    console.log(`[${++currentIdx}/${fileList.length}] starting... ${fileName}`);
    const {name, ext} = path.parse(fileName);
    const out = path.join(outPath, `${name}.pdf`)
    const cmd = [`& "${abbyy}"`, `"${path.join(dirPath, fileName)}"`, '/out', `"${out}"`].join(' ')
    // const {status} = child_process.spawnSync(cmd);
    const proc = child_process.spawn(abbyy, [path.join(dirPath, fileName), '/out', out]);
    const status = await new Promise(resolve => {
        proc.on('exit', code => resolve(code))
    })
    if (status === 0) return true;
    console.log(`error ${cmd}`);
}

function pLimit(concurrent) {
    let task = [], active = 0;
    return (fn) => new Promise(async res => {
        task.push(async () => (active++, res(await fn()), active--, task.pop()?.()));
        await Promise.resolve();
        active < concurrent && task.pop()?.();
    });
}

const limiter = pLimit(10);
await Promise.all(fileList.slice().map(e => limiter(() => exec(e))))

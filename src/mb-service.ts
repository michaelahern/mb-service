import { MacOS } from './macos.js';

async function main() {
    const macos = new MacOS();
    macos.install();
}

main().catch(err => console.error(err));

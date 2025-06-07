import { parseArgs } from 'node:util';
import { MacOS } from './macos.js';

async function main() {
    const { positionals } = parseArgs({
        args: process.argv.slice(2),
        options: { },
        allowPositionals: true
    });

    const command = positionals[0];
    const macos = new MacOS();

    switch (command) {
        case 'install':
            macos.install();
            break;

        case 'uninstall':
            macos.uninstall();
            break;

        case 'is-running':
            console.log(macos.isRunning());
            break;

        case 'start':
            macos.start();
            break;

        case 'stop':
            macos.stop();
            break;

        case undefined:
            console.log('No command specified. Available commands: install, uninstall, start, stop');
            break;

        default:
            console.log(`Unknown command: ${command}`);
            console.log('Available commands: install, uninstall');
    }
}

main().catch(err => console.error(err));

import { parseArgs } from 'node:util';
import { platform } from 'node:os';
import { MacPlatform } from './macos.js';
import { LinuxPlatform } from './linux.js';
import { PlatformCommands } from './platform.js';

async function main() {
    const { positionals } = parseArgs({
        args: process.argv.slice(2),
        options: { },
        allowPositionals: true
    });

    let platformCommands: PlatformCommands;
    switch (platform()) {
        case 'darwin':
            platformCommands = new MacPlatform();
            break;
        case 'linux':
            platformCommands = new LinuxPlatform();
            break;
        default:
            console.log('Platform not supported:', platform());
            process.exit(1);
    }

    const command = positionals[0];
    switch (command) {
        case 'install':
            platformCommands.install();
            break;
        case 'uninstall':
            platformCommands.uninstall();
            break;
        case 'is-running':
            console.log(platformCommands.isRunning());
            break;
        case 'start':
            platformCommands.start();
            break;
        case 'stop':
            platformCommands.stop();
            break;
        case 'restart':
            platformCommands.restart();
            break;
        case undefined:
            console.log('No command specified. Available commands: install, uninstall, start, stop, restart');
            break;
        default:
            console.log(`Unknown command: ${command}`);
            console.log('Available commands: install, uninstall');
    }
}

main().catch(err => console.error(err));

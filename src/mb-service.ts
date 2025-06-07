#!/usr/bin/env node

import { platform } from 'node:os';
import { parseArgs } from 'node:util';
import { MacPlatform } from './mac.js';
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
        // case 'linux':
        //     platformCommands = new LinuxPlatform();
        //     break;
        default:
            console.log('Platform not supported:', platform());
            process.exit(2);
    }

    const command = positionals[0];
    switch (command) {
        case 'install':
            platformCommands.install();
            break;
        case 'uninstall':
            platformCommands.uninstall();
            break;
        case 'start':
            platformCommands.start();
            break;
        case 'stop':
            platformCommands.stop();
            break;
        case 'restart':
            platformCommands.stop();
            setTimeout(() => {
                platformCommands.start();
            }, 2000);
            break;
        case 'pid': {
            const pid = platformCommands.pid();
            if (pid === null) {
                process.exit(1);
            }
            console.log(pid);
            break;
        }
        case 'tail':
            platformCommands.tail();
            break;
        case undefined:
            help();
            break;
        default:
            console.error(`Unknown command: ${command}`);
            help();
            process.exit(1);
    }
}

function help() {
    console.log('Usage: mb-service <command>');
    console.log('Commands:');
    console.log('  install       Install the Matterbridge service');
    console.log('  uninstall     Uninstall the Matterbridge service');
    console.log('  start         Start the Matterbridge service');
    console.log('  stop          Stop the Matterbridge service');
    console.log('  restart       Restart the Matterbridge service');
    console.log('  pid           Get the process id of the Matterbridge service');
    console.log('  tail          Tail the Matterbridge log file');
}

main().catch(err => console.error(err));

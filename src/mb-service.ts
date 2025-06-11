#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { platform } from 'node:os';
import { parseArgs } from 'node:util';
import { MacPlatform } from './mac.js';
import { PlatformCommands } from './platform.js';

async function main() {
    const args = parseArgs({
        args: process.argv.slice(2),
        options: {
            help: { type: 'boolean', short: 'h' },
            version: { type: 'boolean', short: 'v' } },
        strict: false,
        allowPositionals: true
    });

    if (args.values.help) {
        help();
        process.exit(0);
    }

    if (args.values.version) {
        const packageJson = readFileSync('./package.json', 'utf8');
        const packageInfo = JSON.parse(packageJson);
        console.log(packageInfo.version);
        process.exit(0);
    }

    let platformCommands: PlatformCommands;
    switch (platform()) {
        case 'darwin':
            platformCommands = new MacPlatform();
            break;
        default:
            console.log('Platform not supported:', platform());
            process.exit(2);
    }

    const command = args.positionals[0];
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
    console.log('Usage: mb-service <command> [options]');
    console.log('');
    console.log('Commands:');
    console.log('  install       Install the Matterbridge service');
    console.log('  uninstall     Uninstall the Matterbridge service');
    console.log('  start         Start the Matterbridge service');
    console.log('  stop          Stop the Matterbridge service');
    console.log('  restart       Restart the Matterbridge service');
    console.log('  pid           Get the process id of the Matterbridge service');
    console.log('  tail          Tail the Matterbridge log file');
    console.log('');
    console.log('Options:');
    console.log('  -h, --help');
    console.log('  -v, --version');
    console.log('');
}

main().catch(err => console.error(err));

#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { platform } from 'node:os';
import { parseArgs } from 'node:util';
import { LinuxPlatform } from './linux.js';
import { MacPlatform } from './mac.js';
import { PlatformCommands } from './platform.js';

async function main() {
    const args = parseArgs({
        args: process.argv.slice(2),
        options: {
            help: { type: 'boolean', short: 'h' },
            version: { type: 'boolean', short: 'v' },
            frontend: { type: 'string' },
            ssl: { type: 'boolean' }
        },
        strict: false,
        allowPositionals: true
    });

    if (args.values.help) {
        help();
        process.exit(0);
    }

    if (args.values.version) {
        const packageJson = readFileSync(new URL('../package.json', import.meta.url), 'utf8');
        const packageInfo = JSON.parse(packageJson);
        console.log(packageInfo.version);
        process.exit(0);
    }

    let platformCommands: PlatformCommands;
    switch (platform()) {
        case 'linux':
            platformCommands = new LinuxPlatform();
            break;
        case 'darwin':
            platformCommands = new MacPlatform();
            break;
        default:
            console.error('Platform not supported:', platform());
            process.exit(2);
    }

    const installArgs: string[] = ['-service'];

    if (args.values.frontend) {
        if (typeof args.values.frontend === 'string' && /^\d+$/.test(args.values.frontend)) {
            installArgs.push('-frontend', args.values.frontend);
        }
        else {
            console.error(`Specify a valid number in --frontend <port>`);
            help();
            process.exit(1);
        }
    }

    if (args.values.ssl) {
        installArgs.push('-ssl');
    }

    const command = args.positionals[0];
    switch (command) {
        case 'install':
            platformCommands.install(installArgs);
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
    console.log('Global Options:');
    console.log('  -h, --help');
    console.log('  -v, --version');
    console.log('');
    console.log('Install Options:');
    console.log('  --frontend <port>');
    console.log('  --ssl');
    console.log('');
}

main().catch(err => console.error(err));

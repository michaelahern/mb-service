import { execFileSync, execSync } from 'node:child_process';
import { chownSync, existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir, userInfo } from 'node:os';
import { resolve } from 'node:path';
import process from 'node:process';

import { Platform } from './platform.js';

export class MacOS extends Platform {
    #plist = '/Library/LaunchDaemons/com.matterbridge.plist';

    install(): void {
        this.#checkRoot();
        const homedir = this.#getHome();
        const { uid, gid } = this.getId();

        const pluginPath = resolve(homedir, 'Matterbridge');
        const storagePath = resolve(homedir, '.matterbridge');

        mkdirSync(pluginPath, { recursive: true });
        mkdirSync(storagePath, { recursive: true });

        chownSync(pluginPath, uid, gid);
        chownSync(storagePath, uid, gid);

        const matterbridgePath = execSync('which matterbridge').toString().trim();

        // const npmGlobalPath = execSync('/bin/echo -n "$(npm -g prefix)/lib/node_modules"');

        const plistFileContents = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
            '<plist version="1.0">',
            '<dict>',
            '    <key>RunAtLoad</key>',
            '    <true/>',
            '    <key>KeepAlive</key>',
            '    <true/>',
            '    <key>Label</key>',
            `    <string>com.matterbridge</string>`,
            '    <key>ProgramArguments</key>',
            '    <array>',
            `         <string>${matterbridgePath}</string>`,
            `         <string>-service</string>`,
            '    </array>',
            '    <key>StandardOutPath</key>',
            `    <string>${storagePath}/matterbridge.log</string>`,
            '    <key>StandardErrorPath</key>',
            `    <string>${storagePath}/matterbridge.log</string>`,
            '    <key>UserName</key>',
            `    <string>${process.env.SUDO_USER}</string>`,
            '    <key>EnvironmentVariables</key>',
            '    <dict>',
            '        <key>HOME</key>',
            `        <string>${homedir}</string>`,
            '    </dict>',
            '</dict>',
            '</plist>'
        ].filter(x => x).join('\n');

        writeFileSync(this.#plist, plistFileContents);
        this.start();
        // Post Install Console
    }

    uninstall(): void {
        this.stop();
        if (existsSync(this.#plist)) {
            unlinkSync(this.#plist);
            console.info('Matterbridge Service Uninstalled!');
        }
        else {
            console.info('Matterbridge Service Not Installed...');
        }
    }

    start(): void {
        this.#checkRoot();
        console.info('Starting Matterbridge...');
        execFileSync('launchctl', ['load', '-w', this.#plist]);
        console.info('Matterbridge Started!');
    }

    stop(): void {
        this.#checkRoot();
        console.info('Stopping Matterbridge...');
        execFileSync('launchctl', ['unload', '-w', this.#plist]);
        console.info('Matterbridge Stopped!');
    }

    restart(): void {
        this.stop();
        this.start();
    }

    getId(): { uid: number; gid: number } {
        if (process.env.SUDO_USER) {
            const uid = execSync(`id -u ${process.env.SUDO_USER}`).toString();
            const gid = execSync(`id -g ${process.env.SUDO_USER}`).toString();
            return {
                uid: Number.parseInt(uid, 10),
                gid: Number.parseInt(gid, 10)
            };
        }

        return {
            uid: userInfo().uid,
            gid: userInfo().gid
        };
    }

    #checkRoot() {
        if ((process.getuid && process.getuid() !== 0) || !process.env.SUDO_USER) {
            console.error('ERROR: Command must be executed using sudo!');
            console.error(`sudo mb-service <TODO>`);
            process.exit(1);
        }
    }

    #getHome() {
        const sudoUserHomeDir = execSync(`eval echo "~${process.env.SUDO_USER}"`).toString().trim();
        if (sudoUserHomeDir.charAt(0) === '~') {
            return homedir();
        }
        return sudoUserHomeDir;
    }
}

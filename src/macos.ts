import { execFileSync, execSync } from 'node:child_process';
import { chownSync, existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { UserInfo, userInfo } from 'node:os';
import { resolve } from 'node:path';
import process from 'node:process';

import { Platform } from './platform.js';

export class MacOS extends Platform {
    #plist = '/Library/LaunchDaemons/com.matterbridge.plist';

    install(): void {
        this.#checkRoot();
        const userInfo = this.#getUserInfo();

        const pluginPath = resolve(userInfo.homedir, 'Matterbridge');
        const storagePath = resolve(userInfo.homedir, '.matterbridge');

        mkdirSync(pluginPath, { recursive: true });
        mkdirSync(storagePath, { recursive: true });

        chownSync(pluginPath, userInfo.uid, userInfo.gid);
        chownSync(storagePath, userInfo.uid, userInfo.gid);

        const matterbridgePath = execSync('eval echo "$(npm prefix -g --silent)/bin/matterbridge"').toString().trim();
        if (!existsSync(matterbridgePath)) {
            console.error('Matterbridge is not installed globally!');
            console.error('npm install -g matterbridge');
            process.exit(1);
        }

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
            `    <string>${userInfo.username}</string>`,
            '    <key>EnvironmentVariables</key>',
            '    <dict>',
            '        <key>HOME</key>',
            `        <string>${userInfo.homedir}</string>`,
            '        <key>PATH</key>',
            `        <string>${process.env.PATH}</string>`,
            '    </dict>',
            '</dict>',
            '</plist>'
        ].filter(x => x).join('\n');

        writeFileSync(this.#plist, plistFileContents);
        this.start();
        // Post Install Console
    }

    uninstall(): void {
        this.#checkRoot();
        this.stop();
        if (existsSync(this.#plist)) {
            unlinkSync(this.#plist);
            console.info('Matterbridge Service Uninstalled!');
        }
        else {
            console.info('Matterbridge Service Not Installed...');
        }
    }

    isRunning(): boolean {
        try {
            execFileSync('launchctl', ['print', 'system/com.matterbridge']);
            return true;
        }
        catch {
            return false;
        }
    }

    start(): void {
        this.#checkRoot();

        if (this.isRunning()) {
            console.warn('Matterbridge already running!');
            return;
        }

        console.info('Starting Matterbridge...');
        execFileSync('launchctl', ['enable', 'system/com.matterbridge']);
        execFileSync('launchctl', ['bootstrap', 'system', this.#plist]);
    }

    stop(): void {
        this.#checkRoot();

        if (!this.isRunning()) {
            console.warn('Matterbridge is not running!');
            return;
        }

        console.info('Stopping Matterbridge...');
        execFileSync('launchctl', ['bootout', 'system/com.matterbridge']);
    }

    restart(): void {
        this.stop();
        this.start();
    }

    #checkRoot() {
        if (!process.getuid || process.getuid() !== 0) {
            console.error('Run as sudo or root user!');
            console.error(`sudo mb-service <command>`);
            process.exit(1);
        }
    }

    #getUserInfo(): UserInfo<string> {
        this.#checkRoot();
        if (process.env.SUDO_USER && process.env.SUDO_UID && process.env.SUDO_GID) {
            return {
                username: process.env.SUDO_USER,
                uid: Number.parseInt(process.env.SUDO_UID),
                gid: Number.parseInt(process.env.SUDO_GID),
                shell: null,
                homedir: execSync(`eval echo ~"${process.env.SUDO_USER}"`).toString().trim()
            };
        }

        return userInfo();
    }
}

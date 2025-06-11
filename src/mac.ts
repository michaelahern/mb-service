import { execFileSync, execSync } from 'node:child_process';
import { chownSync, existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { UserInfo, userInfo } from 'node:os';
import { resolve } from 'node:path';
import process from 'node:process';

import { PlatformCommands } from './platform.js';

export class MacPlatform extends PlatformCommands {
    #plist = '/Library/LaunchDaemons/com.matterbridge.plist';

    install(): void {
        this.#checkRoot();
        const userInfo = this.#getUserInfo();

        // Check if Matterbridge is installed globally
        const matterbridgePath = execSync('eval echo "$(npm prefix -g --silent)/bin/matterbridge"').toString().trim();
        if (!existsSync(matterbridgePath)) {
            console.error('Matterbridge is not installed globally!');
            console.error('npm install -g matterbridge');
            process.exit(1);
        }

        // Create Matterbridge Plugin and Storage directories
        const matterbridgePluginPath = resolve(userInfo.homedir, 'Matterbridge');
        this.#mkdirPath(matterbridgePluginPath, userInfo);

        const matterbridgeStoragePath = resolve(userInfo.homedir, '.matterbridge');
        this.#mkdirPath(matterbridgeStoragePath, userInfo);

        // Check NPM global modules path permissions and change if necessary
        const npmGlobalModulesPath = execSync('eval echo "$(npm prefix -g --silent)/lib/node_modules"').toString().trim();
        try {
            execSync(`eval test -w "${npmGlobalModulesPath}"`, {
                uid: userInfo.uid,
                gid: userInfo.gid
            });
        }
        catch {
            try {
                execSync(`chown -R ${userInfo.username}:admin "${npmGlobalModulesPath}"`);
            }
            catch {
                process.exit(1);
            }
        }

        // Create the launchd plist file
        const plistFileContents = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
            '<plist version="1.0">',
            '<dict>',
            '    <key>Label</key>',
            `    <string>com.matterbridge</string>`,
            '    <key>ProgramArguments</key>',
            '    <array>',
            `         <string>${matterbridgePath}</string>`,
            `         <string>-service</string>`,
            '    </array>',
            '    <key>KeepAlive</key>',
            '    <true/>',
            '    <key>RunAtLoad</key>',
            '    <true/>',
            '    <key>UserName</key>',
            `    <string>${userInfo.username}</string>`,
            '    <key>EnvironmentVariables</key>',
            '    <dict>',
            '        <key>HOME</key>',
            `        <string>${userInfo.homedir}</string>`,
            '        <key>PATH</key>',
            `        <string>${process.env.PATH}</string>`,
            '    </dict>',
            '    <key>StandardOutPath</key>',
            `    <string>${matterbridgeStoragePath}/matterbridge.log</string>`,
            '    <key>StandardErrorPath</key>',
            `    <string>${matterbridgeStoragePath}/matterbridge.log</string>`,
            '</dict>',
            '</plist>'
        ].filter(x => x).join('\n');

        writeFileSync(this.#plist, plistFileContents);
        console.info('Matterbridge Service Installed!');
        this.start();
        this.postinstall();
    }

    uninstall(): void {
        this.#checkRoot();
        this.stop();
        unlinkSync(this.#plist);
        console.info('Matterbridge Service Uninstalled!');
    }

    start(): void {
        this.#checkRoot();

        if (!this.#isInstalled()) {
            console.error('Matterbridge Service Not Installed!');
            console.error('sudo mb-service install');
            process.exit(1);
        }

        if (this.pid()) {
            console.warn('Matterbridge Service Already Running!');
            return;
        }

        console.info('Starting Matterbridge Service...');
        execFileSync('launchctl', ['bootstrap', 'system', this.#plist]);
    }

    stop(): void {
        this.#checkRoot();

        if (!this.#isInstalled()) {
            console.error('Matterbridge Service Not Installed!');
            console.error('sudo mb-service install');
            process.exit(1);
        }

        if (this.pid()) {
            console.info('Stopping Matterbridge Service...');
            execFileSync('launchctl', ['bootout', 'system/com.matterbridge']);
        }
    }

    pid(): string | null {
        try {
            const output = execFileSync('launchctl', ['print', 'system/com.matterbridge'], { stdio: ['pipe', 'pipe', 'pipe'] }).toString();
            const match = output.match(/pid = (\d+)/);
            if (match) {
                return match[1];
            }
            return null;
        }
        catch {
            return null;
        }
    }

    tail(): void {
        const matterbridgeStoragePath = resolve(this.#getUserInfo().homedir, '.matterbridge');
        execFileSync('tail', ['-f', '-n', '32', `${matterbridgeStoragePath}/matterbridge.log`], { stdio: 'inherit' });
    }

    #checkRoot() {
        if (!process.getuid || process.getuid() !== 0) {
            console.error('Must run as sudo!');
            console.error(`sudo mb-service ${process.argv[2]}`);
            process.exit(1);
        }
    }

    #getUserInfo(): UserInfo<string> {
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

    #isInstalled(): boolean {
        return existsSync(this.#plist);
    }

    #mkdirPath(path: string, userInfo: UserInfo<string>): void {
        mkdirSync(path, { recursive: true });
        chownSync(path, userInfo.uid, userInfo.gid);
    }
}

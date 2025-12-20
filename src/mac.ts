import { execFileSync } from 'node:child_process';
import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

import { PlatformCommands } from './platform.js';

export class MacPlatform extends PlatformCommands {
    #plist = '/Library/LaunchDaemons/com.matterbridge.plist';

    install(args: string[]): void {
        this.checkRoot();
        const matterbridgeBinPath = this.checkMatterbridgeInstalled();
        const matterbridgeStoragePath = this.mkdirMatterbridgePaths();
        const userInfo = this.getUserInfo();

        // Check NPM global modules path permissions and change if necessary
        const npmGlobalPrefix = execFileSync('npm', ['prefix', '-g', '--silent']).toString().trim();
        const npmGlobalModulesPath = resolve(npmGlobalPrefix, 'lib', 'node_modules');
        try {
            execFileSync('test', ['-w', npmGlobalModulesPath], {
                uid: userInfo.uid,
                gid: userInfo.gid
            });
        }
        catch {
            try {
                execFileSync('chown', ['-R', `${userInfo.uid}:${userInfo.gid}`, npmGlobalModulesPath]);
            }
            catch {
                console.error('User not able to write to the NPM Global Modules Path!');
                console.error(`sudo chown -R ${userInfo.uid}:${userInfo.gid} "${npmGlobalModulesPath}"`);
                process.exit(1);
            }
        }

        // Ensure '-nosudo' flag is present since sudo is unnecessary after chown
        if (!args.includes('-nosudo')) {
            args.push('-nosudo');
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
            `         <string>${matterbridgeBinPath}</string>`,
            ...args.map(arg => `         <string>${arg}</string>`),
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
        this.postinstall(args);
    }

    uninstall(): void {
        this.checkRoot();
        this.stop();

        if (existsSync(this.#plist)) {
            unlinkSync(this.#plist);
        }

        console.info('Matterbridge Service Uninstalled!');
    }

    start(): void {
        this.checkRoot();
        this.#checkServiceInstalled();

        if (this.pid()) {
            console.warn('Matterbridge Service Already Running!');
            return;
        }

        console.info('Starting Matterbridge Service...');
        execFileSync('launchctl', ['bootstrap', 'system', this.#plist]);
    }

    stop(): void {
        this.checkRoot();
        this.#checkServiceInstalled();

        if (this.pid()) {
            console.info('Stopping Matterbridge Service...');
            execFileSync('launchctl', ['bootout', 'system/com.matterbridge']);
        }
    }

    pid(): string | null {
        try {
            const output = execFileSync('launchctl', ['print', 'system/com.matterbridge'], { stdio: ['pipe', 'pipe', 'pipe'] }).toString();
            const match = output.match(/pid = (\d+)/);
            if (match && match[1]) {
                return match[1];
            }
            return null;
        }
        catch {
            return null;
        }
    }

    tail(): void {
        const matterbridgeStoragePath = resolve(this.getUserInfo().homedir, '.matterbridge');
        execFileSync('tail', ['-f', '-n', '32', `${matterbridgeStoragePath}/matterbridge.log`], { stdio: 'inherit' });
    }

    #checkServiceInstalled(): void {
        super.checkServiceInstalled(this.#plist);
    }
}

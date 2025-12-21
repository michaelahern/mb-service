import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, unlinkSync, writeFileSync } from 'node:fs';
import type { UserInfo } from 'node:os';

import { PlatformCommands } from './platform.js';

export class LinuxPlatform extends PlatformCommands {
    #systemdService = '/etc/systemd/system/matterbridge.service';

    install(args: string[]): void {
        this.checkRoot();
        this.uninstall();

        const matterbridgeBinPath = this.checkMatterbridgeInstalled();
        const matterbridgeStoragePath = this.mkdirMatterbridgePaths();
        const userInfo = this.getUserInfo();
        this.#configSudoers(userInfo);

        const systemdServiceFileContents = [
            '[Unit]',
            'Description=matterbridge',
            'After=network-online.target',
            '',
            '[Service]',
            'Type=simple',
            `ExecStart=${matterbridgeBinPath} ${args.join(' ')}`,
            `WorkingDirectory=${matterbridgeStoragePath}`,
            'StandardOutput=inherit',
            'StandardError=inherit',
            'Restart=always',
            `User=${userInfo.username}`,
            `Group=${userInfo.username}`,
            'AmbientCapabilities=CAP_NET_BIND_SERVICE CAP_NET_RAW',
            '',
            '[Install]',
            'WantedBy=multi-user.target'
        ].filter(x => x).join('\n');

        writeFileSync(this.#systemdService, systemdServiceFileContents);
        console.info('Matterbridge Service Installed!');

        execFileSync('systemctl', ['daemon-reload']);
        execFileSync('systemctl', ['enable', 'matterbridge']);

        this.start();
        this.postinstall(args);
    }

    uninstall(): void {
        this.checkRoot();
        this.stop();

        if (existsSync(this.#systemdService)) {
            unlinkSync(this.#systemdService);
        }

        execFileSync('systemctl', ['daemon-reload']);

        console.info('Matterbridge Service Uninstalled!');
    }

    start(): void {
        this.checkRoot();
        this.#checkServiceInstalled();

        console.info('Starting Matterbridge Service...');
        execFileSync('systemctl', ['start', 'matterbridge']);
    }

    stop(): void {
        this.checkRoot();
        this.#checkServiceInstalled();

        console.info('Stopping Matterbridge Service...');
        execFileSync('systemctl', ['stop', 'matterbridge']);
    }

    pid(): string | null {
        try {
            const output = execFileSync('systemctl', ['show', '--property', 'MainPID', '--value', 'matterbridge'], { stdio: ['pipe', 'pipe', 'pipe'] }).toString();
            const match = output.match(/(\d+)/);
            if (match && match[1] && match[1] !== '0') {
                return match[1];
            }
            return null;
        }
        catch {
            return null;
        }
    }

    tail(): void {
        execFileSync('journalctl', ['-u', 'matterbridge', '-n', '32', '-f', '--output', 'cat'], { stdio: 'inherit' });
    }

    #checkServiceInstalled(): void {
        super.checkServiceInstalled(this.#systemdService);
    }

    #configSudoers(userInfo: UserInfo<string>) {
        const npmPath = execFileSync('which', ['npm']).toString().trim();
        const sudoersPath = '/etc/sudoers.d/matterbridge';
        const sudoersEntry = `${userInfo.username} ALL=(ALL) NOPASSWD: ${npmPath}\n`;
        writeFileSync(sudoersPath, sudoersEntry);
        chmodSync(sudoersPath, 0o440);
        execFileSync('visudo', ['-c']);
    }
}

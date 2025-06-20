import { execFileSync, execSync } from 'node:child_process';
import { chownSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { UserInfo } from 'node:os';
import { resolve } from 'node:path';
import { PlatformCommands } from './platform.js';

export class LinuxPlatform extends PlatformCommands {
    #systemdService = '/etc/systemd/system/matterbridge.service';

    install(args: string[]): void {
        this.checkRoot();
        const matterbridgePath = this.checkMatterbridgeInstalled();
        const userInfo = this.getUserInfo();

        // Create Matterbridge Plugin and Storage directories
        const matterbridgePluginPath = resolve(userInfo.homedir, 'Matterbridge');
        this.#mkdirPath(matterbridgePluginPath, userInfo);

        const matterbridgeStoragePath = resolve(userInfo.homedir, '.matterbridge');
        this.#mkdirPath(matterbridgeStoragePath, userInfo);

        this.#configSudoers(userInfo);

        const systemdServiceFileContents = [
            '[Unit]',
            'Description=matterbridge',
            'After=network-online.target',
            '',
            '[Service]',
            'Type=simple',
            `ExecStart=${matterbridgePath} ${args.join(' ')}`,
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
            if (match && match[1] !== '0') {
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
        this.checkServiceInstalled(this.#systemdService);
    }

    #mkdirPath(path: string, userInfo: UserInfo<string>): void {
        mkdirSync(path, { recursive: true });
        chownSync(path, userInfo.uid, userInfo.gid);
    }

    #configSudoers(userInfo: UserInfo<string>) {
        try {
            const npmPath = execFileSync('which', ['npm']).toString().trim();
            const sudoersEntry = `${userInfo.username}    ALL=(ALL) NOPASSWD:SETENV: ${npmPath}, /usr/bin/npm, /usr/local/bin/npm`;

            const sudoers = readFileSync('/etc/sudoers', 'utf-8');
            if (sudoers.includes(sudoersEntry)) {
                return;
            }

            execSync(`echo '${sudoersEntry}' | sudo EDITOR='tee -a' visudo`);
        }
        catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Failed to update /etc/sudoers:', error.message);
            }
        }
    }
}

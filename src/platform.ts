import { execFileSync, execSync } from 'node:child_process';
import { chownSync, existsSync, mkdirSync } from 'node:fs';
import { type UserInfo, networkInterfaces, userInfo } from 'node:os';
import { resolve } from 'node:path';

export abstract class PlatformCommands {
    abstract install(args: string[]): void;
    abstract uninstall(): void;
    abstract start(): void;
    abstract stop(): void;
    abstract pid(): string | null;
    abstract tail(): void;

    postinstall(args: string[]) {
        let port = '8283';
        if (args.includes('-frontend')) {
            const portIndex = args.indexOf('-frontend') + 1;
            if (args[portIndex]) {
                port = args[portIndex];
            }
        }

        console.log();
        console.log('Manage Matterbridge in your browser at:');
        console.log(` * http://localhost:${port}`);

        for (const [, interfaceDetails] of Object.entries(networkInterfaces())) {
            if (!interfaceDetails) {
                continue;
            }

            const ipv4Address = interfaceDetails.find(i => i.family === 'IPv4' && !i.internal)?.address;
            const ipv6Address = interfaceDetails.find(i => i.family === 'IPv6' && !i.internal && (i.scopeid === undefined || i.scopeid === 0))?.address;

            if (ipv4Address || ipv6Address) {
                if (ipv4Address) {
                    console.log(` * http://${ipv4Address}:${port}`);
                }
                if (ipv6Address) {
                    console.log(` * http://[${ipv6Address}]:${port}`);
                }
                break;
            }
        }
    }

    protected checkRoot() {
        if (!process.getuid || process.getuid() !== 0) {
            console.error('Must run as sudo!');
            console.error(`sudo mb-service ${process.argv[2]}`);
            process.exit(1);
        }
    }

    protected checkMatterbridgeInstalled(): string {
        const npmGlobalPrefix = execFileSync('npm', ['prefix', '-g', '--silent']).toString().trim();
        const matterbridgePath = resolve(npmGlobalPrefix, 'bin', 'matterbridge');

        if (!existsSync(matterbridgePath)) {
            console.error('Matterbridge Not Installed!');
            console.error('npm install -g matterbridge');
            process.exit(1);
        }

        return matterbridgePath;
    }

    protected checkServiceInstalled(path: string): void {
        if (!existsSync(path)) {
            console.error('Matterbridge Service Not Installed!');
            console.error('sudo mb-service install');
            process.exit(1);
        }
    }

    protected getUserInfo(): UserInfo<string> {
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

    protected mkdirMatterbridgePaths(): string {
        const userInfo = this.getUserInfo();

        const matterbridgePluginPath = resolve(userInfo.homedir, 'Matterbridge');
        mkdirSync(matterbridgePluginPath, { recursive: true });
        chownSync(matterbridgePluginPath, userInfo.uid, userInfo.gid);

        const matterbridgeStoragePath = resolve(userInfo.homedir, '.matterbridge');
        mkdirSync(matterbridgeStoragePath, { recursive: true });
        chownSync(matterbridgeStoragePath, userInfo.uid, userInfo.gid);

        return matterbridgeStoragePath;
    }
}

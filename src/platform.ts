import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { resolve } from 'node:path';

export abstract class PlatformCommands {
    abstract install(): void;
    abstract uninstall(): void;
    abstract start(): void;
    abstract stop(): void;
    abstract pid(): string | null;
    abstract tail(): void;

    postinstall() {
        console.log();
        console.log('Manage Matterbridge in your browser at:');
        console.log(` * http://localhost:8283`);

        for (const [, interfaceDetails] of Object.entries(networkInterfaces())) {
            if (!interfaceDetails) {
                continue;
            }

            const ipv4Address = interfaceDetails.find(i => i.family === 'IPv4' && !i.internal)?.address;
            const ipv6Address = interfaceDetails.find(i => i.family === 'IPv6' && !i.internal && (i.scopeid === undefined || i.scopeid === 0))?.address;

            if (ipv4Address || ipv6Address) {
                if (ipv4Address) {
                    console.log(` * http://${ipv4Address}:8283`);
                }
                if (ipv6Address) {
                    console.log(` * http://[${ipv6Address}]:8283`);
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
            console.error('Matterbridge is not installed globally!');
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
}

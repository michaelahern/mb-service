import { networkInterfaces } from 'node:os';

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
            const ipv6Address = interfaceDetails.find(i => i.family === 'IPv6' && !i.internal)?.address;

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
}

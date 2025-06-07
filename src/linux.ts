import { PlatformCommands } from './platform.js';

export class LinuxPlatform extends PlatformCommands {
    install(): void {
        process.exit(2);
    }

    uninstall(): void {
        process.exit(2);
    }

    start(): void {
        process.exit(2);
    }

    stop(): void {
        process.exit(2);
    }

    pid(): string | null {
        return null;
    }

    tail(): void {
        process.exit(2);
    }
}

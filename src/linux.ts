import { PlatformCommands } from './platform.js';

export class LinuxPlatform extends PlatformCommands {
    install(): void {
        console.error('Platform not implemented yet.');
        process.exit(1);
    }

    uninstall(): void {
        console.error('Platform not implemented yet.');
        process.exit(1);
    }

    start(): void {
        console.error('Platform not implemented yet.');
        process.exit(1);
    }

    stop(): void {
        console.error('Platform not implemented yet.');
        process.exit(1);
    }

    restart(): void {
        console.error('Platform not implemented yet.');
        process.exit(1);
    }

    pid(): string | null {
        return null;
    }

    tail(): void {
        console.error('Platform not implemented yet.');
        process.exit(1);
    }
}

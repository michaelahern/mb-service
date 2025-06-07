export abstract class PlatformCommands {
    abstract install(): void;
    abstract uninstall(): void;
    abstract isRunning(): boolean;
    abstract start(): void;
    abstract stop(): void;
    abstract restart(): void;
}

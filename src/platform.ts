export abstract class PlatformCommands {
    abstract install(): void;
    abstract uninstall(): void;
    abstract start(): void;
    abstract stop(): void;
    abstract restart(): void;
    abstract pid(): string | null;
    abstract tail(): void;
}

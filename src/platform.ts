export abstract class Platform {
    abstract install(): void;
    abstract uninstall(): void;
    abstract start(): void;
    abstract stop(): void;
    abstract restart(): void;
}

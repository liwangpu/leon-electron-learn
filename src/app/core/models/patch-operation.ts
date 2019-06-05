export class PatchOperation {
    op: "add" | "remove" | "replace" | "move" | "copy" | "test";
    path: string;
    value?: string;
    from?: string;
}

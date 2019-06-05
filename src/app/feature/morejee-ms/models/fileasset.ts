import { PatchOperation } from "@app/core";

export class Fileasset {
    id: string;
    name: string;
    description: string;
    fileExt: string;
    size: number;

    static GenPatchDoc(entity: Fileasset): PatchOperation[] {
        return [
            {
                "op": "replace",
                "path": "/name",
                "value": entity.name
            },
            {
                "op": "replace",
                "path": "/description",
                "value": entity.description
            }
        ];
    }//GenPatchDoc
}

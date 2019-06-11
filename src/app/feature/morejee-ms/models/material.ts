export class Material {
    id: string;
    name: string;
    packageName: string;
    unCookedAssetId: string;
    cookedAssetId: string;
    sourceAssetId?: string;
    icon?: string;
    dependencies?: string;
    properties?: string;
}

import { AssetData, MetroConfig, MixedOutput, Module, ReadOnlyGraph, SerializerOptions } from 'metro';
import { ConfigT } from 'metro-config';
import { SerialAsset } from './serializerAssets';
type RscClientReference = {
    /**
     * ??
     * `"/dist/_expo/chunk/client/index.js"`
     */
    id: string;
    /**
     * Name of chunk location on server, e.g. `"/dist/_expo/chunk/client/index.js"`
     * In development, we'll use a metro lazy chunk id, e.g. `/client/client/index.bundle?platform=web`
     */
    chunks: string[];
    /** Name of export, e.g. `"default"` */
    name: string;
};
/**
 * Key is `<id>#<name>`
 * {
 *   "/components/timer.tsx#default": {
 *     id: "/components/timer.js",
 *     chunks: [ "/components/timer.js" ],
 *     name: "default"
 *   }
 * }
 */
type RscManifest = Record<string, RscClientReference>;
type Serializer = NonNullable<ConfigT['serializer']['customSerializer']>;
type SerializerParameters = Parameters<Serializer>;
export type SerializeChunkOptions = {
    includeSourceMaps: boolean;
    includeBytecode: boolean;
};
/** Strips the process.env polyfill in server environments to allow for accessing environment variables off the global. */
export declare function clientManifestSerializerPlugin(entryPoint: string, preModules: readonly Module<MixedOutput>[], graph: ReadOnlyGraph, options: SerializerOptions): SerializerParameters;
export declare function graphToSerialAssetsAsync(config: MetroConfig, serializeChunkOptions: SerializeChunkOptions, ...props: SerializerParameters): Promise<{
    artifacts: SerialAsset[] | null;
    rscManifest: RscManifest;
    assets: AssetData[];
}>;
export {};

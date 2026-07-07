import type { EntityFieldLi } from "../../generated/wasm/haste_inspector_wasm";

export type EntityFieldRow = {
  inner: Pick<EntityFieldLi, "decodedAs" | "encodedAs" | "namedPath" | "path" | "value">;
  joinedPath: string;
  joinedNamedPath: string;
  depth: number;
  expandableKind?: "array" | "vector" | "vectorItem";
  collectionLength?: number;
};

export type EntityFieldGroup = {
  key: string;
  path: Uint16Array;
  namedPath: string[];
  kind: "array" | "vector" | "vectorItem";
  length: number;
  encodedAs: string;
};

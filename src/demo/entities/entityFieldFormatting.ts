import type { EntityFieldLi } from "../../generated/wasm/haste_inspector_wasm";

export function formatFieldPath(path: Uint8Array) {
  return Array.from(path)
    .map((part) => part.toString().padStart(4, " "))
    .join("");
}

export function compareFieldPaths(a: Pick<EntityFieldLi, "path">, b: Pick<EntityFieldLi, "path">) {
  for (let i = 0; i < Math.min(a.path.length, b.path.length); i++) {
    if (a.path[i] !== b.path[i]) {
      return a.path[i] - b.path[i];
    }
  }

  return a.path.length - b.path.length;
}

import type { WrappedParser } from "../generated/wasm/haste_inspector_wasm";
import { atom } from "jotai";
export const demFileAtom = atom<File | undefined>(undefined);
export const demParserAtom = atom<WrappedParser | undefined>(undefined);
export const demTickAtom = atom(0);
export const demSelectedEntityIndexAtom = atom<number | undefined>(undefined);
export const demViewAtom = atom<"entities" | "baselineEntities" | "stringTables">("entities");
export const demSelectedStringTableNameAtom = atom<string | undefined>(undefined);

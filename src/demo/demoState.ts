import type { WrappedParser } from "../generated/wasm/haste_inspector_wasm";
import { atom } from "jotai";

export const demFileAtom = atom<File | undefined>(undefined);
export const demParserAtom = atom<WrappedParser | undefined>(undefined);
export const demTickAtom = atom(0);
export const demSelectedEntityIndexAtom = atom<number | undefined>(undefined);
export const demViewAtom = atom<"entities" | "baselineEntities" | "stringTables" | "gameEvents">(
  "entities",
);
export const demSelectedStringTableNameAtom = atom<string | undefined>(undefined);
export const demSelectedGameEventIdAtom = atom<number | undefined>(undefined);

export const demSetFileAtom = atom(null, (_get, set, file: File | undefined) => {
  set(demFileAtom, file);
  set(demParserAtom, undefined);
  set(demTickAtom, 0);
  set(demSelectedEntityIndexAtom, undefined);
  set(demSelectedStringTableNameAtom, undefined);
  set(demSelectedGameEventIdAtom, undefined);
});

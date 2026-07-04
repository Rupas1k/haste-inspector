import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// https://jotai.org/docs/recipes/atom-with-toggle-and-storage
function atomWithToggleAndStorage(key: string, initialValue?: boolean, storage?: any) {
  const anAtom = atomWithStorage(key, initialValue, storage);
  const derivedAtom = atom(
    (get) => get(anAtom),
    (get, set, nextValue?: boolean) => {
      const update = nextValue ?? !get(anAtom);
      void set(anAtom, update);
    },
  );
  return derivedAtom;
}

export const darkModeAtom = atomWithToggleAndStorage("darkMode", true);
export const fullWidthAtom = atomWithToggleAndStorage("fullWidth", false);

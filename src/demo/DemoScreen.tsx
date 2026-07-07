import initHaste, { WrappedParser } from "../generated/wasm/haste_inspector_wasm";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import EntitiesPanel from "./entities/EntitiesPanel";
import DemoLayout from "./DemoLayout";
import GameEventsPanel from "./gameEvents/GameEventsPanel";
import StringTablesPanel from "./stringTables/StringTablesPanel";
import { demFileAtom, demParserAtom, demTickAtom, demViewAtom } from "./demoState";
import { Tooltip } from "../shared/components/Tooltip";
import { assetPath } from "../shared/utils/assetPath";

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));
const FIRST_TICK = 0;

function readFileToBytes(file: File) {
  return new Promise<Uint8Array>((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      if (fileReader.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(fileReader.result));
      } else {
        reject(new Error("invalid result"));
      }
    };
    fileReader.onerror = () => {
      reject(fileReader.error ?? new Error("failed to read file"));
    };
    fileReader.readAsArrayBuffer(file);
  });
}

export default function DemoScreen() {
  const [demFile] = useAtom(demFileAtom);
  const [demParser, setDemParser] = useAtom(demParserAtom);
  const [demView] = useAtom(demViewAtom);
  const [, setDemTick] = useAtom(demTickAtom);

  const [doingWhat, setDoingWhat] = useState("zzz");
  const [initError, setInitError] = useState<unknown>();
  useEffect(() => {
    let cancelled = false;

    const asyncFn = async () => {
      try {
        setInitError(undefined);

        setDoingWhat("initializing web assembly");
        await initHaste();
        if (cancelled) {
          return;
        }

        setDoingWhat("loading file into memory");
        const fileBytes = await readFileToBytes(demFile!);
        if (cancelled) {
          return;
        }

        setDoingWhat("constructing parser");
        const parser = new WrappedParser(fileBytes);
        if (cancelled) {
          return;
        }

        setDoingWhat("seeking to first tick");
        parser.runToTick(FIRST_TICK);
        if (cancelled) {
          return;
        }

        setDemParser(parser);
        setDemTick(parser.tick());
      } catch (error) {
        if (cancelled) {
          return;
        }
        setInitError(error);
      }
    };
    void asyncFn();

    return () => {
      cancelled = true;
    };
  }, [demFile, setDemParser, setDemTick]);

  if (!demParser) {
    if (initError) {
      return (
        <div className="p-2 flex items-baseline">
          <Tooltip content="monkaW">
            <img src={assetPath("monkaW.webp")} className="h-[1em] mr-[1ch]" />
          </Tooltip>
          <span className="text-red-500">{errorMessage(initError)}</span>
        </div>
      );
    }
    return (
      <div className="p-2 flex items-baseline">
        <Tooltip content="borpaSpin">
          <img src={assetPath("borpaSpin.webp")} className="h-[1em] mr-[1ch]" />
        </Tooltip>
        <span className="text-neutral-400">{`${doingWhat}…`}</span>
      </div>
    );
  }

  return (
    <DemoLayout>
      {(demView === "entities" || demView === "baselineEntities") && <EntitiesPanel />}
      {demView === "stringTables" && <StringTablesPanel />}
      {demView === "gameEvents" && <GameEventsPanel />}
    </DemoLayout>
  );
}

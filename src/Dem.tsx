import initHaste, { WrappedParser } from "./wasm-pkg/haste_inspector_wasm";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import DemEntities from "./DemEntities";
import DemLayout from "./DemLayout";
import DemStringTables from "./DemStringTables";
import { demFileAtom, demParserAtom, demTickAtom, demViewAtom } from "./atoms";
import { Tooltip } from "./lib/Tooltip";
import { assetPath } from "./lib/assetPath";

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

export default function Dem() {
  const [demFile] = useAtom(demFileAtom);
  const [demParser, setDemParser] = useAtom(demParserAtom);
  const [demView] = useAtom(demViewAtom);
  const [, setDemTick] = useAtom(demTickAtom);

  const [doingWhat, setDoingWhat] = useState("zzz");
  const [initError, setInitError] = useState<unknown>();
  useEffect(() => {
    const asyncFn = async () => {
      try {
        setDoingWhat("initializing web assembly");
        await initHaste();

        setDoingWhat("loading file into memory");
        const fileBytes = await readFileToBytes(demFile!);

        setDoingWhat("constructing parser");
        const parser = new WrappedParser(fileBytes);

        setDoingWhat("seeking to first tick");
        parser.runToTick(FIRST_TICK);

        setDemParser(parser);
        setDemTick(parser.tick());
      } catch (error) {
        setInitError(error);
      }
    };
    void asyncFn();
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
    <DemLayout>
      {(demView === "entities" || demView === "baselineEntities") && <DemEntities />}
      {demView === "stringTables" && <DemStringTables />}
    </DemLayout>
  );
}

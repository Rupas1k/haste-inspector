import { useAtom } from "jotai";
import { FileDigitIcon, HandMetalIcon, KeyboardIcon, MousePointerClickIcon } from "lucide-react";
import React from "react";
import { useDropzone } from "react-dropzone";
import { demSetFileAtom } from "../demo/demoState";
import { isCtrlOrCmdActive } from "../shared/utils/keyboard";
import { isMac } from "../shared/utils/platform";
import { cn } from "../shared/utils/style";

export default function WelcomeScreen() {
  const [, setDemFile] = useAtom(demSetFileAtom);

  const { open, getRootProps, getInputProps, isDragAccept, isDragReject } = useDropzone({
    multiple: false,
    accept: {
      "": [".dem"],
    },
    onDropAccepted: ([file]) => {
      setDemFile(file);
    },
  });

  React.useEffect(() => {
    const handleKeydown = (ev: KeyboardEvent) => {
      if (isCtrlOrCmdActive(ev) && ev.key === "o") {
        ev.preventDefault();
        open();
      }
    };
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [open]);

  return (
    <main
      {...getRootProps({
        className: cn(
          "grow flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-500/10 transition-colors",
          isDragAccept && "bg-green-900/10",
          isDragReject && "bg-red-900/10",
        ),
      })}
    >
      <input {...getInputProps()} />
      <p>
        <HandMetalIcon className="inline size-[1em]" /> drag and drop your replay (.dem){" "}
        <FileDigitIcon className="inline size-[1em]" /> file here
      </p>
      <p className="text-neutral-400">
        <small>
          press <KeyboardIcon className="inline size-[1em]" /> {isMac() ? "cmd" : "ctrl"} + o or{" "}
          <MousePointerClickIcon className="inline size-[1em]" /> click to browse
        </small>
      </p>
    </main>
  );
}

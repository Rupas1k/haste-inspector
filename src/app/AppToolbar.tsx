import { useAtom } from "jotai";
import {
  ChevronDownIcon,
  GitForkIcon,
  Maximize2Icon,
  Minimize2Icon,
  MoonIcon,
  SlashIcon,
  SunIcon,
  XIcon,
} from "lucide-react";
import { useLayoutEffect, useState } from "react";
import type { SVGProps } from "react";
import { darkModeAtom, fullWidthAtom } from "./appState";
import { demFileAtom, demSetFileAtom, demViewAtom } from "../demo/demoState";
import { Button } from "../shared/components/Button";
import * as DropdownMenu from "../shared/components/DropdownMenu";
import { Tooltip } from "../shared/components/Tooltip";
import { assetPath } from "../shared/utils/assetPath";
import { cn } from "../shared/utils/style";

function GithubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.014-1.7-2.782.604-3.369-1.34-3.369-1.34-.455-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.071 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.091-.646.349-1.087.635-1.337-2.221-.253-4.555-1.111-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.269.098-2.644 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.748-1.025 2.748-1.025.545 1.375.202 2.391.1 2.644.64.699 1.028 1.592 1.028 2.683 0 3.842-2.337 4.687-4.566 4.935.359.309.679.92.679 1.855 0 1.338-.012 2.419-.012 2.748 0 .267.18.578.688.48A10.002 10.002 0 0 0 22 12c0-5.523-4.477-10-10-10Z" />
    </svg>
  );
}

function IconSection() {
  return (
    <div className="flex items-center">
      <div className="flex items-center justify-center size-8 -ml-1 group relative">
        <img src={assetPath("haste.png")} className="size-4 absolute group-hover:invisible" />
        <img
          src={assetPath("peepoRun.webp")}
          className="size-4 absolute invisible group-hover:visible"
        />
      </div>

      {/* todo: entities view */}
      {/* todo: string tables view */}
    </div>
  );
}

function DemViewSelection() {
  const [demView, setDemView] = useAtom(demViewAtom);
  const [demViewOpen, setDemViewOpen] = useState(false);

  return (
    <DropdownMenu.Root open={demViewOpen} onOpenChange={setDemViewOpen}>
      <DropdownMenu.Trigger asChild>
        <Button size="small" className={cn("px-2", demViewOpen && "bg-neutral-500/30")}>
          {demView === "entities" && "entities"}
          {demView === "baselineEntities" && "baseline entities"}
          {demView === "stringTables" && "string tables"}
          {demView === "gameEvents" && "game events"}
          <ChevronDownIcon className={cn("size-3 stroke-fg-subtle ml-2")} />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          // NOTE: following classes are stolen from tooltip
          className="bg-white dark:bg-black rounded z-10"
        >
          <DropdownMenu.CheckboxItem
            checked={demView === "entities"}
            onCheckedChange={() => setDemView("entities")}
          >
            entities
          </DropdownMenu.CheckboxItem>
          <DropdownMenu.CheckboxItem
            checked={demView === "baselineEntities"}
            onCheckedChange={() => setDemView("baselineEntities")}
          >
            baseline entities
          </DropdownMenu.CheckboxItem>
          <DropdownMenu.CheckboxItem
            checked={demView === "stringTables"}
            onCheckedChange={() => setDemView("stringTables")}
          >
            string tables
          </DropdownMenu.CheckboxItem>
          <DropdownMenu.CheckboxItem
            checked={demView === "gameEvents"}
            onCheckedChange={() => setDemView("gameEvents")}
          >
            game events
          </DropdownMenu.CheckboxItem>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function DemFileSection() {
  const [demFile] = useAtom(demFileAtom);
  const [, setDemFile] = useAtom(demSetFileAtom);

  // TODO: get rid of x button and store file history -> allow to switch between
  // files that were open.

  return (
    <div className="flex items-center gap-x-1 border-l border-l-divider pl-2">
      {demFile && (
        <>
          <div className="flex items-center gap-x-1">
            <span>{demFile.name}</span>
            <Button size="small" onClick={() => setDemFile(undefined)}>
              <XIcon className="size-3 stroke-fg-subtle" />
            </Button>
          </div>
          <SlashIcon className="size-3 text-divider" />
          <DemViewSelection />
        </>
      )}
    </div>
  );
}

function UiSection() {
  const [darkMode, toggleDarkMode] = useAtom(darkModeAtom);
  useLayoutEffect(() => {
    const classNameInverse = darkMode ? "light" : "dark";
    document.documentElement.classList.remove(classNameInverse);
    const className = darkMode ? "dark" : "light";
    document.documentElement.classList.add(className);
  }, [darkMode]);

  const [fullWidth, toggleFullWidth] = useAtom(fullWidthAtom);

  return (
    <div className="flex items-center justify-end gap-x-1">
      <Tooltip content="source code">
        <Button size="small" asChild>
          <a
            href="https://github.com/blukai/haste-inspector"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GithubIcon className="size-4" />
          </a>
        </Button>
      </Tooltip>
      <Tooltip content="fork on GitHub">
        <Button size="small" asChild>
          <a
            href="https://github.com/Rupas1k/haste-inspector"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitForkIcon className="size-4" />
          </a>
        </Button>
      </Tooltip>
      <div className="w-px h-4 bg-divider" />
      <Tooltip content={darkMode ? "light mode" : "dark mode"}>
        <Button size="small" onClick={() => toggleDarkMode()}>
          {darkMode ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
        </Button>
      </Tooltip>
      <Tooltip
        content={
          fullWidth ? (
            "narrow mode"
          ) : (
            <div className="flex items-baseline">
              wide mode
              <img src={assetPath("widepeepoHappy.webp")} className="h-[1em] ml-[1ch]" />
            </div>
          )
        }
      >
        <Button size="small" onClick={() => toggleFullWidth()}>
          {fullWidth ? (
            <Minimize2Icon className="size-4 rotate-45" />
          ) : (
            <Maximize2Icon className="size-4 rotate-45" />
          )}
        </Button>
      </Tooltip>
    </div>
  );
}

export default function AppToolbar() {
  return (
    <div className="shrink-0 grid grid-cols-[auto_1fr_auto] px-1 h-8">
      <IconSection />
      <DemFileSection />
      <UiSection />
    </div>
  );
}

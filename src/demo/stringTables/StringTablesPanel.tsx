import { useVirtualizer } from "@tanstack/react-virtual";
import { useAtom } from "jotai";
import { useCallback, useMemo, useRef } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { demParserAtom, demSelectedStringTableNameAtom, demTickAtom } from "../demoState";
import { ScrollArea } from "../../shared/components/ScrollArea";
import { cn } from "../../shared/utils/style";

// TODO: deduplicate (same const exists in EntitiesPanel.tsx)
const LI_HEIGHT = 26;

function byteToHex(byte: number): string {
  // https://stackoverflow.com/a/39225475
  return `0${byte.toString(16)}`.slice(-2);
}

function StringTableList() {
  const [demParser] = useAtom(demParserAtom);
  const [demTick] = useAtom(demTickAtom);
  const stringTableList = useMemo(() => {
    void demTick;

    return demParser?.listStringTables();
  }, [demParser, demTick]);

  const viewportRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: stringTableList?.length ?? 0,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => LI_HEIGHT,
  });

  const [demSelectedStringTableName, setDemSelectedStringTableName] = useAtom(
    demSelectedStringTableNameAtom,
  );
  const handleClick = useCallback(
    (ev: React.MouseEvent<HTMLLIElement>) => {
      const stringTableName = ev.currentTarget.dataset.stname!;
      setDemSelectedStringTableName((prevStringTableName) =>
        prevStringTableName === stringTableName ? undefined : stringTableName,
      );
    },
    [setDemSelectedStringTableName],
  );

  const handleKeyDown = useCallback(
    (ev: React.KeyboardEvent<HTMLDivElement>) => {
      if (ev.key !== "ArrowDown" && ev.key !== "ArrowUp") {
        return;
      }

      ev.preventDefault();

      if (!stringTableList?.length) {
        return;
      }

      const selectedIndex = stringTableList.findIndex(
        (stringTable) => stringTable.name === demSelectedStringTableName,
      );
      const fallbackIndex = ev.key === "ArrowDown" ? 0 : stringTableList.length - 1;
      const nextIndex =
        selectedIndex === -1
          ? fallbackIndex
          : Math.min(
              Math.max(selectedIndex + (ev.key === "ArrowDown" ? 1 : -1), 0),
              stringTableList.length - 1,
            );

      setDemSelectedStringTableName(stringTableList[nextIndex].name);
      virtualizer.scrollToIndex(nextIndex, { align: "auto" });
    },
    [demSelectedStringTableName, setDemSelectedStringTableName, stringTableList, virtualizer],
  );

  return (
    <div
      className="w-full h-full flex flex-col outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {!stringTableList?.length && (
        <p className="m-2 text-fg-subtle">no string tables, try moving the slider</p>
      )}
      <ScrollArea className="w-full grow" viewportRef={viewportRef}>
        <ul className="w-full h-full relative" style={{ height: virtualizer.getTotalSize() }}>
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const stringTable = stringTableList![virtualItem.index];
            const stringTableSelected = demSelectedStringTableName === stringTable.name;
            return (
              // TODO: create list item conponent or something (deduplicate)
              <li
                key={virtualItem.key}
                className={cn(
                  "haste-li haste-li__virtual haste-li__selectable flex items-center",
                  stringTableSelected && "haste-li__selected",
                )}
                style={{
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                data-stname={stringTable.name}
                onClick={handleClick}
              >
                <span className="text-ellipsis overflow-hidden whitespace-nowrap">
                  {stringTable.name}
                </span>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </div>
  );
}

function StringTableItemList() {
  const [demParser] = useAtom(demParserAtom);
  const [demSelectedStringTableName] = useAtom(demSelectedStringTableNameAtom);
  const [demTick] = useAtom(demTickAtom);

  const stringTableItemList = useMemo(() => {
    void demTick;

    if (demSelectedStringTableName === undefined) {
      return undefined;
    }

    const textDecoder = new TextDecoder();
    return demParser?.listStringTableItems(demSelectedStringTableName)?.map((stringTableItem) => {
      const decodedString = stringTableItem.string
        ? textDecoder.decode(stringTableItem.string)
        : null;
      const decodedUserData = stringTableItem.userData
        ? Array.from(stringTableItem.userData).map(byteToHex).join(" ")
        : null;
      return {
        decodedString,
        decodedUserData,
        inner: stringTableItem,
      };
    });
  }, [demParser, demSelectedStringTableName, demTick]);

  const viewportRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: stringTableItemList?.length ?? 0,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => LI_HEIGHT,
  });

  return (
    <div className="w-full h-full flex flex-col">
      {demSelectedStringTableName === undefined && (
        <p className="m-2 text-fg-subtle">
          to view table items, select a table from the list of tables
        </p>
      )}
      {demSelectedStringTableName !== undefined && !stringTableItemList?.length && (
        <p className="m-2 text-fg-subtle">
          {demSelectedStringTableName} string table appears to be empty
        </p>
      )}
      <ScrollArea className="w-full grow" viewportRef={viewportRef}>
        <ul className="w-full h-full relative" style={{ height: virtualizer.getTotalSize() }}>
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const stringTableItem = stringTableItemList![virtualItem.index];

            return (
              <li
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                className={cn("haste-li haste-li__virtual flex flex-col py-1")}
                style={{
                  minHeight: `${LI_HEIGHT}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <span>
                  {stringTableItem.decodedString || <span className="opacity-40">{"<empty>"}</span>}
                </span>
                {stringTableItem.decodedUserData && (
                  <span className="opacity-60">{stringTableItem.decodedUserData}</span>
                )}
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </div>
  );
}

export default function StringTablesPanel() {
  return (
    <div className="grow h-0">
      <PanelGroup direction="horizontal">
        <Panel minSize={24} defaultSize={24}>
          <StringTableList />
        </Panel>
        <PanelResizeHandle className="haste-panel-resize-handle" />
        <Panel minSize={24}>
          <StringTableItemList />
        </Panel>
      </PanelGroup>
    </div>
  );
}

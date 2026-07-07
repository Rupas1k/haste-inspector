import { useVirtualizer } from "@tanstack/react-virtual";
import { useAtom } from "jotai";
import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import type { GameEventLi } from "../../generated/wasm/haste_inspector_wasm";
import FilterBar, { type UpdateEventHandler } from "../../shared/components/FilterBar";
import { ScrollArea } from "../../shared/components/ScrollArea";
import { cn } from "../../shared/utils/style";
import { demParserAtom, demSelectedGameEventIdAtom, demTickAtom } from "../demoState";

const LI_HEIGHT = 26;

function GameEventList() {
  const [demParser] = useAtom(demParserAtom);
  const [demTick] = useAtom(demTickAtom);
  const gameEventList = useMemo(() => {
    void demTick;

    return demParser?.listGameEvents();
  }, [demParser, demTick]);

  const [, startTransition] = useTransition();
  const [filteredGameEventList, setFilteredGameEventList] = useState(gameEventList);
  const handleFilterUpdate: UpdateEventHandler<GameEventLi> = useCallback(
    (entries, searchCmpFn) => {
      startTransition(() => {
        if (searchCmpFn) {
          setFilteredGameEventList(
            entries?.filter((entry) => searchCmpFn(entry.name) || searchCmpFn(String(entry.id))),
          );
        } else {
          setFilteredGameEventList(entries);
        }
      });
    },
    [],
  );

  const viewportRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: filteredGameEventList?.length ?? 0,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => LI_HEIGHT,
  });

  const [demSelectedGameEventId, setDemSelectedGameEventId] = useAtom(demSelectedGameEventIdAtom);
  const handleClick = useCallback(
    (ev: React.MouseEvent<HTMLLIElement>) => {
      const gameEventId = +ev.currentTarget.dataset.geid!;
      setDemSelectedGameEventId((prevGameEventId) =>
        prevGameEventId === gameEventId ? undefined : gameEventId,
      );
    },
    [setDemSelectedGameEventId],
  );

  const handleKeyDown = useCallback(
    (ev: React.KeyboardEvent<HTMLDivElement>) => {
      if (ev.key !== "ArrowDown" && ev.key !== "ArrowUp") {
        return;
      }

      ev.preventDefault();

      if (!filteredGameEventList?.length) {
        return;
      }

      const selectedIndex = filteredGameEventList.findIndex(
        (gameEvent) => gameEvent.id === demSelectedGameEventId,
      );
      const fallbackIndex = ev.key === "ArrowDown" ? 0 : filteredGameEventList.length - 1;
      const nextIndex =
        selectedIndex === -1
          ? fallbackIndex
          : Math.min(
              Math.max(selectedIndex + (ev.key === "ArrowDown" ? 1 : -1), 0),
              filteredGameEventList.length - 1,
            );

      setDemSelectedGameEventId(filteredGameEventList[nextIndex].id);
      virtualizer.scrollToIndex(nextIndex, { align: "auto" });
    },
    [demSelectedGameEventId, filteredGameEventList, setDemSelectedGameEventId, virtualizer],
  );

  return (
    <div
      className="w-full h-full flex flex-col outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <FilterBar
        entries={gameEventList}
        onUpdate={handleFilterUpdate}
        placehoder="filter game events..."
        className="border-b border-divider"
      />
      {!gameEventList?.length && (
        <p className="m-2 text-fg-subtle">no game event definitions, try moving the slider</p>
      )}
      <ScrollArea className="w-full grow" viewportRef={viewportRef}>
        <ul className="w-full h-full relative" style={{ height: virtualizer.getTotalSize() }}>
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const gameEvent = filteredGameEventList![virtualItem.index];
            const gameEventSelected = demSelectedGameEventId === gameEvent.id;

            return (
              <li
                key={virtualItem.key}
                className={cn(
                  "haste-li haste-li__virtual haste-li__selectable flex items-center gap-x-2",
                  gameEventSelected && "haste-li__selected",
                )}
                style={{
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                data-geid={gameEvent.id}
                onClick={handleClick}
              >
                <span className="opacity-40 text-end shrink-0" style={{ minWidth: "4ch" }}>
                  {gameEvent.id}
                </span>
                <span className="text-ellipsis overflow-hidden whitespace-nowrap">
                  {gameEvent.name}
                </span>
                <span className="opacity-40 ml-auto shrink-0">{gameEvent.keyCount}</span>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </div>
  );
}

function GameEventKeyList() {
  const [demParser] = useAtom(demParserAtom);
  const [demSelectedGameEventId] = useAtom(demSelectedGameEventIdAtom);
  const [demTick] = useAtom(demTickAtom);

  const gameEventKeyList = useMemo(() => {
    void demTick;

    if (demSelectedGameEventId === undefined) {
      return undefined;
    }

    return demParser?.listGameEventKeys(demSelectedGameEventId);
  }, [demParser, demSelectedGameEventId, demTick]);

  const viewportRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: gameEventKeyList?.length ?? 0,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => LI_HEIGHT,
  });

  return (
    <div className="w-full h-full flex flex-col">
      {demSelectedGameEventId === undefined && (
        <p className="m-2 text-fg-subtle">
          to view event keys, select an event from the list of game events
        </p>
      )}
      {demSelectedGameEventId !== undefined && !gameEventKeyList?.length && (
        <p className="m-2 text-fg-subtle">this game event has no keys</p>
      )}
      <ScrollArea className="w-full grow" viewportRef={viewportRef}>
        <ul className="w-full h-full relative" style={{ height: virtualizer.getTotalSize() }}>
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const gameEventKey = gameEventKeyList![virtualItem.index];

            return (
              <li
                key={virtualItem.key}
                className="haste-li haste-li__virtual flex items-center gap-x-2"
                style={{
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <span className="opacity-40 text-end shrink-0" style={{ minWidth: "4ch" }}>
                  {gameEventKey.index}
                </span>
                <span className="text-ellipsis overflow-hidden whitespace-nowrap">
                  {gameEventKey.name}
                </span>
                <span className="opacity-40 ml-auto shrink-0">
                  {gameEventKey.typeName === "unknown"
                    ? `${gameEventKey.typeName} ${gameEventKey.typeId}`
                    : gameEventKey.typeName}
                </span>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </div>
  );
}

export default function GameEventsPanel() {
  return (
    <div className="grow h-0">
      <PanelGroup direction="horizontal">
        <Panel minSize={24} defaultSize={36}>
          <GameEventList />
        </Panel>
        <PanelResizeHandle className="haste-panel-resize-handle" />
        <Panel minSize={24}>
          <GameEventKeyList />
        </Panel>
      </PanelGroup>
    </div>
  );
}

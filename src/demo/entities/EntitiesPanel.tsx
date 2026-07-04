import { useVirtualizer } from "@tanstack/react-virtual";
import {
  eHandleToIndex,
  isEHandleValid,
  type EntityFieldLi,
  type EntityLi,
} from "../../generated/wasm/haste_inspector_wasm";
import { useAtom } from "jotai";
import { ChevronDownIcon, ChevronRightIcon, CogIcon, Link2Icon, Link2OffIcon } from "lucide-react";
import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import FilterBar, { type UpdateEventHandler } from "../../shared/components/FilterBar";
import { demParserAtom, demSelectedEntityIndexAtom, demTickAtom, demViewAtom } from "../demoState";
import { Button } from "../../shared/components/Button";
import * as DropdownMenu from "../../shared/components/DropdownMenu";
import { ScrollArea } from "../../shared/components/ScrollArea";
import { Tooltip } from "../../shared/components/Tooltip";
import { cn } from "../../shared/utils/style";
import { buildEntityFieldRows } from "./entityFieldGrouping";
import type { EntityFieldRow } from "./entityTypes";

const LI_HEIGHT = 26;

const DEFAULT_SHOW_ENTITY_INDEX = false;

const DEFAULT_SHOW_FIELD_ENCODED_TYPE = true;
const DEFAULT_SHOW_FIELD_DECODED_TYPE = false;
const DEFAULT_SHOW_FIELD_PATH = false;

type EntityListPreferencesProps = {
  showEntityIndex: boolean;
  setShowEntityIndex: (value: boolean) => void;
};

// NOTE: keep this in sync with EntityFieldListPreferences
function EntityListPreferences(props: EntityListPreferencesProps) {
  const { showEntityIndex, setShowEntityIndex } = props;

  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <span className="inline-flex">
          <Tooltip content="display preferences">
            <Button size="small" className={cn(open && "bg-neutral-500/30")}>
              <CogIcon className={cn("size-4", !open && "stroke-fg-subtle")} />
            </Button>
          </Tooltip>
        </span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          // NOTE: following classes are stolen from tooltip
          className="bg-white dark:bg-black rounded z-10"
        >
          <DropdownMenu.CheckboxItem checked={showEntityIndex} onCheckedChange={setShowEntityIndex}>
            entity index
          </DropdownMenu.CheckboxItem>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function EntityList() {
  const [demParser] = useAtom(demParserAtom);
  const [demView] = useAtom(demViewAtom);
  const [demTick] = useAtom(demTickAtom);
  const entityList = useMemo(() => {
    void demTick;

    let entityList: EntityLi[] | undefined;
    if (demView === "entities") {
      entityList = demParser?.listEntities();
    } else if (demView === "baselineEntities") {
      entityList = demParser?.listBaselineEntities();
    }

    return entityList;
  }, [demParser, demView, demTick]);

  const [, startTransition] = useTransition();
  const [filteredEntityList, setFinalEntityList] = useState(entityList);
  const handleFilterUpdate: UpdateEventHandler<EntityLi> = useCallback((entries, searchCmpFn) => {
    startTransition(() => {
      if (searchCmpFn) {
        setFinalEntityList(entries?.filter((entry) => searchCmpFn(entry.name)));
      } else {
        setFinalEntityList(entries);
      }
    });
  }, []);

  const viewportRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: filteredEntityList?.length ?? 0,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => LI_HEIGHT,
  });

  const [demSelectedEntityIndex, setDemSelectedEntityIndex] = useAtom(demSelectedEntityIndexAtom);
  const handleClick = useCallback(
    (ev: React.MouseEvent<HTMLLIElement>) => {
      const entityIndex = +ev.currentTarget.dataset.entidx!;
      if (entityIndex >= 0 && entityIndex <= Number.MAX_SAFE_INTEGER) {
        setDemSelectedEntityIndex((prevEntityIndex) =>
          prevEntityIndex === entityIndex ? undefined : entityIndex,
        );
      }
    },
    [setDemSelectedEntityIndex],
  );

  const handleKeyDown = useCallback(
    (ev: React.KeyboardEvent<HTMLDivElement>) => {
      if (ev.key !== "ArrowDown" && ev.key !== "ArrowUp") {
        return;
      }

      ev.preventDefault();

      if (!filteredEntityList?.length) {
        return;
      }

      const selectedIndex = filteredEntityList.findIndex(
        (entity) => entity.index === demSelectedEntityIndex,
      );
      const fallbackIndex = ev.key === "ArrowDown" ? 0 : filteredEntityList.length - 1;
      const nextIndex =
        selectedIndex === -1
          ? fallbackIndex
          : Math.min(
              Math.max(selectedIndex + (ev.key === "ArrowDown" ? 1 : -1), 0),
              filteredEntityList.length - 1,
            );

      setDemSelectedEntityIndex(filteredEntityList[nextIndex].index);
      virtualizer.scrollToIndex(nextIndex, { align: "auto" });
    },
    [demSelectedEntityIndex, filteredEntityList, setDemSelectedEntityIndex, virtualizer],
  );

  const [showEntityIndex, setShowEntityIndex] = useState(DEFAULT_SHOW_ENTITY_INDEX);

  return (
    <div
      className="w-full h-full flex flex-col outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <FilterBar
        entries={entityList}
        onUpdate={handleFilterUpdate}
        placehoder="filter entities…"
        endAdornment={
          <>
            <div className="w-px h-4 bg-divider" />
            <EntityListPreferences
              showEntityIndex={showEntityIndex}
              setShowEntityIndex={setShowEntityIndex}
            />
          </>
        }
        className="border-b border-divider"
      />
      {!entityList?.length && (
        <p className="m-2 text-fg-subtle">no entities, try moving the slider</p>
      )}
      <ScrollArea className="w-full grow" viewportRef={viewportRef}>
        <ul className="w-full h-full relative" style={{ height: virtualizer.getTotalSize() }}>
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const entityItem = filteredEntityList![virtualItem.index];
            const entitySelected = demSelectedEntityIndex === entityItem?.index;
            return (
              <li
                key={virtualItem.key}
                className={cn(
                  "haste-li haste-li__virtual haste-li__selectable flex items-center",
                  entitySelected && "haste-li__selected",
                )}
                style={{
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                data-entidx={entityItem?.index}
                onClick={handleClick}
              >
                {showEntityIndex && (
                  <span className="opacity-40 text-end mr-2" style={{ minWidth: "4ch" }}>
                    {entityItem.index}
                  </span>
                )}
                <span className="text-ellipsis overflow-hidden whitespace-nowrap">
                  {entityItem.name}
                </span>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </div>
  );
}

type EntityFieldListPreferencesProps = {
  showFieldPath: boolean;
  setShowFieldPath: (value: boolean) => void;
  showFieldEncodedType: boolean;
  setShowFieldEncodedType: (value: boolean) => void;
  showFieldDecodedType: boolean;
  setShowFieldDecodedType: (value: boolean) => void;
};

// NOTE: keep this in sync with EntityListPreferences
function EntityFieldListPreferences(props: EntityFieldListPreferencesProps) {
  const {
    showFieldPath,
    setShowFieldPath,
    showFieldEncodedType,
    setShowFieldEncodedType,
    showFieldDecodedType,
    setShowFieldDecodedType,
  } = props;

  const [open, setOpen] = useState(false);

  const active = open;

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <span className="inline-flex">
          <Tooltip content="display preferences">
            <Button size="small" className={cn(active && "bg-neutral-500/30")}>
              <CogIcon className={cn("size-4", !active && "stroke-fg-subtle")} />
            </Button>
          </Tooltip>
        </span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          // NOTE: following classes are stolen from tooltip
          className="bg-white dark:bg-black rounded z-10"
        >
          <DropdownMenu.CheckboxItem checked={showFieldPath} onCheckedChange={setShowFieldPath}>
            field path
          </DropdownMenu.CheckboxItem>
          <DropdownMenu.CheckboxItem
            checked={showFieldEncodedType}
            onCheckedChange={setShowFieldEncodedType}
          >
            encoded type
          </DropdownMenu.CheckboxItem>
          <DropdownMenu.CheckboxItem
            checked={showFieldDecodedType}
            onCheckedChange={setShowFieldDecodedType}
          >
            decoded type
          </DropdownMenu.CheckboxItem>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function EntityFieldList() {
  const [demParser] = useAtom(demParserAtom);
  const [demView] = useAtom(demViewAtom);
  const [demSelectedEntityIndex] = useAtom(demSelectedEntityIndexAtom);
  const [demTick] = useAtom(demTickAtom);

  const rawEntityFieldList = useMemo(() => {
    void demTick;

    if (demSelectedEntityIndex === undefined) {
      return undefined;
    }

    let tmpEntityFieldList: EntityFieldLi[] | undefined;
    if (demView === "entities") {
      tmpEntityFieldList = demParser?.listEntityFields(demSelectedEntityIndex);
    } else if (demView === "baselineEntities") {
      tmpEntityFieldList = demParser?.listBaselineEntityFields(demSelectedEntityIndex);
    }

    return tmpEntityFieldList;
  }, [demParser, demView, demSelectedEntityIndex, demTick]);

  const [expandedFieldGroups, setExpandedFieldGroups] = useState(() => new Set<string>());

  const { entityFieldList, joinedPathMaxLen } = useMemo(
    () => buildEntityFieldRows(rawEntityFieldList, expandedFieldGroups),
    [rawEntityFieldList, expandedFieldGroups],
  );

  const [, startTransition] = useTransition();
  const [filteredEntityFieldList, setFinalEntityFieldList] = useState(entityFieldList);
  const handleFilterUpdate: UpdateEventHandler<EntityFieldRow> = useCallback(
    (entries, searchCmpFn) => {
      startTransition(() => {
        if (searchCmpFn) {
          setFinalEntityFieldList(
            entries?.filter((entry) => searchCmpFn(entry.joinedNamedPath)) ?? [],
          );
        } else {
          setFinalEntityFieldList(entries ?? []);
        }
      });
    },
    [],
  );

  const viewportRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: filteredEntityFieldList?.length ?? 0,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => LI_HEIGHT,
  });

  const [showFieldEncodedType, setShowFieldEncodedType] = useState(DEFAULT_SHOW_FIELD_ENCODED_TYPE);
  const [showFieldDecodedType, setShowFieldDecodedType] = useState(DEFAULT_SHOW_FIELD_DECODED_TYPE);
  const [showFieldPath, setShowFieldPath] = useState(DEFAULT_SHOW_FIELD_PATH);

  const [, setDemSelectedEntityIndex] = useAtom(demSelectedEntityIndexAtom);
  const handleFieldGroupToggle = useCallback((groupName: string) => {
    setExpandedFieldGroups((prevExpandedGroups) => {
      const nextExpandedGroups = new Set(prevExpandedGroups);
      if (nextExpandedGroups.has(groupName)) {
        nextExpandedGroups.delete(groupName);
      } else {
        nextExpandedGroups.add(groupName);
      }
      return nextExpandedGroups;
    });
  }, []);
  const handleClick = useCallback(
    (ev: React.MouseEvent<HTMLLIElement>) => {
      const entityIndex = +ev.currentTarget.dataset.entidx!;
      if (entityIndex >= 0 && entityIndex <= Number.MAX_SAFE_INTEGER) {
        setDemSelectedEntityIndex((prevEntityIndex) =>
          prevEntityIndex === entityIndex ? undefined : entityIndex,
        );
      }
    },
    [setDemSelectedEntityIndex],
  );

  return (
    <div className="w-full h-full flex flex-col">
      <FilterBar
        entries={entityFieldList}
        onUpdate={handleFilterUpdate}
        updateDelay={10}
        placehoder="filter entity fields…"
        endAdornment={
          <>
            <div className="w-px h-4 bg-divider" />
            <EntityFieldListPreferences
              showFieldEncodedType={showFieldEncodedType}
              setShowFieldEncodedType={setShowFieldEncodedType}
              showFieldDecodedType={showFieldDecodedType}
              setShowFieldDecodedType={setShowFieldDecodedType}
              showFieldPath={showFieldPath}
              setShowFieldPath={setShowFieldPath}
            />
          </>
        }
        className="border-b border-divider"
      />
      {demSelectedEntityIndex === undefined && (
        <p className="m-2 text-fg-subtle">
          to view entity fields, select an entity from the list of entities
        </p>
      )}
      {demSelectedEntityIndex !== undefined && !entityFieldList?.length && (
        <p className="m-2 text-fg-subtle">
          the previously selected entity does not exist at the current tick
        </p>
      )}
      <ScrollArea className="w-full grow" viewportRef={viewportRef}>
        <ul className="w-full h-full relative" style={{ height: virtualizer.getTotalSize() }}>
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const entityFieldItem = filteredEntityFieldList[virtualItem.index];
            const groupExpanded =
              !!entityFieldItem.expandableKind &&
              expandedFieldGroups.has(entityFieldItem.joinedNamedPath);

            const handle =
              !entityFieldItem.expandableKind &&
              entityFieldItem.inner.encodedAs.startsWith("CHandle");
            const handleValid = handle && isEHandleValid(+entityFieldItem.inner.value);
            const linkedEntIdx = handleValid ? eHandleToIndex(+entityFieldItem.inner.value) : null;

            return (
              <li
                key={virtualItem.key}
                className={cn(
                  "haste-li haste-li__virtual flex items-center",
                  handleValid && "haste-li__selectable",
                )}
                style={{
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                data-entidx={linkedEntIdx}
                onClick={handleClick}
              >
                <span className="whitespace-nowrap gap-x-[1ch] flex items-center">
                  <span className="inline-flex size-4 items-center justify-center">
                    {!!entityFieldItem.expandableKind && (
                      <button
                        className="inline-flex size-4 items-center justify-center rounded hover:bg-neutral-500/30"
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          handleFieldGroupToggle(entityFieldItem.joinedNamedPath);
                        }}
                      >
                        {groupExpanded ? (
                          <ChevronDownIcon className="size-3" />
                        ) : (
                          <ChevronRightIcon className="size-3" />
                        )}
                      </button>
                    )}
                  </span>
                  {showFieldPath && (
                    <span
                      className="opacity-40 whitespace-pre mr-2"
                      style={{ width: `${joinedPathMaxLen}ch` }}
                    >
                      {entityFieldItem.joinedPath}
                    </span>
                  )}
                  <span style={{ paddingLeft: `${entityFieldItem.depth * 2}ch` }}>
                    {entityFieldItem.joinedNamedPath}
                  </span>
                  <span className="opacity-40 -ml-2">:</span>
                  {(showFieldEncodedType || showFieldDecodedType) && (
                    <>
                      {showFieldEncodedType && (
                        <span className="opacity-40">{entityFieldItem.inner.encodedAs || "_"}</span>
                      )}
                      {showFieldEncodedType && showFieldDecodedType && (
                        <span className="opacity-40">{"->"}</span>
                      )}
                      {showFieldDecodedType && (
                        <span className="opacity-40">{entityFieldItem.inner.decodedAs}</span>
                      )}
                    </>
                  )}
                  <span className={cn("text-fg", entityFieldItem.expandableKind && "opacity-60")}>
                    {entityFieldItem.expandableKind === "vectorItem"
                      ? ""
                      : entityFieldItem.expandableKind
                        ? `length ${entityFieldItem.collectionLength ?? entityFieldItem.inner.value}`
                        : entityFieldItem.inner.value}
                  </span>
                  {handle &&
                    (handleValid ? (
                      <Tooltip content="click to navigate to the linked entity">
                        <Link2Icon className="size-4" />
                      </Tooltip>
                    ) : (
                      <Tooltip content="this handle is invalid">
                        <Link2OffIcon className="size-4" />
                      </Tooltip>
                    ))}
                </span>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </div>
  );
}

export default function EntitiesPanel() {
  return (
    <div className="grow h-0">
      <PanelGroup direction="horizontal">
        <Panel minSize={24} defaultSize={24}>
          <EntityList />
        </Panel>
        <PanelResizeHandle className="haste-panel-resize-handle" />
        <Panel minSize={24}>
          <EntityFieldList />
        </Panel>
      </PanelGroup>
    </div>
  );
}

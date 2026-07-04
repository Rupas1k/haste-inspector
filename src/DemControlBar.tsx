import { useAtom } from "jotai";
import type React from "react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { demParserAtom, demTickAtom } from "./atoms";
import { Slider } from "./lib/Slider";
import { Tooltip } from "./lib/Tooltip";
import { formatNumber } from "./lib/formatNumber";

export default function DemControlBar() {
  const [demParser] = useAtom(demParserAtom);
  const [demTick, setDemTick] = useAtom(demTickAtom);

  const [value, setValue] = useState(demTick);
  useEffect(() => setValue(demTick), [demTick]);
  const handleValueChange = useCallback(([nextValue]: number[]) => {
    setValue(nextValue);
  }, []);

  const [, startTransition] = useTransition();
  const demTotalTicks = demParser?.totalTicks() ?? -1;
  const handleValueCommit = useCallback(
    ([nextDemTick]: number[]) => {
      startTransition(() => {
        demParser!.runToTick(nextDemTick);
        const actualTick = demParser!.tick();
        setValue(actualTick);
        setDemTick(actualTick);
      });
    },
    [demParser, setDemTick],
  );

  const handleSliderKeyDown = useCallback(
    (ev: React.KeyboardEvent<HTMLSpanElement>) => {
      if (
        ev.key !== "ArrowLeft" &&
        ev.key !== "ArrowDown" &&
        ev.key !== "ArrowRight" &&
        ev.key !== "ArrowUp"
      ) {
        return;
      }

      ev.preventDefault();

      const direction = ev.key === "ArrowLeft" || ev.key === "ArrowDown" ? -1 : 1;
      const nextDemTick = Math.min(Math.max(demTick + direction, 0), demTotalTicks);
      demParser!.runToTick(nextDemTick);
      const actualTick = demParser!.tick();
      setValue(actualTick);
      setDemTick(actualTick);
    },
    [demParser, demTick, demTotalTicks, setDemTick],
  );

  const formattedTotalTicks = formatNumber(demTotalTicks);
  const tickStyle: React.CSSProperties = {
    width: `${formattedTotalTicks.length}ch`,
  };

  return (
    <div className="shrink-0 px-2 gap-x-2 min-h-10 flex items-center">
      <Tooltip content="current tick">
        <span style={tickStyle} className="text-center shrink-0 cursor-default">
          {formatNumber(demTick)}
        </span>
      </Tooltip>
      <Slider
        min={0}
        max={demTotalTicks}
        value={[value]}
        onValueChange={handleValueChange}
        onValueCommit={handleValueCommit}
        onKeyDown={handleSliderKeyDown}
      />
      <Tooltip content="total ticks">
        <span style={tickStyle} className="text-center shrink-0 cursor-default">
          {formattedTotalTicks}
        </span>
      </Tooltip>
    </div>
  );
}

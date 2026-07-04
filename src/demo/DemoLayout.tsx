import type React from "react";
import DemoTimeline from "./DemoTimeline";

type DemLayoutProps = React.PropsWithChildren;

export default function DemLayout(props: DemLayoutProps) {
  const { children } = props;
  return (
    <div className="grow flex flex-col divide-y divide-divider">
      {children}
      <DemoTimeline />
    </div>
  );
}

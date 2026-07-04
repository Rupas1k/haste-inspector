import { useAtom } from "jotai";
import AppToolbar from "./AppToolbar";
import { fullWidthAtom } from "./appState";
import { cn } from "../shared/utils/style";

type AppLayoutProps = React.PropsWithChildren;

export default function AppLayout(props: AppLayoutProps) {
  const { children } = props;

  const [fullWidth] = useAtom(fullWidthAtom);

  return (
    <div
      className={cn(
        "mx-auto flex flex-col divide-y divide-divider h-screen overflow-hidden w-full min-w-[40rem]",
        !fullWidth && "max-w-[80rem] border-x border-divider",
      )}
    >
      <AppToolbar />
      {children}
    </div>
  );
}

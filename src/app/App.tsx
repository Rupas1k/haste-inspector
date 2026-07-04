import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { useAtom } from "jotai";
import AppLayout from "./AppLayout";
import DemoScreen from "../demo/DemoScreen";
import WelcomeScreen from "./WelcomeScreen";
import { demFileAtom } from "../demo/demoState";

export default function App() {
  const [demFile] = useAtom(demFileAtom);

  return (
    <TooltipPrimitive.Provider delayDuration={0} disableHoverableContent>
      <AppLayout>
        {!demFile && <WelcomeScreen />}
        {demFile && <DemoScreen />}
      </AppLayout>
    </TooltipPrimitive.Provider>
  );
}

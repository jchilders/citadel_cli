import { useEffect, useMemo, useState } from "react";
import { Citadel } from "./index";
import { createBasicCommandRegistry } from "./examples/basicCommands.ts";
import { createDevOpsCommandRegistry } from "./examples/devopsCommands";
import { createLocalDevCommandRegistry } from "./examples/localDevCommands";
import { defaultConfig } from "./components/Citadel/config/defaults";
import { useRuntimeConfigDemo } from "./examples/runtimeConfigDemo";
import "./styles/app.css";

type ExampleId = "basic" | "localdev" | "devops" | "runtime";

const EXAMPLE_STORAGE_KEY = "citadel-demo-example";
const EXAMPLE_LABELS: Record<ExampleId, string> = {
  basic: "Basic",
  localdev: "Local Full-Stack",
  devops: "DevOps",
  runtime: "Runtime Config",
};
const EXAMPLE_DESCRIPTIONS: Record<ExampleId, string> = {
  basic: "A broad starter setup with user operations, error handling, and media output.",
  localdev: "A local development setup for API checks, quick DB queries, seeding, and full-stack log inspection.",
  devops: "An operations-flavored setup focused on deploy, logs, metrics, and infrastructure actions.",
  runtime: "A live configuration setup that changes Citadel behavior while you use it.",
};
const EXAMPLE_HINTS: Record<ExampleId, string> = {
  basic: "Great first stop to understand command structure and result types.",
  localdev: "Use this when building locally and jumping between frontend, API, and database checks.",
  devops: "Shows how Citadel can power fast operational workflows in internal tools.",
  runtime: "Shows Citadel acting as a control surface, not just a command runner.",
};
const EXAMPLE_TRY_COMMAND: Record<ExampleId, string> = {
  basic: "user.show 1234",
  localdev: "stack.status",
  devops: "monitor.metrics",
  runtime: "display.mode.inline",
};
const EXAMPLE_TRY_KEYS: Record<ExampleId, string> = {
  basic: "u s 1234",
  localdev: "s s",
  devops: "m m",
  runtime: "d m i",
};
const EXAMPLE_TRY_EXPLANATION: Record<ExampleId, string> = {
  basic: "Shows a single user result.",
  localdev: "Shows the current local stack health snapshot.",
  devops: "Shows a live-style metrics payload.",
  runtime: "Switches Citadel into inline mode in the page.",
};
const EXAMPLE_SOURCE_URL: Record<ExampleId, string> = {
  basic: "https://github.com/jchilders/citadel_cli/blob/main/src/examples/basicCommands.ts",
  localdev: "https://github.com/jchilders/citadel_cli/blob/main/src/examples/localDevCommands.ts",
  devops: "https://github.com/jchilders/citadel_cli/blob/main/src/examples/devopsCommands.ts",
  runtime: "https://github.com/jchilders/citadel_cli/blob/main/src/examples/runtimeConfigDemo.ts",
};

const VALID_EXAMPLE_IDS: ExampleId[] = ["basic", "localdev", "devops", "runtime"];

const isExampleId = (value: string): value is ExampleId =>
  VALID_EXAMPLE_IDS.includes(value as ExampleId);

const getInitialExample = (): ExampleId => {
  if (typeof window === "undefined") {
    return "basic";
  }

  const stored = window.localStorage.getItem(EXAMPLE_STORAGE_KEY);
  if (stored && isExampleId(stored)) {
    return stored;
  }

  return "basic";
};

function App() {
  const [selectedExample, setSelectedExample] = useState<ExampleId>(getInitialExample);
  const basicRegistry = useMemo(() => createBasicCommandRegistry(), []);
  const localDevRegistry = useMemo(() => createLocalDevCommandRegistry(), []);
  const devopsRegistry = useMemo(() => createDevOpsCommandRegistry(), []);
  const runtimeDemo = useRuntimeConfigDemo();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(EXAMPLE_STORAGE_KEY, selectedExample);
    }
  }, [selectedExample]);

  const activeBaseRegistry = useMemo(() => {
    if (selectedExample === "devops") {
      return devopsRegistry;
    }

    if (selectedExample === "localdev") {
      return localDevRegistry;
    }

    if (selectedExample === "runtime") {
      return runtimeDemo.commandRegistry;
    }

    return basicRegistry;
  }, [basicRegistry, localDevRegistry, devopsRegistry, runtimeDemo.commandRegistry, selectedExample]);

  const activeConfig = selectedExample === "runtime" ? runtimeDemo.config : defaultConfig;

  const commandRegistry = activeBaseRegistry;

  return (
    <div className="min-h-screen bg-slate-950 flex items-start justify-center p-6 md:p-10 pt-12 md:pt-16">
      <div className="w-full max-w-4xl">

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-4">
            <span className="font-mono text-emerald-400 text-xs font-bold tracking-[0.25em] uppercase">
              ▶ citadel
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight">
            Keyboard-driven command console
            <br />
            <span className="text-slate-500 font-medium">for your web app</span>
          </h1>
          <p className="mt-4 text-slate-500 text-sm leading-relaxed max-w-md mx-auto">
            Press <kbd>.</kbd>, type fast-expand shortcuts, see results inline.
            These tabs show four different command registry setups.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">

          {/* Tab bar */}
          <div className="flex items-end gap-1 px-4 border-b border-slate-800 bg-slate-950/60">
            {VALID_EXAMPLE_IDS.map((exampleId) => {
              const isActive = selectedExample === exampleId;
              return (
                <button
                  key={exampleId}
                  type="button"
                  onClick={() => setSelectedExample(exampleId)}
                  className={`px-4 py-3 text-sm font-medium -mb-px border-b-2 transition-all ${
                    isActive
                      ? "text-emerald-400 border-emerald-400"
                      : "text-slate-500 border-transparent hover:text-slate-300 hover:border-slate-600"
                  }`}
                >
                  {EXAMPLE_LABELS[exampleId]}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="p-6 md:p-8">

            {/* Example info */}
            <div className="flex gap-4 mb-6 pb-6 border-b border-slate-800">
              <div className="mt-2 w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
              <div>
                <div className="flex items-baseline gap-3">
                  <p className="text-white font-semibold text-base">
                    {EXAMPLE_LABELS[selectedExample]}
                  </p>
                  <a
                    href={EXAMPLE_SOURCE_URL[selectedExample]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    view source ↗
                  </a>
                </div>
                <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
                  {EXAMPLE_DESCRIPTIONS[selectedExample]}
                </p>
                <p className="text-slate-600 text-xs mt-2">
                  {EXAMPLE_HINTS[selectedExample]}
                </p>
              </div>
            </div>

            {/* Try it */}
            <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-5">
              <p className="text-slate-200 text-sm font-semibold mb-3 flex items-center gap-2">
                <span className="text-emerald-400">▸</span> Try it now
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Press <kbd>.</kbd> to open Citadel, then type{" "}
                {EXAMPLE_TRY_KEYS[selectedExample].split(" ").map((k, i, arr) => (
                  <span key={i}>
                    <kbd>{k}</kbd>
                    {i < arr.length - 1 && " "}
                  </span>
                ))}
                {" "}— Citadel auto-expands to{" "}
                <code className="font-mono text-emerald-400 text-xs bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-900/50">
                  {EXAMPLE_TRY_COMMAND[selectedExample]}
                </code>
                . {EXAMPLE_TRY_EXPLANATION[selectedExample]}
              </p>
            </div>

          </div>
        </div>

        <p className="text-center text-slate-700 text-xs mt-8">
          citadel_cli · a keyboard-driven command surface for React apps
        </p>

        <Citadel
          key={selectedExample}
          commandRegistry={commandRegistry}
          config={activeConfig}
        />
      </div>
    </div>
  );
}

export default App;

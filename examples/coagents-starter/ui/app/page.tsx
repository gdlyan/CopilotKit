"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { useState, useEffect, useRef, useCallback } from "react";
import { Responsive, WidthProvider, Layout } from "react-grid-layout";
import "/node_modules/react-grid-layout/css/styles.css";
import "/node_modules/react-resizable/css/styles.css";

import { createUniver, defaultTheme, LocaleType, merge } from '@univerjs/presets';
import { UniverSheetsCorePreset } from '@univerjs/presets/preset-sheets-core';
import sheetsCoreEnUS from '@univerjs/presets/preset-sheets-core/locales/en-US';

import { UniverSheetsZenEditorPlugin } from '@univerjs/sheets-zen-editor';
import sheetsZenEditorEnUS from '@univerjs/sheets-zen-editor/locale/en-US';

import { FUniver } from '@univerjs/facade';
import { PythonProvider, usePython } from 'react-py';

import '@univerjs/presets/lib/styles/preset-sheets-core.css';
import '@univerjs/sheets-zen-editor/lib/index.css';

type LayoutsType = {
  lg: Layout[];
  md?: Layout[];
  sm?: Layout[];
  xs?: Layout[];
  xxs?: Layout[];
};

declare global {
  interface Window {
    univerAPI: any;
  }
}

const ResponsiveGridLayout = WidthProvider(Responsive);

const tableData = [
  ['Product', 'Price', 'Stock'],
  ['Laptop', '999', '45'],
  ['Phone', '699', '120'],
  ['Tablet', '399', '78']
];

function PythonCell({ onExecute }: { onExecute: (code: string) => Promise<string> }) {
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const executeCode = async () => {
    if (!code.trim()) {
      setOutput('Please enter some Python code');
      return;
    }

    setIsRunning(true);
    setOutput('Executing...');
    
    try {
      const result = await onExecute(code);
      setOutput(result);
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [code]);

  return (
    <div className="flex flex-col h-full border border-gray-300 rounded-lg overflow-hidden">
      <div className="flex-1 min-h-[150px]">
        <textarea
          ref={textareaRef}
          className="w-full h-full p-3 font-mono text-sm border-none focus:outline-none resize-none"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter Python code here..."
          disabled={isRunning}
        />
      </div>
      <div className="p-2 bg-gray-100 border-t border-gray-300 flex justify-between items-center">
        <button
          onClick={executeCode}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
        >
          {isRunning ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Running...
            </span>
          ) : 'Run'}
        </button>
      </div>
      <div className={`p-3 bg-gray-50 border-t border-gray-200 overflow-auto ${output ? 'flex-1 max-h-[40%]' : 'h-0'}`}>
        {output && (
          <pre className="text-sm font-mono whitespace-pre-wrap break-words">{output}</pre>
        )}
      </div>
    </div>
  );
}

function SpreadsheetPage({ tableData }: { tableData: any[][] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [univerAPI, setUniverAPI] = useState<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const { univerAPI } = createUniver({
      locale: LocaleType.EN_US,
      locales: {
        enUS: merge({}, sheetsCoreEnUS, sheetsZenEditorEnUS),
      },
      theme: defaultTheme,
      presets: [
        UniverSheetsCorePreset({
          container: containerRef.current,
          disableTextFormatAlert: true,
          disableTextFormatMark: true,
        }),
      ],
      plugins: [UniverSheetsZenEditorPlugin],
    });

    univerAPI.createWorkbook({});
    setUniverAPI(univerAPI);
    
    const wb = univerAPI.getActiveWorkbook();
    const ws = wb?.getActiveSheet();
    const ar = ws?.getRange(0, 0, tableData?.length, tableData[0]?.length);
    
    if (tableData && tableData.length > 0) {      
      ar?.setValues(tableData);
    }
    
    window.univerAPI = univerAPI;

    return () => {
      univerAPI.dispose?.();
    };
  }, []);

  return (
    <div className="h-full w-full">
      <div ref={containerRef} className="h-full w-full"></div>
    </div>
  );
}

function Dashboard() {
  const [backgroundColor, setBackgroundColor] = useState("#f0f9ff");
  const [userName, setUserName] = useState("User");
  const { runPython, stdout, stderr, isLoading, isRunning, interruptExecution } = usePython();

  const stdoutRef = useRef(stdout);
  const stderrRef = useRef(stderr);

  // Update ref whenever stdout or stderr changes
  useEffect(() => {
    stdoutRef.current = stdout;
    stderrRef.current = stderr;
  }, [stdout, stderr]);

  const [layouts, setLayouts] = useState<LayoutsType>({
    lg: [
      { 
        i: "spreadsheet", 
        x: 0, 
        y: 0, 
        w: 7,
        h: 12, 
        minW: 4, 
        minH: 6
      },
      { 
        i: "python", 
        x: 7,
        y: 0, 
        w: 5,
        h: 12, 
        minW: 4, 
        minH: 6
      }
    ]
  });

  
  const executePython = useCallback(async (code: string) => {
//     const fullCode = `
// import micropip

// import pyodide_http
// pyodide_http.patch_all()

// ${code}
//     `
    
    console.log('Execute python code', code)
    try {  
      await runPython("");    
      const output=await runPython(code); 
      await new Promise(resolve => setTimeout(resolve, 10));

      
      console.log("Stdout ",stdoutRef.current);
      console.log("Stderr ",stderrRef.current);
      console.log("Output ",output);

      return stderrRef.current ? `Error:\n${stderrRef.current}` : stdoutRef.current || "Code executed successfully";
    } catch (error) {
      return `Error:\n${error instanceof Error ? error.message : String(error)}`;
    }
  }, [runPython, stdout, stderr]);
  // const executePython = async (code: string): Promise<string> => {
  //   const fullCode = `
  //     import micropip
  //     import pyodide_http
  //     pyodide_http.patch_all()
      
  //     ${code}
  //   `;
  
  //   console.log('Executing Python code:', fullCode);
  
  //   try {
  //     // Clear previous execution
  //     await runPython("");
      
  //     // Execute the code
  //     const result = await runPython(fullCode);
      
  //     // The stdout/stderr from usePython() may take a moment to update
  //     // We need to check both the direct result and the hook's state
  //     await new Promise(resolve => setTimeout(resolve, 0)); // Yield to event loop
      
  //     console.log('Execution results:', {
  //       directReturn: result,
  //       stdout: stdout,
  //       stderr: stderr
  //     });
      
  //     if (stderr) {
  //       return `Error:\n${stderr}`;
  //     }
  //     return stdout || result || "Code executed successfully (no output)";
  //   } catch (error) {
  //     console.error('Python execution failed:', error);
  //     return `Error:\n${error instanceof Error ? error.message : String(error)}`;
  //   }
  // };

  const stopExecution = useCallback(() => {
    interruptExecution();
  }, [interruptExecution]);

  const handleLayoutChange = useCallback((
    currentLayout: Layout[],
    allLayouts: LayoutsType
  ) => {
    setLayouts(prev => ({
      ...prev,
      lg: currentLayout
    }));
  }, []);

  //useCopilotAction part starts here
  useCopilotAction({
    name: "setBackgroundColor",
    available: "remote",
    parameters: [
      {
        name: "backgroundColor",
        type: "string",
        description: "The background color in hex format"
      }
    ],
    handler: ({ backgroundColor }) => {
      console.log("Executing color change to:", backgroundColor);
      setBackgroundColor(backgroundColor);
    },
  });

  // Render a greeting in the chat
  useCopilotAction({
    name: "greetUser",
    available: "remote",
    parameters: [
      {
        name: "userName",
        description: "Name of the user just introduced to you, and you want to greet them",
      },
    ],
    handler: ({ userName }) => {
      console.log("useCopilotAction fetchNameForUserId invoked ", userName);  
      window.univerAPI.getActiveWorkbook().getActiveSheet().setName(userName)
      setUserName(userName);
    },
    render: ({ args }) => {
      return (
        <div className="text-lg font-bold bg-blue-500 text-white p-2 rounded-xl text-center">
          Hello, user {args.userName}!
        </div>
      );
    }
  });

  useCopilotAction({
    name: "putDataIntoActiveWorksheet",
    available: "remote",
    parameters: [
      {
        name: "tableData",
        type: "string",
        description: "2D-array with data that will replace the current content of the active worksheet",
      },
    ],
    handler: ({ tableData }) => {
      const jsonString = typeof tableData === 'string' 
        ? tableData 
        : JSON.stringify(tableData);

      const jsonTableData = typeof tableData === 'string'
        ? jsonString
            .replace(/'/g, '"')
            .replace(/"\s*([^"]+?)\s*"/g, '"$1"')
        : jsonString;

      const parsedTableData: (string | number)[][] = (() => {
        try {
          return JSON.parse(jsonTableData)
        } catch(e) {
          console.error("Parsing failed:", e);
          return [['Timestamp', 'Error'], [new Date().toISOString(), e]]; // or a default value
        }
      })();
      console.log("useCopilotAction putDataIntoActiveWorksheet invoked \n", parsedTableData, parsedTableData?.length, parsedTableData[0]?.length);  
      const wb = window.univerAPI.getActiveWorkbook();
      const ws=wb?.getActiveSheet();
      const arow = ws?.getSelection()?.getActiveRange()?.getRow() || 0;
      const acol = ws?.getSelection()?.getActiveRange()?.getColumn() || 0;
      const ar=ws?.getRange(arow, acol, parsedTableData?.length, parsedTableData[0]?.length);
      if (parsedTableData && parsedTableData.length > 0) {      
        ar?.setValues(parsedTableData);
      }
    }
  });

  useCopilotAction({
    description: "Invoke the action when asked to read from Excel or from spreadsheet. Use selectAll = False if request specifiec to get the data from selected cells",
    name: "getDataFromActiveWorksheet",
    available: "remote",
    parameters: [
      {
        name: "selectAll",
        type: "boolean",
        description: "If True, selects the entire data range; if False, uses only the active selection. Defaults to False if not specified.",
      },
    ],
    handler: ({ selectAll }) => {
      console.log("useCopilotAction getDataFromActiveWorksheet invoked with selectAll ", selectAll);  
      const wb = window.univerAPI.getActiveWorkbook()
      const ws=wb?.getActiveSheet()
      const ar=selectAll ? ws?.getDataRange() : ws?.getSelection()?.getActiveRange();
      const values=ar?.getValues();
      console.log(values);
      return(values)
    }
  });


  return (
    <div style={{ backgroundColor }} className="min-h-screen p-4">
      <div className="bg-white rounded-xl shadow-lg w-full h-[calc(100vh-2rem)] overflow-hidden">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={30}
          width={1200}
          onLayoutChange={handleLayoutChange}
          draggableHandle=".drag-handle"
          autoSize={true}
          margin={[10, 10]}
        >
          <div key="spreadsheet" className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col border border-gray-200">
            <div className="drag-handle bg-gray-50 p-3 cursor-move flex justify-between items-center border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Spreadsheet</h3>
              <span className="text-sm text-gray-500">{userName}'s Sheet</span>
            </div>
            <div className="flex-1 p-1">
              <SpreadsheetPage tableData={tableData} />
            </div>
          </div>
          <div key="python" className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col border border-gray-200">
            <div className="drag-handle bg-gray-50 p-3 cursor-move flex justify-between items-center border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Python Cell</h3>
              {isLoading ? (
                <span className="text-sm text-gray-500">Initializing...</span>
              ) : isRunning && (
                <button 
                  onClick={stopExecution}
                  className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                >
                  Stop Execution
                </button>
              )}
            </div>
            <div className="flex-1 p-1">
              <PythonCell onExecute={executePython} />
            </div>
          </div>
        </ResponsiveGridLayout>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <PythonProvider 
      packages={{ 
        micropip: ['pyodide-http'],
        official: ['numpy', 'pandas']
      }}
    >
      <main className="h-full">
        <Dashboard />
        <CopilotSidebar
          defaultOpen={true}
          labels={{
            title: "Data Assistant",
            initial: "How can I help with your data today?",
          }}
        />
      </main>
    </PythonProvider>
  );
}
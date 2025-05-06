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

import '@univerjs/presets/lib/styles/preset-sheets-core.css';
import '@univerjs/sheets-zen-editor/lib/index.css';

// Define the type for our layouts state
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

export default function Home() {
  return (
    <main>
      <YourMainContent />
      <CopilotSidebar
        defaultOpen={true}
        labels={{
          title: "Popup Assistant",
          initial: "Hi! I'm connected to an agent. How can I help?",
        }}
      />
    </main>
  );
}

function YourMainContent() {
  const [backgroundColor, setBackgroundColor] = useState("#ADD8E6");
  const [userName, setUserName] = useState("unknown");
  const [spreadsheetData, setSpreadsheetData] = useState({tableData});
  
  // Initialize layouts with proper typing
  const [layouts, setLayouts] = useState<LayoutsType>({
    lg: [
      { 
        i: "spreadsheet", 
        x: 0, 
        y: 0, 
        w: 12, 
        h: 10, 
        minW: 6, 
        minH: 6,
        // Add these to satisfy the Layout type
        moved: false,
        static: false
      }
    ]
  });

  // Properly typed layout change handler
  const handleLayoutChange = useCallback((
    currentLayout: Layout[],
    allLayouts: LayoutsType
  ) => {
    setLayouts(prev => ({
      ...prev,
      lg: currentLayout.map(item => ({
        ...item,
        // Ensure all required properties are present
        moved: item.moved || false,
        static: item.static || false
      }))
    }));
  }, []);

  // Action for setting the background color (unchanged)
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
      })()
      console.log("useCopilotAction putDataIntoActiveWorksheet invoked \n", parsedTableData, parsedTableData?.length, parsedTableData[0]?.length);  
      const wb = window.univerAPI.getActiveWorkbook()
      const ws=wb?.getActiveSheet()
      const ar=ws?.getRange(0, 0, parsedTableData?.length, parsedTableData[0]?.length);
      if (parsedTableData && parsedTableData.length > 0) {      
        ar?.setValues(parsedTableData);
      }
    }
  });

  useCopilotAction({
    name: "getDataFromActiveWorksheet",
    available: "remote",
    parameters: [
      {
        name: "range",
        description: "cell range in Excel notation",
      },
    ],
    handler: ({ range }) => {
      console.log("useCopilotAction getDataFromActiveWorksheet invoked \n", range);  
      const wb = window.univerAPI.getActiveWorkbook()
      const ws=wb?.getActiveSheet()
      const ar=ws?.getRange(range);
      const values=ar?.getValues();
      console.log(values);
      setSpreadsheetData(values);
      return(values)
    }
  });

  return (
    <div
      style={{ backgroundColor }}
      className="h-screen w-screen flex justify-center items-center flex-col gap-4"
    >
      <div className="bg-white p-6 rounded-xl shadow-lg w-[95%] h-[95vh] max-w-none mx-auto my-4 overflow-hidden">  
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={30}
          width={1200}
          onLayoutChange={handleLayoutChange}
          draggableHandle=".drag-handle"
        >
          <div key="spreadsheet" className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="drag-handle bg-gray-200 p-2 cursor-move flex justify-between items-center">
              <span className="font-medium">Spreadsheet</span>
            </div>
            <div className="p-2 h-full">
              <SpreadsheetPage tableData={tableData} sheetName={userName} />
            </div>
          </div>
        </ResponsiveGridLayout>
      </div>
    </div>
  );
}

interface SpreadsheetPageProps {
  sheetName: string;
  tableData: any[][]
}

const tableData = [
  ['Product', 'Price', 'Stock'],
  ['Laptop', '999', '45'],
  ['Phone', '699', '120'],
  ['Tablet', '399', '78']
];

function SpreadsheetPage({ tableData }: SpreadsheetPageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [univerAPI, setUniverAPI] = useState<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Univer inside useEffect to ensure it runs on the client side
    const { univerAPI } = createUniver({
      locale: LocaleType.EN_US,
      locales: {
        enUS: merge(
          {},
          sheetsCoreEnUS,
          sheetsZenEditorEnUS,
        ),
      },
      theme: defaultTheme,
      presets: [
        UniverSheetsCorePreset({
          container: containerRef.current, // Mount UI here
          disableTextFormatAlert: true,
          disableTextFormatMark: true,
        }),
      ],
      plugins: [UniverSheetsZenEditorPlugin],
    });

    univerAPI.createWorkbook({});  

    setUniverAPI(univerAPI);
    const wb=univerAPI.getActiveWorkbook()
    const ws=wb?.getActiveSheet()
    const ar=ws?.getRange(0, 0, tableData?.length, tableData[0]?.length);
    if (tableData && tableData.length > 0) {      
      ar?.setValues(tableData);
    }
    
    // Assign to window if needed
    window.univerAPI = univerAPI;

    // Cleanup function
    return () => {
      univerAPI.dispose?.();
    };
  }, []);

  return (
    <div className="univer-container" style={{ height: 'calc(100% - 40px)' }}>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }}></div>
    </div>
  );
}
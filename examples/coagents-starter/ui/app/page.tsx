"use client";


import { useCopilotAction } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { useState, useEffect, useRef } from "react";

import { createUniver, defaultTheme, LocaleType, merge } from '@univerjs/presets';
import { UniverSheetsCorePreset } from '@univerjs/presets/preset-sheets-core';
import sheetsCoreEnUS from '@univerjs/presets/preset-sheets-core/locales/en-US';

import { UniverSheetsZenEditorPlugin } from '@univerjs/sheets-zen-editor';
import sheetsZenEditorEnUS from '@univerjs/sheets-zen-editor/locale/en-US';

import { FUniver } from '@univerjs/facade';

import '@univerjs/presets/lib/styles/preset-sheets-core.css';
import '@univerjs/sheets-zen-editor/lib/index.css';


declare global {
  interface Window {
    univerAPI: any;
  }
}


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
  const [spreadsheetData, setSpreadsheetData] = useState({tableData}) ;
  

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



  // Render the main content with Spreadsheet
  return (
    <div
      style={{ backgroundColor }}
      className="h-screen w-screen flex justify-center items-center flex-col gap-4"
    >
      <div className="bg-white p-6 rounded-xl shadow-lg w-[95%] h-[95vh] max-w-none mx-auto my-4">  
        <SpreadsheetPage tableData={tableData} sheetName={userName} />  
      </div>
      <button onClick={handleRename}>Rename Sheet</button>
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
    //univerAPI.getActiveWorkbook().getActiveSheet().setName(`${userName}`)
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
      // Add any necessary cleanup here
      univerAPI.dispose?.();
    };
  }, []);

  return (
    <div className="univer-container">
      {/* This div will be used by Univer to mount the spreadsheet */}
      <div ref={containerRef}  style={{ height: '90vh', width: '100%' }}></div>
    </div>
  );
}

const handleRename = () => {
  if (window.univerAPI) {
    const workbook = window.univerAPI.getActiveWorkbook();
    const sheet = workbook.getActiveSheet();
    sheet.setName('Renamed via Button');
  }
};


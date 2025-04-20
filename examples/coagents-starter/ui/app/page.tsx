"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { useState } from "react";
import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';

type Row = {
  id: number;
  title: string;
  status: string;
};

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
  
  // Define columns for the grid
  const columns = [
    { key: 'id', name: 'ID', editable: true },
    { key: 'title', name: 'Title', editable: true },
    { key: 'status', name: 'Status', editable: true }
  ];
  
  // Sample initial rows with proper typing
  const [rows, setRows] = useState<Row[]>([
    { id: 0, title: 'Task 1', status: 'In Progress' },
    { id: 1, title: 'Task 2', status: 'Todo' },
    { id: 2, title: 'Task 3', status: 'Done' }
  ]);

  // Handle row changes with proper typing
  const onRowsChange = (updatedRows: Row[]) => {
    setRows(updatedRows);
  };

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



  // Render the main content with DataGrid
  return (
    <div
      style={{ backgroundColor }}
      className="h-screen w-screen flex justify-center items-center flex-col gap-4"
    >
      <div className="bg-white p-6 rounded-xl shadow-lg w-3/4 max-w-4xl">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">{userName}</h1>
        <DataGrid
          columns={columns}
          rows={rows}
          onRowsChange={onRowsChange}
          className="rdg-light"
          style={{ height: 400 }}
        />
      </div>
    </div>
  );
}
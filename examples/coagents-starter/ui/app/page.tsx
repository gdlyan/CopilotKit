"use client";

import { useCopilotReadable, useCopilotAction, useCopilotContext } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { useState, useEffect } from "react";



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


  // Action for setting the background color
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

  // Render the main content
  return (
    <div
      style={{ backgroundColor }}
      className="h-screen w-screen flex justify-center items-center flex-col gap-4"
    >
      <h1 className="bg-blue-500 p-10 rounded-xl text-white text-4xl">
        Color - {backgroundColor}
        <br></br>
        User - {userName}
      </h1>

      <div className="flex gap-2">
        <button
          onClick={() => setBackgroundColor("#ff0000")}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Set Red
        </button>
        <button
          onClick={() => setBackgroundColor("#00ff00")}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Set Green
        </button>
        <button
          onClick={() => setBackgroundColor("#0000ff")}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Set Blue
        </button>
      </div>
    </div>
  );
}

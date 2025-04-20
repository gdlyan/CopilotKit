"""
This serves the "sample_agent" agent. This is an example of self-hosting an agent
through our FastAPI integration. However, you can also host in LangGraph platform.
"""

import os
from dotenv import load_dotenv
load_dotenv() # pylint: disable=wrong-import-position

from fastapi import FastAPI
import uvicorn
from copilotkit.integrations.fastapi import add_fastapi_endpoint
from copilotkit import CopilotKitRemoteEndpoint, LangGraphAgent, Action as CopilotAction
from sample_agent.agent import graph

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Define your backend action
# async def greet_user(userName: str):
#     return {"name": "User_" + userName}

# async def set_background_color(backgroundColor: str):
#     return {"backgroundColor": backgroundColor}

# this is a dummy action for demonstration purposes
# action_greetUser = CopilotAction(
#     name="greetUser",
#     description="Greets the user when the user introduces oneself and sets them as the active user lable in the main content area",
#     parameters=[
#         {
#             "name": "userName",
#             "type": "string",
#             "description": "The name of the user to set as the active user lable in the main content area",
#             "required": True,
#         }
#     ],
#     handler=greet_user
# )

# action_setBackgroundColor = CopilotAction(
#     name="setBackgroundColor",
#     description="Sets background color for the main content area of the app",
#     parameters=[
#         {
#             "name": "backgroundColor",
#             "type": "string",
#             "description": "The hex color code of the new background colo",
#             "required": True,
#         }
#     ],
#     handler=set_background_color
# )

# Add CORS middleware BEFORE any routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sdk = CopilotKitRemoteEndpoint(
    agents=[
        LangGraphAgent(
            name="sample_agent",
            description="An example agent to use as a starting point for your own agent.",
            graph=graph,
        )
    ]
)

add_fastapi_endpoint(app, sdk, "/copilotkit")

# @app.post("/test-action")
# async def test_action():
#     return {
#         "copilotkit": {
#             "actions": [{
#                 "name": "setBackgroundColor",
#                 "parameters": {"backgroundColor": "#FF0000"}
#             }]
#         }
#     }

def main():
    """Run the uvicorn server."""
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(
        "sample_agent.demo:app",
        host="0.0.0.0",
        port=port,
        reload=True,
    )

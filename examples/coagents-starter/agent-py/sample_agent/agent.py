"""
This is the main entry point for the agent.
It defines the workflow graph, state, tools, nodes and edges.
"""
from datetime import datetime
from time import localtime
from typing_extensions import Literal
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, AIMessage
from langchain_core.runnables import RunnableConfig
from langchain.tools import tool
from langchain_community.tools.tavily_search import TavilySearchResults
from langgraph.graph import StateGraph, END
from langgraph.types import Command
from langgraph.prebuilt import ToolNode
from copilotkit import CopilotKitState

# from langgraph.checkpoint.memory import MemorySaver


class AgentState(CopilotKitState):
    """
    Here we define the state of the agent

    In this instance, we're inheriting from CopilotKitState, which will bring in
    the CopilotKitState fields. We're also adding a custom field, `language`,
    which will be used to set the language of the agent.
    """
    language: Literal["english", "russian"] = "english"
    # your_custom_agent_state: str = ""

#Here go copilot actions

@tool
def greet_user(userName: str) -> dict:
    """
    Greets the user when the user introduces oneself and sets them as the active user label in the main content area.

    Args:
        userName (str): The name of the user to set as the active user label in the main content area

    Returns:
        dict: A dictionary containing the processed user name
    """
    # Implement logic and return dict
    return {"name": "User_" + userName}

@tool
def change_color(backgroundColor: str) -> dict:
    """
    Sets background color for the main content area of the app.

    Args:
        backgroundColor (str): The hex color code of the new background color

    Returns:
        dict: A dictionary containing the processed hex color code of the new background color
    """
    # Implement logic and return dict
    return {"backgroundColor": backgroundColor}

@tool
def putDataIntoActiveWorksheet(tableData: str) -> dict:
    """
    In a spreadsheet window clears the current active worksheet and puts the new data therein 

    Args:
        tableData (List[List[Any]]): strictly 2D array containing the new data to be put on a spreadsheet        

    Returns:
        dict: A dictionary containing a 2D array containing the new data to be put on a spreadsheet
    """
    # if not isinstance(tableData, list) or not all(isinstance(row, list) for row in tableData):
    #     raise ValueError("Input must be a 2D array (List[List[Any]])")
    
    return {"tableData": tableData}

@tool
def getDataFromActiveWorksheet(spreadsheetData) -> dict:
    """
    Gets data from active worksheet of a spreadshet from main content area      

    Returns:
        dict: A dictionary containing a 2D array containing the new data to be put on a spreadsheet
    """
    
    return {"spreadsheetData": spreadsheetData}

#And these are regular tools
@tool
def get_now():
    """
    Get current date and time on a server where agent is running
    """
    return f"Now is {datetime.now()} in {localtime().tm_zone}"



tools = [    
    get_now,
    putDataIntoActiveWorksheet,
    TavilySearchResults(max_results=2)
    # your_tool_here
]

async def chat_node(state: AgentState, config: RunnableConfig) -> Command[Literal["tool_node", "__end__"]]:
    """
    Standard chat node based on the ReAct design pattern. It handles:
    - The model to use (and binds in CopilotKit actions and the tools defined above)
    - The system prompt
    - Getting a response from the model
    - Handling tool calls

    For more about the ReAct design pattern, see: 
    https://www.perplexity.ai/search/react-agents-NcXLQhreS0WDzpVaS4m9Cg
    """
    
    # 1. Define the model
    model = ChatOpenAI(model="gpt-4.1-nano", base_url="https://api.proxyapi.ru/openai/v1")

    # 2. Bind the tools to the model
    model_with_tools = model.bind_tools(
        [
            *(state.get("copilotkit",{}).get("actions", [])),
            get_now,
            # change_color,
            TavilySearchResults(max_results=2)
            # your_tool_here
        ],

        # 2.1 Disable parallel tool calls to avoid race conditions,
        #     enable this for faster performance if you want to manage
        #     the complexity of running tool calls in parallel.
        parallel_tool_calls=False,
    )
    #print(state)

    # 3. Define the system message by which the chat model will be run
    system_message = SystemMessage(
        content=f"""
        You are a helpful assistant. Talk in {state.get('language', 'english')}. 
        
        You have access to the following tools: {tools}. 
        You can use these tools to assist you in completing your tasks. 
        When appropriate, invoke the tools by their names and provide necessary parameters. A
        Always consider whether a tool is needed before using it.
        
        When encountering questions related to current events, news, or information that may change over time, use the TavilySearchResults tool. 
        This tool is specifically designed to search for up-to-date and reliable information. 
        Ensure that your search query is clearly formulated and reflects the core of the question to obtain the most relevant results.  

        You can interact with spreadsheet using the following actions: {state.get("copilotkit",{}).get("actions", [])}     
        
        When generating tables or spreadsheet data, ALWAYS format them as a strict 2D array (List[List[Any]]) that can be directly used in the putDataIntoActiveWorksheet tool.
        For example:
        [
            ["Name", "Age", "Occupation"],
            ["John", 30, "Engineer"],
            ["Alice", 25, "Designer"]
        ]       
        """
    )

    # 4. Run the model to generate a response
    response = await model_with_tools.ainvoke([
        system_message,
        *state["messages"],
    ], config)

    #print("Model response:", response)

    # 5. Check for tool calls in the response and handle them. We ignore
    #    CopilotKit actions, as they are handled by CopilotKit.
    if isinstance(response, AIMessage) and response.tool_calls:
        print("Tool calls detected:", response.tool_calls)
        actions = state.get("copilotkit").get("actions", [])
        print("Actions:", actions)
        print("Response tool calls:", response.tool_calls[0])


        # 5.1 Check for any non-copilotkit actions in the response and
        #     if there are none, go to the tool node.
        if not any(
            action.get("name") == response.tool_calls[0].get("name")
            for action in actions
        ):
            return Command(goto="tool_node", update={"messages": response})

    # 6. We've handled all tool calls, so we can end the graph.
    print("Final response being sent:", response)
    return Command(
        goto=END,
        update={
            "messages": response
        }
    )



# Define the workflow graph
workflow = StateGraph(AgentState)
workflow.add_node("chat_node", chat_node)
workflow.add_node("tool_node", ToolNode(tools=tools))
workflow.add_edge("tool_node", "chat_node")
workflow.set_entry_point("chat_node")



# Compile the workflow graph
graph = workflow.compile()
# graph = workflow.compile(MemorySaver())

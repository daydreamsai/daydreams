import os
import argparse
from langchain_openai import ChatOpenAI
from browser_use import Agent
import asyncio
from dotenv import load_dotenv
import json
from datetime import datetime

load_dotenv()

def parse_args():
    parser = argparse.ArgumentParser(description='Browser automation script')
    parser.add_argument('--task', type=str, 
                       default="get the google news for the last 24 hours",
                       help='Task to perform in browser')
    parser.add_argument('--file-path', type=str, 
                       default="./search_browser_result.md",
                       help='File path to save the result')
    parser.add_argument('--model', type=str, 
                       default="gpt-4o",
                       help='LLM model to use')
    return parser.parse_args()

async def main():
    args = parse_args()
    
    agent = Agent(
        task=args.task,
        llm=ChatOpenAI(model=args.model),
    )
    result = await agent.run()
    print("[result]:", result)
    
    # Write in Markdown format
    with open(args.file_path, "w") as f:
        f.write(f"""# Search Result for: {args.task}

{result}

---
Generated at: {datetime.now()}
""")
        
    print(f"Browser Search Result Saved to: {args.file_path}")

if __name__ == "__main__":
    asyncio.run(main())
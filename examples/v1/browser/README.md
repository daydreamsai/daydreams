# Browser Automation Example

This example demonstrates how to use browser automation to fetch news from Google News using both Python and TypeScript.

## Prerequisites

### Python Environment Setup

1. Install Python 3.11+
   ```bash
   # macOS with Homebrew
   brew install python@3.11
   
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install python3.11 python3-pip
   ```

2. Install pip (Python package manager)
   ```bash
   # macOS/Linux
   curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
   python3 get-pip.py
   ```

3. Install Python dependencies
   ```bash
   pip install langchain-openai python-dotenv browser-use
   ```

### Node.js Environment Setup

1. Install Node.js dependencies
   ```bash
   bun install
   ```

## Configuration

1. Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

## Running the Examples

### Run the CLI Example
```bash
# Start the CLI agent
bun examples/v1/browser/example.ts
```

### Run the Test
```bash
# Run the browser automation test
bun examples/v1/browser/test-browser-action.ts
```

## Project Structure

```
browser/
├── README.md
├── browser-action.ts    # Browser automation action implementation
├── browser-use.py      # Python script for browser automation
├── example.ts          # Main example using the CLI agent
└── test-browser-action.ts  # Test file for browser automation
```

## Notes

- Make sure Chrome/Chromium is installed on your system
- The browser automation might take a few seconds to complete
- Results are saved in Markdown format
- The Python script can be run independently or through the TypeScript interface

## Troubleshooting

1. If you see Python import errors:
   ```bash
   pip install -r requirements.txt  # if you have a requirements.txt
   ```

2. If you get Chrome/Chromium errors:
   ```bash
   # macOS
   brew install --cask chromium
   
   # Ubuntu/Debian
   sudo apt-get install chromium-browser
   ```

3. For permission issues:
   ```bash
   # Make Python script executable
   chmod +x browser-use.py
   ``` 
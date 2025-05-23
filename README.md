# Pylee AI CLI

Command-line interface for interacting with Pylee AI services.

## Overview

The Pylee CLI provides a convenient way to use Pylee AI services directly from your terminal. It includes commands for authentication, running the MCP proxy server, and more.

## Requirements

- [Deno](https://deno.com/manual/getting_started/installation) 2.0 or later

## Building from Source

The CLI is built using Deno, which provides a self-contained binary without external dependencies.

### Build Steps

1. Clone the repository and navigate to the CLI directory:

```bash
git clone https://github.com/pyleeai/cli.git
cd cli
```

2. Run the build script:

```bash
chmod +x build.sh
./build.sh
```

This will:
- Cache all npm dependencies
- Include configuration from config.json
- Include HTML files and package metadata as embedded resources
- Compile the CLI into a single binary

The compiled binary will be available at `dist/pylee`.

### Configuration

The CLI uses a configuration file (`config.json`) with the following parameters:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `PYLEE_OIDC_AUTHORITY` | OIDC authority URL | https://auth.pylee.ai |
| `PYLEE_OIDC_CLIENT_ID` | OIDC client ID | pylee-cli |
| `PYLEE_OIDC_REDIRECT_URI` | OIDC redirect URI | http://localhost:3000/callback |
| `PYLEE_OIDC_PORT` | Local port for OIDC callbacks | 3000 |
| `MCP_PROXY_CONFIG_URL` | MCP proxy configuration URL | https://api.pylee.ai/v1/proxy/config |
| `MCP_PROXY_URL` | MCP proxy URL | https://proxy.pylee.ai |
| `MCP_PROXY_API_KEY` | MCP proxy API key | pylee-cli-proxy-key |

These configuration values can be set in two ways:

1. **Edit config.json directly** - This is best for development and permanent changes.

2. **Use the update_config.sh script** - This updates config.json based on environment variables.
   ```bash
   # Set environment variables
   export PYLEE_OIDC_AUTHORITY=https://custom-auth.example.com
   export MCP_PROXY_URL=https://custom-proxy.example.com
   
   # Update config.json from environment variables
   ./update_config.sh
   
   # Build the CLI with updated configuration
   ./build.sh
   ```

3. **Set environment variables at runtime** - The CLI will also check for environment variables at runtime, which take precedence over values in config.json.

## Usage

```bash
# Show help
./dist/pylee --help

# Check authentication status
./dist/pylee auth status

# Sign in
./dist/pylee auth signin

# Sign out
./dist/pylee auth signout

# Run the MCP proxy server (default command)
./dist/pylee
# or
./dist/pylee proxy
```

## Installation

After building, you can move the binary to a directory in your PATH:

```bash
# macOS/Linux
sudo cp dist/pylee /usr/local/bin/pylee

# Windows
# Add the binary location to your PATH
```

## License

MIT
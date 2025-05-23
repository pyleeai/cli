# Pylee AI CLI

Command-line interface for interacting with Pylee AI services.

## Overview

The Pylee CLI provides a convenient way to use Pylee AI services directly from your terminal. It includes commands for authentication, running the MCP proxy server, and more.

## Requirements

- [Bun](https://bun.sh/docs/installation) 1.0 or later
- [Deno](https://deno.com/manual/getting_started/installation) 2.0 or later (optional, for Deno-specific builds)

## Building from Source

The CLI is built using Bun, which provides fast builds and dependency management.

### Build Steps

1. Clone the repository and navigate to the CLI directory:

```bash
git clone https://github.com/pyleeai/cli.git
cd cli
```

2. Install dependencies and build:

```bash
bun install
bun run build
```

This will:
- Install all npm dependencies
- Bundle the application
- Create the build output

The compiled output will be available in the `build/` directory.

### Configuration

The CLI uses environment variables for configuration. You can set these in `.env` files or as environment variables:

| Parameter | Description | Required |
|-----------|-------------|----------|
| `PYLEE_OIDC_AUTHORITY` | OIDC authority URL | Yes |
| `PYLEE_OIDC_CLIENT_ID` | OIDC client ID | Yes |
| `PYLEE_OIDC_REDIRECT_URI` | OIDC redirect URI | Yes |
| `PYLEE_OIDC_PORT` | Local port for OIDC callbacks | Yes |

Configuration can be set in several ways:

1. **Environment files** - Create `.env.local` or modify existing `.env.*` files
2. **Environment variables at runtime** - Export variables in your shell
3. **Development vs Production** - Use `.env.development` or `.env.production` files

Example `.env.local`:
```bash
PYLEE_OIDC_AUTHORITY=https://your-auth-domain.clerk.accounts.dev
PYLEE_OIDC_CLIENT_ID=your-client-id
PYLEE_OIDC_REDIRECT_URI=http://localhost:3000/callback
PYLEE_OIDC_PORT=3000
```

## Authentication

The CLI uses OpenID Connect (OIDC) with Clerk as the identity provider for secure authentication.

### How Authentication Works

1. **Initial Sign-in**: When you first run a command that requires authentication, the CLI will automatically open a sign-in flow in your default browser.

2. **Token Storage**: Authentication tokens are securely stored locally and automatically managed by the CLI.

3. **Automatic Refresh**: The CLI automatically handles token refresh when needed.

### Long-Running Processes

The proxy command runs indefinitely and handles token expiration automatically using event-driven monitoring:

- **Event-Driven Monitoring**: The CLI listens for token expiration events from the authentication library
- **Zero-Downtime Restart**: When tokens expire or are refreshed, the proxy restarts without service interruption
- **Real-Time Feedback**: Provides immediate feedback about token status and refresh operations

Token management approach:
- **Event Handlers**: Respond to real-time token lifecycle events from oidc-client-ts
- **Automatic Refresh**: Tokens are refreshed automatically when expiration events are triggered
- **Graceful Restart**: Keeps old proxy running until new one with fresh tokens is ready

According to Clerk's OIDC implementation:
- Access tokens expire after 2 hours
- ID tokens expire after 1 hour  
- Refresh tokens expire after 3 days

The proxy uses the authentication library's event system for reliable token management in CLI environments. If you don't use the CLI for more than 3 days, you'll need to sign in again.

### Troubleshooting

**"Authentication required" message**: The CLI will automatically open the sign-in flow.

**"Authentication failed" message**: 
- Check your internet connection
- Verify your Clerk account is active
- Try clearing stored credentials: `./dist/pylee auth signout`

**"No configuration URL found"**: Your account may not be properly configured for proxy access. Contact support.

## Usage

```bash
# Development - run directly with Bun
bun run cli --help

# Or use Deno
deno task dev --help

# Check authentication status
bun run cli auth status

# Sign in
bun run cli auth signin

# Sign out
bun run cli auth signout

# Run the MCP proxy server (default command)
bun run cli
# or
bun run cli proxy
```

## Installation

For development, you can create aliases or scripts to run the CLI:

```bash
# Create an alias (add to your shell profile)
alias pylee="bun run --cwd /path/to/cli cli"

# Or create a wrapper script
echo '#!/bin/bash\nbun run --cwd /path/to/cli cli "$@"' > /usr/local/bin/pylee
chmod +x /usr/local/bin/pylee
```

## License

MIT
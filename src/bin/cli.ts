#!/usr/bin/env bun
import { run } from "@stricli/core";
import { buildContext } from "../context";
import { app } from "../app";

const ctx = buildContext(process);
await ctx.loadUserState();
await run(app, process.argv.slice(2), ctx);

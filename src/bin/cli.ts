#!/usr/bin/env deno

import process from "node:process";
import { run } from "@stricli/core";
import { app } from "../app";
import { buildContext } from "../context";

const context = await buildContext(process);

await run(app, process.argv.slice(2), context);

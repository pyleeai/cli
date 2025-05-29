#!/usr/bin/env deno --allow-env --allow-read --allow-write --allow-net --allow-sys --allow-run 

import process from "node:process";
import { run } from "@stricli/core";
import { app } from "../app";
import { buildContext } from "../context";

const context = await buildContext(process);

await run(app, process.argv.slice(2), context);

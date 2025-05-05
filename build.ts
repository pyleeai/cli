await Bun.build({
	entrypoints: ["./src/bin/cli.ts"],
	env: "inline",
	target: "bun",
	outdir: "./build",
});

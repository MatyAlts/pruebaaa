const path = require("node:path");
const Module = require("node:module");

process.env.NODE_PATH = path.resolve(process.cwd(), "node_modules");
Module._initPaths();
require("jest/bin/jest");

#!/usr/bin/env node
const JSON5 = require('json5')
const fs = require("fs");
const yaml = require("yaml");
const rfc6902 = require("rfc6902");
const jsonmergepatch = require("json-merge-patch");
const traverse = require("traverse");
const lodash = require("lodash");
const {get} = require("lodash");
const clone = require("clone");
const {stdin} = process;

if (process.env["NJQ2_FORMAT"]) {
    if (!process.env["NJQ2_INPUT_FORMAT"]) {
        process.env["NJQ2_INPUT_FORMAT"] = process.env["NJQ2_FORMAT"];
    }
    if (!process.env["NJQ2_OUTPUT_FORMAT"]) {
        process.env["NJQ2_OUTPUT_FORMAT"] = process.env["NJQ2_FORMAT"];
    }
}

if (process.env["NJQ2_OUTPUT_FORMAT"] === "yaml" && typeof process.env["NJQ2_OUTPUT_DOCUMENT_SEPARATOR"] == "undefined") {
    process.env["NJQ2_OUTPUT_DOCUMENT_SEPARATOR"] = "---\n"
}

function evalFile(path) {
    return eval(fs.readFileSync(path, {encoding: "UTF-8"}));
}

const getStdin = async () => {
    let result = '';

    if (stdin.isTTY) {
        return result;
    }

    stdin.setEncoding('utf8');

    for await (const chunk of stdin) {
        result += chunk;
    }

    return result;
};

((function main() {
    let expression = process.argv[2];
    if (!expression) {
        printUsage();
        process.exit(1);
    }

    if (process.env["NJQ2_MODE"] === "JsonMergePatch") {
        return executeJsonMergePatch(expression).then(printResults);
    } else {
        return executeQuery(expression).then(printResults);
    }
})()).catch(err => {
    console.error(err);
    process.exit(1);
});

function executeJsonMergePatch(expression) {
    return getAndParseFiles().then(files => files.map(input => {
        return jsonmergepatch.apply(input, JSON5.parse(expression));
    }));
}

function executeQuery(expression) {
    // normalize expression
    expression = (() => {
        if (expression.startsWith(".[")) {
            // if the expression is a jq like `.[xxx]yyy`, we assume it is referring to `input[xxx]yyy`
            return `input[${expression.substr(2)}`;
        } else if (expression.startsWith(".")) {
            try {
                // case of '.1 + .2'
                let result = eval(expression);
                if (isNumber(result)) {
                    return result;
                }
            } catch {
            }
            // if the expression is a jq like `.xxx`, we assume it is referring to `input.xxx`
            return `input${expression}`;
        } else {
            return expression
        }
    })();

    patchArrayFilter();

    return getAndParseFiles().then(files => files.map(input => {
        const pristineInput = JSON.parse(JSON.stringify(input));

        function genJsonPatch(value) {
            return rfc6902.createPatch(pristineInput, value);
        }

        function genJsonMergePatch(value) {
            return jsonmergepatch.generate(pristineInput, value);
        }

        return eval(`${expression}`);
    }));
}

function printResults(results) {
    results.forEach((result, i) => {
        if (typeof result == "object") {
            if (process.env["NJQ2_OUTPUT_FORMAT"] === "yaml") {
                console.log(yaml.stringify(result, {indentSeq: false, maxAliasCount: 0}).trim());
            } else {
                console.log(JSON.stringify(result, null, 4).trim());
            }
        } else {
            console.log(result);
        }
        if (i < results.length - 1 && process.env["NJQ2_OUTPUT_DOCUMENT_SEPARATOR"]) {
            console.log(process.env["NJQ2_OUTPUT_DOCUMENT_SEPARATOR"]);
        }
    })
}

// patches array.filter so that when there's an uncaught exception in the callback function,
// it simply returns false instead of crashing.
//
// this allows for a simpler .filter() call, without worrying about
//   TypeError: Cannot read property 'xxx' of undefined
// and other trivial errors
function patchArrayFilter() {
    let origArrayFilter = Array.prototype.filter;

    function patchedArrayFilter(...arguments) {
        // hook the filter function
        let origFilterFunction = arguments[0];
        arguments[0] = a => {
            try {
                return origFilterFunction(a)
            } catch (e) {
                return false;
            }
        }
        return origArrayFilter.apply(this, arguments);
    }

    Array.prototype.filter = patchedArrayFilter;
};


function getFiles() {
    if (process.argv.length === 3) {
        return getStdin().then(data => [data])
    } else {
        return Promise.resolve(process.argv.slice(3).map(path => fs.readFileSync(path, "utf-8")))
    }
}

function getAndParseFiles() {
    return getFiles().then(files => files.map(input => {
        try {
            // try to parse input as JSON
            if (process.env["NJQ2_INPUT_FORMAT"] === "yaml") {
                return yaml.parse(input);
            } else {
                return JSON5.parse(input);
            }
        } catch {
            // input is not a JSON, which is also fine and we leave it as is
            return input;
        }
    }))
}

function printUsage() {
    console.log("Usage: njq2 <js expression> [file...]")
}

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

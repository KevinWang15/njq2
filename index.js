#!/usr/bin/env node
const fs = require("fs");
const yaml = require("yaml");
const {stdin} = process;

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

(function main() {
    let expression = process.argv[2];
    if (!expression) {
        printUsage();
        process.exit(1);
    }

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

    getFiles().then(input => input.forEach(input => {
        try {
            // try to parse input as JSON
            if (process.env["NJQ2_MODE"] === "yaml") {
                input = yaml.parse(input);
            } else {
                input = JSON.parse(input);
            }
        } catch {
            // input is not a JSON, which is also fine and we leave it as is
        }

        // print the evaluation result to stdout
        let result = eval(`${expression}`);
        if (typeof result == "object") {
            console.log(JSON.stringify(result, null, 4));
        } else {
            console.log(result);
        }
    }));
})();

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

function printUsage() {
    console.log("Usage: njq2 <js expression> [file...]")
}

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
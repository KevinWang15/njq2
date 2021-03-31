# run script from js file

```zsh
printf "%s" $SOME_JSON | njq2 "$(cat ./script.js)"
```

# generate json patch

```zsh
printf "%s" $SOME_JSON | njq2 'input.spec.a=input.spec.b="xxx";genJsonPatch(input)'
```

# use yaml

```zsh
printf "%s" $SOME_YAML | NJQ2_FORMAT=yaml njq2 "..."
printf "%s" $SOME_YAML | NJQ2_INPUT_FORMAT=yaml NJQ2_OUTPUT_FORMAT=json njq2 "..."
```

# cli utils

```zsh
alias yaml2json='NJQ2_INPUT_FORMAT=yaml NJQ2_OUTPUT_FORMAT=json njq2 "input"'
alias json2yaml='NJQ2_INPUT_FORMAT=json NJQ2_OUTPUT_FORMAT=yaml njq2 "input"'
```

# traverse objects

```zsh
printf "%s" $SOME_JSON | njq2 "
result = clone(input);
traverse(result.spec).forEach(function () {
    if (this.key === 'revision') {
        this.update('NEW_REVISION');
    }
});
genJsonPatch(result);"
```

# lodash

```zsh
printf "%s" $SOME_JSON | njq2 "lodash.get(input, '.some.fields.which.may.or.may.not.exist', 'default')"
```

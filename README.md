njq2
---

`jq`-like in node

# Installation
```shell
sudo npm i -g njq2
```

# Examples
* `echo '{"a": 123}' | njq2 '.a'` -> `123`
* `echo '[[1],[2,5],3]' | njq2 '.[1][1]'` -> `5`
* `echo '[[1],[2,5],3]' | njq2 '.[1].map(i=>i+1)'` -> `[ 3, 6 ]`
* `echo '[{"name": "Peter"}, {"name": "Kevin"}, {"name": "_"}]' | njq2 '.filter(person=>!person.name.startsWith("_")).map(person=>person.name).join(", ")'` -> `Peter, Kevin`
* `echo '[{"name":"Peter","birthday":"1995-11-15T00:00:00Z"},{"name":"Kevin","birthday":"1993-11-15T00:00:00Z"},{"name":"Alice","birthday":"1998-11-15T00:00:00Z"}]' | njq2 '.sort((a,b)=>Date.parse(a.birthday)-Date.parse(b.birthday))'` -> `[{"name":"Kevin","birthday":"1993-11-15T00:00:00Z"},{"name":"Peter","birthday":"1995-11-15T00:00:00Z"},{"name":"Alice","birthday":"1998-11-15T00:00:00Z"}]`
* `echo 'xyz' | njq2 '"abc" + input'` -> `abcxyz`
* `echo 'xyz' | njq2 '.1 + .9'` -> `1`
* `njq2 ".[1]" jsonfile1 jsonfile2` -> `1\n2`
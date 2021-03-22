# source njq2-w.sh
# edit a json file with njq2
# njq2-w '.hello="world"' myfile.json

njq2-w() {
  TMP=$(mktemp)
  njq2 "$1;input" $2 > $TMP
  mv $TMP $2
}

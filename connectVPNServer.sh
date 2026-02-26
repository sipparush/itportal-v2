if [ -z "$1" ]; then
      ssh jventures@192.168.80.1 
else
      cmd="$1"
      ssh jventures@192.168.80.1 "$cmd"
fi

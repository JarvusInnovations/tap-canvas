# tap-canvas

A [Singer](https://www.singer.io/) tap for Canvas' [LMS API](https://canvas.instructure.com/doc/api/)

## Configuration

Per Singer specifications, provide configuration via json file:

```bash
tap-canvas --config ./config.json
```

### Sample `config.json`

```json
{
    "host": "example.instructure.com",
    "token": "1234~xzwD4...",
    "account": 1
}
```

### Example usage

```bash
mkdir -p .scratch

# prepare target-csv
python3 -m venv .scratch/venv
source .scratch/venv/bin/activate
pip install target-csv
deactivate

# dump data
node bin/tap-canvas --config .scratch/config.json \
    | (cd .scratch/ && ./venv/bin/target-csv)
```

## References

- [Canvas LMS API Documentation](https://canvas.instructure.com/doc/api/)

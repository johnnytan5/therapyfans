# Sui Therapist Smart Contract

A Move smart contract built for the Sui blockchain platform.

## Prerequisites

- [Sui CLI](https://docs.sui.io/guides/developer/getting-started/sui-install) installed
- Active Sui wallet configured

## Development

### Building the Contract

```bash
sui move build
```

### Running Tests

```bash
sui move test
```

## Deployment

### Publishing to Network

```bash
sui client publish --gas-budget 50000000
```

> **Note**: Adjust the gas budget as needed. The example uses 50 million MIST (0.05 SUI).

### Verify Deployment

After publishing, you'll receive a package ID. You can verify the deployment using:

```bash
sui client object <PACKAGE_ID>
```

## Project Structure

- `sources/` - Contains the Move source files
- `tests/` - Contains test files
- `Move.toml` - Project configuration
- `Move.lock` - Dependency lock file

## Additional Resources

- [Sui Documentation](https://docs.sui.io/)
- [Move Language Reference](https://move-language.github.io/move/)
- [Sui Move Examples](https://github.com/MystenLabs/sui/tree/main/sui_programmability/examples)
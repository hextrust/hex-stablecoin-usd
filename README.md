
# Hex Stablecoin (USDX)

USDX is ERC-20 token that is issued by HTMI Limited and is backed by USD reserve managed by trusted custodian.
See contract functionalities details from Docs [here](./doc/token_design.md)

### Deployed Contract Addresses

|        Chain       |                  Address                   |  Version  |
|:-------------------|:------------------------------------------:|:----------|
| Ethereum Mainnet   | 0x7A486F809c952a6f8dEc8cb0Ff68173F2B8ED56c |     2     |
| Flare Mainnet      | 0x4A771Cc1a39FDd8AA08B8EA51F7Fd412e73B3d2B |     2     |
| Songbird Mainnet   | 0x4A771Cc1a39FDd8AA08B8EA51F7Fd412e73B3d2B |     1     |

### Audit & Version

The contract was audited by third party provide, Hacken in December 2023. Audit report can be found .

|  Version |              Audit report                  |          |
|:---------|:------------------------------------------:|:----------|
|     1    | [Hacken December 2023](./audit/Hex_Trust_SC_Audit_24_11_23_[SA2049]_final.pdf) |     ERC20 basic function with blacklisting , pausing & UUPS proxies upgrading features    |
|     2    |    |     Supporting LayerZero OFT standard    |

### Setup 

under `layerzero/oapp` directory
```bash
npm install
forge install foundry-rs/forge-std --no-commit
forge build
```

under root directory
```bash
npm install
```

// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;
import { ILayerZeroEndpointV2 } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";

interface ILayerZeroEndpoint is ILayerZeroEndpointV2 {
    function delegates(address oapp) external view returns (address);
}

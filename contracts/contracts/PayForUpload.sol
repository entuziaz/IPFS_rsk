// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title PayForUpload
/// @notice Accepts RBTC payments for upload identifiers and lets the owner withdraw collected funds.
contract PayForUpload {
    address public immutable owner;
    uint256 public uploadFee; // optional: fixed price per upload

    event Paid(address indexed payer, uint256 amount, bytes32 indexed uploadId, uint256 timestamp);

    /// @notice Deploys the contract and sets the fixed upload fee.
    /// @param _uploadFee The minimum RBTC amount required for a single upload payment.
    constructor(uint256 _uploadFee) {
        owner = msg.sender;
        uploadFee = _uploadFee;
    }

    /// @notice Pays for an upload and emits a receipt event tied to the supplied upload identifier.
    /// @param uploadId The upload identifier that the backend later verifies against the payment event.
    function payForUpload(bytes32 uploadId) external payable {
        require(msg.value >= uploadFee, "Insufficient payment");
        emit Paid(msg.sender, msg.value, uploadId, block.timestamp);
    }

    /// @notice Withdraws the full contract balance to the owner address.
    function withdraw() external {
        require(msg.sender == owner, "Only owner");
        (bool success, ) = payable(owner).call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }
}

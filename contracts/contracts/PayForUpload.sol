// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title PayForUpload
/// @notice Accepts RBTC payments for upload identifiers and lets the owner withdraw collected funds.
contract PayForUpload {
    address public owner;
    address public pendingOwner;
    uint256 public uploadFee; // optional: fixed price per upload

    event Paid(address indexed payer, uint256 amount, bytes32 indexed uploadId, uint256 timestamp);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

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

    /// @notice Rejects direct RBTC transfers that do not go through payForUpload.
    receive() external payable {
        revert("Use payForUpload");
    }

    /// @notice Rejects unknown calls and accidental direct RBTC transfers.
    fallback() external payable {
        revert("Use payForUpload");
    }

    /// @notice Starts a two-step ownership transfer to a new owner.
    /// @param newOwner The address that must call acceptOwnership to complete the transfer.
    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "Only owner");
        require(newOwner != address(0), "Invalid owner");
        require(newOwner != owner, "Already owner");

        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    /// @notice Accepts a pending ownership transfer.
    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "Only pending owner");

        address previousOwner = owner;
        owner = pendingOwner;
        pendingOwner = address(0);

        emit OwnershipTransferred(previousOwner, owner);
    }

    /// @notice Withdraws the full contract balance to the owner address.
    function withdraw() external {
        require(msg.sender == owner, "Only owner");
        (bool success, ) = payable(owner).call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }
}

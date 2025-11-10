// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PayForUpload {
    address public owner;
    uint256 public uploadFee; // optional: fixed price per upload

    event Paid(address indexed payer, uint256 amount, bytes32 indexed uploadId, uint256 timestamp);

    constructor(uint256 _uploadFee) {
        owner = msg.sender;
        uploadFee = _uploadFee;
    }

    function payForUpload(bytes32 uploadId) external payable {
        require(msg.value >= uploadFee, "Insufficient payment");
        emit Paid(msg.sender, msg.value, uploadId, block.timestamp);
    }

    function withdraw() external {
        require(msg.sender == owner, "Only owner");
        payable(owner).transfer(address(this).balance);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    mapping(bytes32 => uint) public votesReceived;
    bytes32[] public candidates;

    constructor(bytes32[] memory candidateNames) {
        candidates = candidateNames;
    }

    function vote(bytes32 candidate) public {
        require(validCandidate(candidate), "Invalid candidate");
        votesReceived[candidate] += 1;
    }

    function validCandidate(bytes32 candidate) view public returns (bool) {
        for (uint i = 0; i < candidates.length; i++) {
            if (candidates[i] == candidate) return true;
        }
        return false;
    }

    function getVotes(bytes32 candidate) view public returns (uint) {
        return votesReceived[candidate];
    }
}

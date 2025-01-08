// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//引入 OpenZeppelin 提供的 ERC20 合約標準庫(如果沒有請下載 指令為"npm install @openzeppelin/contracts" )
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract QuizPlatform is ERC20 {
    // 合約擁有者地址
    address public owner;

    // 事件，用於通知獎勵發放
    event RewardGiven(address indexed user, uint256 amount);

    // 合約構造函數
    constructor() ERC20("QuizToken", "QT") {
        owner = msg.sender; // 設置合約創造者
        _mint(owner, 1000000 * 10**decimals()); // 創造者初始擁有 1,000,000 代幣
    }

    // 僅限創造者操作的修飾符
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    // 用於發放獎勵代幣的函數
    function rewardUser(address user, uint256 amount) external onlyOwner {
        require(balanceOf(owner) >= amount, "Not enough tokens to reward");
        _transfer(owner, user, amount); // 從創造者地址轉移代幣到用戶地址
        emit RewardGiven(user, amount); // 發布獎勵事件
    }

    // 查詢代幣餘額的函數
    function getBalance(address account) external view returns (uint256) {
        return balanceOf(account);
    }
}

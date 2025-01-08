import React, { useState, useEffect } from "react";
import Web3 from "web3";
import contractABI from "./ABI.json";
import questions from "./abi/questions.json";
import "./App.css";

const contractAddress = "0xb0bb9aCd66AE2a6Ef56664450EC9Ff8B3DdE4D76";
const creatorAddress = "0x00cac02DDf0019f2CF08985Caf00DDeD14c60149";

const ALL_ACHIEVEMENTS = [
  "完成1題",
  "完成3題",
  "完成5題",
  "完成10題",
  "完成20題",
  "完成30題",
  "完成40題",
  "完成50題",
];

const MAX_ERRORS = 20; // 最大錯誤次數

const App = () => {
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("");
  const [tokenBalance, setTokenBalance] = useState("0");
  const [question, setQuestion] = useState({});
  const [userAnswer, setUserAnswer] = useState("");
  const [message, setMessage] = useState("");

  const [completedQuestions, setCompletedQuestions] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  const rewardAmount = Web3.utils.toWei("0.00000001", "ether");

  const loadQuestion = () => {
    const randomIndex = Math.floor(Math.random() * questions.length);
    setQuestion(questions[randomIndex]);
    setUserAnswer("");
    setMessage("");
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

        if (accounts[0] !== account) {
          setAccount(accounts[0]);
          setCompletedQuestions(0);
          setErrorCount(0); // 重置錯誤次數
          setUnlockedAchievements([]);

          const existingUser = leaderboard.find((user) => user.account === accounts[0]);
          if (!existingUser) {
            setLeaderboard((prevLeaderboard) => [
              ...prevLeaderboard,
              {
                account: accounts[0],
                completedQuestions: 0,
                tokenBalance: 0,
              },
            ]);
          }
        }

        const balance = await web3.eth.getBalance(accounts[0]);
        setBalance(web3.utils.fromWei(balance, "ether"));

        await getTokenBalance(accounts[0]);

        setMessage("✅ 錢包連接成功！");
      } catch (error) {
        console.error("Wallet connection failed:", error);
        setMessage("❌ 錢包連接失敗！");
      }
    } else {
      alert("請安裝 MetaMask 錢包！");
    }
  };

  const getTokenBalance = async (selectedAccount) => {
    if (!selectedAccount) return;

    const web3 = new Web3(window.ethereum);
    const contract = new web3.eth.Contract(contractABI, contractAddress);

    try {
      const balance = await contract.methods.balanceOf(selectedAccount).call();
      setTokenBalance(web3.utils.fromWei(balance, "ether"));
    } catch (error) {
      console.error("無法獲取代幣餘額：", error);
    }
  };

  const checkAchievements = (currentCompletedQuestions) => {
  const newAchievements = [...unlockedAchievements];

  if (currentCompletedQuestions >= 1 && !newAchievements.includes("完成1題")) {
    newAchievements.push("完成1題");
  }
  if (currentCompletedQuestions >= 3 && !newAchievements.includes("完成3題")) {
    newAchievements.push("完成3題");
  }
  if (currentCompletedQuestions >= 5 && !newAchievements.includes("完成5題")) {
    newAchievements.push("完成5題");
  }
  if (currentCompletedQuestions >= 10 && !newAchievements.includes("完成10題")) {
    newAchievements.push("完成10題");
  }
  if (currentCompletedQuestions >= 20 && !newAchievements.includes("完成20題")) {
    newAchievements.push("完成20題");
  }
  if (currentCompletedQuestions >= 30 && !newAchievements.includes("完成30題")) {
    newAchievements.push("完成30題");
  }
  if (currentCompletedQuestions >= 40 && !newAchievements.includes("完成40題")) {
    newAchievements.push("完成40題");
  }
  if (currentCompletedQuestions >= 50 && !newAchievements.includes("完成50題")) {
    newAchievements.push("完成50題");
  }

  setUnlockedAchievements(newAchievements);
};


  const resetGame = () => {
    setCompletedQuestions(0);
    setErrorCount(0);
    setUnlockedAchievements([]);
    loadQuestion();
    setMessage("遊戲已重置，重新開始！");
  };

  const submitAnswer = async () => {
  if (!account) {
    setMessage("❌ 請先連結錢包！");
    return;
  }

  if (errorCount >= MAX_ERRORS) {
    setMessage("❌ 錯誤次數已達上限，請重新開始遊戲！");
    return;
  }

  if (userAnswer === question.correctAnswer) {
    setMessage("🎉 恭喜你！答案正確！等待獎勵發送中...");
    const web3 = new Web3(window.ethereum);
    const contract = new web3.eth.Contract(contractABI, contractAddress);

    try {
      await contract.methods.rewardUser(account, rewardAmount).send({
        from: creatorAddress,
      });
      setMessage("🎉 獎勵已成功發放！繼續答題吧！");
      
      const newCompletedQuestions = completedQuestions + 1; // 新的完成題目數量
      setCompletedQuestions(newCompletedQuestions);

      checkAchievements(newCompletedQuestions); // 傳入最新的題目數量
      await getTokenBalance(account);

      setLeaderboard((prevLeaderboard) => {
        const updatedLeaderboard = prevLeaderboard.map((user) =>
          user.account === account
            ? {
                ...user,
                completedQuestions: newCompletedQuestions,
                tokenBalance: parseFloat(tokenBalance),
              }
            : user
        );

        if (!updatedLeaderboard.some((user) => user.account === account)) {
          updatedLeaderboard.push({
            account,
            completedQuestions: newCompletedQuestions,
            tokenBalance: parseFloat(tokenBalance),
          });
        }

        return updatedLeaderboard.sort((a, b) => b.completedQuestions - a.completedQuestions);
      });

      loadQuestion();
    } catch (error) {
      console.error("獎勵分發失敗：", error);
      setMessage("❌ 獎勵分發失敗！");
    }
  } else {
    setErrorCount(errorCount + 1);
    setMessage(
      `❌ 答案錯誤！還有 ${MAX_ERRORS - errorCount - 1} 次錯誤機會！`
    );

    if (errorCount + 1 >= MAX_ERRORS) {
      setMessage("❌ 錯誤次數已達上限，請重新開始遊戲！");
    }
  }
};


  useEffect(() => {
    loadQuestion();
  }, []);

  return (
    <div className="app-container">
      <div className="achievement-section">
        <h2>成就列表</h2>
        <ul>
          {ALL_ACHIEVEMENTS.map((achievement, index) => (
            <li key={index}>
              {achievement}{" "}
              {unlockedAchievements.includes(achievement) ? (
                <span className="achievement-unlocked">✅</span>
              ) : (
                <span className="achievement-locked">❌</span>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className="main-content">
        <h1 className="title">區塊鏈答題平台</h1>
        <button onClick={connectWallet}>連接錢包</button>
        <p>當前錢包地址：{account}</p>
        <p>錢包餘額：{balance} ETH</p>
        <p>代幣餘額：{tokenBalance} QT</p>
        <p>已完成題目數量：{completedQuestions}</p>
        <p>剩餘可錯次數：{MAX_ERRORS - errorCount}</p>
        <h2>題目</h2>
        {question.question ? (
          <div>
            <p>{question.question}</p>
            {question.options.map((option, index) => (
              <button
                key={index}
                className={`option-button ${
                  userAnswer === option ? "selected" : ""
                }`}
                onClick={() => setUserAnswer(option)}
              >
                {option}
              </button>
            ))}
            <div>
              <button onClick={submitAnswer}>提交答案</button>
              <button onClick={loadQuestion}>換一題</button>
            </div>
            {message && <p>{message}</p>}
          </div>
        ) : (
          <p>正在加載題目...</p>
        )}
        {errorCount >= MAX_ERRORS && (
          <button onClick={resetGame}>重新開始遊戲</button>
        )}
      </div>
      <div className="leaderboard">
        <h2>排行榜</h2>
        <ul>
          {leaderboard.map((user, index) => (
            <li key={index}>
              <strong>{index + 1}. {user.account}</strong> - 完成題目數：{user.completedQuestions}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;

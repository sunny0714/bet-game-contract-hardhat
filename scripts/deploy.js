const GameToken = "0xCCf84A8B29F706F01816071f386079E9B5aBac76";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const BetGame = await ethers.getContractFactory("BetGame");
  const betGame = await BetGame.deploy(GameToken);

  console.log("BetGame address:", betGame.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
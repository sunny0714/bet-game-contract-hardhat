// We import Chai to use its asserting functions here.
const { expect } = require("chai");

// `describe` is a Mocha function that allows you to organize your tests. It's
// not actually needed, but having your tests organized makes debugging them
// easier. All Mocha functions are available in the global scope.

// `describe` receives the name of a section of your test suite, and a callback.
// The callback must define the tests of that section. This callback can't be
// an async function.
describe("BetGame contract", function () {
  // Mocha has four functions that let you hook into the the test runner's
  // lifecyle. These are: `before`, `beforeEach`, `after`, `afterEach`.

  // They're very useful to setup the environment for tests, and to clean it
  // up after they run.

  // A common pattern is to declare some variables, and assign them in the
  // `before` and `beforeEach` callbacks.

  let BetGame;
  let BetGameContract;
  let GameToken;
  let GameTokenContract;
  let owner;
  let addr1;
  let addr2;
  let addrs;
  let poolOneInfo;
  let poolTwoInfo;
  let allowanceAmount = '9999999999999999999999999';

  // `beforeEach` will run before each test, re-deploying the contract every
  // time. It receives a callback, which can be async.
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    // Deploy Game token
    GameToken = await ethers.getContractFactory("GameToken");
    GameTokenContract = await GameToken.deploy(100000);
    // Deploy Bet Game
    BetGame = await ethers.getContractFactory("BetGame");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    BetGameContract = await BetGame.deploy(GameTokenContract.address);

    // Add pools
    await BetGameContract.connect(owner).addPool(50);
    await BetGameContract.connect(owner).addPool(100);
  });

  // You can nest describe calls to create subsections.
  describe("Deployment and Initialization", function () {
    // `it` is another Mocha function. This is the one you use to define your
    // tests. It receives the test name, and a callback function.

    // If the callback function is async, Mocha will `await` it.
    it("Should assign the total supply of tokens to the owner", async function () {
      // Expect receives a value, and wraps it in an Assertion object. These
      // objects have a lot of utility methods to assert values.

      const ownerBalance = await GameTokenContract.balanceOf(owner.address);
      expect(await GameTokenContract.totalSupply()).to.equal(ownerBalance);
    });

    it("Should set the right reward Multiplier", async function () {
      // This test expects the rewardMultiplier variable stored in the contract to be equal
      // to the value set in constructor.
      expect(await BetGameContract.rewardMultiplier()).to.equal(90);
    });

    it("Should assign each tokenAmount to each pool", async function () {
      // check the added pool data
      poolOneInfo = await BetGameContract.pools(0);
      expect(poolOneInfo.tokenAmount).to.equal(50);
  
      poolTwoInfo = await BetGameContract.pools(1);
      expect(poolTwoInfo.tokenAmount).to.equal(100);
    });
  });

  describe("Transactions", function () {
    it("Should return the number of adding pool when querying poolLength", async function () {
      const poolLength = await BetGameContract.poolLength();
      expect(poolLength).to.equal(2);
    });

    it("Should assign updated tokenAmount to the selected pool", async function () {
      await BetGameContract.connect(owner).updatePool(1, 150);
      poolOneInfo = await BetGameContract.pools(0);
      expect(poolOneInfo.tokenAmount).to.equal(150);
    });

    it("Should transfer tokens between accounts", async function () {
      // transfer to addr1
      await GameTokenContract.transfer(addr1.address, 500);
      expect(await GameTokenContract.balanceOf(addr1.address)).to.equal(500);
      // transfer to addr2
      await GameTokenContract.transfer(addr2.address, 500);
      expect(await GameTokenContract.balanceOf(addr2.address)).to.equal(500);
    });

    it("Should approve token allowance", async function () {
      // set allownace to addr1
      await GameTokenContract.connect(addr1).approve(BetGameContract.address, 500);
      expect(await GameTokenContract.allowance(addr1.address, BetGameContract.address)).to.equal(500);
      // set allowance to addr2
      await GameTokenContract.connect(addr2).approve(BetGameContract.address, 500);
      expect(await GameTokenContract.allowance(addr2.address, BetGameContract.address)).to.equal(500);
    });

    it("Should change the state of the game pool whenever accounts bet", async function () {
      // transfer to addr1
      await GameTokenContract.transfer(addr1.address, 500);
      // set allownace to addr1
      await GameTokenContract.connect(addr1).approve(BetGameContract.address, allowanceAmount);
      console.log('pooloneinfo before bet-->', poolOneInfo);
      console.log('Game Players before bet-->', await BetGameContract.getGamePlayers(1));
      // check bet for the first account
      await BetGameContract.connect(addr1).bet(1);
      // Check game status after first account bet
      poolOneInfo = await BetGameContract.pools(0);
      console.log('pooloneinfo after 1 bet-->', poolOneInfo)
      console.log('Game Players after 1 bet-->', await BetGameContract.getGamePlayers(1));
      expect(poolOneInfo.state).to.equal(1);

      // transfer to addr2
      await GameTokenContract.transfer(addr2.address, 500);
      // set allowance to addr2
      await GameTokenContract.connect(addr2).approve(BetGameContract.address, allowanceAmount);
      // check bet for the second account
      await BetGameContract.connect(addr2).bet(1);
      // Check game status after second account bet
      poolOneInfo = await BetGameContract.pools(0);
      console.log('pooloneinfo after 2 bet-->', poolOneInfo)
      console.log('pooloneinfo player after 2 bet-->', poolOneInfo.player)
      console.log('Game Players after 2 bet-->', await BetGameContract.getGamePlayers(1));
      expect(poolOneInfo.state).to.equal(2);

      // check claim rewards
      await BetGameContract.connect(owner).claimAward(1, addr1.address);
      console.log('1------> %d PBR', await GameTokenContract.balanceOf(addr1.address));
      console.log('2------> %d PBR', await GameTokenContract.balanceOf(addr2.address));
      console.log('owner--> %d PBR', await GameTokenContract.balanceOf(owner.address));
    });
  });
});
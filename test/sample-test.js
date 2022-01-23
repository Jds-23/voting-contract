const { expect } = require("chai");
const { ethers } = require("hardhat");
const {expectRevert} = require("@openzeppelin/test-helpers")
// We import Chai to use its asserting functions here.


describe("Ballot contract", function () {

  let Ballot;
  let BallotContract;
  let owner;
  let addr1;
  let addr2;
  let addrs;
  const proposalArr=["JDS","VB","EMUSK","JETA"];

  // `beforeEach` will run before each test, re-deploying the contract every
  // time. It receives a callback, which can be async.
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    Ballot = await ethers.getContractFactory("Ballot");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens once its transaction has been
    // mined.
    BallotContract = await Ballot.deploy(proposalArr);
  });

  // You can nest describe calls to create subsections.
  describe("Deployment", function () {
    // `it` is another Mocha function. This is the one you use to define your
    // tests. It receives the test name, and a callback function.

    // If the callback function is async, Mocha will `await` it.
    it("Should set the right chairperson", async function () {
      expect(await BallotContract.chairperson()).to.equal(owner.address);
    });

    it("Should set the right Proposals", async function () {
      const proposals=[];
      for(let i=0;i<proposalArr.length;i++){
        const response=await BallotContract.proposals(i)
        proposals.push(response.name);
      }
        expect(proposals.length).to.equal(proposalArr.length)
      proposals.map((item,i)=>{
        expect(item).to.equal(proposalArr[i]);
      })
    });


    it("Should reject if user without voting approval trys to vote", async function (){
      await expectRevert.unspecified(BallotContract.connect(addr1).vote(0),"Member doesn't have rights")
    });

    it("Should take a vote if user with approval votes", async function (){
      await BallotContract.addVoter(addr1.address);
      const i =1;
      const proposalBefore=await BallotContract.proposals(i)
      const noOfVotesBefore=proposalBefore.noOfVotes;
      await BallotContract.connect(addr1).vote(i)
      const proposalAfter=await BallotContract.proposals(i)
      const noOfVotesAfter=proposalAfter.noOfVotes;

      expect(noOfVotesBefore+ 1).to.equal(noOfVotesAfter);
    } )

    it("Should reject a voter if already voted", async function (){
      await BallotContract.addVoter(addr1.address);
      const i =1;
      await BallotContract.connect(addr1).vote(i);
      await expectRevert.unspecified(BallotContract.connect(addr1).vote(0))
    } )
    it("Should delegat a vote if ", async function (){
      await BallotContract.addVoter(addr1.address);
      await BallotContract.addVoter(addr2.address);
      await BallotContract.addVoter(addrs[0].address);
      await BallotContract.connect(addr1).delegate(addr2.address);
      await expectRevert.unspecified(BallotContract.connect(addr1).vote(0));
      
      const i =1;
      const proposalBefore=await BallotContract.proposals(i)
      const noOfVotesBefore=proposalBefore.noOfVotes;
      await BallotContract.connect(addr2).vote(i)
      const proposalAfter=await BallotContract.proposals(i)
      const noOfVotesAfter=proposalAfter.noOfVotes;
      
      expect(noOfVotesBefore+ 2).to.equal(noOfVotesAfter);
      
      await BallotContract.connect(addrs[0]).delegate(addr2.address);
      const proposalAfter2=await BallotContract.proposals(i)
      const noOfVotesAfter2=proposalAfter2.noOfVotes;
      expect(noOfVotesBefore+ 3).to.equal(noOfVotesAfter2);

    } )
    it("Should delecare winner correctly ", async function (){
      await BallotContract.addVoter(addr1.address);
      await BallotContract.addVoter(addr2.address);
      await BallotContract.addVoter(addrs[0].address);
      await BallotContract.addVoter(addrs[1].address);
      
      await BallotContract.connect(owner).vote(0);
      await BallotContract.connect(addr1).vote(0);
      await BallotContract.connect(addr2).vote(1);
      await BallotContract.connect(addrs[0]).vote(1);
      await BallotContract.connect(addrs[1]).vote(1);

      expect(await BallotContract.winnerName()).to.equal(proposalArr[1]);

    } )
  });

});
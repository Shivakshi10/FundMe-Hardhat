const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

describe("FundMe", async function () {
    let fundMe
    let deployer
    let mockV3Aggregator
    const sendValue = ethers.utils.parseEther("1")
    beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer
        deployments.fixture(["all"])
        fundMe = await ethers.getContract("FundMe", deployer)
        mockV3Aggregator = await ethers.getContractAt(
            "MockV3Aggregator",
            deployer
        )
    })
    describe("contructor", async function () {
        it("sets the aggregator addresses correctly", async function () {
            const response = await fundMe.priceFeed()
            assert.equal(response, mockV3Aggregator.address)
        })
    })

    describe("fund", async function () {
        it("Fails if you don't send enough ETH", async function () {
            await expect(fundMe.fund()).to.be.revertedWith(
                "You need to spend more ETH!"
            )
        })

        it("updated the amount funded data structure", async function () {
            await fundMe.fund({ value: sendValue })
            const response = await fundMe.addressToAmountFunded(deployer)
            assert.equal(response.toString(), sendValue.toString())
        })

        it("Adds funder to array of funders", async function () {
            await fundMe.fund({ value: sendValue })
            const funder = await fundMe.funders(0)
            assert.equal(funder, deployer)
        })
        describe("withdraw", async function () {
            beforeEach(async function () {
                await fundMe.fund({ value: sendValue })
            })

            it("Withdraw ETH from a single founder", async function () {
                //Arrange
                const startingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const startingDeployerBalance =
                    await fundMe.provider.getBalance(deployer)
                //Act
                const transactionResponse = await fundMe.withdraw()
                const trnasactionReciept = await transactionResponse.wait(1)

                const { gasUsed, effectiveGasPrice } = trnasactionReciept
                const gasCost = gasUsed.mul(effectiveGasPrice)
                const endingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const endingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )
                //Assert
                assert.equal(endingDeployerBalance, 0)
                assert.equal(
                    startingFundMeBalance.add(startingDeployerBalance),
                    endingDeployerBalance.add(gasCost).toString()
                )
            })
            it("is allows us to withdraw with multiple funders", async () => {
                // Arrange
                const accounts = await ethers.getSigners()
                for (i = 1; i < 6; i++) {
                    const fundMeConnectedContract = await fundMe.connect(
                        accounts[i]
                    )
                    await fundMeConnectedContract.fund({ value: sendValue })
                }
                const startingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const startingDeployerBalance =
                    await fundMe.provider.getBalance(deployer)

                // Act
                const transactionResponse = await fundMe.cheaperWithdraw()
                // Let's comapre gas costs :)
                // const transactionResponse = await fundMe.withdraw()
                const transactionReceipt = await transactionResponse.wait()
                const { gasUsed, effectiveGasPrice } = transactionReceipt
                const withdrawGasCost = gasUsed.mul(effectiveGasPrice)
                console.log(`GasCost: ${withdrawGasCost}`)
                console.log(`GasUsed: ${gasUsed}`)
                console.log(`GasPrice: ${effectiveGasPrice}`)
                const endingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const endingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )
                // Assert
                assert.equal(
                    startingFundMeBalance
                        .add(startingDeployerBalance)
                        .toString(),
                    endingDeployerBalance.add(withdrawGasCost).toString()
                )
                // Make a getter for storage variables
                await expect(fundMe.getFunder(0)).to.be.reverted

                for (i = 1; i < 6; i++) {
                    assert.equal(
                        await fundMe.getAddressToAmountFunded(
                            accounts[i].address
                        ),
                        0
                    )
                }
            })
            it("Only allows the owner to withdraw", async function () {
                const accounts = await ethers.getSigners()
                const fundMeConnectedContract = await fundMe.connect(
                    accounts[1]
                )
                await expect(
                    fundMeConnectedContract.withdraw()
                ).to.be.revertedWith("FundMe__NotOwner")
            })
        })
    })
})

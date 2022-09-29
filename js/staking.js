"use strict";

const Web3Modal = window.Web3Modal.default;
let web3Modal;
let provider;
let selectedAccount;
let isConnected = false;

let abi = [
  {
    inputs: [
      {
        internalType: "uint256[]",
        name: "tokenIds",
        type: "uint256[]",
      },
      {
        internalType: "bytes",
        name: "signature",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "randomId",
        type: "uint256",
      },
    ],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256[]",
        name: "tokenIds",
        type: "uint256[]",
      },
    ],
    name: "claimableFor",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "contractAddress",
        type: "address",
      },
    ],
    name: "tokensOwnedBy",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
async function init() {
  const providerOptions = {};
  web3Modal = new Web3Modal({
    cacheProvider: false,
    providerOptions,
    disableInjectedProvider: false,
  });
  try {
    if (window.ethereum.selectedAddress !== null) {
      connect();
    }
  } catch (error) {}
}
async function fetchAccountData() {
  const web3 = new Web3(provider);
  const accounts = await web3.eth.getAccounts();
  selectedAccount = accounts[0];
}

async function connect() {
  if (window.web3 == undefined && window.ethereum == undefined) {
    window.open("https://metamask.app.link/dapp/mint.drippyzombies.xyz", "_blank").focus();
  }
  provider = await web3Modal.connect();
  await fetchAccountData();

  if (isConnected) {
    return;
  }

  if (selectedAccount) {
    isConnected = true;
    document.getElementById("connect-button").classList.add("d-none");
    document.getElementById("claim-button").classList.remove("d-none");
    getClaimAmount();
    toastr.success(`Connected`);
  }
}

async function claim() {
  if (isConnected) {
    let req = await axios.post("https://sapi.drippyzombies.xyz/getClaimDetails/", {
      wallet: selectedAccount,
    });
    if (req.data.signature == false || req.data.tokens.length == 0) {
      toastr.error(`ERROR!`);
    } else {
      
      const web3 = new Web3(provider);
      const contract = new web3.eth.Contract(abi, "0x7239951d608e65D0CFeEd610d015318C6F15c195"); // staking contract on poly
      contract.methods
        .claim(req.data.signature, req.data.randomId, req.data.tokens)
        .send({
          from: selectedAccount,
        })
        .then((state) => {
          toastr.success(`Claimed`);
        });
    }
  }
}

async function getClaimAmount() {
  if (isConnected) {
    let web3E = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/00b3826c843c45e6acfcfaf3e0093e3e"));
    const contractETH = new web3E.eth.Contract(abi, "0x7466cb13bbebbf3f404ffa1e4de9e7b841c85514"); // contract in ETH that has the ownedOf
    let tokensOwned = await contractETH.methods.tokensOwnedBy(selectedAccount, "0x255C5F67B0dc68dC793255D30f7e8ae432312db0").call(); // nft contract address
    console.log(tokensOwned);
    if (tokensOwned.length > 0) {
      const web3 = new Web3(provider);
      const contractPoly = new web3.eth.Contract(abi, "0x7239951d608e65D0CFeEd610d015318C6F15c195"); // staking contract on poly
      let totalClaimable = await contractPoly.methods.claimableFor(tokensOwned).call();
      console.log(web3.utils.fromWei(totalClaimable.toString(), "ether"));
      document.getElementById("claimableAmount").innerHTML = web3.utils.fromWei(totalClaimable.toString(), "ether") + " $Drippy";
    } else {
      document.getElementById("claimableAmount").innerHTML = "0 $Drippy";
    }
  }
}

window.addEventListener("load", async () => {
  init();
});

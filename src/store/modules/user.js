import { defineStore } from 'pinia'

export default defineStore('storeUser', {
  state () {
    return {
      name: 'kids',
      age: 18,
      accessToken: 'abcdefg',
      account: '',
      chainId: Number(import.meta.env.VITE_APP_CHAINID),
      accounts: [],
      address: '',
      walletConnector: null,
      connected: false,
      token: '',
    }
  },
  getters: {
     getaccount:(state)=>state.account,
     getchainId:(state)=>state.chainId,
     getaccounts:(state)=>state.accounts,
     getaddress:(state)=>state.address,
     getwalletConnector:(state)=>state.walletConnector,
     getconnected:(state)=>state.connected,
     gettoken:(state)=>state.token,
  },
  actions: {
    setAccount(account){
      this.account = account;
    },
    setToken(token){
      this.token = token;
    },
    setChainId(chainId){
      this.account = chainId;
    },
    setAccounts(accounts){
      this.accounts = accounts;
    },
    setAddress(account){
      this.address = account;
    },
    setWalletConnector(connector){
      this.walletConnector = connector;
    },
    setConnected(isConnected){
      this.connected = isConnected;
    },
  },
  persist: {
    enabled: true,
    strategies: [
      { storage: sessionStorage, paths: ['name', 'age'] }, 
      { storage: localStorage, paths: ['accessToken'] }
    ],
  },
})

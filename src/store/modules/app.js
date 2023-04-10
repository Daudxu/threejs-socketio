import { defineStore } from 'pinia'

export default defineStore('storeApp', {
  state () {
    return {
      themeType: 'light',
      isInpt: false,
    }
  },
  getters: {
     getThemeType: (state) => state.themeType,
     getIsInpt: (state) => state.isInpt,
  },
  actions: {
     setThemeType(themeType){
        this.themeType = themeType
     },
     setIsInpt(isInpt){
        this.isInpt = isInpt
     }
  },
  persist: {
    enabled: true,
    strategies: [
      { storage: sessionStorage, paths: ['themeType'] },
    ],
  },
})

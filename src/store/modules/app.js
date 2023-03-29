import { defineStore } from 'pinia'

export default defineStore('storeApp', {
  state () {
    return {
      themeType: 'light',
      bgm: '',
      score: 0,
      isStart: 0,
      isFail: 0,
    }
  },
  getters: {
     getThemeType: (state) => state.themeType,
     getBgm: (state) => state.bgm,
     getScore: (state) => state.score,
     getIsStart: (state) => state.isStart,
     getIsFail: (state) => state.isFail
  },
  actions: {
     setThemeType(themeType){
        this.themeType = themeType
     },
     setBgm(bgm){
        this.bgm = bgm
     },
     setScore(score){
        this.score = score
     },
     setIsStart(isStart){
        this.isStart = isStart
     },
     setIsFail(isFail){
        this.isFail = isFail
     }
  },
  persist: {
    enabled: true,
    strategies: [
      { storage: sessionStorage, paths: ['themeType'] },
      { storage: sessionStorage, paths: ['bgm'] }
    ],
  },
})

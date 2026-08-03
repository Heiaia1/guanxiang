declare const require: (path: string) => any

const { getTrigramLines } = require('../../services/hexagram-engine')

Component({
  properties: {
    upper: {
      type: String,
      value: "qian"
    },
    lower: {
      type: String,
      value: "qian"
    },
    changingLine: {
      type: Number,
      value: 0
    },
    compact: {
      type: Boolean,
      value: false
    }
  },

  data: {
    visualLines: [] as Array<{ yin: boolean; changing: boolean; position: number }>
  },

  observers: {
    "upper, lower, changingLine": function (
      upper: string,
      lower: string,
      changingLine: number
    ) {
      const bottomUp = [
        ...getTrigramLines(lower),
        ...getTrigramLines(upper)
      ]
      const visualLines = bottomUp
        .map((value, index) => ({
          yin: value === 0,
          changing: index + 1 === changingLine,
          position: index + 1
        }))
        .reverse()
      this.setData({ visualLines })
    }
  }
})

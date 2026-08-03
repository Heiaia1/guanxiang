Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    document: {
      type: Object,
      value: null
    },
    motionOff: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    close() {
      this.triggerEvent("close")
    },

    stopPropagation() {}
  }
})

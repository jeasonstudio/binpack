export default class Context {
  constructor(req, res) {
    this.request = req;
    this.response = res;
  }
  async execute(pipeline) {}
}

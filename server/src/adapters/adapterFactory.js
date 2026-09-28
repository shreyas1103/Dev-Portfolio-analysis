const githubAdapter = require("./github/github.adapter");
const leetcodeAdapter = require("./leetcode/leetcode.adapter");
const adapters = {
  github: githubAdapter,
  leetcode: leetcodeAdapter,
};

function getAdapter(source) {
  const adapter = adapters[source];
  if (!adapter) {
    throw new Error(`No adapter registered for source: ${source}`);
  }
  return adapter;
}

module.exports = { getAdapter };
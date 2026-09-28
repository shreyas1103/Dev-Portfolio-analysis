class SourceAdapter {
  async fetchProfile(credentials) {
    throw new Error("fetchProfile must be implemented by subclass");
  }

  async fetchActivity(credentials, sinceDate) {
    throw new Error("fetchActivity must be implemented by subclass");
  }

  async fetchRepos(credentials) {
    throw new Error("fetchRepos must be implemented by subclass");
  }
}

module.exports = SourceAdapter;
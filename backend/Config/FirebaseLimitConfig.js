const admin = require('./FirebaseAdmin')
let cachedConfig = null;

async function fetchFirebaseConfig() {
  if (cachedConfig) return cachedConfig;

  const template = await admin.remoteConfig().getTemplate();
  const config = {};

  for (const key in template.parameters) {
    config[key] = template.parameters[key].defaultValue.value;
  }

  cachedConfig = config;
  return config;
}

function clearFirebaseConfigCache() {
    cachedConfig = null;
  }

module.exports = {
    fetchFirebaseConfig,
    clearFirebaseConfigCache
};
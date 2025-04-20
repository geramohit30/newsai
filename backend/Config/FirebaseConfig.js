const admin = require('./FirebaseAdmin')

async function getFirebaseConfig() {
    try {
        const template = await admin.remoteConfig().getTemplate();
        return template.parameters;
    } catch (err) {
        console.error('Error fetching Firebase config:', err);
        return {};
    }
}
// getFirebaseConfig()
module.exports = getFirebaseConfig;
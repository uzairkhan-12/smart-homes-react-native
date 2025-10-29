const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withNetworkSecurityConfig(config) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    
    // Find the application tag
    const application = androidManifest.manifest.application[0];
    
    // Add networkSecurityConfig attribute
    application.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    
    return config;
  });
};
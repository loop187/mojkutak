const fs = require('fs');
const path = require('path');

// googleServicesFile se dodaje samo kad postoji (EAS secret ili lokalna datoteka),
// kako bi app.json ostao čist za Snack import.
module.exports = ({ config }) => {
  const localFile = path.join(__dirname, 'google-services.json');
  const googleServicesFile = process.env.GOOGLE_SERVICES_JSON
    || (fs.existsSync(localFile) ? './google-services.json' : undefined);

  return {
    ...config,
    android: {
      ...config.android,
      ...(googleServicesFile ? { googleServicesFile } : {}),
    },
  };
};

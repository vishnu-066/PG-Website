const https = require('https');

const urls = [
  'https://coastlineart.net/wp-content/uploads/elementor/css/post-26628.css?ver=1783414423',
  'https://coastlineart.net/wp-content/uploads/elementor/css/post-6.css?ver=1783407928'
];

urls.forEach((url, index) => {
  https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log(`=== DOWNLOADED CSS ${index} ===`);
      // Find all styles matching padding or margin for header classes
      // Elementor stylesheet is typically minified, so let's search via regex
      const regex = /\.elementor-element-[a-zA-Z0-9]+[^\{]*\{[^\}]*\}/g;
      let match;
      while ((match = regex.exec(data)) !== null) {
        const rules = match[0];
        if (rules.includes('padding') && (rules.includes('header') || rules.includes('logo') || rules.includes('menu'))) {
          console.log(rules);
        }
      }
      // Also search general selectors
      const generalRegex = /[a-zA-Z0-9\-\.\#\_\>\:\s\,]+\{[^\}]*\}/g;
      while ((match = generalRegex.exec(data)) !== null) {
        const rules = match[0];
        if (rules.includes('padding') && (rules.includes('header') || rules.includes('logo') || rules.includes('menu'))) {
          console.log("General:", rules);
        }
      }
    });
  }).on('error', (err) => {
    console.error(`Error fetching CSS ${index}:`, err);
  });
});

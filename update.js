import fs from 'fs';

let p = fs.readFileSync('products.js', 'utf8');

// Replace all image: "..." with image: "Awlaa Global Logo.png"
p = p.replace(/image\s*:\s*\"[^\"]+\"/g, 'image: "Awlaa Global Logo.png"');

// Replace slideshows
// For slideshow we want to drop the slideshow array completely, because there's already an image being added or present
p = p.replace(/slideshow\s*:\s*\[[\s\S]*?\],?/g, '');

// Append image: "Awlaa Global Logo.png" to any work that doesn't have it.
// works: [ { name: "...", desc: "..." } ]
// Wait, a better way is to use regex:
// If a {} block has `name:` but no `image:` inside the works array
p = p.replace(/name\s*:\s*\"([^\"]+)\"(?![^}]*image\s*:)/g, 'name: "$1", image: "Awlaa Global Logo.png"');

fs.writeFileSync('products.js', p);

let s = fs.readFileSync('services.js', 'utf8');
s = s.replace(/\{\s*name\s*:\s*\"([^\"]+)\"\s*\}/g, '{ name: "$1", image: "Awlaa Global Logo.png" }');
fs.writeFileSync('services.js', s);

console.log("Done");

const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/pages/*.tsx').concat(glob.sync('src/components/*.tsx'));

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  
  const attrs = ['onClick', 'onChange', 'className', 'value', 'placeholder', 'checked', 'dir', 'type', 'aria-', 'title', 'id', 'min', 'max', 'required'];
  
  attrs.forEach(attr => {
    const regex = new RegExp('"' + attr, 'g');
    code = code.replace(regex, '" ' + attr);
  });
  
  fs.writeFileSync(file, code);
});
